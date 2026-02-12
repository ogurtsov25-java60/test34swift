import type { FastifyPluginAsync } from "fastify";

import { TodayResponse } from "@ai-hebrew/shared";

import { parseOutput } from "../lib/zod";
import { requireUserId } from "../auth/requireUser";

export const todayRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/today", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const userRes = await fastify.pg.query<{
      current_level: string | null;
      current_lesson_id: string | null;
    }>("SELECT current_level, current_lesson_id FROM users WHERE user_id = $1", [userId]);
    const user = userRes.rows[0];
    if (!user) return reply.code(404).send({ code: "NOT_FOUND", message: "User not found" });

    const currentLevel = (user.current_level ?? "A1") as string;
    const currentLessonId = (user.current_lesson_id ?? "A1-U01-L01") as string;

    const lessonRes = await fastify.pg.query<{ micro_goal_ru: string }>(
      "SELECT micro_goal_ru FROM lessons WHERE lesson_id = $1",
      [currentLessonId]
    );
    const microGoalRu = lessonRes.rows[0]?.micro_goal_ru ?? "";

    const dueRes = await fastify.pg.query<{ cnt: string }>(
      `
      SELECT COUNT(*)::text AS cnt
      FROM srs_state
      WHERE user_id = $1 AND due_at <= now()
    `,
      [userId]
    );
    const srsDueCount = Number(dueRes.rows[0]?.cnt ?? "0");

    const out = parseOutput(TodayResponse, {
      current_level: currentLevel,
      current_lesson_id: currentLessonId,
      micro_goal_ru: microGoalRu,
      srs_due_count: srsDueCount,
    });
    return reply.send(out);
  });
};

