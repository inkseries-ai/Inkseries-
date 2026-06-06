import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { X, Crown, Check, Loader as Loader2, Users, Shield, Lock, RefreshCcw, CreditCard, Building2, Smartphone } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

const individualPlans = [
  {
    name: "Weekly",
    price: "₦500",
    period: "/week",
    type: "weekly",
    features: ["7 days access", "Try it out"],
  },
  {
    name: "Monthly",
    price: "₦1,500",
    period: "/month",
    type: "monthly",
    features: ["Unlimited access", "New episodes weekly"],
  },
  {
    name: "3 Months",
    price: "₦4,000",
    period: "",
    type: "quarterly",
    features: ["₦1,333/month", "Save ₦500"],
  },
  {
    name: "6 Months",
    price: "₦7,000",
    period: "",
    type: "biannual",
    features: ["₦1,167/month", "Save ₦2,000"],
    popular: true,
  },
  {
    name: "Yearly",
    price: "₦14,400",
    period: "/year",
    type: "yearly",
    features: ["₦1,200/month", "2 months free"],
  },
];

const familyPlans = [
  {
    name: "Family Weekly",
    price: "₦1,500",
    period: "/week",
    type: "family_weekly",
    features: ["4 accounts", "₦375 each"],
  },
  {
    name: "Family Monthly",
    price: "₦4,500",
    period: "/month",
    type: "family_monthly",
    features: ["4 accounts", "₦1,125 each"],
  },
  {
    name: "Family 3 Months",
    price: "₦11,000",
    period: "",
    type: "family_quarterly",
    features: ["4 accounts", "₦917 each"],
  },
  {
    name: "Family 6 Months",
    price: "₦20,000",
    period: "",
    type: "family_biannual",
    features: ["4 accounts", "₦833 each"],
    popular: true,
  },
  {
    name: "Family Annual",
    price: "₦40,000",
    period: "/year",
    type: "family_annual",
    features: ["4 accounts", "₦833 each"],
  },
];

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle?: string;
  returnTo?: string;
}

export default function SubscribeModal({ 
  isOpen, 
  onClose, 
  chapterTitle, 
  returnTo,
}: SubscribeModalProps) {
  const [tab, setTab] = useState<"subscribe" | "family">("subscribe");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [trialInfo, setTrialInfo] = useState<{ isTrial: boolean; trialExpiresAt?: string } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, redirectToLogin } = useAuth();

  // Fetch trial status when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetch("/api/subscriptions/status", { credentials: "include" })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setTrialInfo({ isTrial: data.isTrial, trialExpiresAt: data.trialExpiresAt });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getReturnUrl = () => {
    if (returnTo) return returnTo;
    return location.pathname;
  };

  const handleSubscribe = async (plan: typeof individualPlans[0]) => {
    if (!user) {
      await redirectToLogin();
      return;
    }

    setSubscribing(plan.type);
    try {
      const isFamilyPlan = plan.type.startsWith("family_");
      const endpoint = isFamilyPlan ? "/api/family/create" : "/api/payments/initialize";
      const body = isFamilyPlan 
        ? { plan_type: plan.type, return_to: getReturnUrl() } 
        : { plan: plan.type, return_to: getReturnUrl() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (data.error) {
        alert(data.error);
      } else {
        navigate("/settings");
      }
    } catch {
      alert("Failed to initialize payment. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Floating X close button - easy to tap */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-2 right-2 z-[60] w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full shadow-lg border border-zinc-600 transition-colors"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-4 bg-gradient-to-r from-primary/20 to-orange-500/20 border-b border-border/50">
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Unlock Premium Content</h2>
              <p className="text-xs text-muted-foreground">Subscribe for unlimited access</p>
            </div>
          </div>
          
          {/* Two Tab Toggle */}
          <div className="flex bg-background/80 rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setTab("subscribe")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                tab === "subscribe"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Subscribe
            </button>
            <button
              onClick={() => setTab("family")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                tab === "family"
                  ? "bg-primary text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Family
            </button>
          </div>
          
          {chapterTitle && (
            <p className="text-xs text-muted-foreground bg-background/50 rounded-lg px-3 py-2 mt-3">
              Reading: <span className="text-foreground font-medium">{chapterTitle}</span>
            </p>
          )}
        </div>

        {/* Subscription Plans */}
        <div className="p-4 grid grid-cols-2 gap-2">
          {(tab === "subscribe" ? individualPlans : familyPlans).map((plan) => (
              <button
                key={plan.type}
                onClick={() => handleSubscribe(plan)}
                disabled={subscribing !== null}
                className={`text-left p-3 rounded-xl border-2 transition-all relative ${
                  plan.popular
                    ? "border-[#F5A623] bg-[#F5A623]/5 hover:bg-[#F5A623]/10"
                    : "border-border hover:border-[#F5A623]/50 hover:bg-muted/30"
                } ${subscribing === plan.type ? "opacity-70" : ""}`}
              >
                {plan.popular && (
                  <span className="absolute -top-2 left-3 text-[10px] bg-[#F5A623] text-black px-2 py-0.5 rounded-full font-semibold">
                    Best
                  </span>
                )}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{plan.name}</span>
                  {subscribing === plan.type && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                </div>
                <div className="text-lg font-bold text-[#F5A623]">{plan.price}</div>
                <div className="mt-1.5 space-y-0.5">
                  {plan.features.slice(0, 2).map((feature) => (
                    <span key={feature} className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                      {feature}
                    </span>
                  ))}
                </div>
                {/* Auto-renewal note for weekly/monthly plans */}
                {(plan.type === "weekly" || plan.type === "monthly" || plan.type === "family_weekly" || plan.type === "family_monthly") && (
                  <p className="text-[8px] text-zinc-500 mt-2 leading-tight">
                    Auto-renewal requires card payment. Bank/USSD are one-time.
                  </p>
                )}
              </button>
            ))}
        </div>

        {/* Footer - only show payment info if not on active trial */}
        <div className="px-4 pb-4 pt-2 border-t border-border/50">
          {/* Payment Methods - shown only when trial expired */}
          {!trialInfo?.isTrial && (
            <div className="space-y-2 mb-3 py-2">
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">🏦 Bank Transfer</span>
                  <span className="text-muted-foreground/70"> — GTBank, Kuda, Moniepoint, Opay, Palmpay, Access, UBA, Zenith</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <Smartphone className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">📱 USSD</span>
                  <span className="text-muted-foreground/70"> — No internet needed</span>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <CreditCard className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">💳 Card</span>
                  <span className="text-muted-foreground/70"> — Visa, Mastercard, Verve accepted</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-3 mb-3 py-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Shield className="w-3 h-3 text-green-500" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Lock className="w-3 h-3 text-green-500" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <RefreshCcw className="w-3 h-3 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
          </div>
          
          <p className="text-[10px] text-center text-muted-foreground mb-2">
            First 3 episodes free • Powered by Flutterwave
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  );
}
