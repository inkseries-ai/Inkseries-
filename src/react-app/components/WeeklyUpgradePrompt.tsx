import { useState, useEffect } from "react";
import { X, Sparkles, Clock } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";

interface SubscriptionStatus {
  isActive: boolean;
  plan_type?: string;
  expires_at?: string;
}

export default function WeeklyUpgradePrompt() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Only show once per user
    const storageKey = `inkseries-weekly-upgrade-shown-${user.id}`;
    const alreadyShown = localStorage.getItem(storageKey);
    if (alreadyShown) return;

    // Fetch subscription status
    fetch("/api/subscriptions/status", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then((data: SubscriptionStatus | null) => {
        if (!data || !data.isActive) return;
        
        // Check if on weekly plan with <= 24 hours remaining
        if (data.plan_type === "weekly" && data.expires_at) {
          const expiresAt = new Date(data.expires_at);
          const now = new Date();
          const hoursRemaining = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursRemaining > 0 && hoursRemaining <= 24) {
            setIsOpen(true);
            localStorage.setItem(storageKey, "true");
          }
        }
      })
      .catch(() => {});
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: "monthly" })
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(data.error || "Failed to initialize payment. Please try again.");
        setUpgrading(false);
      }
    } catch {
      alert("Payment service unavailable. Please try again later.");
      setUpgrading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-2xl border border-primary/30 shadow-2xl overflow-hidden">
        {/* Glow effects */}
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
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30 flex items-center justify-center">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Your Week is Almost Up!
            </h2>
          </div>

          {/* Message */}
          <div className="bg-neutral-800/50 rounded-xl p-4 mb-6 border border-neutral-700/50">
            <p className="text-neutral-300 text-center leading-relaxed">
              Upgrade to monthly and save.{" "}
              <span className="text-primary font-semibold">₦1,500</span> unlocks everything for a full month — that's{" "}
              <span className="text-white font-medium">3 extra weeks for just ₦1,000 more.</span>
            </p>
          </div>

          {/* Upgrade Button */}
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full py-4 bg-[#F5A623] hover:bg-[#E09515] text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-70"
          >
            {upgrading ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Upgrade to Monthly
              </>
            )}
          </button>

          {/* Dismiss link */}
          <button
            onClick={handleClose}
            className="w-full mt-3 py-2 text-neutral-500 hover:text-neutral-300 text-sm transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
