export interface Novel {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  cover: string;
  synopsis: string;
  genre: string;
  tags: string[];
  status: "ongoing" | "completed" | "new" | "coming_soon";
  chapterCount: number;
  readCount: number;
  rating: number;
  ratingCount: number;
  lastUpdated: string;
}

export const genres = [
  "All",
  "School Life and Friendships",
  "Romance and First Love",
  "Family and Identity",
  "Street and Hustle",
  "Thriller and Mystery",
  "African Fantasy and Mythology",
] as const;

export type Genre = (typeof genres)[number];

export const novels: Novel[] = [];

export function formatReadCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}
