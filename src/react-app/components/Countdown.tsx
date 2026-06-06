import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownProps {
  targetDate: string;
  label?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown({ targetDate, label, compact = false }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return (
      <div className="text-emerald-400 text-sm font-medium">
        Now available!
      </div>
    );
  }

  if (!timeLeft) return null;

  if (compact) {
    // Compact inline version
    const parts = [];
    if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
    if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${timeLeft.hours}h`);
    parts.push(`${timeLeft.minutes}m`);
    
    return (
      <span className="text-primary font-medium">
        {parts.join(" ")}
      </span>
    );
  }

  // Full countdown display
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {label}
        </p>
      )}
      <div className="flex items-center gap-2">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="bg-muted/50 rounded-lg px-3 py-2 min-w-[50px]">
              <span className="text-xl font-bold text-primary">{timeLeft.days}</span>
            </div>
            <span className="text-xs text-muted-foreground mt-1">days</span>
          </div>
        )}
        <div className="text-center">
          <div className="bg-muted/50 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-xl font-bold text-primary">
              {timeLeft.hours.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">hrs</span>
        </div>
        <span className="text-xl text-muted-foreground">:</span>
        <div className="text-center">
          <div className="bg-muted/50 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-xl font-bold text-primary">
              {timeLeft.minutes.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">min</span>
        </div>
        <span className="text-xl text-muted-foreground">:</span>
        <div className="text-center">
          <div className="bg-muted/50 rounded-lg px-3 py-2 min-w-[50px]">
            <span className="text-xl font-bold text-primary">
              {timeLeft.seconds.toString().padStart(2, "0")}
            </span>
          </div>
          <span className="text-xs text-muted-foreground mt-1">sec</span>
        </div>
      </div>
    </div>
  );
}
