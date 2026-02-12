import type { FastifyPluginAsync } from "fastify";
import crypto from "node:crypto";

import {
  LessonDTO,
  LessonEndRequest,
  LessonReport,
  LessonStartRequest,
  LessonStartResponse,
  LessonTurnRequest,
  LessonTurnResponse,
  type TranscriptTurnT,
  type VocabItemT,
} from "@ai-hebrew/shared";

import { requireUserId } from "../auth/requireUser";
import { withTransaction } from "../db/tx";
import { asJson } from "../lib/jsonb";
import { parseBody, parseOutput } from "../lib/zod";
import { nextLessonId, parseLessonId } from "../curriculum/lessonId";

function initialAiTurn(): TranscriptTurnT {
  return { role: "ai", he: "שלום! בוא נתחיל.", ru: "Привет! Давай начнем." };
}

function vocabToFlashcardSeed(v: VocabItemT) {
  return {
    he: v.he,
    ru: v.ru,
    example_he: v.example_he,
    example_ru: v.example_ru,
    tags: v.tags ?? [],
  };
}

export const lessonRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/lesson/start", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const body = parseBody(reply, LessonStartRequest, request.body);
    if (!body) return;

    const userRes = await fastify.pg.query<{ current_lesson_id: string | null }>(
      "SELECT current_lesson_id FROM users WHERE user_id = $1",
      [userId]
    );
    const fallbackLessonId = userRes.rows[0]?.current_lesson_id ?? null;
    const requestedLessonId = body.lesson_id ?? fallbackLessonId;

    const lessonRes = await fastify.pg.query<{
      lesson_id: string;
      level: string;
      title_ru: string;
      micro_goal_ru: string;
      grammar_focus: unknown;
    }>(
      `
      SELECT lesson_id, level, title_ru, micro_goal_ru, grammar_focus
      FROM lessons
      ORDER BY (lesson_id = $1)::int DESC, lesson_id ASC
      LIMIT 1
    `,
      [requestedLessonId]
    );
    const row = lessonRes.rows[0];
    if (!row) return reply.code(409).send({ code: "NO_CURRICULUM", message: "Seed curriculum first" });

    const sessionId = crypto.randomUUID();
    await fastify.pg.query(
      `
      INSERT INTO dialog_sessions (session_id, user_id, lesson_id, transcript)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
      [sessionId, userId, row.lesson_id, JSON.stringify([initialAiTurn()])]
    );

    const lesson = parseOutput(LessonDTO, {
      lesson_id: row.lesson_id,
      level: row.level,
      title_ru: row.title_ru,
      micro_goal_ru: row.micro_goal_ru,
      grammar_focus: asJson<string[]>(row.grammar_focus, []),
    });

    const out = parseOutput(LessonStartResponse, { session_id: sessionId, lesson });
    return reply.send(out);
  });

  fastify.post("/lesson/turn", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const body = parseBody(reply, LessonTurnRequest, request.body);
    if (!body) return;

    const aiTextHe = "מעולה. שאלה: איך אתה היום?";
    const aiTextRu = "Отлично. Вопрос: как ты сегодня?";

    const turns: TranscriptTurnT[] = [
      { role: "user", he: body.user_text },
      { role: "ai", he: aiTextHe, ru: aiTextRu },
    ];

    const res = await fastify.pg.query(
      `
      UPDATE dialog_sessions
      SET transcript = transcript || $1::jsonb
      WHERE session_id = $2 AND user_id = $3
    `,
      [JSON.stringify(turns), body.session_id, userId]
    );
    if (res.rowCount === 0) return reply.code(404).send({ code: "NOT_FOUND", message: "Session not found" });

    const out = parseOutput(LessonTurnResponse, { ai_text_he: aiTextHe, ai_text_ru: aiTextRu });
    return reply.send(out);
  });

  fastify.post("/lesson/end", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const body = parseBody(reply, LessonEndRequest, request.body);
    if (!body) return;

    const result = await withTransaction(fastify.pg, async (client) => {
      const sessionRes = await client.query<{
        lesson_id: string;
        transcript: unknown;
        level: string;
        target_vocab: unknown;
        grammar_focus: unknown;
      }>(
        `
        SELECT ds.lesson_id, ds.transcript, l.level, l.target_vocab, l.grammar_focus
        FROM dialog_sessions ds
        JOIN lessons l ON l.lesson_id = ds.lesson_id
        WHERE ds.session_id = $1 AND ds.user_id = $2
        LIMIT 1
      `,
        [body.session_id, userId]
      );
      const session = sessionRes.rows[0];
      if (!session) return { kind: "not_found" as const };

      const transcript = asJson<TranscriptTurnT[]>(session.transcript, []);
      if (transcript.length < 2) {
        transcript.push({ role: "user", he: "..." });
      }

      const targetVocab = asJson<Array<{ he: string; ru: string }>>(session.target_vocab, []);
      const vocab_to_learn: VocabItemT[] = (targetVocab.slice(0, 5).length ? targetVocab.slice(0, 5) : [{ he: "שלום", ru: "привет" }]).map(
        (v) => ({
          he: v.he,
          ru: v.ru,
          example_he: `${v.he} ...`,
          example_ru: `${v.ru} ...`,
          tags: [],
          priority: 2,
        })
      );

      const report = parseOutput(LessonReport, {
        lesson_id: session.lesson_id,
        summary_ru: `Урок ${session.lesson_id} завершён.`,
        transcript,
        corrections: [],
        vocab_to_learn,
        skill_scores: { fluency: 0.7, accuracy: 0.7, comprehension: 0.7 },
        next_steps_ru: ["Повтори ключевые слова", "Пройди SRS очередь"],
      });

      await client.query(
        `
        UPDATE dialog_sessions
        SET ended_at = now(), report_json = $1::jsonb
        WHERE session_id = $2 AND user_id = $3
      `,
        [JSON.stringify(report), body.session_id, userId]
      );

      await client.query(
        `
        INSERT INTO progress (user_id, lesson_id, accuracy, fluency, comprehension, report)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        ON CONFLICT (user_id, lesson_id) DO UPDATE SET
          completed_at = now(),
          accuracy = excluded.accuracy,
          fluency = excluded.fluency,
          comprehension = excluded.comprehension,
          report = excluded.report
      `,
        [
          userId,
          report.lesson_id,
          report.skill_scores.accuracy,
          report.skill_scores.fluency,
          report.skill_scores.comprehension,
          JSON.stringify(report),
        ]
      );

      for (const vocab of report.vocab_to_learn) {
        const seed = vocabToFlashcardSeed(vocab);
        const existing = await client.query<{ card_id: string }>(
          `
          SELECT card_id
          FROM flashcards
          WHERE user_id = $1 AND he = $2 AND ru = $3
          LIMIT 1
        `,
          [userId, seed.he, seed.ru]
        );

        const cardId =
          existing.rows[0]?.card_id ??
          (
            await client.query<{ card_id: string }>(
              `
              INSERT INTO flashcards (
                card_id, user_id, he, ru, example_he, example_ru, tags
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7::jsonb
              )
              RETURNING card_id
            `,
              [
                crypto.randomUUID(),
                userId,
                seed.he,
                seed.ru,
                seed.example_he,
                seed.example_ru,
                JSON.stringify(seed.tags),
              ]
            )
          ).rows[0]?.card_id;

        if (!cardId) continue;

        await client.query(
          `
          INSERT INTO srs_state (user_id, card_id, due_at, interval_days, ease, repetitions)
          VALUES ($1, $2, now(), 1, 2.5, 0)
          ON CONFLICT (user_id, card_id) DO NOTHING
        `,
          [userId, cardId]
        );
      }

      const next = nextLessonId(report.lesson_id);
      if (next) {
        const exists = await client.query<{ lesson_id: string }>(
          "SELECT lesson_id FROM lessons WHERE lesson_id = $1",
          [next]
        );
        if (exists.rows[0]?.lesson_id) {
          const parsedNext = parseLessonId(next);
          await client.query(
            "UPDATE users SET current_level = $1, current_lesson_id = $2 WHERE user_id = $3",
            [parsedNext?.level ?? session.level, next, userId]
          );
        }
      }

      return { kind: "ok" as const, report };
    });

    if (result.kind === "not_found") {
      return reply.code(404).send({ code: "NOT_FOUND", message: "Session not found" });
    }

    return reply.send(result.report);
  });
};
