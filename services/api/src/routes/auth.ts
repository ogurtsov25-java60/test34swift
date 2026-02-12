import type { FastifyPluginAsync } from "fastify";

import { AuthAppleRequest, AuthAppleResponse } from "@ai-hebrew/shared";

import { parseBody, parseOutput } from "../lib/zod";
import { newAuthToken, userIdFromAppleIdToken } from "../auth/token";

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/auth/dev", async (_request, reply) => {
    const userId = "dev-user";

    const lessonRes = await fastify.pg.query<{ lesson_id: string }>(
      "SELECT lesson_id FROM lessons ORDER BY lesson_id ASC LIMIT 1"
    );
    const firstLessonId = lessonRes.rows[0]?.lesson_id ?? "A1-U01-L01";

    await fastify.pg.query(
      `
      INSERT INTO users (user_id, current_level, current_lesson_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO NOTHING
    `,
      [userId, "A1", firstLessonId]
    );

    const token = newAuthToken(userId);
    await fastify.pg.query(
      "INSERT INTO auth_tokens (token, user_id) VALUES ($1, $2)",
      [token, userId]
    );

    const out = parseOutput(AuthAppleResponse, { token });
    return reply.send(out);
  });

  fastify.post("/auth/apple", async (request, reply) => {
    const body = parseBody(reply, AuthAppleRequest, request.body);
    if (!body) return;
    const userId = userIdFromAppleIdToken(body.id_token);

    const lessonRes = await fastify.pg.query<{ lesson_id: string }>(
      "SELECT lesson_id FROM lessons ORDER BY lesson_id ASC LIMIT 1"
    );
    const firstLessonId = lessonRes.rows[0]?.lesson_id ?? "A1-U01-L01";

    await fastify.pg.query(
      `
      INSERT INTO users (user_id, current_level, current_lesson_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO NOTHING
    `,
      [userId, "A1", firstLessonId]
    );

    const token = newAuthToken();
    await fastify.pg.query(
      "INSERT INTO auth_tokens (token, user_id) VALUES ($1, $2)",
      [token, userId]
    );

    const out = parseOutput(AuthAppleResponse, { token });
    return reply.send(out);
  });
};
