export type Env = Readonly<{
  DATABASE_URL: string;
  PORT: number;
}>;

export function readEnv(env: NodeJS.ProcessEnv = process.env): Env {
  const databaseUrl = env["DATABASE_URL"];
  if (!databaseUrl) {
    throw new Error("Missing env DATABASE_URL");
  }

  const portStr = env["PORT"];
  const port = portStr ? Number(portStr) : 3000;
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("Invalid env PORT");
  }

  return { DATABASE_URL: databaseUrl, PORT: port };
}
