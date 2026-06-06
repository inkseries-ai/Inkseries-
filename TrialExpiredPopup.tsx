import { useState, useEffect } from "react";
import { X, Crown, Calendar, BookOpen, CreditCard, Building2, Smartphone } from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";
import { Link } from "react-router";

interface SubscriptionStatus {
  isTrial: boolean;
  trialExpiresAt: string | null;
  isActive: boolean;
}

export default function TrialExpiredPopup() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Use user-specific key so each account has own popup tracking
    const storageKey = `inkseries-trial-expired-${user.id}`;
    const lastShown = localStorage.getItem(storageKey);
    const today = new Date().toDateString();
    
    // Only show once per day
    if (lastShown === today) return;

    // Fetch subscription status
    fetch("/api/subscriptions/status", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then((data: SubscriptionStatus | null) => {
        if (!data) return;
        
        // Show if user had a trial that has now expired (not active, had trial)
        if (data.trialExpiresAt && !data.isActive) {
          const expiresAt = new Date(data.trialExpiresAt);
          const now = new Date();
          
          // Trial has expired
          if (now > expiresAt) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden">
        {/* Subtle glow effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
        
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <span className="text-4xl">⏰</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Your Trial Has Ended
            </h2>
            <p className="text-neutral-400">
              Choose how you'd like to continue your reading journey
            </p>
          </div>

          {/* 3 Options */}
          <div className="space-y-3 mb-6">
            {/* Option 1: Weekly Plan - Cheapest entry option shown first */}
            <Link to="/#pricing" onClick={handleClose} className="block">
              <div className="group relative p-4 rounded-xl bg-gradient-to-r from-primary/20 to-orange-500/20 border border-primary/40 hover:border-primary transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                      Start with Weekly
                    </h3>
                    <p className="text-sm text-neutral-400">
                      Just ₦500 for 7 days of unlimited reading
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-medium">
                    Try Now
                  </span>
                </div>
              </div>
            </Link>

            {/* Option 2: Monthly/Other Plans */}
            <Link to="/#pricing" onClick={handleClose} className="block">
              <div className="group p-4 rounded-xl bg-neutral-800/50 border border-neutral-700 hover:border-primary/50 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-primary transition-colors">
                      View All Plans
                    </h3>
                    <p className="text-sm text-neutral-400">
                      Weekly from ₦500 • Save more with longer plans
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Option 3: Continue with Free Episodes */}
            <button onClick={handleClose} className="w-full">
              <div className="group p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50 hover:border-neutral-600 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-700/50 border border-neutral-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-neutral-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-neutral-300 group-hover:text-white transition-colors">
                      Continue with Free Episodes
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Read the first 3 episodes of any story
                    </p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Payment Methods - displayed in order: Bank Transfer, USSD, Card */}
          <div className="mb-6 p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
            <p className="text-xs text-neutral-400 mb-3 text-center font-medium">
              Available Payment Methods
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm text-neutral-300 font-medium">🏦 Bank Transfer</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Works with GTBank, Kuda, Moniepoint, Opay, Palmpay, Access, UBA, Zenith and all Nigerian banks</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm text-neutral-300 font-medium">📱 USSD</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5">No internet needed</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-700/30">
                <CreditCard className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm text-neutral-300 font-medium">💳 Card</span>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Visa, Mastercard, Verve accepted</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-center text-neutral-500 mt-3">
              Powered by Flutterwave • 100% Secure
            </p>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-neutral-500">
            Your reading progress has been saved and will be waiting for you
          </p>
        </div>
      </div>
    </div>
  );
}
