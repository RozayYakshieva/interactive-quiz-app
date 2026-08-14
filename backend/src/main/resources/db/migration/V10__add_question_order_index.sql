ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_index INTEGER;

UPDATE questions q
SET order_index = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY quiz_id ORDER BY id) - 1 AS rn
  FROM questions
) sub
WHERE q.id = sub.id
  AND q.order_index IS NULL;

ALTER TABLE questions ALTER COLUMN order_index SET NOT NULL;
