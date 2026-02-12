import { Client } from "pg";

import { readEnv } from "../src/env";
import { generateCurriculumSeed } from "../src/curriculum/generate";

function unitKey(level: string, unitIndex: number) {
  return `${level}|${unitIndex}`;
}

async function main() {
  const env = readEnv();
  const seed = generateCurriculumSeed();

  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");

    for (const level of seed.levels) {
      await client.query(
        `
        INSERT INTO levels (cefr_level, ulpan_name)
        VALUES ($1, $2)
        ON CONFLICT (cefr_level) DO UPDATE
        SET ulpan_name = excluded.ulpan_name
      `,
        [level.cefr_level, level.ulpan_name]
      );
    }

    const unitIdByKey = new Map<string, string>();
    for (const unit of seed.units) {
      const res = await client.query<{ unit_id: string }>(
        `
        INSERT INTO units (
          level, unit_index, goals_ru, grammar_focus, core_vocab_packs, conversation_style
        ) VALUES (
          $1, $2, $3, $4::jsonb, $5::jsonb, $6
        )
        ON CONFLICT (level, unit_index) DO UPDATE SET
          goals_ru = excluded.goals_ru,
          grammar_focus = excluded.grammar_focus,
          core_vocab_packs = excluded.core_vocab_packs,
          conversation_style = excluded.conversation_style
        RETURNING unit_id
      `,
        [
          unit.level,
          unit.unit_index,
          unit.goals_ru,
          JSON.stringify(unit.grammar_focus),
          JSON.stringify(unit.core_vocab_packs),
          unit.conversation_style,
        ]
      );
      const row = res.rows[0];
      if (!row) {
        throw new Error(`Failed to upsert unit ${unit.level} U${unit.unit_index}`);
      }
      unitIdByKey.set(unitKey(unit.level, unit.unit_index), row.unit_id);
    }

    for (const lesson of seed.lessons) {
      const unit_id = unitIdByKey.get(unitKey(lesson.level, lesson.unit_index));
      if (!unit_id) {
        throw new Error(`Missing unit_id for ${lesson.level} U${lesson.unit_index}`);
      }

      await client.query(
        `
        INSERT INTO lessons (
          lesson_id, level, unit_id, lesson_index,
          title_ru, micro_goal_ru, grammar_focus, target_vocab, prompt_seed
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7::jsonb, $8::jsonb, $9
        )
        ON CONFLICT (lesson_id) DO UPDATE SET
          level = excluded.level,
          unit_id = excluded.unit_id,
          lesson_index = excluded.lesson_index,
          title_ru = excluded.title_ru,
          micro_goal_ru = excluded.micro_goal_ru,
          grammar_focus = excluded.grammar_focus,
          target_vocab = excluded.target_vocab,
          prompt_seed = excluded.prompt_seed
      `,
        [
          lesson.lesson_id,
          lesson.level,
          unit_id,
          lesson.lesson_index,
          lesson.title_ru,
          lesson.micro_goal_ru,
          JSON.stringify(lesson.grammar_focus),
          JSON.stringify(lesson.target_vocab),
          lesson.prompt_seed,
        ]
      );
    }

    await client.query("COMMIT");
    process.stdout.write(
      `seeded levels=${seed.levels.length} units=${seed.units.length} lessons=${seed.lessons.length}\n`
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

await main();
