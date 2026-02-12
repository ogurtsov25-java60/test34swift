# Shared schemas

All API payloads must validate with Zod schemas in `packages/shared/src/schemas.ts`.

Main schemas:
- `UserProfile`
- `LessonDTO`
- `LessonReport`
- `FlashcardDTO`
- `SrsReviewRequest` / `SrsReviewResponse`
- `TodayResponse`
- `LevelStatusResponse`
- `AuthAppleRequest` / `AuthAppleResponse`
- `LessonStartRequest` / `LessonStartResponse`
- `LessonTurnRequest` / `LessonTurnResponse`
- `LessonEndRequest`
- `SrsQueueResponse`

LessonReport MUST follow the exact structure for storage and UI rendering.

## Definitions (v0)

### UserProfile
```json
{
  "user_id": "user_123",
  "current_level": "A1",
  "current_lesson_id": "A1-U03-L02"
}
```

### LessonDTO
```json
{
  "lesson_id": "A1-U03-L02",
  "level": "A1",
  "title_ru": "Знакомство и приветствия",
  "micro_goal_ru": "Предлоги ב/ל/מ",
  "grammar_focus": ["prepositions"]
}
```

## Samples (must validate)

### TodayResponse
```json
{
  "current_level": "A1",
  "current_lesson_id": "A1-U03-L02",
  "micro_goal_ru": "Предлоги ב/ל/מ",
  "srs_due_count": 12
}
```

### SrsReviewResponse
```json
{
  "card_id": "card_123",
  "due_at": "2026-02-11T12:00:00.000Z",
  "interval_days": 3,
  "ease": 2.5,
  "repetitions": 1
}
```

### LessonReport
```json
{
  "lesson_id": "A1-U03-L02",
  "summary_ru": "Практика приветствий и вопросов о самочувствии.",
  "transcript": [
    { "role": "user", "he": "שלום", "ru": "привет" },
    { "role": "ai", "he": "שלום! מה שלומך?", "ru": "Привет! Как ты?" }
  ],
  "corrections": [
    {
      "user_he": "אני טוב",
      "fixed_he": "אני טוב",
      "explain_ru": "Фраза корректна; пример без изменения.",
      "type": "grammar"
    }
  ],
  "vocab_to_learn": [
    {
      "he": "מה שלומך",
      "ru": "как ты",
      "example_he": "מה שלומך היום?",
      "example_ru": "Как ты сегодня?"
    }
  ],
  "skill_scores": { "fluency": 0.7, "accuracy": 0.8, "comprehension": 0.75 },
  "next_steps_ru": ["Повтори фразы приветствия вслух", "Сделай 5 карточек SRS"]
}
```
