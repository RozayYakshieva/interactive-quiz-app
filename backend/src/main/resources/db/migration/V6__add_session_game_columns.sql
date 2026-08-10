-- Align sessions table with GameSession entity (missing columns on legacy DB)

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS current_question_index INTEGER NOT NULL DEFAULT 0;

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
