-- Ensure canonical email uniqueness (case-insensitive + trimmed)
DO $$
DECLARE
  duplicate_email TEXT;
BEGIN
  SELECT lower(btrim("email"))
  INTO duplicate_email
  FROM "users"
  WHERE "email" IS NOT NULL
  GROUP BY lower(btrim("email"))
  HAVING COUNT(*) > 1
  LIMIT 1;

  IF duplicate_email IS NOT NULL THEN
    RAISE EXCEPTION
      'Cannot enforce canonical email uniqueness. Duplicate canonical email found: %',
      duplicate_email;
  END IF;
END $$;

UPDATE "users"
SET "email" = lower(btrim("email"))
WHERE "email" IS NOT NULL
  AND "email" <> lower(btrim("email"));

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_canonical_key"
ON "users" (lower(btrim("email")))
WHERE "email" IS NOT NULL;

ALTER TABLE "users"
DROP CONSTRAINT IF EXISTS "users_email_canonical_check";

ALTER TABLE "users"
ADD CONSTRAINT "users_email_canonical_check"
CHECK ("email" IS NULL OR "email" = lower(btrim("email")));
