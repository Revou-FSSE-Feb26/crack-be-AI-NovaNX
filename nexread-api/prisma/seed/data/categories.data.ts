export type CategorySeedData = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  iconPath: string;
};

export const categories: CategorySeedData[] = [
  {
    id: 'cat-fiction',
    name: 'Fiction',
    slug: 'fiction',
    subtitle: 'Imagination & stories',
    iconPath: '/assets/icons/category/Icon-5.svg',
  },
  {
    id: 'cat-non-fiction',
    name: 'Non-Fiction',
    slug: 'non-fiction',
    subtitle: 'Real-world insight',
    iconPath: '/assets/icons/category/Icon-4.svg',
  },
  {
    id: 'cat-self-improvement',
    name: 'Self-Improvement',
    slug: 'self-improvement',
    subtitle: 'Growth & mindset',
    iconPath: '/assets/icons/category/Icon-3.svg',
  },
  {
    id: 'cat-finance',
    name: 'Finance',
    slug: 'finance',
    subtitle: 'Money & business',
    iconPath: '/assets/icons/category/Icon-2.svg',
  },
  {
    id: 'cat-science-technology',
    name: 'Science & Technology',
    slug: 'science-technology',
    subtitle: 'Future knowledge',
    iconPath: '/assets/icons/category/Icon-1.svg',
  },
  {
    id: 'cat-education',
    name: 'Education',
    slug: 'education',
    subtitle: 'Learning resources',
    iconPath: '/assets/icons/category/Icon-6.svg',
  },
];
