-- Collapse MovementType to only 'Transfer' and 'Assignment'.
-- Existing rows are remapped first so reducing the enum cannot fail on removed values:
--   Temporary/Permanent/Acting Assignment -> Assignment; everything else -> Transfer.

ALTER TYPE "MovementType" RENAME TO "MovementType_old";

CREATE TYPE "MovementType" AS ENUM ('Transfer', 'Assignment');

ALTER TABLE "announcements"
  ALTER COLUMN "movementType" TYPE "MovementType"
  USING (
    CASE
      WHEN "movementType"::text IN ('TemporaryAssignment', 'PermanentAssignment', 'ActingAssignment', 'Assignment') THEN 'Assignment'
      ELSE 'Transfer'
    END::"MovementType"
  );

ALTER TABLE "announcement_employees"
  ALTER COLUMN "movementType" TYPE "MovementType"
  USING (
    CASE
      WHEN "movementType" IS NULL THEN NULL
      WHEN "movementType"::text IN ('TemporaryAssignment', 'PermanentAssignment', 'ActingAssignment', 'Assignment') THEN 'Assignment'
      ELSE 'Transfer'
    END::"MovementType"
  );

ALTER TABLE "templates"
  ALTER COLUMN "movementTypeScope" TYPE "MovementType"
  USING (
    CASE
      WHEN "movementTypeScope" IS NULL THEN NULL
      WHEN "movementTypeScope"::text IN ('TemporaryAssignment', 'PermanentAssignment', 'ActingAssignment', 'Assignment') THEN 'Assignment'
      ELSE 'Transfer'
    END::"MovementType"
  );

DROP TYPE "MovementType_old";
