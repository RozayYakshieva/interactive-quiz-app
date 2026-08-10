-- Allow longer image URLs for question media links

ALTER TABLE questions
    ALTER COLUMN image_url TYPE TEXT;
