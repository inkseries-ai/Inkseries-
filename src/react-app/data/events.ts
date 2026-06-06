export type EventType = "ama" | "live-reading" | "watch-party" | "character-reveal" | "premiere" | "workshop";

export interface LiveEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  hostName: string;
  hostAvatar: string;
  hostRole: string;
  novelId?: string;
  novelTitle?: string;
  novelCover?: string;
  coverImage: string;
  startsAt: string;
  duration: number; // in minutes
  attendees: number;
  maxAttendees?: number;
  isLive: boolean;
  isPast: boolean;
  tags: string[];
}

export const eventTypeLabels: Record<EventType, string> = {
  ama: "Author AMA",
  "live-reading": "Live Reading",
  "watch-party": "Watch Party",
  "character-reveal": "Character Reveal",
  premiere: "Episode Premiere",
  workshop: "Writing Workshop",
};

export const eventTypeColors: Record<EventType, string> = {
  ama: "from-purple-500 to-pink-500",
  "live-reading": "from-amber-500 to-orange-500",
  "watch-party": "from-blue-500 to-cyan-500",
  "character-reveal": "from-green-500 to-emerald-500",
  premiere: "from-red-500 to-rose-500",
  workshop: "from-indigo-500 to-violet-500",
};

// Generate future dates relative to now
const getUpcomingDate = (daysFromNow: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const getPastDate = (daysAgo: number, hour: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const upcomingEvents: LiveEvent[] = [
  {
    id: "1",
    title: "Season 2 Premiere: Daughters of the Delta",
    description: "Join author Amara Okonkwo as she reads the first episode of Season 2 LIVE. Exclusive behind-the-scenes insights, character revelations, and Q&A with the community.",
    type: "premiere",
    hostName: "Amara Okonkwo",
    hostAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
    hostRole: "Author",
    novelId: "1",
    novelTitle: "Daughters of the Delta",
    novelCover: "https://images.unsplash.com/photo-1516914589923-f105f1535f88?w=400&h=600&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1516914589923-f105f1535f88?w=1200&h=600&fit=crop",
    startsAt: getUpcomingDate(0, 20), // Today at 8 PM
    duration: 90,
    attendees: 2847,
    maxAttendees: 5000,
    isLive: false,
    isPast: false,
    tags: ["Season Premiere", "Live Reading", "Q&A"],
  },
  {
    id: "2",
    title: "Ask Me Anything: Chidi Mensah",
    description: "The Lagos Hustle author answers your burning questions about writing tech thrillers, his research process, and hints about the upcoming finale.",
    type: "ama",
    hostName: "Chidi Mensah",
    hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    hostRole: "Author",
    novelId: "2",
    novelTitle: "The Lagos Hustle",
    novelCover: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=400&h=600&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=1200&h=600&fit=crop",
    startsAt: getUpcomingDate(1, 19), // Tomorrow at 7 PM
    duration: 60,
    attendees: 1234,
    isLive: false,
    isPast: false,
    tags: ["AMA", "Author Q&A", "Tech Thriller"],
  },
  {
    id: "3",
    title: "Kingdom of Whispers: Villain Reveal 🔥",
    description: "Zainab Adeyemi reveals the true identity of the Shadow King in this exclusive live event. Voice actor performance included!",
    type: "character-reveal",
    hostName: "Zainab Adeyemi",
    hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    hostRole: "Author",
    novelId: "3",
    novelTitle: "Kingdom of Whispers",
    novelCover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&h=600&fit=crop",
    startsAt: getUpcomingDate(2, 21), // 2 days from now at 9 PM
    duration: 45,
    attendees: 3456,
    maxAttendees: 5000,
    isLive: false,
    isPast: false,
    tags: ["Character Reveal", "Fantasy", "Voice Acting"],
  },
  {
    id: "4",
    title: "Love & Jollof Watch Party: Finale!",
    description: "Watch the Season 1 finale together with fellow fans. Live reactions, commentary from author Temi Adebayo, and exclusive bonus content.",
    type: "watch-party",
    hostName: "Temi Adebayo",
    hostAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    hostRole: "Author",
    novelId: "8",
    novelTitle: "Love & Jollof",
    novelCover: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=600&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop",
    startsAt: getUpcomingDate(4, 20), // 4 days from now at 8 PM
    duration: 120,
    attendees: 4521,
    isLive: false,
    isPast: false,
    tags: ["Watch Party", "Romance", "Foodie"],
  },
  {
    id: "5",
    title: "Writing African Fantasy: Workshop",
    description: "Learn how to weave African mythology, folklore, and spirituality into your fantasy writing. Interactive workshop with exercises.",
    type: "workshop",
    hostName: "Adaeze Eze",
    hostAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
    hostRole: "Author & Writing Coach",
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=600&fit=crop",
    startsAt: getUpcomingDate(6, 15), // 6 days from now at 3 PM
    duration: 90,
    attendees: 678,
    maxAttendees: 100,
    isLive: false,
    isPast: false,
    tags: ["Workshop", "Writing", "Fantasy"],
  },
  {
    id: "6",
    title: "The Night Market: Live Reading Ch. 10",
    description: "Author Folake Balogun reads the most requested episode with atmospheric sound effects and ambient music.",
    type: "live-reading",
    hostName: "Folake Balogun",
    hostAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    hostRole: "Author",
    novelId: "5",
    novelTitle: "The Night Market",
    novelCover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=600&fit=crop",
    startsAt: getUpcomingDate(8, 22), // 8 days from now at 10 PM
    duration: 60,
    attendees: 892,
    isLive: false,
    isPast: false,
    tags: ["Live Reading", "Horror", "Atmospheric"],
  },
];

export const pastEvents: LiveEvent[] = [
  {
    id: "p1",
    title: "Second Chance in Accra: Author AMA",
    description: "Kwame Asante answered questions about his writing journey, Ghanaian settings, and the art of second-chance romance.",
    type: "ama",
    hostName: "Kwame Asante",
    hostAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    hostRole: "Author",
    novelId: "4",
    novelTitle: "Second Chance in Accra",
    novelCover: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&h=600&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&h=600&fit=crop",
    startsAt: getPastDate(3, 19),
    duration: 60,
    attendees: 2134,
    isLive: false,
    isPast: true,
    tags: ["AMA", "Romance", "Ghana"],
  },
  {
    id: "p2",
    title: "Bound by Blood: Twin Prophecy Reveal",
    description: "The moment readers had been waiting for — the full prophecy was revealed live with dramatic reading.",
    type: "character-reveal",
    hostName: "Adaeze Eze",
    hostAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
    hostRole: "Author",
    novelId: "10",
    novelTitle: "Bound by Blood",
    novelCover: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=600&fit=crop",
    coverImage: "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1200&h=600&fit=crop",
    startsAt: getPastDate(7, 20),
    duration: 45,
    attendees: 4567,
    isLive: false,
    isPast: true,
    tags: ["Reveal", "Fantasy", "Epic"],
  },
  {
    id: "p3",
    title: "Inkseries Launch Party 🎉",
    description: "The grand launch of Inkseries! Authors, readers, and team members came together to celebrate African storytelling.",
    type: "watch-party",
    hostName: "Inkseries Team",
    hostAvatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop",
    hostRole: "Platform",
    coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=600&fit=crop",
    startsAt: getPastDate(14, 18),
    duration: 180,
    attendees: 8923,
    isLive: false,
    isPast: true,
    tags: ["Launch", "Celebration", "Community"],
  },
];

export function getTimeUntil(dateString: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const target = new Date(dateString);
  const now = new Date();
  const total = target.getTime() - now.getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((total % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((total % (1000 * 60)) / 1000),
    total,
  };
}

export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatEventTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
