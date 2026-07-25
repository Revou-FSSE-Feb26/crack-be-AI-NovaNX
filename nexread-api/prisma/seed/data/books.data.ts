export type BookSeedData = {
  id: string;
  title: string;
  authorId: string;
  categoryId: string;
  rating: number;
  coverClassName: string;
};

export const books: BookSeedData[] = [
  {
    id: '21-rasa-bakso',
    title: '21 Rasa Bakso',
    authorId: 'andrea-hirata',
    categoryId: 'cat-fiction',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#ff637e,_#fb2c36_50%,_#020618)]',
  },
  {
    id: 'white-fang',
    title: 'White Fang',
    authorId: 'jack-london',
    categoryId: 'cat-fiction',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#5ee9b5,_#009689_50%,_#020618)]',
  },
  {
    id: 'oliver-twist',
    title: 'Oliver Twist',
    authorId: 'charles-dickens',
    categoryId: 'cat-education',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#fee685,_#ff6900_50%,_#020618)]',
  },
  {
    id: 'the-scarecrow',
    title: 'The Scarecrow',
    authorId: 'michael-connelly',
    categoryId: 'cat-non-fiction',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#a4f4cf,_#006045_50%,_#020618)]',
  },
  {
    id: 'rumah-yang-menelan-penghuninya',
    title: 'Rumah yang Menelan Penghuninya',
    authorId: 'dee-lestari',
    categoryId: 'cat-self-improvement',
    rating: 4.9,
    coverClassName: 'bg-[linear-gradient(135deg,_#cad5e2,_#1d293d_50%,_#000)]',
  },
  {
    id: 'yeti-bertukar-gigi',
    title: 'Yeti Bertukar Gigi',
    authorId: 'tere-liye',
    categoryId: 'cat-education',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#ffb86a,_#f54900_50%,_#020618)]',
  },
  {
    id: 'hidden-neon',
    title: 'Hidden Neon',
    authorId: 'jk-rowling',
    categoryId: 'cat-finance',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#c4b4ff,_#7008e7_50%,_#020618)]',
  },
  {
    id: 'digital-fortress',
    title: 'Digital Fortress',
    authorId: 'dan-brown',
    categoryId: 'cat-science-technology',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#53eafd,_#155dfc_50%,_#020618)]',
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    authorId: 'james-clear',
    categoryId: 'cat-self-improvement',
    rating: 4.4,
    coverClassName:
      'bg-[linear-gradient(135deg,_#86efac,_#16a34a_50%,_#020618)]',
  },
  {
    id: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    authorId: 'robert-kiyosaki',
    categoryId: 'cat-finance',
    rating: 3.8,
    coverClassName:
      'bg-[linear-gradient(135deg,_#fde68a,_#ca8a04_50%,_#020618)]',
  },
  {
    id: 'brief-history-of-time',
    title: 'A Brief History of Time',
    authorId: 'stephen-hawking',
    categoryId: 'cat-science-technology',
    rating: 2.7,
    coverClassName:
      'bg-[linear-gradient(135deg,_#93c5fd,_#2563eb_50%,_#020618)]',
  },
  {
    id: 'learning-react',
    title: 'Learning React',
    authorId: 'alex-banks',
    categoryId: 'cat-education',
    rating: 1.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#f0abfc,_#a21caf_50%,_#020618)]',
  },
  {
    id: 'neon-library',
    title: 'Neon Library',
    authorId: 'andrea-hirata',
    categoryId: 'cat-fiction',
    rating: 5.0,
    coverClassName:
      'bg-[linear-gradient(135deg,_#4ddeff,_#7c5cff_50%,_#020618)]',
  },
];
