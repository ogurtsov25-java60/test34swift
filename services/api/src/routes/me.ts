import type { FastifyPluginAsync } from "fastify";

import { UserProfile } from "@ai-hebrew/shared";

import { parseOutput } from "../lib/zod";
import { requireUserId } from "../auth/requireUser";

export const meRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/me", async (request, reply) => {
    const userId = await requireUserId(fastify, request);
    if (!userId) return reply.code(401).send({ code: "UNAUTHORIZED", message: "Missing token" });

    const res = await fastify.pg.query<{
      user_id: string;
      current_level: string | null;
      current_lesson_id: string | null;
    }>("SELECT user_id, current_level, current_lesson_id FROM users WHERE user_id = $1", [userId]);

    const row = res.rows[0];
    if (!row) return reply.code(404).send({ code: "NOT_FOUND", message: "User not found" });

    const out = parseOutput(UserProfile, {
      user_id: row.user_id,
      current_level: row.current_level ?? "A1",
      current_lesson_id: row.current_lesson_id ?? "A1-U01-L01",
    });
    return reply.send(out);
  });
};

