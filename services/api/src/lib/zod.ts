import type { ZodTypeAny, z } from "zod";
import type { FastifyReply } from "fastify";

export function parseBody<TSchema extends ZodTypeAny>(
  reply: FastifyReply,
  schema: TSchema,
  body: unknown
): z.infer<TSchema> | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    reply.code(400).send({
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      issues: parsed.error.issues,
    });
    return null;
  }
  return parsed.data;
}

export function parseOutput<TSchema extends ZodTypeAny>(
  schema: TSchema,
  payload: unknown
): z.infer<TSchema> {
  return schema.parse(payload);
}
