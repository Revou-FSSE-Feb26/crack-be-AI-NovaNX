export type AuthorSeedData = {
  id: string;
  name: string;
  booksCount: number;
  borrowedBooksCount: number;
  rating: number;
  avatarPath: string | null;
};

export const authors: AuthorSeedData[] = [
  {
    id: 'andrea-hirata',
    name: 'Andrea Hirata',
    booksCount: 12,
    borrowedBooksCount: 8400,
    rating: 4.9,
    avatarPath: '/assets/images/authors/andrea-hirata.svg',
  },
  {
    id: 'tere-liye',
    name: 'Tere Liye',
    booksCount: 16,
    borrowedBooksCount: 9200,
    rating: 4.8,
    avatarPath: '/assets/images/authors/tere-liye.svg',
  },
  {
    id: 'dee-lestari',
    name: 'Dee Lestari',
    booksCount: 20,
    borrowedBooksCount: 7800,
    rating: 4.8,
    avatarPath: '/assets/images/authors/dee-lestari.svg',
  },
  {
    id: 'jk-rowling',
    name: 'J.K. Rowling',
    booksCount: 24,
    borrowedBooksCount: 12100,
    rating: 4.9,
    avatarPath: '/assets/images/authors/jk-rowling.svg',
  },
  {
    id: 'jack-london',
    name: 'Jack London',
    booksCount: 18,
    borrowedBooksCount: 6500,
    rating: 4.7,
    avatarPath: '/assets/images/authors/jack-london.svg',
  },
  {
    id: 'charles-dickens',
    name: 'Charles Dickens',
    booksCount: 30,
    borrowedBooksCount: 11300,
    rating: 4.9,
    avatarPath: '/assets/images/authors/charles-dickens.svg',
  },
  {
    id: 'michael-connelly',
    name: 'Michael Connelly',
    booksCount: 22,
    borrowedBooksCount: 7100,
    rating: 4.7,
    avatarPath: '/assets/images/authors/michael-connelly.svg',
  },
  {
    id: 'dan-brown',
    name: 'Dan Brown',
    booksCount: 14,
    borrowedBooksCount: 8900,
    rating: 4.8,
    avatarPath: '/assets/images/authors/dan-brown.svg',
  },
  {
    id: 'james-clear',
    name: 'James Clear',
    booksCount: 1,
    borrowedBooksCount: 0,
    rating: 4.4,
    avatarPath: null,
  },
  {
    id: 'robert-kiyosaki',
    name: 'Robert Kiyosaki',
    booksCount: 1,
    borrowedBooksCount: 0,
    rating: 3.8,
    avatarPath: null,
  },
  {
    id: 'stephen-hawking',
    name: 'Stephen Hawking',
    booksCount: 1,
    borrowedBooksCount: 0,
    rating: 2.7,
    avatarPath: null,
  },
  {
    id: 'alex-banks',
    name: 'Alex Banks',
    booksCount: 1,
    borrowedBooksCount: 0,
    rating: 1.9,
    avatarPath: null,
  },
];
