import { buildServer } from "./server";
import { readEnv } from "./env";

const env = readEnv();
const server = buildServer({ databaseUrl: env.DATABASE_URL, logger: true });

await server.listen({ port: env.PORT, host: "0.0.0.0" });

