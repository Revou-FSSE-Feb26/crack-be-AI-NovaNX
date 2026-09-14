export type BookSeedData = {
  id: string;
  title: string;
  authorId: string;
  categoryId: string;
  rating: number;
  coverClassName: string;
  coverUrl: string;
  description: string;
  pageCount: number;
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
    coverUrl: '/covers/books/21-rasa-bakso.png',
    description: 'A lively culinary story that celebrates the many flavors and memories found in a bowl of bakso.',
    pageCount: 224,
  },
  {
    id: 'white-fang',
    title: 'White Fang',
    authorId: 'jack-london',
    categoryId: 'cat-fiction',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#5ee9b5,_#009689_50%,_#020618)]',
    coverUrl: '/covers/books/white-fang.png',
    description: 'A wild wolf-dog learns about trust, survival, and companionship in the harsh northern frontier.',
    pageCount: 320,
  },
  {
    id: 'oliver-twist',
    title: 'Oliver Twist',
    authorId: 'charles-dickens',
    categoryId: 'cat-education',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#fee685,_#ff6900_50%,_#020618)]',
    coverUrl: '/covers/books/oliver-twist.png',
    description: 'An orphan navigates poverty and injustice in nineteenth-century London while seeking a better life.',
    pageCount: 608,
  },
  {
    id: 'the-scarecrow',
    title: 'The Scarecrow',
    authorId: 'michael-connelly',
    categoryId: 'cat-non-fiction',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#a4f4cf,_#006045_50%,_#020618)]',
    coverUrl: '/covers/books/the-scarecrow.png',
    description: 'A detective follows a disturbing trail that links an old crime to a dangerous new case.',
    pageCount: 432,
  },
  {
    id: 'rumah-yang-menelan-penghuninya',
    title: 'Rumah yang Menelan Penghuninya',
    authorId: 'dee-lestari',
    categoryId: 'cat-self-improvement',
    rating: 4.9,
    coverClassName: 'bg-[linear-gradient(135deg,_#cad5e2,_#1d293d_50%,_#000)]',
    coverUrl: '/covers/books/rumah-yang-menelan-penghuninya.png',
    description: 'A haunting Indonesian tale about a house, its secrets, and the people drawn into its darkness.',
    pageCount: 288,
  },
  {
    id: 'yeti-bertukar-gigi',
    title: 'Yeti Bertukar Gigi',
    authorId: 'tere-liye',
    categoryId: 'cat-education',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#ffb86a,_#f54900_50%,_#020618)]',
    coverUrl: '/covers/books/yeti-bertukar-gigi.png',
    description: 'A playful children’s adventure about a yeti facing an unexpected change and discovering courage.',
    pageCount: 96,
  },
  {
    id: 'hidden-neon',
    title: 'Hidden Neon',
    authorId: 'jk-rowling',
    categoryId: 'cat-finance',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#c4b4ff,_#7008e7_50%,_#020618)]',
    coverUrl: '/covers/books/hidden-neon.png',
    description: 'A neon-lit mystery where hidden messages and unlikely allies reveal the truth behind a city legend.',
    pageCount: 352,
  },
  {
    id: 'digital-fortress',
    title: 'Digital Fortress',
    authorId: 'dan-brown',
    categoryId: 'cat-science-technology',
    rating: 4.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#53eafd,_#155dfc_50%,_#020618)]',
    coverUrl: '/covers/books/digital-fortress.png',
    description: 'A fast-paced techno-thriller about cryptography, surveillance, and a code that could expose everything.',
    pageCount: 528,
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    authorId: 'james-clear',
    categoryId: 'cat-self-improvement',
    rating: 4.4,
    coverClassName:
      'bg-[linear-gradient(135deg,_#86efac,_#16a34a_50%,_#020618)]',
    coverUrl: '/covers/books/atomic-habits.png',
    description: 'A practical guide to building lasting habits through small, consistent improvements.',
    pageCount: 320,
  },
  {
    id: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    authorId: 'robert-kiyosaki',
    categoryId: 'cat-finance',
    rating: 3.8,
    coverClassName:
      'bg-[linear-gradient(135deg,_#fde68a,_#ca8a04_50%,_#020618)]',
    coverUrl: '/covers/books/rich-dad-poor-dad.png',
    description: 'An introduction to personal finance through contrasting lessons about money, assets, and financial independence.',
    pageCount: 336,
  },
  {
    id: 'brief-history-of-time',
    title: 'A Brief History of Time',
    authorId: 'stephen-hawking',
    categoryId: 'cat-science-technology',
    rating: 2.7,
    coverClassName:
      'bg-[linear-gradient(135deg,_#93c5fd,_#2563eb_50%,_#020618)]',
    coverUrl: '/covers/books/a-brief-history-of-time.png',
    description: 'An accessible exploration of cosmology, time, black holes, and the origins of the universe.',
    pageCount: 256,
  },
  {
    id: 'learning-react',
    title: 'Learning React',
    authorId: 'alex-banks',
    categoryId: 'cat-education',
    rating: 1.9,
    coverClassName:
      'bg-[linear-gradient(135deg,_#f0abfc,_#a21caf_50%,_#020618)]',
    coverUrl: '/covers/books/learning-react.png',
    description: 'A hands-on introduction to building modern user interfaces with React and its component model.',
    pageCount: 350,
  },
  {
    id: 'neon-library',
    title: 'Neon Library',
    authorId: 'andrea-hirata',
    categoryId: 'cat-fiction',
    rating: 5.0,
    coverClassName:
      'bg-[linear-gradient(135deg,_#4ddeff,_#7c5cff_50%,_#020618)]',
    coverUrl: '/covers/books/neon-library.png',
    description: 'A speculative journey through a future library where every book can change the path of its reader.',
    pageCount: 304,
  },
];
