-- V1__init_schema.sql
-- Multiplayer quiz app schema

-- =====================
-- Enums
-- =====================
CREATE TYPE user_role     AS ENUM ('organizer', 'participant');
CREATE TYPE quiz_status   AS ENUM ('draft', 'active', 'finished');
CREATE TYPE question_type AS ENUM ('single', 'multiple');
CREATE TYPE session_status AS ENUM ('waiting', 'running', 'finished');

-- =====================
-- users
-- =====================
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username      VARCHAR(100) NOT NULL,
    role          user_role NOT NULL DEFAULT 'participant',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- quizzes
-- =====================
CREATE TABLE quizzes (
    id                 BIGSERIAL PRIMARY KEY,
    organizer_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    time_per_question  INTEGER,
    status             quiz_status NOT NULL DEFAULT 'draft',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- questions
-- =====================
CREATE TABLE questions (
    id          BIGSERIAL PRIMARY KEY,
    quiz_id     BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    image_url   VARCHAR(500),
    type        question_type NOT NULL DEFAULT 'single',
    order_index INTEGER NOT NULL
);

-- =====================
-- answer_options
-- =====================
CREATE TABLE answer_options (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text        VARCHAR(500) NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE
);

-- =====================
-- sessions (game rooms)
-- =====================
CREATE TABLE sessions (
    id                      BIGSERIAL PRIMARY KEY,
    quiz_id                 BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    room_code               VARCHAR(8) UNIQUE NOT NULL,
    current_question_index  INTEGER NOT NULL DEFAULT 0,
    status                  session_status NOT NULL DEFAULT 'waiting',
    started_at              TIMESTAMPTZ
);

-- =====================
-- participants
-- =====================
CREATE TABLE participants (
    id          BIGSERIAL PRIMARY KEY,
    session_id  BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score       INTEGER NOT NULL DEFAULT 0,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- =====================
-- user_answers
-- =====================
CREATE TABLE user_answers (
    id               BIGSERIAL PRIMARY KEY,
    participant_id   BIGINT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    question_id      BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_option_id BIGINT NOT NULL REFERENCES answer_options(id) ON DELETE CASCADE,
    is_correct       BOOLEAN,
    answered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Indexes
-- =====================
CREATE INDEX idx_quizzes_organizer        ON quizzes(organizer_id);
CREATE INDEX idx_quizzes_status           ON quizzes(status);
CREATE INDEX idx_questions_quiz           ON questions(quiz_id);
CREATE INDEX idx_answer_options_question  ON answer_options(question_id);
CREATE INDEX idx_sessions_quiz            ON sessions(quiz_id);
CREATE INDEX idx_sessions_room_code       ON sessions(room_code);
CREATE INDEX idx_participants_session     ON participants(session_id);
CREATE INDEX idx_participants_user        ON participants(user_id);
CREATE INDEX idx_user_answers_participant ON user_answers(participant_id);
CREATE INDEX idx_user_answers_question    ON user_answers(question_id);
