import { describe, expect, it } from "vitest";

import { formatLessonId, generateCurriculumSeed } from "../curriculum/generate";

describe("curriculum seed", () => {
  it("generates expected counts (5 levels, 60 units, 300 lessons)", () => {
    const seed = generateCurriculumSeed();
    expect(seed.levels).toHaveLength(5);
    expect(seed.units).toHaveLength(5 * 12);
    expect(seed.lessons).toHaveLength(5 * 12 * 5);
  });

  it("generates lesson_id in the exact required format", () => {
    const seed = generateCurriculumSeed();
    const re = /^(A1|A2|B1|B2|C1)-U\d{2}-L\d{2}$/;

    for (const lesson of seed.lessons) {
      expect(lesson.lesson_id).toMatch(re);
      expect(lesson.lesson_id).toBe(
        formatLessonId(lesson.level, lesson.unit_index, lesson.lesson_index)
      );
    }
  });

  it("is deterministic", () => {
    const a = generateCurriculumSeed();
    const b = generateCurriculumSeed();
    expect(a).toEqual(b);
  });
});

