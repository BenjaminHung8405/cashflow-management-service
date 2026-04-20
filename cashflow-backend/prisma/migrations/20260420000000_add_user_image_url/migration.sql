ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "image_url" text NOT NULL
DEFAULT 'https://cdn-icons-png.freepik.com/512/3607/3607444.png';
