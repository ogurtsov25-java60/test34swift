import type { FastifyInstance, FastifyRequest } from "fastify";

export async function requireUserId(
  fastify: FastifyInstance,
  request: FastifyRequest
) {
  const auth = request.headers.authorization;
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = auth.slice("bearer ".length).trim();
  if (!token) return null;

  const res = await fastify.pg.query<{ user_id: string }>(
    "SELECT user_id FROM auth_tokens WHERE token = $1",
    [token]
  );
  const row = res.rows[0];
  return row?.user_id ?? null;
}

