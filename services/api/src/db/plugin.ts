import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { Pool } from "pg";

import { createPool } from "./pool";

declare module "fastify" {
  interface FastifyInstance {
    pg: Pool;
  }
}

type DbPluginOpts = Readonly<{ databaseUrl: string }>;

const dbPlugin: FastifyPluginAsync<DbPluginOpts> = async (fastify, opts) => {
  const pool = createPool(opts.databaseUrl);
  fastify.decorate("pg", pool);

  fastify.addHook("onClose", async () => {
    await pool.end();
  });
};

export default fp(dbPlugin, { name: "db" });

