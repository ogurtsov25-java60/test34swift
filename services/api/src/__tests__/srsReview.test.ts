import { describe, expect, it } from "vitest";
import type { Pool } from "pg";

import { buildServer } from "../server";

type QueryResult<Row> = Readonly<{ rows: Row[]; rowCount: number }>;

class FakePool {
  private readonly tokens = new Map<string, string>(); // token -> user_id
  private readonly users = new Map<string, { current_level: string; current_lesson_id: string }>();
  private readonly lessons = new Map<string, { micro_goal_ru: string }>([
    ["A1-U01-L01", { micro_goal_ru: "Предлоги ב/ל/м" }],
  ]);
  private readonly srs = new Map<
    string,
    { due_at: string; interval_days: number; ease: number; repetitions: number }
  >();

  constructor() {
    // Seed one card state for dev-user.
    this.srs.set("dev-user|card_123", {
      due_at: "2026-02-11T00:00:00.000Z",
      interval_days: 1,
      ease: 2.5,
      repetitions: 0,
    });
  }

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

    if (sql.includes("SELECT due_at, interval_days, ease, repetitions FROM srs_state")) {
      const userId = String(params[0]);
      const cardId = String(params[1]);
      const state = this.srs.get(`${userId}|${cardId}`);
      return {
        rows: state ? ([state] as any) : ([] as any),
        rowCount: state ? 1 : 0,
      };
    }

    if (sql.includes("UPDATE srs_state SET")) {
      const userId = String(params[0]);
      const cardId = String(params[1]);
      const intervalDays = Number(params[2]);
      const ease = Number(params[3]);
      const repetitions = Number(params[4]);

      const key = `${userId}|${cardId}`;
      const existing = this.srs.get(key);
      if (!existing) return { rows: [] as any, rowCount: 0 };

      const due = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString();
      const updated = { due_at: due, interval_days: intervalDays, ease, repetitions };
      this.srs.set(key, updated);
      return { rows: [{ due_at: updated.due_at }] as any, rowCount: 1 };
    }

    if (sql.includes("SELECT micro_goal_ru FROM lessons WHERE lesson_id = $1")) {
      const lessonId = String(params[0]);
      const l = this.lessons.get(lessonId);
      return { rows: l ? ([{ micro_goal_ru: l.micro_goal_ru }] as any) : ([] as any), rowCount: l ? 1 : 0 };
    }

    if (sql.includes("SELECT current_level, current_lesson_id FROM users WHERE user_id = $1")) {
      const userId = String(params[0]);
      const u = this.users.get(userId);
      return {
        rows: u ? ([{ current_level: u.current_level, current_lesson_id: u.current_lesson_id }] as any) : ([] as any),
        rowCount: u ? 1 : 0,
      };
    }

    if (sql.includes("SELECT COUNT(*)::text AS cnt FROM srs_state")) {
      return { rows: [{ cnt: "0" }] as any, rowCount: 1 };
    }

    throw new Error(`FakePool: unhandled query: ${sql}`);
  }
}

describe("POST /srs/review", () => {
  it("returns numeric interval_days/ease/repetitions and does not throw", async () => {
    const fakePool = new FakePool();
    const server = buildServer({
      databaseUrl: "postgres://ignored",
      logger: false,
      pg: fakePool as unknown as Pool,
    });

    const authRes = await server.inject({ method: "POST", url: "/auth/dev" });
    expect(authRes.statusCode).toBe(200);
    const { token } = authRes.json() as { token: string };

    const res = await server.inject({
      method: "POST",
      url: "/srs/review",
      headers: { authorization: `Bearer ${token}` },
      payload: { card_id: "card_123", grade: "easy" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.card_id).toBe("card_123");
    expect(typeof body.interval_days).toBe("number");
    expect(typeof body.ease).toBe("number");
    expect(typeof body.repetitions).toBe("number");
    expect(typeof body.due_at).toBe("string");
    expect(Number.isFinite(Date.parse(body.due_at))).toBe(true);

    await server.close();
  });
});

