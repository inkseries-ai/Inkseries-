import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@getmocha/users-service/react";

interface ReactionCount {
  reaction_type: string;
  count: number;
}

interface ChapterReactionsProps {
  chapterId: number;
  isDarkMode?: boolean;
}

const REACTIONS = [
  { type: 'shock', emoji: '😱', label: 'Shocked' },
  { type: 'heartbreak', emoji: '💔', label: 'Heartbreak' },
  { type: 'laughter', emoji: '😂', label: 'Hilarious' },
  { type: 'anger', emoji: '😤', label: 'Angry' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
];

export default function ChapterReactions({ chapterId, isDarkMode = true }: ChapterReactionsProps) {
  const { user, redirectToLogin } = useAuth();
  const [reactions, setReactions] = useState<ReactionCount[]>([]);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReactions = useCallback(async () => {
    try {
      const res = await fetch(`/api/chapters/${chapterId}/reactions`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setReactions(data.reactions || []);
        setUserReaction(data.userReaction);
      }
    } catch (err) {
      console.error("Failed to fetch reactions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    if (chapterId) {
      fetchReactions();
    }
  }, [chapterId, fetchReactions]);

  const handleReaction = async (reactionType: string) => {
    if (!user) {
      redirectToLogin();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reaction_type: reactionType }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // Optimistically update UI
        if (data.action === 'removed') {
          setUserReaction(null);
          setReactions(prev => prev.map(r => 
            r.reaction_type === reactionType 
              ? { ...r, count: Math.max(0, r.count - 1) }
              : r
          ).filter(r => r.count > 0));
        } else if (data.action === 'added') {
          setUserReaction(reactionType);
          setReactions(prev => {
            const existing = prev.find(r => r.reaction_type === reactionType);
            if (existing) {
              return prev.map(r => 
                r.reaction_type === reactionType 
                  ? { ...r, count: r.count + 1 }
                  : r
              );
            }
            return [...prev, { reaction_type: reactionType, count: 1 }];
          });
        } else if (data.action === 'updated') {
          // Remove count from old reaction, add to new
          const oldReaction = userReaction;
          setUserReaction(reactionType);
          setReactions(prev => {
            let updated = prev.map(r => {
              if (r.reaction_type === oldReaction) {
                return { ...r, count: Math.max(0, r.count - 1) };
              }
              if (r.reaction_type === reactionType) {
                return { ...r, count: r.count + 1 };
              }
              return r;
            }).filter(r => r.count > 0);
            
            // If new reaction type doesn't exist yet, add it
            if (!updated.find(r => r.reaction_type === reactionType)) {
              updated.push({ reaction_type: reactionType, count: 1 });
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error("Failed to submit reaction:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCount = (type: string) => {
    const found = reactions.find(r => r.reaction_type === type);
    return found?.count || 0;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${isDarkMode ? 'text-neutral-500' : 'text-neutral-400'}`}>
        <span className="text-sm">Loading reactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className={`text-sm font-medium ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
        How did this chapter make you feel?
      </p>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ type, emoji, label }) => {
          const count = getCount(type);
          const isSelected = userReaction === type;
          
          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={isSubmitting}
              title={label}
              className={`
                flex items-center gap-1.5 px-3 py-2 rounded-full text-sm
                transition-all duration-200
                ${isSelected
                  ? isDarkMode
                    ? 'bg-amber-500/30 border-amber-500 border shadow-md shadow-amber-500/20'
                    : 'bg-amber-100 border-amber-500 border shadow-md'
                  : isDarkMode
                    ? 'bg-neutral-800/50 border border-neutral-700 hover:bg-neutral-700/50'
                    : 'bg-white border border-neutral-200 hover:bg-neutral-50'
                }
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              `}
            >
              <span className="text-lg">{emoji}</span>
              {count > 0 && (
                <span className={`text-xs font-medium ${
                  isSelected 
                    ? 'text-amber-500' 
                    : isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
