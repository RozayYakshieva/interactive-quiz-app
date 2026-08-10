-- Idempotent: align sessions.code with GameSession entity after V1 schema

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'sessions'
          AND column_name = 'room_code'
    ) THEN
        ALTER TABLE sessions RENAME COLUMN room_code TO code;
    END IF;
END $$;

ALTER TABLE sessions
    ALTER COLUMN code TYPE VARCHAR(8);

ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

DROP INDEX IF EXISTS idx_sessions_room_code;
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
