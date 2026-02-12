import type { CefrLevel } from "./templates";

const LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"] as const;

export function parseLessonId(lessonId: string) {
  const m = /^(A1|A2|B1|B2|C1)-U(\d{2})-L(\d{2})$/.exec(lessonId);
  if (!m) return null;
  const level = m[1] as CefrLevel;
  const unit = Number(m[2]);
  const lesson = Number(m[3]);
  if (!Number.isInteger(unit) || unit < 1 || unit > 12) return null;
  if (!Number.isInteger(lesson) || lesson < 1 || lesson > 5) return null;
  return { level, unitIndex: unit, lessonIndex: lesson };
}

export function nextLessonId(current: string) {
  const parsed = parseLessonId(current);
  if (!parsed) return null;

  const { level, unitIndex, lessonIndex } = parsed;
  if (lessonIndex < 5) {
    return `${level}-U${String(unitIndex).padStart(2, "0")}-L${String(lessonIndex + 1).padStart(2, "0")}`;
  }

  if (unitIndex < 12) {
    return `${level}-U${String(unitIndex + 1).padStart(2, "0")}-L01`;
  }

  const levelIdx = LEVELS.indexOf(level);
  const nextLevel = LEVELS[levelIdx + 1];
  if (!nextLevel) return current;
  return `${nextLevel}-U01-L01`;
}

