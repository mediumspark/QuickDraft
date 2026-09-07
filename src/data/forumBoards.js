export const FORUM_BOARDS = [
  {
    slug: 'fiction',
    name: 'Fiction',
    description: 'General fiction and literary stories.',
    kind: 'genre',
    sortOrder: 10,
  },
  {
    slug: 'nonfiction',
    name: 'Nonfiction',
    description: 'Essays, reportage, and factual writing.',
    kind: 'genre',
    sortOrder: 20,
  },
  {
    slug: 'poetry',
    name: 'Poetry',
    description: 'Poems of any form or length.',
    kind: 'genre',
    sortOrder: 30,
  },
  {
    slug: 'drama-screen',
    name: 'Drama & Screen',
    description: 'Plays, scripts, and screenwriting.',
    kind: 'genre',
    sortOrder: 40,
  },
  {
    slug: 'fantasy-scifi',
    name: 'Fantasy & Sci-Fi',
    description: 'Speculative worlds and futures.',
    kind: 'genre',
    sortOrder: 50,
  },
  {
    slug: 'mystery-thriller',
    name: 'Mystery & Thriller',
    description: 'Crime, suspense, and whodunits.',
    kind: 'genre',
    sortOrder: 60,
  },
  {
    slug: 'romance',
    name: 'Romance',
    description: 'Love stories and relationship-driven work.',
    kind: 'genre',
    sortOrder: 70,
  },
  {
    slug: 'horror',
    name: 'Horror',
    description: 'Scary, uncanny, and dark fiction.',
    kind: 'genre',
    sortOrder: 80,
  },
  {
    slug: 'young-adult',
    name: 'Young Adult',
    description: 'YA fiction and coming-of-age work.',
    kind: 'genre',
    sortOrder: 90,
  },
  {
    slug: 'memoir-essays',
    name: 'Memoir & Essays',
    description: 'Personal narrative and reflective prose.',
    kind: 'genre',
    sortOrder: 100,
  },
  {
    slug: 'advice',
    name: 'Asking for Advice',
    description: 'Get craft feedback, process tips, and second opinions.',
    kind: 'community',
    sortOrder: 200,
  },
  {
    slug: 'advertise-work',
    name: 'Advertising Work',
    description: 'Share links, calls for readers, and project announcements.',
    kind: 'community',
    sortOrder: 210,
  },
  {
    slug: 'chit-chat',
    name: 'Chit-Chat',
    description: 'Casual talk about writing life and the community.',
    kind: 'community',
    sortOrder: 220,
  },
]

export const GENRE_BOARDS = FORUM_BOARDS.filter((b) => b.kind === 'genre')
export const COMMUNITY_BOARDS = FORUM_BOARDS.filter((b) => b.kind === 'community')

export function boardBySlug(slug) {
  return FORUM_BOARDS.find((b) => b.slug === slug) || null
}
