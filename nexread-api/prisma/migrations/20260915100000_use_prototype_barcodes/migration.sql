WITH existing_prototype AS (
  SELECT COALESCE(MAX(SUBSTRING("barcode" FROM 4)::INTEGER), 0) AS maximum_number
  FROM "BookCopy"
  WHERE "barcode" ~ '^BK-[0-9]+$'
), generated_copies AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (ORDER BY "id") AS sequence_number
  FROM "BookCopy"
  WHERE "barcode" LIKE 'NXR-%'
)
UPDATE "BookCopy" AS copy
SET
  "barcode" = 'BK-' || LPAD(
    (existing_prototype.maximum_number + generated_copies.sequence_number)::TEXT,
    3,
    '0'
  ),
  "updatedAt" = NOW()
FROM generated_copies, existing_prototype
WHERE copy."id" = generated_copies."id";
