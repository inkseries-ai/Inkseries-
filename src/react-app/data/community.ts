// Community data with authentic Nigerian names and initial-based avatars

export interface Discussion {
  id: string;
  novelId: string;
  novelTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  user: {
    name: string;
    initials: string;
    color: string;
    badge?: "top_reader" | "writer" | "moderator";
  };
  content: string;
  likes: number;
  replies: number;
  timestamp: string;
  isSpoiler: boolean;
}

export interface TrendingTopic {
  id: string;
  tag: string;
  novelTitle: string;
  novelId: string;
  postCount: number;
  isHot: boolean;
}

export interface FeaturedReader {
  id: string;
  name: string;
  initials: string;
  color: string;
  bio: string;
  booksRead: number;
  commentsPosted: number;
  favoriteGenre: string;
  joinedDate: string;
}

// Avatar color palette - warm African-inspired colors
const avatarColors = [
  "bg-amber-600",
  "bg-orange-600", 
  "bg-rose-600",
  "bg-emerald-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-purple-600",
  "bg-red-600",
  "bg-yellow-600",
  "bg-green-600",
];

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// Authentic Nigerian names (ethnically consistent)
const nigerianNames = {
  igbo: [
    "Chidimma Okonkwo",
    "Obinna Eze",
    "Adaeze Nwachukwu",
    "Chukwuemeka Obi",
    "Ngozi Udeh",
    "Kenechukwu Anyanwu",
    "Chiamaka Nnadi",
    "Ikechukwu Okoro",
    "Nneka Agu",
    "Chisom Nwosu",
  ],
  yoruba: [
    "Folake Adeyemi",
    "Oluwaseun Ogundimu",
    "Temitope Bakare",
    "Adebayo Oladipo",
    "Bukola Adesanya",
    "Olumide Falade",
    "Adeola Oyelaran",
    "Kehinde Adewale",
    "Funmilayo Okonkwo",
    "Babatunde Ojo",
  ],
  hausa: [
    "Amina Abdullahi",
    "Musa Ibrahim",
    "Fatima Yusuf",
    "Abubakar Suleiman",
    "Hauwa Bello",
    "Usman Garba",
    "Zainab Abubakar",
    "Ibrahim Danjuma",
    "Halima Sani",
    "Yusuf Mohammed",
  ],
};

// Helper to create user data with initials
function createUser(name: string, badge?: "top_reader" | "writer" | "moderator") {
  return {
    name,
    initials: getInitials(name),
    color: getColorForName(name),
    badge,
  };
}

// Sample discussions - will be matched to actual novels dynamically
export const sampleDiscussionTemplates = [
  {
    content: "This episode had me SCREAMING! The plot twist at the end was completely unexpected. I had to read it twice to fully process what happened! 🔥",
    likes: 234,
    replies: 47,
    isSpoiler: true,
  },
  {
    content: "The character development in this story is incredible. You can really see how much the main character has grown since episode 1.",
    likes: 189,
    replies: 32,
    isSpoiler: false,
  },
  {
    content: "I love how authentic the dialogue feels. It's like listening to conversations from my own neighborhood!",
    likes: 312,
    replies: 67,
    isSpoiler: false,
  },
  {
    content: "This story is proof that African fiction can compete with anything out there. So proud to support local talent! 💪🏾",
    likes: 456,
    replies: 89,
    isSpoiler: false,
  },
  {
    content: "Had to take a break after this episode to recover emotionally. The writing is so powerful!",
    likes: 278,
    replies: 54,
    isSpoiler: false,
  },
  {
    content: "Theory: I think the mysterious character from episode 2 is going to come back in a major way. Mark my words!",
    likes: 145,
    replies: 78,
    isSpoiler: true,
  },
  {
    content: "The way this author describes our culture and traditions is beautiful. Finally, stories that feel like home! 🇳🇬",
    likes: 523,
    replies: 102,
    isSpoiler: false,
  },
  {
    content: "I've been recommending this to everyone I know. This is exactly the kind of storytelling we need more of!",
    likes: 367,
    replies: 45,
    isSpoiler: false,
  },
];

const timestamps = [
  "2 hours ago",
  "5 hours ago",
  "8 hours ago",
  "12 hours ago",
  "1 day ago",
  "1 day ago",
  "2 days ago",
  "2 days ago",
];

