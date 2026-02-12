import { describe, expect, it } from "vitest";

import { LessonReport, SrsReviewResponse, TodayResponse } from "../schemas";

describe("shared schemas sample payloads", () => {
  it("validates LessonReport sample payload", () => {
    const sample = {
      lesson_id: "A1-U03-L02",
      summary_ru: "Практика приветствий и вопросов о самочувствии.",
      transcript: [
        { role: "user", he: "שלום", ru: "привет" },
        { role: "ai", he: "שלום! מה שלומך?", ru: "Привет! Как ты?" },
      ],
      corrections: [
        {
          user_he: "אני טוב",
          fixed_he: "אני טוב",
          explain_ru: "Фраза корректна; пример без изменения.",
          type: "grammar",
        },
      ],
      vocab_to_learn: [
        {
          he: "מה שלומך",
          ru: "как ты",
          example_he: "מה שלומך היום?",
          example_ru: "Как ты сегодня?",
        },
      ],
      skill_scores: { fluency: 0.7, accuracy: 0.8, comprehension: 0.75 },
      next_steps_ru: ["Повтори фразы приветствия вслух", "Сделай 5 карточек SRS"],
    } as const;

    const parsed = LessonReport.parse(sample);
    expect(parsed.lesson_id).toBe(sample.lesson_id);
    expect(parsed.vocab_to_learn[0]?.tags).toEqual([]);
    expect(parsed.vocab_to_learn[0]?.priority).toBe(2);
  });

  it("validates TodayResponse sample payload (docs/API.md)", () => {
    const sample = {
      current_level: "A1",
      current_lesson_id: "A1-U03-L02",
      micro_goal_ru: "Предлоги ב/ל/מ",
      srs_due_count: 12,
    } as const;

    expect(TodayResponse.safeParse(sample).success).toBe(true);
  });

  it("validates SrsReviewResponse sample payload (docs/API.md)", () => {
    const sample = {
      card_id: "card_123",
      due_at: "2026-02-11T12:00:00.000Z",
      interval_days: 3,
      ease: 2.5,
      repetitions: 1,
    } as const;

    expect(SrsReviewResponse.safeParse(sample).success).toBe(true);
  });
});

