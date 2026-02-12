import type { FastifyPluginAsync } from "fastify";

import { authRoutes } from "./auth";
import { lessonRoutes } from "./lessons";
import { levelStatusRoutes } from "./levelStatus";
import { meRoutes } from "./me";
import { srsRoutes } from "./srs";
import { todayRoutes } from "./today";

export const apiRoutes: FastifyPluginAsync = async (fastify) => {
  await fastify.register(authRoutes);
  await fastify.register(meRoutes);
  await fastify.register(todayRoutes);
  await fastify.register(levelStatusRoutes);
  await fastify.register(lessonRoutes);
  await fastify.register(srsRoutes);
};

