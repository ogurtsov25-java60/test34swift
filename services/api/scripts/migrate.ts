import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { Client } from "pg";

import { readEnv } from "../src/env";

type MigrationRow = Readonly<{ id: string }>;

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function listMigrationFiles(migrationsDir: string) {
  const entries = await readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".sql"))
    .map((e) => e.name)
    .sort();
}

async function main() {
  const env = readEnv();
  const migrationsDir = path.resolve("migrations");

  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");
    await ensureMigrationsTable(client);

    const applied = await client.query<MigrationRow>(
      "SELECT id FROM schema_migrations"
    );
    const appliedIds = new Set(applied.rows.map((r) => r.id));

    const files = await listMigrationFiles(migrationsDir);
    for (const file of files) {
      if (appliedIds.has(file)) continue;

      const fullPath = path.join(migrationsDir, file);
      const sql = await readFile(fullPath, "utf8");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [
        file,
      ]);
      process.stdout.write(`applied ${file}\n`);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

await main();

