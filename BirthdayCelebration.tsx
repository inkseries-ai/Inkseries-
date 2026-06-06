import { useState, useEffect } from "react";
import { X, Gift, Sparkles, Cake, PartyPopper } from "lucide-react";
// @ts-ignore
import confetti from "canvas-confetti";

interface BirthdayCelebrationProps {
  displayName: string;
  onDismiss: () => void;
}

export default function BirthdayCelebration({ displayName, onDismiss }: BirthdayCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#d4af37", "#f4d03f", "#fbbf24", "#fff"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-amber-900/40 via-yellow-900/30 to-amber-900/40 border-2 border-amber-500/50 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Animated background sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 left-8 animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400/60" />
        </div>
        <div className="absolute top-4 right-12 animate-pulse delay-300">
          <Sparkles className="w-3 h-3 text-yellow-400/50" />
        </div>
        <div className="absolute bottom-3 left-1/4 animate-pulse delay-500">
          <Sparkles className="w-5 h-5 text-amber-300/40" />
        </div>
        <div className="absolute bottom-2 right-1/3 animate-pulse delay-700">
          <Sparkles className="w-3 h-3 text-yellow-500/50" />
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-amber-200 hover:text-white transition-colors z-10"
        aria-label="Dismiss birthday celebration"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {/* Cake icon with glow */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-amber-500 to-yellow-600 p-5 rounded-full shadow-lg shadow-amber-500/30">
            <Cake className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Message */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <PartyPopper className="w-5 h-5 text-amber-400" />
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
              Happy Birthday, {displayName}!
            </h2>
            <PartyPopper className="w-5 h-5 text-amber-400 scale-x-[-1]" />
          </div>
          <p className="text-amber-100/80 text-sm md:text-base max-w-xl">
            Today is your special day! 🎉 The entire Inkseries family wishes you an amazing year ahead filled with incredible stories and adventures.
          </p>
        </div>

        {/* Gift section */}
        <div className="flex-shrink-0">
          <div className="bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 rounded-xl p-4 text-center">
            <Gift className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-amber-200 font-medium">Birthday Reward</p>
            <p className="text-lg font-bold text-amber-300">Enjoy Your Day!</p>
          </div>
        </div>
      </div>

      {/* Bottom sparkle bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
    </div>
  );
}
