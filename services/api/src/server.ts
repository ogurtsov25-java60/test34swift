import Fastify from "fastify";
import type { Pool } from "pg";

import dbPlugin from "./db/plugin";
import { apiRoutes } from "./routes";

export type BuildServerOpts = Readonly<{
  databaseUrl: string;
  logger?: boolean;
  pg?: Pool;
}>;

export function buildServer(opts: BuildServerOpts) {
  const fastify = Fastify({ logger: opts.logger ?? true });

  if (opts.pg) {
    fastify.decorate("pg", opts.pg);
    fastify.addHook("onClose", async () => {
      const anyPg = opts.pg as any;
      if (typeof anyPg.end === "function") {
        await anyPg.end();
      }
    });
  } else {
    fastify.register(dbPlugin, { databaseUrl: opts.databaseUrl });
  }

  fastify.get("/health", async () => ({ ok: true }));
  fastify.register(apiRoutes);

  return fastify;
}
