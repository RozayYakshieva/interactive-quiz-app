-- Flyway requires double underscore: V7__description.sql

ALTER TABLE participants
    ADD COLUMN IF NOT EXISTS nickname VARCHAR(100);

UPDATE participants
SET nickname = COALESCE(
    (SELECT u.username FROM users u WHERE u.id = participants.user_id),
    'Player'
)
WHERE nickname IS NULL;

ALTER TABLE participants
    ALTER COLUMN nickname SET NOT NULL;

-- Anonymous players join without a user account
ALTER TABLE participants
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE participants
    DROP CONSTRAINT IF EXISTS participants_session_id_user_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_user
    ON participants (session_id, user_id)
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_nickname
    ON participants (session_id, nickname)
    WHERE user_id IS NULL;
