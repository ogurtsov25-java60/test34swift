ALTER TABLE dialog_sessions
  ADD COLUMN IF NOT EXISTS report_json jsonb;

CREATE TABLE IF NOT EXISTS auth_tokens (
  token text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_tokens_user_id_idx ON auth_tokens(user_id);

