import { useState, useEffect } from "react";
import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysRead: number;
  lastReadDate: string | null;
  recentActivity: { read_date: string; chapters_read: number }[];
}

interface ReadingStreakProps {
  compact?: boolean;
  onStreakLoaded?: (streak: StreakData) => void;
}

export function ReadingStreak({ compact = false, onStreakLoaded }: ReadingStreakProps) {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchStreak = async () => {
      try {
        const res = await fetch("/api/streaks", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setStreak(data);
          onStreakLoaded?.(data);
        }
      } catch (err) {
        console.error("Failed to fetch streak:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStreak();
  }, [user, onStreakLoaded]);

  if (!user || isLoading) return null;

  if (!streak) return null;

  // Get last 7 days for mini calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const activityDates = new Set(streak.recentActivity.map((a) => a.read_date));

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-full">
        <Flame className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-500">
          {streak.currentStreak}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-foreground">Reading Streak</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-amber-500/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-500">{streak.currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </div>

        <div className="bg-purple-500/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-purple-400">{streak.longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best</p>
        </div>

        <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{streak.totalDaysRead}</p>
          <p className="text-xs text-muted-foreground">Total Days</p>
        </div>
      </div>

      {/* Mini Calendar - Last 7 Days */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Last 7 days</span>
        </div>
        <div className="flex gap-1.5">
          {last7Days.map((date) => {
            const isActive = activityDates.has(date);
            const isToday = date === new Date().toISOString().split("T")[0];
            return (
              <div
                key={date}
                className={`
                  w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium
                  ${isActive 
                    ? "bg-amber-500 text-black" 
                    : "bg-muted/50 text-muted-foreground"
                  }
                  ${isToday ? "ring-2 ring-amber-500/50" : ""}
                `}
                title={date}
              >
                {new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "narrow" })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational message */}
      {streak.currentStreak > 0 && (
        <p className="text-xs text-center text-muted-foreground mt-4">
          {streak.currentStreak === 1 && "Great start! Keep reading tomorrow to build your streak."}
          {streak.currentStreak >= 2 && streak.currentStreak < 7 && "You're on a roll! Keep it up."}
          {streak.currentStreak >= 7 && streak.currentStreak < 30 && "🔥 Amazing! A whole week of reading!"}
          {streak.currentStreak >= 30 && "🏆 Legendary reader! You're unstoppable!"}
        </p>
      )}
    </div>
  );
}

// Hook to record reading activity
export function useRecordReading() {
  const { user } = useAuth();

  const recordReading = async (chapterId?: number) => {
    if (!user) return null;
    
    try {
      const res = await fetch("/api/streaks/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chapter_id: chapterId }),
      });
      if (res.ok) {
        const data = await res.json();
        // Check for new badges after recording reading
        fetch("/api/badges/check", { method: "POST", credentials: "include" });
        return data;
      }
    } catch (err) {
      console.error("Failed to record reading:", err);
    }
    return null;
  };

  return { recordReading };
}
