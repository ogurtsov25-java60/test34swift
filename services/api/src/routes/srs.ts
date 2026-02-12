import type { FastifyPluginAsync } from "fastify";

import { FlashcardDTO, SrsQueueResponse, SrsReviewRequest, SrsReviewResponse } from "@ai-hebrew/shared";

import { requireUserId } from "../auth/requireUser";
import { asJson } from "../lib/jsonb";
import { parseBody, parseOutput } from "../lib/zod";

type DueRow = Readonly<{
  id: string;
  he: string;
  ru: string;
  example_he: string;
  example_ru: string;
  tags: unknown;
  audio_tts_url: string | null;
}>;

export const srsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/srs/queue", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const res = await fastify.pg.query<DueRow>(
      `
      SELECT
        f.card_id AS id,
        f.he, f.ru, f.example_he, f.example_ru, f.tags, f.audio_tts_url
      FROM flashcards f
      JOIN srs_state s ON s.user_id = f.user_id AND s.card_id = f.card_id
      WHERE f.user_id = $1 AND s.due_at <= now()
      ORDER BY s.due_at ASC
      LIMIT 200
    `,
      [userId]
    );

    const due = res.rows.map((r) =>
      parseOutput(FlashcardDTO, {
        id: r.id,
        he: r.he,
        ru: r.ru,
        example_he: r.example_he,
        example_ru: r.example_ru,
        tags: asJson<string[]>(r.tags, []),
        audio_tts_url: r.audio_tts_url ?? undefined,
      })
    );

    const out = parseOutput(SrsQueueResponse, { due });
    return reply.send(out);
  });

  fastify.post("/srs/review", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const body = parseBody(reply, SrsReviewRequest, request.body);
    if (!body) return;

    const stateRes = await fastify.pg.query<{
      due_at: unknown;
      interval_days: unknown;
      ease: unknown;
      repetitions: unknown;
    }>(
      `
      SELECT due_at, interval_days, ease, repetitions
      FROM srs_state
      WHERE user_id = $1 AND card_id = $2
      LIMIT 1
    `,
      [userId, body.card_id]
    );
    const state = stateRes.rows[0];
    if (!state) return reply.code(404).send({ code: "NOT_FOUND", message: "Card not found" });

    let interval = Number(state.interval_days);
    let ease = Number(state.ease);
    let reps = Number(state.repetitions);
    if (!Number.isFinite(interval) || interval <= 0) interval = 1;
    if (!Number.isFinite(ease) || ease < 1.3) ease = 2.5;
    if (!Number.isFinite(reps) || reps < 0) reps = 0;

    if (body.grade === "easy") {
      ease += 0.15;
      interval = interval * ease;
      reps += 1;
    } else if (body.grade === "ok") {
      interval = interval * 1.3;
      reps += 1;
    } else {
      ease = Math.max(1.3, ease - 0.2);
      interval = 1;
      reps = Math.max(0, reps - 1);
    }

    const intervalDays = Math.max(1, Math.round(Number(interval)));

    const updateRes = await fastify.pg.query<{
      due_at: unknown;
    }>(
      `
      UPDATE srs_state
      SET
        due_at = now() + ($3::text || ' days')::interval,
        interval_days = $3::int,
        ease = $4::float8,
        repetitions = $5::int
      WHERE user_id = $1 AND card_id = $2
      RETURNING due_at
    `,
      [userId, body.card_id, intervalDays, ease, reps]
    );
    const dueAt = updateRes.rows[0]?.due_at ?? new Date().toISOString();

    const out = parseOutput(SrsReviewResponse, {
      card_id: body.card_id,
      due_at: new Date(dueAt as any).toISOString(),
      interval_days: intervalDays,
      ease,
      repetitions: reps,
    });
    return reply.send(out);
  });
};
