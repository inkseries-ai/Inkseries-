import { useState, useEffect } from "react";
import { X, Sparkles, Clock, Gift } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { useAuth } from "@getmocha/users-service/react";
import { Link } from "react-router";

interface TrialInfo {
  isTrial: boolean;
  trialExpiresAt: string | null;
  isActive: boolean;
}

export default function TrialPopup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Use user-specific key so each account has own popup tracking
    const storageKey = `inkseries-trial-popup-${user.id}`;
    const lastShown = localStorage.getItem(storageKey);
    const today = new Date().toDateString();
    
    if (lastShown === today) return;

    // Fetch trial status
    fetch("/api/subscriptions/status", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then((data: TrialInfo | null) => {
        if (data?.isTrial && data.trialExpiresAt) {
          setTrialInfo(data);
          
          // Calculate time remaining
          const expiresAt = new Date(data.trialExpiresAt);
          const now = new Date();
          const diffMs = expiresAt.getTime() - now.getTime();
          const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
          const diffDays = Math.floor(diffHours / 24);
          
          setDaysLeft(diffDays);
          setHoursLeft(diffHours % 24);
          
          // Only show if trial is still active
          if (diffMs > 0) {
            setIsOpen(true);
            localStorage.setItem(storageKey, today);
          }
        }
      })
      .catch(() => {});
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen || !trialInfo) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-2xl border border-primary/30 shadow-2xl shadow-primary/20 overflow-hidden">
        {/* Gold glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-6 pt-8">
          {/* Header icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30">
              <Gift className="w-8 h-8 text-black" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            Your Free Trial is Active!
          </h2>
          
          <p className="text-center text-neutral-400 mb-6">
            Enjoy unlimited access to all premium episodes
          </p>

          {/* Countdown */}
          <div className="bg-black/30 rounded-xl p-4 mb-6 border border-primary/20">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Time Remaining</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{daysLeft}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide">Days</div>
              </div>
              <div className="text-2xl text-primary font-bold">:</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{hoursLeft}</div>
                <div className="text-xs text-neutral-500 uppercase tracking-wide">Hours</div>
              </div>
            </div>
          </div>

          {/* Benefits reminder */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Read all premium episodes</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Download for offline reading</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
              <span>No ads or interruptions</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link to="/explore" onClick={handleClose} className="block">
              <Button className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-black font-semibold h-12">
                Start Reading Now
              </Button>
            </Link>
            <button
              onClick={handleClose}
              className="w-full text-sm text-neutral-500 hover:text-neutral-300 transition-colors py-2"
            >
              Maybe later
            </button>
          </div>

          {/* Note - no payment info during trial */}
          <p className="text-center text-xs text-neutral-500 mt-4">
            Explore the full library while your trial is active
          </p>
        </div>
      </div>
    </div>
  );
}
