import { describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { buildServer } from "../server";

type QueryResult<Row> = Readonly<{ rows: Row[]; rowCount: number }>;

class FakePool {
  private readonly tokens = new Map<string, string>(); // token -> user_id
  private readonly users = new Map<string, { current_level: string; current_lesson_id: string }>();
  private readonly lessons = new Map<string, { micro_goal_ru: string }>([
    ["A1-U01-L01", { micro_goal_ru: "Предлоги ב/ל/מ" }],
  ]);

  async query<Row = any>(text: string, params: any[] = []): Promise<QueryResult<Row>> {
    const sql = text.replace(/\s+/g, " ").trim();

    if (sql.includes("SELECT user_id FROM auth_tokens WHERE token = $1")) {
      const token = String(params[0] ?? "");
      const user_id = this.tokens.get(token);
      return {
        rows: user_id ? ([{ user_id }] as any) : ([] as any),
        rowCount: user_id ? 1 : 0,
      };
    }

    if (sql.startsWith("SELECT lesson_id FROM lessons ORDER BY lesson_id ASC LIMIT 1")) {
      return { rows: [{ lesson_id: "A1-U01-L01" }] as any, rowCount: 1 };
    }

    if (sql.includes("INSERT INTO users (user_id, current_level, current_lesson_id)")) {
      const userId = String(params[0]);
      const level = String(params[1]);
      const lessonId = String(params[2]);
      if (!this.users.has(userId)) {
        this.users.set(userId, { current_level: level, current_lesson_id: lessonId });
      }
      return { rows: [] as any, rowCount: 1 };
    }

    if (sql.startsWith("INSERT INTO auth_tokens (token, user_id) VALUES ($1, $2)")) {
      const token = String(params[0]);
      const userId = String(params[1]);
      this.tokens.set(token, userId);
      return { rows: [] as any, rowCount: 1 };
    }

    if (sql.includes("SELECT current_level, current_lesson_id FROM users WHERE user_id = $1")) {
      const userId = String(params[0]);
      const u = this.users.get(userId);
      return {
        rows: u ? ([{ current_level: u.current_level, current_lesson_id: u.current_lesson_id }] as any) : ([] as any),
        rowCount: u ? 1 : 0,
      };
    }

    if (sql.includes("SELECT micro_goal_ru FROM lessons WHERE lesson_id = $1")) {
      const lessonId = String(params[0]);
      const l = this.lessons.get(lessonId);
      return { rows: l ? ([{ micro_goal_ru: l.micro_goal_ru }] as any) : ([] as any), rowCount: l ? 1 : 0 };
    }

    if (sql.includes("SELECT COUNT(*)::text AS cnt FROM srs_state")) {
      return { rows: [{ cnt: "0" }] as any, rowCount: 1 };
    }

    throw new Error(`FakePool: unhandled query: ${sql}`);
  }
}

describe("POST /auth/dev", () => {
  it("returns token and token authorizes GET /today", async () => {
    const fakePool = new FakePool();
    const server = buildServer({
      databaseUrl: "postgres://ignored",
      logger: false,
      pg: fakePool as unknown as Pool,
    });

    const authRes = await server.inject({
      method: "POST",
      url: "/auth/dev",
    });
    expect(authRes.statusCode).toBe(200);
    const authJson = authRes.json() as { token: string };
    expect(typeof authJson.token).toBe("string");
    expect(authJson.token.length).toBeGreaterThan(10);

    const todayRes = await server.inject({
      method: "GET",
      url: "/today",
      headers: { authorization: `Bearer ${authJson.token}` },
    });
    expect(todayRes.statusCode).toBe(200);
    const todayJson = todayRes.json() as any;
    expect(todayJson.current_level).toBe("A1");
    expect(todayJson.current_lesson_id).toBe("A1-U01-L01");

    await server.close();
  });
});
