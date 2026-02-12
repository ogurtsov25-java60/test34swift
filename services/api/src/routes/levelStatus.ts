import type { FastifyPluginAsync } from "fastify";

import { LevelStatusResponse } from "@ai-hebrew/shared";

import { parseOutput } from "../lib/zod";
import { requireUserId } from "../auth/requireUser";

export const levelStatusRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/level-status", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const userRes = await fastify.pg.query<{ current_level: string | null }>(
      "SELECT current_level FROM users WHERE user_id = $1",
      [userId]
    );
    const currentLevel = (userRes.rows[0]?.current_level ?? "A1") as string;

    const completedRes = await fastify.pg.query<{ cnt: string }>(
      `
      SELECT COUNT(*)::text AS cnt
      FROM progress p
      JOIN lessons l ON l.lesson_id = p.lesson_id
      WHERE p.user_id = $1 AND l.level = $2
    `,
      [userId, currentLevel]
    );
    const completed = Number(completedRes.rows[0]?.cnt ?? "0");
    const completion = Math.min(1, completed / 60);

    const avgRes = await fastify.pg.query<{ accuracy: number | null; fluency: number | null }>(
      `
      SELECT AVG(p.accuracy) AS accuracy, AVG(p.fluency) AS fluency
      FROM progress p
      JOIN lessons l ON l.lesson_id = p.lesson_id
      WHERE p.user_id = $1 AND l.level = $2
    `,
      [userId, currentLevel]
    );
    const accuracy = Math.max(0, Math.min(1, avgRes.rows[0]?.accuracy ?? 0));
    const fluency = Math.max(0, Math.min(1, avgRes.rows[0]?.fluency ?? 0));

    const last10Res = await fastify.pg.query<{ ok: boolean | null }>(
      `
      WITH last10 AS (
        SELECT accuracy, fluency
        FROM progress
        WHERE user_id = $1
        ORDER BY completed_at DESC
        LIMIT 10
      )
      SELECT COALESCE(
        bool_and(COALESCE(accuracy, 1) >= 0.6 AND COALESCE(fluency, 1) >= 0.6),
        true
      ) AS ok
      FROM last10
    `,
      [userId]
    );
    const noWeakZones = last10Res.rows[0]?.ok ?? true;

    const eligible =
      completion >= 0.8 && accuracy >= 0.75 && fluency >= 0.7 && noWeakZones;

    const out = parseOutput(LevelStatusResponse, {
      current_level: currentLevel,
      completion,
      accuracy,
      fluency,
      eligible_for_upgrade: eligible,
    });
    return reply.send(out);
  });
};

