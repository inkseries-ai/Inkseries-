import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { BookOpen, Star, Sparkles, Trophy, Crown, Flame, Zap, Award } from "lucide-react";

interface ReadingLevelData {
  level: string;
  levelName: string;
  totalChaptersRead: number;
  chaptersToNextLevel: number | null;
  nextLevelName: string | null;
  progress: number;
}

const levelIcons: Record<string, React.ReactNode> = {
  new_reader: <BookOpen className="w-5 h-5" />,
  bookworm: <BookOpen className="w-5 h-5" />,
  page_turner: <Zap className="w-5 h-5" />,
  story_lover: <Star className="w-5 h-5" />,
  avid_reader: <Flame className="w-5 h-5" />,
  scholar: <Award className="w-5 h-5" />,
  master: <Crown className="w-5 h-5" />,
  legend: <Trophy className="w-5 h-5" />,
};

const levelColors: Record<string, string> = {
  new_reader: "from-slate-400 to-slate-500",
  bookworm: "from-emerald-400 to-emerald-600",
  page_turner: "from-blue-400 to-blue-600",
  story_lover: "from-pink-400 to-pink-600",
  avid_reader: "from-orange-400 to-orange-600",
  scholar: "from-purple-400 to-purple-600",
  master: "from-amber-400 to-amber-600",
  legend: "from-yellow-300 via-amber-400 to-yellow-500",
};

const levelBgColors: Record<string, string> = {
  new_reader: "bg-slate-500/10 border-slate-500/20",
  bookworm: "bg-emerald-500/10 border-emerald-500/20",
  page_turner: "bg-blue-500/10 border-blue-500/20",
  story_lover: "bg-pink-500/10 border-pink-500/20",
  avid_reader: "bg-orange-500/10 border-orange-500/20",
  scholar: "bg-purple-500/10 border-purple-500/20",
  master: "bg-amber-500/10 border-amber-500/20",
  legend: "bg-yellow-500/10 border-yellow-500/20",
};

interface ReadingLevelProps {
  compact?: boolean;
  showProgress?: boolean;
}

export function ReadingLevel({ compact = false, showProgress = true }: ReadingLevelProps) {
  const { user } = useAuth();
  const [data, setData] = useState<ReadingLevelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetch("/api/reading-level", { credentials: "include" })
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || loading) {
    return null;
  }

  if (!data) {
    return null;
  }

  const icon = levelIcons[data.level] || <BookOpen className="w-5 h-5" />;
  const gradient = levelColors[data.level] || levelColors.new_reader;
  const bgColor = levelBgColors[data.level] || levelBgColors.new_reader;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${bgColor}`}>
        <div className={`bg-gradient-to-r ${gradient} text-white p-1 rounded-full`}>
          {icon}
        </div>
        <span className="text-sm font-medium">{data.levelName}</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${bgColor}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`bg-gradient-to-br ${gradient} text-white p-3 rounded-xl shadow-lg`}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg">{data.levelName}</h3>
          <p className="text-sm text-muted-foreground">
            {data.totalChaptersRead} episodes read
          </p>
        </div>
        {data.level === "legend" && (
          <Sparkles className="w-6 h-6 text-yellow-400 ml-auto animate-pulse" />
        )}
      </div>

      {showProgress && data.nextLevelName && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to {data.nextLevelName}</span>
            <span className="font-medium">{data.progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500`}
              style={{ width: `${data.progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {data.chaptersToNextLevel} more episodes to reach {data.nextLevelName}
          </p>
        </div>
      )}

      {data.level === "legend" && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
          <p className="text-sm text-center text-yellow-400 font-medium">
            🏆 You've reached the highest level! You're a true Legend of Inkseries!
          </p>
        </div>
      )}
    </div>
  );
}
