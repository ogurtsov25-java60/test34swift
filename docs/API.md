# API Contracts (v0)

## Auth
POST /auth/apple
- input: { id_token: string }
- output: { token: string }

POST /auth/dev (dev only)
- input: {}
- output: { token: string }

GET /me
- output: UserProfile

## Today / Progress
GET /today
- output:
{
  "current_level": "A1",
  "current_lesson_id": "A1-U03-L02",
  "micro_goal_ru": "Предлоги ב/ל/מ",
  "srs_due_count": 12
}

GET /level-status
- output:
{
  "current_level":"B1",
  "completion": 0.63,
  "accuracy": 0.78,
  "fluency": 0.71,
  "eligible_for_upgrade": false
}

## Lessons
POST /lesson/start
- input: { lesson_id?: string }
- output: { session_id: string, lesson: LessonDTO }

POST /lesson/turn
- input:
{
  "session_id": string,
  "user_text": string,
  "user_audio_b64"?: string
}
- output:
{
  "ai_text_he": string,
  "ai_text_ru"?: string,
  "ai_audio_b64"?: string
}

POST /lesson/end
- input: { session_id: string }
- output: LessonReport

## SRS
GET /srs/queue
- output: { due: FlashcardDTO[] }

POST /srs/review
- input: { card_id: string, grade: "easy"|"ok"|"hard" }
- output: { card_id: string, due_at: string, interval_days: number, ease: number, repetitions: number }

