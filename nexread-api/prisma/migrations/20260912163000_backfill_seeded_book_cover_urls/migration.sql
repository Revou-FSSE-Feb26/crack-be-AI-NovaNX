UPDATE "Book"
SET "coverUrl" = CASE "id"
  WHEN '21-rasa-bakso' THEN '/covers/books/21-rasa-bakso.png'
  WHEN 'brief-history-of-time' THEN '/covers/books/a-brief-history-of-time.png'
  WHEN 'atomic-habits' THEN '/covers/books/atomic-habits.png'
  WHEN 'digital-fortress' THEN '/covers/books/digital-fortress.png'
  WHEN 'hidden-neon' THEN '/covers/books/hidden-neon.png'
  WHEN 'learning-react' THEN '/covers/books/learning-react.png'
  WHEN 'neon-library' THEN '/covers/books/neon-library.png'
  WHEN 'oliver-twist' THEN '/covers/books/oliver-twist.png'
  WHEN 'rich-dad-poor-dad' THEN '/covers/books/rich-dad-poor-dad.png'
  WHEN 'rumah-yang-menelan-penghuninya' THEN '/covers/books/rumah-yang-menelan-penghuninya.png'
  WHEN 'the-scarecrow' THEN '/covers/books/the-scarecrow.png'
  WHEN 'white-fang' THEN '/covers/books/white-fang.png'
  WHEN 'yeti-bertukar-gigi' THEN '/covers/books/yeti-bertukar-gigi.png'
END
WHERE "id" IN (
  '21-rasa-bakso',
  'brief-history-of-time',
  'atomic-habits',
  'digital-fortress',
  'hidden-neon',
  'learning-react',
  'neon-library',
  'oliver-twist',
  'rich-dad-poor-dad',
  'rumah-yang-menelan-penghuninya',
  'the-scarecrow',
  'white-fang',
  'yeti-bertukar-gigi'
);
