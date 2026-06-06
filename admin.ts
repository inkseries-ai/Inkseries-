// Admin dashboard mock data

export interface AdminStats {
  totalUsers: number;
  activeSubscribers: number;
  totalNovels: number;
  pendingNovels: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalReads: number;
  flaggedContent: number;
}

export interface PendingNovel {
  id: string;
  title: string;
  author: string;
  authorAvatar: string;
  genre: string;
  synopsis: string;
  submittedAt: string;
  chapterCount: number;
  wordCount: number;
}

export interface FlaggedComment {
  id: string;
  content: string;
  author: string;
  authorAvatar: string;
  novelTitle: string;
  chapterNumber: number;
  reason: string;
  reportedAt: string;
  reportCount: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  subscriptionTier: "free" | "monthly" | "yearly";
  joinedAt: string;
  lastActive: string;
  isWriter: boolean;
  totalReads: number;
  novelsPublished: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}

export interface GenreStats {
  genre: string;
  count: number;
  reads: number;
}

// Mock admin statistics
export const adminStats: AdminStats = {
  totalUsers: 45892,
  activeSubscribers: 12450,
  totalNovels: 847,
  pendingNovels: 23,
  totalRevenue: 31250000, // in Naira
  monthlyRevenue: 4850000,
  totalReads: 2340000,
  flaggedContent: 15,
};

// Mock pending novels for review
export const pendingNovels: PendingNovel[] = [
  {
    id: "p1",
    title: "The Masquerade's Secret",
    author: "Ngozi Okafor",
    authorAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
    genre: "Mystery",
    synopsis: "In the heart of Lagos, a masquerade festival becomes the backdrop for a decades-old mystery. When journalist Amara Eze receives an anonymous tip about her grandmother's disappearance thirty years ago, she must navigate family secrets and dangerous truths.",
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    chapterCount: 15,
    wordCount: 52000,
  },
  {
    id: "p2",
    title: "Sahel Dreams",
    author: "Ibrahim Diallo",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    genre: "Literary Fiction",
    synopsis: "A poetic exploration of life in the Sahel region, following three generations of a Fulani family as they adapt to the changing landscape of modern Africa while preserving their traditions.",
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    chapterCount: 22,
    wordCount: 78000,
  },
  {
    id: "p3",
    title: "Tech Bros of Victoria Island",
    author: "Chidi Anyanwu",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    genre: "Comedy",
    synopsis: "A satirical comedy following a group of startup founders in Lagos as they chase funding, fame, and the perfect pitch deck. When a mysterious investor offers them everything they want, they must decide what they're willing to sacrifice.",
    submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    chapterCount: 12,
    wordCount: 38000,
  },
  {
    id: "p4",
    title: "The Oracle of Osogbo",
    author: "Folake Adeyemi",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    genre: "Fantasy",
    synopsis: "When a young priestess discovers she can see the future through sacred waters, she must use her gift to prevent a catastrophe that could destroy the sacred grove and everything she holds dear.",
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    chapterCount: 28,
    wordCount: 95000,
  },
];

// Mock flagged comments
export const flaggedComments: FlaggedComment[] = [
  {
    id: "fc1",
    content: "This episode is stolen from another author! I've seen this exact text on another platform.",
    author: "ReaderX99",
    authorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    novelTitle: "Daughters of the Delta",
    chapterNumber: 12,
    reason: "Plagiarism accusation",
    reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    reportCount: 3,
  },
  {
    id: "fc2",
    content: "The author is clearly promoting illegal activities here. This shouldn't be allowed.",
    author: "ConcernedMom",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    novelTitle: "The Lagos Hustle",
    chapterNumber: 8,
    reason: "Inappropriate content",
    reportedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    reportCount: 5,
  },
  {
    id: "fc3",
    content: "Stop writing this garbage! You call yourself a writer? 🤮🤮🤮",
    author: "TrollMaster",
    authorAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100&h=100&fit=crop",
    novelTitle: "Love & Jollof",
    chapterNumber: 3,
    reason: "Harassment",
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reportCount: 8,
  },
];

// Mock users for admin management
export const adminUsers: AdminUser[] = [
  {
    id: "u1",
    name: "Adaeze Okonkwo",
    email: "adaeze.o@email.com",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop",
    subscriptionTier: "yearly",
    joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isWriter: true,
    totalReads: 125000,
    novelsPublished: 3,
  },
  {
    id: "u2",
    name: "Emeka Nwosu",
    email: "emeka.n@email.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    subscriptionTier: "monthly",
    joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isWriter: false,
    totalReads: 0,
    novelsPublished: 0,
  },
  {
    id: "u3",
    name: "Fatima Bello",
    email: "fatima.b@email.com",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    subscriptionTier: "free",
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isWriter: true,
    totalReads: 8500,
    novelsPublished: 1,
  },
  {
    id: "u4",
    name: "Kwame Asante",
    email: "kwame.a@email.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    subscriptionTier: "yearly",
    joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isWriter: true,
    totalReads: 340000,
    novelsPublished: 7,
  },
  {
    id: "u5",
    name: "Zainab Ibrahim",
    email: "zainab.i@email.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    subscriptionTier: "monthly",
    joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isWriter: false,
    totalReads: 0,
    novelsPublished: 0,
  },
];

// Mock revenue data for charts
export const revenueData: RevenueData[] = [
  { month: "Jan", revenue: 2850000, subscriptions: 8500 },
  { month: "Feb", revenue: 3100000, subscriptions: 9200 },
  { month: "Mar", revenue: 3450000, subscriptions: 9800 },
  { month: "Apr", revenue: 3200000, subscriptions: 9500 },
  { month: "May", revenue: 3800000, subscriptions: 10500 },
  { month: "Jun", revenue: 4100000, subscriptions: 11200 },
  { month: "Jul", revenue: 4350000, subscriptions: 11800 },
  { month: "Aug", revenue: 4500000, subscriptions: 12100 },
  { month: "Sep", revenue: 4650000, subscriptions: 12300 },
  { month: "Oct", revenue: 4850000, subscriptions: 12450 },
];

// Genre statistics
export const genreStats: GenreStats[] = [
  { genre: "Romance and First Love", count: 245, reads: 580000 },
  { genre: "African Fantasy and Mythology", count: 156, reads: 420000 },
  { genre: "Family and Identity", count: 134, reads: 380000 },
  { genre: "Thriller and Mystery", count: 98, reads: 290000 },
  { genre: "School Life and Friendships", count: 87, reads: 210000 },
  { genre: "Street and Hustle", count: 65, reads: 180000 },
];

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
