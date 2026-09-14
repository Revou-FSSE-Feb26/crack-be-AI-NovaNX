UPDATE "Book"
SET
  "description" = COALESCE("description", CASE "id"
    WHEN '21-rasa-bakso' THEN 'A lively culinary story that celebrates the many flavors and memories found in a bowl of bakso.'
    WHEN 'white-fang' THEN 'A wild wolf-dog learns about trust, survival, and companionship in the harsh northern frontier.'
    WHEN 'oliver-twist' THEN 'An orphan navigates poverty and injustice in nineteenth-century London while seeking a better life.'
    WHEN 'the-scarecrow' THEN 'A detective follows a disturbing trail that links an old crime to a dangerous new case.'
    WHEN 'rumah-yang-menelan-penghuninya' THEN 'A haunting Indonesian tale about a house, its secrets, and the people drawn into its darkness.'
    WHEN 'yeti-bertukar-gigi' THEN 'A playful children''s adventure about a yeti facing an unexpected change and discovering courage.'
    WHEN 'hidden-neon' THEN 'A neon-lit mystery where hidden messages and unlikely allies reveal the truth behind a city legend.'
    WHEN 'digital-fortress' THEN 'A fast-paced techno-thriller about cryptography, surveillance, and a code that could expose everything.'
    WHEN 'atomic-habits' THEN 'A practical guide to building lasting habits through small, consistent improvements.'
    WHEN 'rich-dad-poor-dad' THEN 'An introduction to personal finance through contrasting lessons about money, assets, and financial independence.'
    WHEN 'brief-history-of-time' THEN 'An accessible exploration of cosmology, time, black holes, and the origins of the universe.'
    WHEN 'learning-react' THEN 'A hands-on introduction to building modern user interfaces with React and its component model.'
    WHEN 'neon-library' THEN 'A speculative journey through a future library where every book can change the path of its reader.'
    ELSE "description"
  END),
  "pageCount" = COALESCE("pageCount", CASE "id"
    WHEN '21-rasa-bakso' THEN 224
    WHEN 'white-fang' THEN 320
    WHEN 'oliver-twist' THEN 608
    WHEN 'the-scarecrow' THEN 432
    WHEN 'rumah-yang-menelan-penghuninya' THEN 288
    WHEN 'yeti-bertukar-gigi' THEN 96
    WHEN 'hidden-neon' THEN 352
    WHEN 'digital-fortress' THEN 528
    WHEN 'atomic-habits' THEN 320
    WHEN 'rich-dad-poor-dad' THEN 336
    WHEN 'brief-history-of-time' THEN 256
    WHEN 'learning-react' THEN 350
    WHEN 'neon-library' THEN 304
    ELSE "pageCount"
  END)
WHERE "id" IN (
  '21-rasa-bakso', 'white-fang', 'oliver-twist', 'the-scarecrow',
  'rumah-yang-menelan-penghuninya', 'yeti-bertukar-gigi', 'hidden-neon',
  'digital-fortress', 'atomic-habits', 'rich-dad-poor-dad',
  'brief-history-of-time', 'learning-react', 'neon-library'
)
AND ("description" IS NULL OR "pageCount" IS NULL);
