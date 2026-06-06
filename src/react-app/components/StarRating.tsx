import { useState } from "react";
import { Star } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";

interface StarRatingProps {
  novelSlug: string;
  initialAverage?: number;
  initialCount?: number;
  initialUserRating?: number | null;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  interactive?: boolean;
}

export default function StarRating({
  novelSlug,
  initialAverage = 0,
  initialCount = 0,
  initialUserRating = null,
  size = "md",
  showCount = true,
  interactive = true,
}: StarRatingProps) {
  const { user } = useAuth();
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [userRating, setUserRating] = useState<number | null>(initialUserRating);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleRate = async (rating: number) => {
    if (!user || !interactive || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/novels/${novelSlug}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating }),
      });

      if (res.ok) {
        const data = await res.json();
        setAverage(data.average);
        setCount(data.count);
        setUserRating(data.userRating);
        // Check for new badges after rating
        fetch("/api/badges/check", { method: "POST", credentials: "include" });
      }
    } catch (e) {
      console.error("Failed to submit rating:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoveredStar ?? userRating ?? average;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHoveredStar(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHalfFilled = !isFilled && star - 0.5 <= displayRating;
          const canInteract = interactive && user && !isSubmitting;

          return (
            <button
              key={star}
              type="button"
              disabled={!canInteract}
              onClick={() => handleRate(star)}
              onMouseEnter={() => canInteract && setHoveredStar(star)}
              className={`relative ${canInteract ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
            >
              {/* Background star (empty) */}
              <Star
                className={`${sizeClasses[size]} text-muted-foreground/30`}
              />
              {/* Filled star overlay */}
              <Star
                className={`${sizeClasses[size]} absolute inset-0 transition-colors ${
                  isFilled || isHalfFilled
                    ? "fill-primary text-primary"
                    : "fill-transparent text-transparent"
                } ${hoveredStar !== null && star <= hoveredStar ? "fill-primary/80 text-primary/80" : ""}`}
                style={
                  isHalfFilled && !isFilled
                    ? { clipPath: "inset(0 50% 0 0)" }
                    : undefined
                }
              />
            </button>
          );
        })}
      </div>

      {showCount && (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold">{average.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({count} {count === 1 ? "rating" : "ratings"})
          </span>
        </div>
      )}

      {interactive && user && userRating && (
        <span className="text-xs text-primary ml-1">Your rating: {userRating}★</span>
      )}

      {interactive && !user && (
        <span className="text-xs text-muted-foreground ml-1">Sign in to rate</span>
      )}
    </div>
  );
}
