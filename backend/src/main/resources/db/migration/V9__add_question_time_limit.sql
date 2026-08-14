-- Per-question timer override. NULL or 0 means unlimited time.
-- Existing questions inherit the quiz-level time_per_question so current quizzes keep their timing.

ALTER TABLE questions
    ADD COLUMN time_limit INTEGER;

UPDATE questions q
SET time_limit = quiz.time_per_question
FROM quizzes quiz
WHERE q.quiz_id = quiz.id;
