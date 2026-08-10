-- V2__replace_enums_with_varchar.sql
-- Replace PostgreSQL ENUM types with VARCHAR for Hibernate compatibility

-- Remove defaults that reference ENUM types first
ALTER TABLE users   ALTER COLUMN role DROP DEFAULT;
ALTER TABLE quizzes ALTER COLUMN status DROP DEFAULT;
ALTER TABLE questions ALTER COLUMN type DROP DEFAULT;
ALTER TABLE sessions ALTER COLUMN status DROP DEFAULT;

-- Change column types from ENUM to VARCHAR
ALTER TABLE users     ALTER COLUMN role   TYPE VARCHAR(20);
ALTER TABLE quizzes   ALTER COLUMN status TYPE VARCHAR(20);
ALTER TABLE questions ALTER COLUMN type   TYPE VARCHAR(20);
ALTER TABLE sessions  ALTER COLUMN status TYPE VARCHAR(20);

-- Re-add defaults as plain strings
ALTER TABLE users     ALTER COLUMN role   SET DEFAULT 'participant';
ALTER TABLE quizzes   ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE questions ALTER COLUMN type   SET DEFAULT 'single';
ALTER TABLE sessions  ALTER COLUMN status SET DEFAULT 'waiting';

-- Drop ENUM types
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS quiz_status;
DROP TYPE IF EXISTS question_type;
DROP TYPE IF EXISTS session_status;
