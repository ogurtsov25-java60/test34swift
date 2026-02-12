# Curriculum (A1–C1) storage strategy

## Goal
Support 300 lessons in MVP without hand-authoring every lesson.

## Data model
Levels -> Units -> Lessons

We store:
1) LEVELS (A1..C1)
2) UNITS: 12 per level, each with:
- unit goals (RU)
- grammar_focus tags
- core_vocab_packs (arrays of vocab items)
- conversation_style

3) LESSONS: generated from Unit:
- 5 lessons per unit with deterministic variation:
  L1: introduce core vocab pack #1 + grammar focus
  L2: reuse 60% + add pack #2 + more questions
  L3: comprehension & speed
  L4: corrections-heavy practice
  L5: checkpoint (mini-assessment)

## Unit templates (examples)
A1 Unit types:
- greetings, family, numbers/time, shopping, doctor basics, directions, etc.
A2:
- past tense, daily routines, telling stories, etc.
B1:
- future, opinions, workplace scenarios
B2:
- argumentation, formal register
C1:
- idioms, nuance, colloquial vs formal

## Required seed content for MVP
- Levels table (5 rows)
- Units table (5*12=60 rows) with grammar_focus + vocab packs
- Lessons table (5*12*5=300 rows) generated on seed step

## Deterministic generation rule
lesson_id: "{level}-U{unitIndex:02}-L{lessonIndex:02}"
Prompt template for AI includes:
- level rules
- grammar focus
- target vocab list
- length targets
- "teacher persona" constraints

