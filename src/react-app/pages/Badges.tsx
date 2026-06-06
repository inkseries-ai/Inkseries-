import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { ArrowLeft, Trophy, Lock, Sparkles } from "lucide-react";
import { 
  badges, 
  tierColors, 
  categoryLabels, 
  categoryIcons,
  type Badge 
} from "@/react-app/data/badges";

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface BadgeProgress {
  chapters_read: number;
  novels_completed: number;
  current_streak: number;
  longest_streak: number;
  comments: number;
  ratings: number;
  referrals: number;
  library_count: number;
  genres_read: number;
  total_xp: number;
}

export default function Badges() {
  const { user } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [progress, setProgress] = useState<BadgeProgress | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBadges();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/badges", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEarnedBadges(data.badges || []);
        setProgress(data.progress || null);
      }
    } catch (err) {
      console.error("Failed to fetch badges:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ["all", "reading", "streak", "social", "collection", "special"];
  
  const filteredBadges = selectedCategory === "all" 
    ? badges 
    : badges.filter(b => b.category === selectedCategory);

  const isBadgeEarned = (badgeId: string) => 
    earnedBadges.some(b => b.badge_id === badgeId);

  const getBadgeProgress = (badge: Badge): number => {
    if (!progress) return 0;
    
    const progressMap: Record<string, number> = {
      chapters_read: progress.chapters_read,
      novels_completed: progress.novels_completed,
      streak_days: progress.longest_streak,
      comments: progress.comments,
      ratings: progress.ratings,
      referrals: progress.referrals,
      library_count: progress.library_count,
      genres_read: progress.genres_read,
    };
    
    const current = progressMap[badge.requirement.type] || 0;
    return Math.min((current / badge.requirement.value) * 100, 100);
  };

  const totalXP = progress?.total_xp || 0;
  const earnedCount = earnedBadges.length;
  const totalBadges = badges.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/library" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Badges & Achievements</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl p-6 mb-8 border border-primary/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-1">
                {user ? "Your Achievement Progress" : "Unlock Achievements"}
              </h2>
              <p className="text-muted-foreground">
                {user 
                  ? `You've earned ${earnedCount} of ${totalBadges} badges`
                  : "Sign in to start earning badges"}
              </p>
            </div>
            {user && (
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{earnedCount}</div>
                  <div className="text-sm text-muted-foreground">Badges</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-5 h-5" />
                    {totalXP.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total XP</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {cat === "all" ? "All Badges" : (
                <span className="flex items-center gap-1.5">
                  <span>{categoryIcons[cat as keyof typeof categoryIcons]}</span>
                  <span>{categoryLabels[cat as keyof typeof categoryLabels]}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-muted rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBadges.map((badge) => {
              const earned = isBadgeEarned(badge.id);
              const progressPercent = getBadgeProgress(badge);
              const tier = tierColors[badge.tier];
              
              return (
                <div
                  key={badge.id}
                  className={`relative rounded-xl border-2 p-4 transition-all ${
                    earned 
                      ? `${tier.bg} ${tier.border} shadow-lg ${tier.glow}` 
                      : "bg-muted/50 border-border/50 opacity-70"
                  }`}
                >
                  {/* Lock overlay for unearned */}
                  {!earned && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Badge icon */}
                  <div className={`text-4xl mb-3 ${earned ? "" : "grayscale opacity-50"}`}>
                    {badge.icon}
                  </div>
                  
                  {/* Badge info */}
                  <h3 className={`font-bold text-sm mb-1 ${earned ? tier.text : "text-muted-foreground"}`}>
                    {badge.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {badge.description}
                  </p>
                  
                  {/* Progress bar for unearned */}
                  {!earned && badge.requirement.type !== "special" && (
                    <div className="mt-auto">
                      <div className="h-1.5 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {Math.round(progressPercent)}% complete
                      </p>
                    </div>
                  )}
                  
                  {/* XP reward */}
                  <div className={`absolute bottom-2 right-2 text-xs font-medium ${
                    earned ? tier.text : "text-muted-foreground"
                  }`}>
                    +{badge.xp} XP
                  </div>
                  
                  {/* Tier indicator */}
                  <div className={`absolute top-2 left-2 text-[10px] uppercase font-bold tracking-wider ${
                    earned ? tier.text : "text-muted-foreground"
                  }`}>
                    {badge.tier}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state for non-logged in users */}
        {!user && (
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Sign in to start tracking your progress and earning badges!
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Sign In to Get Started
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
