export interface Chapter {
  id: string;
  novelId: string;
  number: number;
  title: string;
  wordCount: number;
  publishedAt: string;
  isFree: boolean;
}

// Sample chapters for novel "Daughters of the Delta" (id: "1")
export const sampleChapters: Chapter[] = [
  { id: "1-1", novelId: "1", number: 1, title: "The Telegram", wordCount: 2450, publishedAt: "Jan 15, 2024", isFree: true },
  { id: "1-2", novelId: "1", number: 2, title: "Three Sisters", wordCount: 2890, publishedAt: "Jan 22, 2024", isFree: true },
  { id: "1-3", novelId: "1", number: 3, title: "The Reading of the Will", wordCount: 3120, publishedAt: "Jan 29, 2024", isFree: true },
  { id: "1-4", novelId: "1", number: 4, title: "Secrets in the Attic", wordCount: 2780, publishedAt: "Feb 5, 2024", isFree: false },
  { id: "1-5", novelId: "1", number: 5, title: "The Oil Baron's Daughter", wordCount: 3050, publishedAt: "Feb 12, 2024", isFree: false },
  { id: "1-6", novelId: "1", number: 6, title: "Betrayal at Dawn", wordCount: 2920, publishedAt: "Feb 19, 2024", isFree: false },
  { id: "1-7", novelId: "1", number: 7, title: "The Letter", wordCount: 2650, publishedAt: "Feb 26, 2024", isFree: false },
  { id: "1-8", novelId: "1", number: 8, title: "Grandmother's Journal", wordCount: 3200, publishedAt: "Mar 4, 2024", isFree: false },
  { id: "1-9", novelId: "1", number: 9, title: "The Family Meeting", wordCount: 2880, publishedAt: "Mar 11, 2024", isFree: false },
  { id: "1-10", novelId: "1", number: 10, title: "Unearthed Truths", wordCount: 3340, publishedAt: "Mar 18, 2024", isFree: false },
];

export function generateChaptersForNovel(novelId: string, chapterCount: number): Chapter[] {
  const chapterTitles = [
    "The Beginning", "Whispers in the Dark", "A Chance Encounter", "The Revelation",
    "Crossroads", "Echoes of the Past", "The Journey", "Hidden Truths",
    "The Storm", "New Horizons", "Shadows", "The Promise", "Betrayal",
    "Redemption", "The Return", "Destiny's Call", "Breaking Point", "Hope",
    "The Secret", "Awakening", "Trial by Fire", "The Choice", "Reunion",
    "Darkness Falls", "Light in the Storm", "The Confession", "Running Away",
    "Coming Home", "The Truth", "A New Dawn", "Legacy", "The Final Chapter"
  ];

  return Array.from({ length: chapterCount }, (_, i) => ({
    id: `${novelId}-${i + 1}`,
    novelId,
    number: i + 1,
    title: chapterTitles[i % chapterTitles.length],
    wordCount: 2400 + Math.floor(Math.random() * 1000),
    publishedAt: new Date(2024, 0, 15 + i * 7).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    isFree: i < 3, // First 3 chapters are free
  }));
}