// Fallback story titles when no novels are available
const fallbackStories = [
  { id: "1", title: "The Laundry Boy", slug: "the-laundry-boy" },
  { id: "2", title: "School Days", slug: "school-days" },
  { id: "3", title: "First Love", slug: "first-love" },
];

// Generate discussions based on available novels
export function generateDiscussions(novels: Array<{ id: string; title: string; slug: string }>): Discussion[] {
  const storiesList = novels && novels.length > 0 ? novels : fallbackStories;
  
  const allNames = [
    ...nigerianNames.igbo,
    ...nigerianNames.yoruba,
    ...nigerianNames.hausa,
  ];
  
  const discussions: Discussion[] = [];
  const badges: Array<"top_reader" | "writer" | "moderator" | undefined> = [
    "top_reader",
    undefined,
    undefined,
    "moderator",
    "top_reader",
    undefined,
    undefined,
    undefined,
  ];
  
  for (let i = 0; i < Math.min(8, sampleDiscussionTemplates.length); i++) {
    const novel = storiesList[i % storiesList.length];
    const template = sampleDiscussionTemplates[i];
    const name = allNames[i % allNames.length];
    
    discussions.push({
      id: String(i + 1),
      novelId: novel.id || novel.slug,
      novelTitle: novel.title,
      chapterNumber: Math.floor(Math.random() * 20) + 1,
      chapterTitle: `Episode ${Math.floor(Math.random() * 20) + 1}`,
      user: createUser(name, badges[i]),
      content: template.content,
      likes: template.likes,
      replies: template.replies,
      timestamp: timestamps[i],
      isSpoiler: template.isSpoiler,
    });
  }
  
  return discussions;
}

// Generate trending topics based on available novels
export function generateTrendingTopics(novels: Array<{ id: string; title: string; slug: string }>): TrendingTopic[] {
  const storiesList = novels && novels.length > 0 ? novels : fallbackStories;
  
  const tagPrefixes = [
    "#LoveThis",
    "#TeamMain",
    "#PlotTwist",
    "#MustRead",
    "#Obsessed",
    "#AfricanStories",
  ];
  
  return storiesList.slice(0, 6).map((novel, i) => ({
    id: String(i + 1),
    tag: `${tagPrefixes[i % tagPrefixes.length]}${novel.title.replace(/\s+/g, "")}`,
    novelTitle: novel.title,
    novelId: novel.id || novel.slug,
    postCount: Math.floor(Math.random() * 2000) + 500,
    isHot: i < 2,
  }));
}

// Featured readers with authentic names
export const featuredReaders: FeaturedReader[] = [
  {
    id: "1",
    name: "Adaeze Nwachukwu",
    initials: "AN",
    color: "bg-amber-600",
    bio: "Book lover from Enugu. I devour stories like suya! 📚🔥",
    booksRead: 47,
    commentsPosted: 892,
    favoriteGenre: "Romance",
    joinedDate: "Jan 2024",
  },
  {
    id: "2",
    name: "Oluwaseun Ogundimu",
    initials: "OO",
    color: "bg-emerald-600",
    bio: "Story enthusiast from Lagos. Always looking for the next great African tale.",
    booksRead: 62,
    commentsPosted: 445,
    favoriteGenre: "Drama",
    joinedDate: "Mar 2024",
  },
  {
    id: "3",
    name: "Fatima Yusuf",
    initials: "FY",
    color: "bg-purple-600",
    bio: "Hopeless romantic from Kano. If there's no happy ending, I'm not reading it!",
    booksRead: 89,
    commentsPosted: 1203,
    favoriteGenre: "Romance",
    joinedDate: "Nov 2023",
  },
];

export function getBadgeLabel(badge?: "top_reader" | "writer" | "moderator"): string {
  switch (badge) {
    case "top_reader":
      return "Top Reader";
    case "writer":
      return "Author";
    case "moderator":
      return "Moderator";
    default:
      return "";
  }
}

export function getBadgeColor(badge?: "top_reader" | "writer" | "moderator"): string {
  switch (badge) {
    case "top_reader":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "writer":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "moderator":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    default:
      return "";
  }
}
