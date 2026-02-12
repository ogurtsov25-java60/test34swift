CREATE TABLE IF NOT EXISTS levels (
  cefr_level text PRIMARY KEY,
  ulpan_name text NOT NULL
);

CREATE TABLE IF NOT EXISTS units (
  unit_id bigserial PRIMARY KEY,
  level text NOT NULL REFERENCES levels(cefr_level) ON DELETE CASCADE,
  unit_index int NOT NULL CHECK (unit_index >= 1 AND unit_index <= 12),
  goals_ru text NOT NULL,
  grammar_focus jsonb NOT NULL DEFAULT '[]'::jsonb,
  core_vocab_packs jsonb NOT NULL DEFAULT '[]'::jsonb,
  conversation_style text NOT NULL DEFAULT 'neutral',
  UNIQUE (level, unit_index)
);

CREATE TABLE IF NOT EXISTS lessons (
  lesson_id text PRIMARY KEY,
  level text NOT NULL REFERENCES levels(cefr_level) ON DELETE CASCADE,
  unit_id bigint NOT NULL REFERENCES units(unit_id) ON DELETE CASCADE,
  lesson_index int NOT NULL CHECK (lesson_index >= 1 AND lesson_index <= 5),
  title_ru text NOT NULL,
  micro_goal_ru text NOT NULL,
  grammar_focus jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_vocab jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_seed text NOT NULL,
  UNIQUE (unit_id, lesson_index)
);

CREATE TABLE IF NOT EXISTS users (
  user_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  current_level text REFERENCES levels(cefr_level),
  current_lesson_id text REFERENCES lessons(lesson_id),
  preferred_language text NOT NULL DEFAULT 'ru'
);

CREATE TABLE IF NOT EXISTS progress (
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lesson_id text NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  accuracy real,
  fluency real,
  comprehension real,
  report jsonb,
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS dialog_sessions (
  session_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  lesson_id text NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS dialog_sessions_user_id_idx ON dialog_sessions(user_id);
CREATE INDEX IF NOT EXISTS dialog_sessions_lesson_id_idx ON dialog_sessions(lesson_id);

CREATE TABLE IF NOT EXISTS flashcards (
  card_id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  he text NOT NULL,
  ru text NOT NULL,
  example_he text NOT NULL,
  example_ru text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  audio_tts_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flashcards_user_id_idx ON flashcards(user_id);

CREATE TABLE IF NOT EXISTS srs_state (
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  card_id text NOT NULL REFERENCES flashcards(card_id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  interval_days int NOT NULL CHECK (interval_days >= 1),
  ease real NOT NULL CHECK (ease >= 1.3),
  repetitions int NOT NULL CHECK (repetitions >= 0),
  PRIMARY KEY (user_id, card_id)
);

