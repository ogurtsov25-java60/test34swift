# PRD — AI Hebrew (A1–C1 MVP)

## Product definition
An adaptive Hebrew learning app (CEFR A1–C1 / Ulpan Alef–He) with:
- automatic learning plan (no topic picker),
- daily voice conversation lesson (5–10 min),
- structured lesson report (JSON),
- SRS with reminders.

## Levels
CEFR: A1, A2, B1, B2, C1
Ulpan mapping: Alef(A1), Bet(A2), Gimel(B1), Dalet(B2), He(C1)

## Curriculum scope (MVP includes all levels)
For each level:
- 12 Units
- each Unit: 5 Lessons
Total lessons: 5 levels × 60 = 300 lessons.

### Key requirement: do NOT hardcode 300 lessons manually
Store "Curriculum Skeleton" (levels/units/goals/grammar/target vocab packs) and generate per-lesson prompts deterministically.

## Daily flow
Home "Today" shows:
1) Continue plan (lesson)
2) SRS queue (due cards)
3) Daily micro-goal (derived from current unit grammar focus)

User taps "Start lesson" -> voice session -> end -> report -> add vocab to SRS.

## Voice lesson behavior
- Voice-to-voice preferred.
- Fallback to text-only if ASR/TTS fails.
- AI must keep language complexity within user's level.
- AI can correct gently during the lesson but MUST provide full corrections in the final report.

## Lesson Report (strict JSON schema)
The final lesson report MUST match shared schema `LessonReport` exactly:
- transcript (ai/user turns in Hebrew + optional RU translation)
- corrections list
- vocab_to_learn list (>=5 if lesson >=5 min)
- skill_scores (0..1)
- next_steps_ru list

## Placement
Onboarding includes a short placement voice dialog.
Output:
- level_cefr
- confidence 0..1
- estimated_vocab
- initial lesson id

## Progression and level-up
User completes lessons sequentially within a unit.
Unit completion: >=4/5 lessons completed (MVP rule).
Level upgrade eligibility:
- level completion >=80%
- avg_accuracy >=0.75
- avg_fluency >=0.70
- no "weak zones" in last 10 reports
If eligible, upgrade automatically after next completed lesson.

## SRS (MVP algorithm)
Maintain per card:
- repetitions
- interval_days
- ease (start 2.5, min 1.3)
- due_at

Grades:
- easy: ease += 0.15; interval = max(1, round(interval * ease))
- ok: interval = max(1, round(interval * 1.3))
- hard: ease -= 0.2 (min 1.3); interval = 1; repetitions = max(0, repetitions-1)

## Notifications (MVP)
Use iOS local notifications for reminders:
- preferred time (HH:MM)
- days of week
- can be toggled

## Non-functional
- iOS 16+
- Hebrew RTL support
- latency: response after ASR text <= 2.5s (best effort)
- privacy: allow user to delete history

