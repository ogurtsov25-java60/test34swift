import { UNIT_TEMPLATES, type CefrLevel, type UnitTemplate, type VocabSeed } from "./templates";

export type LevelSeed = Readonly<{
  cefr_level: CefrLevel;
  ulpan_name: string;
}>;

export type UnitSeed = Readonly<{
  level: CefrLevel;
  unit_index: number; // 1..12
  goals_ru: string;
  grammar_focus: readonly string[];
  core_vocab_packs: readonly (readonly VocabSeed[])[];
  conversation_style: string;
  topic_ru: string;
}>;

export type LessonSeed = Readonly<{
  lesson_id: string;
  level: CefrLevel;
  unit_index: number; // 1..12
  lesson_index: number; // 1..5
  title_ru: string;
  micro_goal_ru: string;
  grammar_focus: readonly string[];
  target_vocab: readonly VocabSeed[];
  prompt_seed: string;
}>;

export type CurriculumSeed = Readonly<{
  levels: readonly LevelSeed[];
  units: readonly UnitSeed[];
  lessons: readonly LessonSeed[];
}>;

const ULPAN: Readonly<Record<CefrLevel, string>> = {
  A1: "Alef",
  A2: "Bet",
  B1: "Gimel",
  B2: "Dalet",
  C1: "He",
};

export function formatLessonId(level: CefrLevel, unitIndex: number, lessonIndex: number) {
  const u = String(unitIndex).padStart(2, "0");
  const l = String(lessonIndex).padStart(2, "0");
  return `${level}-U${u}-L${l}`;
}

function selectTargetVocab(unit: UnitTemplate, lessonIndex: number) {
  const pack1 = unit.core_vocab_packs[0] ?? [];
  const pack2 = unit.core_vocab_packs[1] ?? [];
  if (lessonIndex === 1) return [...pack1];
  if (lessonIndex === 2) return [...pack1, ...pack2];
  if (lessonIndex === 3) return [...pack2];
  if (lessonIndex === 4) return [...pack1, ...pack2];
  return [...pack1, ...pack2];
}

export function generateCurriculumSeed(): CurriculumSeed {
  const levels: LevelSeed[] = (Object.keys(ULPAN) as CefrLevel[]).map((cefr_level) => ({
    cefr_level,
    ulpan_name: ULPAN[cefr_level],
  }));

  const units: UnitSeed[] = [];
  const lessons: LessonSeed[] = [];

  for (const level of levels) {
    const templates = UNIT_TEMPLATES[level.cefr_level];
    if (!templates || templates.length !== 12) {
      throw new Error(`Expected 12 unit templates for ${level.cefr_level}`);
    }

    templates.forEach((t, idx) => {
      const unit_index = idx + 1;
      units.push({
        level: level.cefr_level,
        unit_index,
        goals_ru: t.goals_ru,
        grammar_focus: [...t.grammar_focus],
        core_vocab_packs: t.core_vocab_packs.map((p) => [...p]),
        conversation_style: t.conversation_style,
        topic_ru: t.topic_ru,
      });

      for (let lesson_index = 1; lesson_index <= 5; lesson_index++) {
        const lesson_id = formatLessonId(level.cefr_level, unit_index, lesson_index);
        const titlePrefix =
          lesson_index === 1
            ? "Введение"
            : lesson_index === 2
              ? "Расширение"
              : lesson_index === 3
                ? "Понимание и скорость"
                : lesson_index === 4
                  ? "Практика с исправлениями"
                  : "Чекпоинт";

        const vocab = selectTargetVocab(t, lesson_index);
        lessons.push({
          lesson_id,
          level: level.cefr_level,
          unit_index,
          lesson_index,
          title_ru: `${t.topic_ru} — ${titlePrefix}`,
          micro_goal_ru: `${t.topic_ru}: ${t.goals_ru}`,
          grammar_focus: [...t.grammar_focus],
          target_vocab: vocab,
          prompt_seed: `${level.cefr_level}|U${unit_index}|L${lesson_index}|${t.topic_ru}`,
        });
      }
    });
  }

  return { levels, units, lessons };
}

