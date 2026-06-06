import { useState, useEffect, useRef } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { Navigate, useSearchParams } from "react-router";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/react-app/components/ui/card";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Switch } from "@/react-app/components/ui/switch";
import { User, Bell, Shield, Moon, Mail, Crown, Check, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Camera, Trash2, Users, Gift, Copy, Share2, UserPlus, X, Chrome as Home, TrendingUp, Clock } from "lucide-react";
import { ReadingLevel } from "@/react-app/components/ReadingLevel";
import { ReadingStreak } from "@/react-app/components/ReadingStreak";

type PlanType = "weekly" | "monthly" | "quarterly" | "biannual" | "yearly";

interface SubscriptionStatus {
  plan: string;
  expires_at: string | null;
  active: boolean;
  isTrial?: boolean;
  trialExpiresAt?: string | null;
}

export default function SettingsPage() {
  const { user, isPending } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [chapterAlerts, setChapterAlerts] = useState(true);
  const [communityDigest, setCommunityDigest] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subscribing, setSubscribing] = useState<PlanType | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "error" | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  
  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Referral state
  const [referralData, setReferralData] = useState<{
    referral_code: string;
    referral_path: string;
    total_referrals: number;
    successful_referrals: number;
    pending_referrals: number;
    bonus_days_stored: number;
    total_days_earned: number;
    has_early_access: boolean;
    milestone_progress: {
      current: number;
      target: number;
      reward: string;
    };
    friends: Array<{ firstName: string; joinedAt: string }>;
  } | null>(null);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);

  // Family plan state
  interface FamilyMember {
    email: string;
    name: string;
    joined_at: string;
    is_owner: boolean;
  }
  interface FamilyPlan {
    id: number;
    owner_email: string;
    owner_name: string;
    max_members: number;
    expires_at: string;
    members: FamilyMember[];
    is_owner: boolean;
  }
  const [familyPlan, setFamilyPlan] = useState<FamilyPlan | null>(null);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [leavingFamily, setLeavingFamily] = useState(false);

  // Gift subscription state
  interface SentGift {
    id: number;
    gift_code: string;
    recipient_email: string;
    plan_type: string;
    is_redeemed: boolean;
    redeemed_at: string | null;
    created_at: string;
    expires_at: string;
  }
  interface RedeemableGift {
    id: number;
    gift_code: string;
    sender_name: string;
    sender_email: string;
    plan_type: string;
    expires_at: string;
  }
  const [sentGifts, setSentGifts] = useState<SentGift[]>([]);
  const [redeemableGifts, setRedeemableGifts] = useState<RedeemableGift[]>([]);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [giftRecipientEmail, setGiftRecipientEmail] = useState("");
  const [giftPlanType, setGiftPlanType] = useState<PlanType>("monthly");
  const [purchasingGift, setPurchasingGift] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemingGift, setRedeemingGift] = useState(false);
  const [giftTab, setGiftTab] = useState<"send" | "received" | "sent">("send");

  // Subscription management state
  interface SubscriptionDetails {
    isActive: boolean;
    isTrial: boolean;
    trialExpiresAt: string | null;
    plan: string | null;
    expiresAt: string | null;
    subscription: {
      planType: string;
      amount: number;
      startsAt: string;
      expiresAt: string;
      isRecurring: boolean;
      isCancelled: boolean;
      cancelledAt: string | null;
      paymentProvider: string;
    } | null;
  }
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState<"reason" | "offer" | "confirm">("reason");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [acceptingOffer, setAcceptingOffer] = useState<"pause" | "discount" | null>(null);
  
  // Refund state
  interface RefundEligibility {
    eligible: boolean;
    reason?: string;
    hoursRemaining?: number;
    daysRemaining?: number;
    episodesRead?: number;
    maxEpisodes?: number;
    refundAmount?: number;
    planType?: string;
    planDisplayName?: string;
    isOneTimePlan?: boolean;
    refundWindowDays?: number;
    windowExpired?: boolean;
    isRecurring?: boolean;
  }
  const [refundEligibility, setRefundEligibility] = useState<RefundEligibility | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [requestingRefund, setRequestingRefund] = useState(false);

  // Plan change state
  interface PlanOption {
    planType: string;
    amount: number;
    duration: number;
    label: string;
    category: "individual" | "family";
    isCurrent: boolean;
    isUpgrade: boolean;
    isDowngrade: boolean;
    isCategorySwitch: boolean;
  }
  interface PlansData {
    individualPlans: PlanOption[];
    familyPlans: PlanOption[];
    currentPlan: string | null;
    currentCategory: "individual" | "family" | null;
    currentExpires: string | null;
    isFamilyOwner: boolean;
    isFamilyMember: boolean;
  }
  interface ScheduledChange {
    new_plan_type: string;
    change_type: string;
    effective_at: string;
  }
  const [plansData, setPlansData] = useState<PlansData | null>(null);
  const [scheduledChange, setScheduledChange] = useState<ScheduledChange | null>(null);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [changePlanTab, setChangePlanTab] = useState<"individual" | "family">("individual");
  const [processingPlanChange, setProcessingPlanChange] = useState<string | null>(null);
  const [cancellingScheduledChange, setCancellingScheduledChange] = useState(false);

  // Check for payment verification on page load
  useEffect(() => {
    const payment = searchParams.get("payment");
    const reference = searchParams.get("reference");

    if (payment === "verify" && reference) {
      verifyPayment(reference);
      // Clear the URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Fetch subscription status
  useEffect(() => {
    if (user) {
      fetchSubscription();
      fetchSubscriptionDetails();
      fetchRefundEligibility();
      fetchPlans();
      fetchScheduledChange();
      fetchProfile();
      fetchNotificationPreferences();
      fetchReferrals();
      fetchFamilyPlan();
      fetchGiftSubscriptions();
    }
  }, [user]);

  const fetchSubscriptionDetails = async () => {
    try {
      const res = await fetch("/api/subscriptions/details", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubscriptionDetails(data);
      }
    } catch (error) {
      console.error("Failed to fetch subscription details:", error);
    }
  };

  const fetchRefundEligibility = async () => {
    try {
      const res = await fetch("/api/subscriptions/refund-eligibility", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRefundEligibility(data);
      }
    } catch (error) {
      console.error("Failed to fetch refund eligibility:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/subscriptions/plans", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPlansData(data);
        if (data.currentCategory) {
          setChangePlanTab(data.currentCategory);
        }
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const fetchScheduledChange = async () => {
    try {
      const res = await fetch("/api/subscriptions/scheduled-change", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setScheduledChange(data.scheduledChange || null);
      }
    } catch (error) {
      console.error("Failed to fetch scheduled change:", error);
    }
  };

  const handleUpgrade = async (newPlanType: string) => {
    setProcessingPlanChange(newPlanType);
    try {
      const res = await fetch("/api/subscriptions/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPlanType }),
      });
      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage(data.message || "Plan upgraded successfully!");
        setShowChangePlanModal(false);
        fetchSubscription();
        fetchSubscriptionDetails();
        fetchPlans();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to upgrade plan");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to upgrade plan. Please try again.");
    } finally {
      setProcessingPlanChange(null);
    }
  };

  const handleDowngrade = async (newPlanType: string) => {
    setProcessingPlanChange(newPlanType);
    try {
      const res = await fetch("/api/subscriptions/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPlanType }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage(data.message || "Your plan will change at the end of your billing period.");
        setShowChangePlanModal(false);
        fetchScheduledChange();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to schedule downgrade");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to schedule downgrade. Please try again.");
    } finally {
      setProcessingPlanChange(null);
    }
  };

  const handleCategorySwitch = async (newPlanType: string) => {
    setProcessingPlanChange(newPlanType);
    try {
      const res = await fetch("/api/subscriptions/switch-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPlanType }),
      });
      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage(data.message || "Plan change scheduled successfully!");
        setShowChangePlanModal(false);
        fetchScheduledChange();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to switch plan category");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to switch plan category. Please try again.");
    } finally {
      setProcessingPlanChange(null);
    }
  };

  const handleCancelScheduledChange = async () => {
    setCancellingScheduledChange(true);
    try {
      const res = await fetch("/api/subscriptions/scheduled-change", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage("Scheduled plan change cancelled.");
        setScheduledChange(null);
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to cancel scheduled change");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to cancel scheduled change. Please try again.");
    } finally {
      setCancellingScheduledChange(false);
    }
  };

  const handlePlanChange = (plan: PlanOption) => {
    if (plan.isCurrent) return;
    if (plan.isCategorySwitch) {
      handleCategorySwitch(plan.planType);
    } else if (plan.isUpgrade) {
      handleUpgrade(plan.planType);
    } else if (plan.isDowngrade) {
      handleDowngrade(plan.planType);
    }
  };

  const handleRequestRefund = async () => {
    setRequestingRefund(true);
    try {
      const res = await fetch("/api/subscriptions/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: refundReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage(`Refund of ₦${data.amount?.toLocaleString()} processed successfully. The amount will be credited within 3-5 business days.`);
        setShowRefundModal(false);
        fetchSubscription();
        fetchSubscriptionDetails();
        setRefundEligibility({ eligible: false, reason: "Refund processed" });
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to process refund");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to process refund. Please try again.");
    } finally {
      setRequestingRefund(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage("Your subscription has been cancelled. You'll retain access until your current period ends.");
        setShowCancelModal(false);
        setCancelStep("reason");
        setCancelReason("");
        fetchSubscription();
        fetchSubscriptionDetails();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveOffer = async (offerType: "pause" | "discount") => {
    setAcceptingOffer(offerType);
    try {
      const res = await fetch("/api/subscriptions/save-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ offerType }),
      });
      const data = await res.json();
      if (res.ok) {
        if (offerType === "pause") {
          setPaymentStatus("success");
          setPaymentMessage("Great! We've added 7 free days to your subscription. Enjoy!");
          setShowCancelModal(false);
          setCancelStep("reason");
          fetchSubscription();
          fetchSubscriptionDetails();
        } else if (data.authorization_url) {
          window.location.href = data.authorization_url;
        }
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to apply offer");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Something went wrong. Please try again.");
    } finally {
      setAcceptingOffer(null);
    }
  };

  const fetchFamilyPlan = async () => {
    setLoadingFamily(true);
    try {
      const res = await fetch("/api/family", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.family) {
          setFamilyPlan(data.family);
        }
      }
    } catch (error) {
      console.error("Failed to fetch family plan:", error);
    } finally {
      setLoadingFamily(false);
    }
  };

  const handleCreateFamilyPlan = async (planType: string = "family_annual") => {
    setCreatingFamily(true);
    try {
      const res = await fetch("/api/family/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan_type: planType }),
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(data.error || "Failed to create family plan");
      }
    } catch (error) {
      alert("Failed to create family plan. Please try again.");
    } finally {
      setCreatingFamily(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
        fetchFamilyPlan();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to send invitation");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to send invitation. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ invite_code: joinCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage("You've joined the family plan!");
        setJoinCode("");
        fetchFamilyPlan();
        fetchSubscription();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to join family plan");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to join. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleRemoveMember = async (email: string) => {
    if (!confirm(`Remove ${email} from your family plan?`)) return;
    setRemovingMember(email);
    try {
      const res = await fetch(`/api/family/members/${encodeURIComponent(email)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage("Member removed from family plan");
        fetchFamilyPlan();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to remove member");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to remove member. Please try again.");
    } finally {
      setRemovingMember(null);
    }
  };

  const handleLeaveFamily = async () => {
    if (!confirm("Are you sure you want to leave this family plan? You'll lose your premium access.")) return;
    setLeavingFamily(true);
    try {
      const res = await fetch("/api/family/leave", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage("You've left the family plan");
        setFamilyPlan(null);
        fetchSubscription();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to leave family plan");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to leave. Please try again.");
    } finally {
      setLeavingFamily(false);
    }
  };

  // Gift subscription functions
  const fetchGiftSubscriptions = async () => {
    setLoadingGifts(true);
    try {
      const [sentRes, redeemableRes] = await Promise.all([
        fetch("/api/gifts/sent", { credentials: "include" }),
        fetch("/api/gifts/redeemable", { credentials: "include" }),
      ]);
      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentGifts(data.gifts || []);
      }
      if (redeemableRes.ok) {
        const data = await redeemableRes.json();
        setRedeemableGifts(data.gifts || []);
      }
    } catch (error) {
      console.error("Failed to fetch gift subscriptions:", error);
    } finally {
      setLoadingGifts(false);
    }
  };

  const handlePurchaseGift = async () => {
    if (!giftRecipientEmail.trim()) return;
    setPurchasingGift(true);
    try {
      const res = await fetch("/api/gifts/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          recipient_email: giftRecipientEmail.trim(),
          plan_type: giftPlanType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to initiate gift purchase");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to purchase gift. Please try again.");
    } finally {
      setPurchasingGift(false);
    }
  };

  const handleRedeemGift = async (code?: string) => {
    const codeToRedeem = code || redeemCode.trim();
    if (!codeToRedeem) return;
    setRedeemingGift(true);
    try {
      const res = await fetch("/api/gifts/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ gift_code: codeToRedeem }),
      });
      const data = await res.json();
      if (res.ok) {
        setPaymentStatus("success");
        setPaymentMessage("Gift subscription redeemed successfully!");
        setRedeemCode("");
        fetchGiftSubscriptions();
        fetchSubscription();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Failed to redeem gift");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Failed to redeem gift. Please try again.");
    } finally {
      setRedeemingGift(false);
    }
  };

  const fetchReferrals = async () => {
    setLoadingReferrals(true);
    try {
      const res = await fetch("/api/referrals", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const getReferralLink = () => {
    if (referralData?.referral_code) {
      return `https://inkseries.com/?ref=${referralData.referral_code}`;
    }
    return null;
  };

  const copyReferralCode = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    }
  };

  const shareReferral = async () => {
    const referralLink = getReferralLink();
    if (!referralLink) return;
    
    const shareData = {
      title: "Join Inkseries",
      text: "Check out Inkseries - where stories of African teenagers come alive weekly! Sign up with my link:",
      url: referralLink,
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, copy to clipboard as fallback
        if ((err as Error).name !== 'AbortError') {
          navigator.clipboard.writeText(referralLink);
          setReferralCopied(true);
          setTimeout(() => setReferralCopied(false), 2000);
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(referralLink);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions/status", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSubscription({
          plan: data.plan || "free",
          expires_at: data.expiresAt,
          active: data.isActive,
          isTrial: data.isTrial,
          trialExpiresAt: data.trialExpiresAt,
        });
      }
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const profile = data.profile;
        if (profile?.avatar_url) {
          // Convert the R2 key to API URL
          const parts = profile.avatar_url.split("/");
          if (parts.length >= 3) {
            setAvatarUrl(`/api/avatars/${parts[1]}/${parts[2]}`);
          }
        }
        if (profile?.display_name) {
          setDisplayName(profile.display_name);
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      const res = await fetch("/api/profile/notifications", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setChapterAlerts(data.chapterAlerts ?? true);
        setEmailNotifications(data.newsletter ?? true);
      }
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
    }
  };

  const saveNotificationPreference = async (key: "chapterAlerts" | "newsletter", value: boolean) => {
    try {
      await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ [key]: value })
      });
    } catch (error) {
      console.error("Failed to save notification preference:", error);
    }
  };

  const handleChapterAlertsChange = (value: boolean) => {
    setChapterAlerts(value);
    saveNotificationPreference("chapterAlerts", value);
  };

  const handleNewsletterChange = (value: boolean) => {
    setEmailNotifications(value);
    saveNotificationPreference("newsletter", value);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type on client - check MIME type and file extension
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"];
    const fileExt = (file.name.split(".").pop() || "").toLowerCase();
    
    const isValidType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExt) || file.type.startsWith("image/");
    if (!isValidType) {
      alert("Please upload a JPEG, PNG, WebP, GIF, or HEIC image.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.key) {
        // Convert R2 key to API URL for display
        const parts = data.key.split("/");
        setAvatarUrl(`/api/avatars/${parts[1]}/${parts[2]}`);
      } else {
        alert(data.error || "Failed to upload avatar");
      }
    } catch (error) {
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAvatarDelete = async () => {
    if (!confirm("Are you sure you want to remove your profile picture?")) return;

    setDeletingAvatar(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setAvatarUrl(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to remove avatar");
      }
    } catch (error) {
      alert("Failed to remove avatar. Please try again.");
    } finally {
      setDeletingAvatar(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const res = await fetch(`/api/payments/verify/${reference}`);
      const data = await res.json();
      
      if (data.verified) {
        setPaymentStatus("success");
        setPaymentMessage(`Welcome to Inkseries Premium! Your ${data.plan} subscription is now active.`);
        fetchSubscription();
      } else {
        setPaymentStatus("error");
        setPaymentMessage(data.error || "Payment verification failed. Please contact support.");
      }
    } catch (error) {
      setPaymentStatus("error");
      setPaymentMessage("Unable to verify payment. Please contact support.");
    }
  };

  const handleSubscribe = async (plan: PlanType) => {
    setSubscribing(plan);
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (data.authorization_url) {
        // Redirect to Paystack checkout
        window.location.href = data.authorization_url;
      } else {
        alert(data.error || "Failed to initialize payment");
        setSubscribing(null);
      }
    } catch (error) {
      alert("Payment service unavailable. Please try again.");
      setSubscribing(null);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    alert("Profile updated successfully!");
  };

  const currentPlan = subscription?.active ? subscription.plan : "free";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          <div className="space-y-6">
            {/* Profile Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Your public profile information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative group">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : user.google_user_data?.picture ? (
                      <img
                        src={user.google_user_data.picture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-10 h-10 text-primary" />
                      </div>
                    )}
                    
                    {/* Upload overlay */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <Camera className="w-6 h-6 text-white" />
                      )}
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium">{user.google_user_data?.name || "Reader"}</p>
                    <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            {avatarUrl ? "Change Photo" : "Upload Photo"}
                          </>
                        )}
                      </Button>
                      
                      {avatarUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAvatarDelete}
                          disabled={deletingAvatar}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        >
                          {deletingAvatar ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      JPEG, PNG, WebP or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder={user.google_user_data?.name || "Enter display name"}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is how your name appears in comments and community discussions
                  </p>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Reading Progress Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Reading Progress</CardTitle>
                    <CardDescription>Track your reading journey and achievements</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ReadingLevel showProgress={true} />
                <ReadingStreak />
              </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Subscription</CardTitle>
                    <CardDescription>Manage your subscription plan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Payment Status Notification */}
                {paymentStatus && (
                  <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                    paymentStatus === "success" 
                      ? "bg-green-500/10 border border-green-500/20" 
                      : "bg-red-500/10 border border-red-500/20"
                  }`}>
                    {paymentStatus === "success" ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${paymentStatus === "success" ? "text-green-500" : "text-red-500"}`}>
                      {paymentMessage}
                    </span>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-muted/50 border border-border/50 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Current Plan</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      subscription?.isTrial
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        : currentPlan !== "free" 
                          ? "bg-gradient-to-r from-primary to-orange-500 text-primary-foreground" 
                          : "bg-muted"
                    }`}>
                      {subscription?.isTrial ? "Free Trial" :
                       currentPlan === "free" ? "Free" : 
                       currentPlan === "weekly" ? "Weekly Premium" :
                       currentPlan === "monthly" ? "Monthly Premium" : 
                       currentPlan === "quarterly" ? "3-Month Premium" :
                       currentPlan === "biannual" ? "6-Month Premium" : "Yearly Premium"}
                    </span>
                  </div>
                  {subscription?.isTrial ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        You're enjoying your 3-day free trial! Access all premium episodes while it lasts.
                      </p>
                      {subscription.trialExpiresAt && (
                        <p className="text-sm font-medium text-blue-400">
                          Trial ends {new Date(subscription.trialExpiresAt).toLocaleDateString()} at {new Date(subscription.trialExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  ) : currentPlan === "free" ? (
                    <p className="text-sm text-muted-foreground">
                      You're on the free plan. Upgrade to access premium episodes and exclusive features.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your subscription {subscription?.expires_at ? `expires on ${new Date(subscription.expires_at).toLocaleDateString()}` : "is active"}
                    </p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Weekly */}
                  <div className={`p-4 rounded-lg border transition-colors ${
                    currentPlan === "weekly" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                  }`}>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl font-bold">₦500</span>
                      <span className="text-muted-foreground text-xs">/week</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">All premium episodes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Try before you commit</span>
                      </li>
                    </ul>
                    <Button 
                      variant={currentPlan === "weekly" ? "secondary" : "outline"} 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleSubscribe("weekly")}
                      disabled={currentPlan === "weekly" || subscribing !== null}
                    >
                      {subscribing === "weekly" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : currentPlan === "weekly" ? "Current" : "Select"}
                    </Button>
                  </div>

                  {/* Monthly */}
                  <div className={`p-4 rounded-lg border transition-colors ${
                    currentPlan === "monthly" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                  }`}>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl font-bold">₦1,500</span>
                      <span className="text-muted-foreground text-xs">/month</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">All premium episodes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Ad-free reading</span>
                      </li>
                    </ul>
                    <Button 
                      variant={currentPlan === "monthly" ? "secondary" : "outline"} 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleSubscribe("monthly")}
                      disabled={currentPlan === "monthly" || subscribing !== null}
                    >
                      {subscribing === "monthly" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : currentPlan === "monthly" ? "Current" : "Select"}
                    </Button>
                  </div>

                  {/* 3 Months */}
                  <div className={`p-4 rounded-lg border transition-colors relative ${
                    currentPlan === "quarterly" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                  }`}>
                    <div className="absolute -top-2 right-2">
                      <span className="px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-medium">
                        Save ₦500
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl font-bold">₦4,000</span>
                      <span className="text-muted-foreground text-xs">/3 mo</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Everything in Monthly</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Priority support</span>
                      </li>
                    </ul>
                    <Button 
                      variant={currentPlan === "quarterly" ? "secondary" : "outline"} 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleSubscribe("quarterly")}
                      disabled={currentPlan === "quarterly" || subscribing !== null}
                    >
                      {subscribing === "quarterly" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : currentPlan === "quarterly" ? "Current" : "Select"}
                    </Button>
                  </div>

                  {/* 6 Months */}
                  <div className={`p-4 rounded-lg border transition-colors relative ${
                    currentPlan === "biannual" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"
                  }`}>
                    <div className="absolute -top-2 right-2">
                      <span className="px-1.5 py-0.5 rounded-full bg-muted text-foreground text-[10px] font-medium">
                        Save ₦1,500
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl font-bold">₦7,500</span>
                      <span className="text-muted-foreground text-xs">/6 mo</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Everything in Monthly</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Early access</span>
                      </li>
                    </ul>
                    <Button 
                      variant={currentPlan === "biannual" ? "secondary" : "outline"} 
                      size="sm" 
                      className="w-full" 
                      onClick={() => handleSubscribe("biannual")}
                      disabled={currentPlan === "biannual" || subscribing !== null}
                    >
                      {subscribing === "biannual" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : currentPlan === "biannual" ? "Current" : "Select"}
                    </Button>
                  </div>

                  {/* Yearly */}
                  <div className={`p-4 rounded-lg border relative ${
                    currentPlan === "yearly" ? "border-primary bg-primary/10" : "border-primary/50 bg-primary/5"
                  }`}>
                    <div className="absolute -top-2 right-2">
                      <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary to-orange-500 text-primary-foreground text-[10px] font-medium">
                        Save ₦3,600
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-xl font-bold">₦14,400</span>
                      <span className="text-muted-foreground text-xs">/year</span>
                    </div>
                    <ul className="space-y-1.5 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Save ₦3,600</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="text-muted-foreground text-xs">Author Q&As</span>
                      </li>
                    </ul>
                    <Button 
                      size="sm" 
                      className={`w-full ${currentPlan !== "yearly" ? "bg-gradient-to-r from-primary to-orange-500" : ""}`}
                      variant={currentPlan === "yearly" ? "secondary" : "default"}
                      onClick={() => handleSubscribe("yearly")}
                      disabled={currentPlan === "yearly" || subscribing !== null}
                    >
                      {subscribing === "yearly" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : currentPlan === "yearly" ? "Current" : "Select"}
                    </Button>
                  </div>
                </div>

                {/* Manage Subscription */}
                {subscriptionDetails?.isActive && !subscriptionDetails?.isTrial && (!subscriptionDetails?.subscription || !subscriptionDetails.subscription.isCancelled) && (
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">Manage Your Subscription</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {subscriptionDetails?.subscription?.isRecurring ? (
                            <>Auto-renews on {new Date(subscriptionDetails.subscription.expiresAt).toLocaleDateString()}</>
                          ) : subscriptionDetails?.subscription ? (
                            <>Ends on {new Date(subscriptionDetails.subscription.expiresAt).toLocaleDateString()} (one-time purchase)</>
                          ) : subscriptionDetails?.expiresAt ? (
                            <>Ends on {new Date(subscriptionDetails.expiresAt).toLocaleDateString()}</>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary border-primary/30 hover:bg-primary/10"
                          onClick={() => setShowChangePlanModal(true)}
                        >
                          <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                          Change Plan
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => setShowCancelModal(true)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                    
                    {/* Scheduled Plan Change Notice */}
                    {scheduledChange && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <Clock className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm text-blue-400">
                              Plan Change Scheduled
                            </h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              Your plan will {scheduledChange.change_type === 'downgrade' ? 'downgrade' : 'switch'} to{' '}
                              <span className="text-foreground font-medium">
                                {scheduledChange.new_plan_type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>{' '}
                              on {new Date(scheduledChange.effective_at).toLocaleDateString()}.
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2"
                              onClick={handleCancelScheduledChange}
                              disabled={cancellingScheduledChange}
                            >
                              {cancellingScheduledChange ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                              ) : null}
                              Keep Current Plan
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Refund Option - different display for one-time vs recurring plans */}
                    {refundEligibility?.eligible && (
                      <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Clock className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm text-emerald-400">
                              {refundEligibility.isOneTimePlan 
                                ? `${refundEligibility.refundWindowDays}-Day Refund Available` 
                                : "48-Hour Satisfaction Guarantee"}
                            </h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              {refundEligibility.isOneTimePlan ? (
                                <>
                                  You have {refundEligibility.daysRemaining} day{refundEligibility.daysRemaining !== 1 ? 's' : ''} left to request a full refund of ₦{refundEligibility.refundAmount?.toLocaleString()} for your {refundEligibility.planDisplayName} plan.
                                </>
                              ) : (
                                <>
                                  Not satisfied? You have {refundEligibility.hoursRemaining} hours left to request a full refund of ₦{refundEligibility.refundAmount?.toLocaleString()}.
                                </>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Episodes read: {refundEligibility.episodesRead}/{refundEligibility.maxEpisodes! - 1} max allowed for refund
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => setShowRefundModal(true)}
                            >
                              Request Refund
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cancelled Notice */}
                {subscriptionDetails?.subscription?.isCancelled && (
                  <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-400">
                      Your subscription is cancelled. You'll retain access until {new Date(subscriptionDetails.subscription.expiresAt).toLocaleDateString()}.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cancel Subscription Modal */}
            {showCancelModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="bg-background border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">
                        {cancelStep === "reason" && "Before you go..."}
                        {cancelStep === "offer" && "Wait! We have an offer"}
                        {cancelStep === "confirm" && "Confirm Cancellation"}
                      </h3>
                      <button
                        onClick={() => {
                          setShowCancelModal(false);
                          setCancelStep("reason");
                          setCancelReason("");
                        }}
                        className="p-1 rounded-lg hover:bg-muted"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {cancelStep === "reason" && (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          We're sorry to see you go! Help us improve by telling us why you're leaving.
                        </p>
                        <div className="space-y-2">
                          {[
                            "Too expensive",
                            "Not enough content",
                            "Don't have time to read",
                            "Found another platform",
                            "Technical issues",
                            "Other"
                          ].map((reason) => (
                            <label
                              key={reason}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                cancelReason === reason
                                  ? "border-primary bg-primary/10"
                                  : "border-border/50 hover:border-primary/50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="cancelReason"
                                value={reason}
                                checked={cancelReason === reason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="accent-primary"
                              />
                              <span className="text-sm">{reason}</span>
                            </label>
                          ))}
                        </div>
                        <Button
                          className="w-full mt-4"
                          disabled={!cancelReason}
                          onClick={() => setCancelStep("offer")}
                        >
                          Continue
                        </Button>
                      </div>
                    )}

                    {cancelStep === "offer" && (
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Gift className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            We don't want you to miss out! Choose one of these special offers:
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <button
                            onClick={() => handleSaveOffer("pause")}
                            disabled={acceptingOffer !== null}
                            className="w-full p-4 rounded-lg border border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/20">
                                <TrendingUp className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">Take a Break</p>
                                <p className="text-xs text-muted-foreground">
                                  Get 7 extra days free to explore more stories
                                </p>
                              </div>
                              {acceptingOffer === "pause" && (
                                <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                              )}
                            </div>
                          </button>

                          <button
                            onClick={() => handleSaveOffer("discount")}
                            disabled={acceptingOffer !== null}
                            className="w-full p-4 rounded-lg border border-green-500/50 bg-green-500/5 hover:bg-green-500/10 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-green-500/20">
                                <Crown className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium">50% Off Renewal</p>
                                <p className="text-xs text-muted-foreground">
                                  Continue reading at half the price
                                </p>
                              </div>
                              {acceptingOffer === "discount" && (
                                <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                              )}
                            </div>
                          </button>
                        </div>

                        <div className="pt-4 border-t border-border/50">
                          <button
                            onClick={() => setCancelStep("confirm")}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            No thanks, proceed to cancel →
                          </button>
                        </div>
                      </div>
                    )}

                    {cancelStep === "confirm" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-400">
                            {subscriptionDetails?.subscription?.isRecurring ? (
                              <>Your subscription will stop auto-renewing. You'll retain access until {subscriptionDetails?.subscription?.expiresAt ? new Date(subscriptionDetails.subscription.expiresAt).toLocaleDateString() : "the end of your current period"}.</>
                            ) : (
                              <>Your subscription will be marked as cancelled. You'll retain access until {subscriptionDetails?.subscription?.expiresAt ? new Date(subscriptionDetails.subscription.expiresAt).toLocaleDateString() : "the end of your current period"}.</>
                            )}
                          </p>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setShowCancelModal(false);
                              setCancelStep("reason");
                              setCancelReason("");
                            }}
                          >
                            Keep Subscription
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleCancelSubscription}
                            disabled={cancelling}
                          >
                            {cancelling ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Cancel Subscription"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Change Plan Modal */}
            {showChangePlanModal && plansData && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="bg-background border border-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Change Your Plan</h3>
                      <button
                        onClick={() => setShowChangePlanModal(false)}
                        className="p-1 rounded-lg hover:bg-muted"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Plan Category Tabs */}
                    <div className="flex gap-2 mb-6 p-1 bg-muted/30 rounded-lg">
                      <button
                        onClick={() => setChangePlanTab("individual")}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          changePlanTab === "individual" 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Individual
                      </button>
                      <button
                        onClick={() => setChangePlanTab("family")}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                          changePlanTab === "family" 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        Family (4 accounts)
                      </button>
                    </div>

                    {/* Family member warning */}
                    {plansData.isFamilyMember && !plansData.isFamilyOwner && (
                      <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-amber-400">
                          You're part of a family plan. Only the plan owner can change the plan.
                        </p>
                      </div>
                    )}

                    {/* Current plan info */}
                    {plansData.currentPlan && (
                      <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm">
                          <span className="text-muted-foreground">Current plan:</span>{' '}
                          <span className="font-medium text-primary">
                            {plansData.currentPlan.replace('_', ' ').replace('family ', 'Family ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                          {plansData.currentExpires && (
                            <span className="text-muted-foreground">
                              {' '}• Renews {new Date(plansData.currentExpires).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Plans Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {(changePlanTab === "individual" ? plansData.individualPlans : plansData.familyPlans).map((plan) => (
                        <div
                          key={plan.planType}
                          className={`p-4 rounded-lg border transition-all ${
                            plan.isCurrent 
                              ? "border-primary bg-primary/10 opacity-60" 
                              : plan.isUpgrade
                                ? "border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5 cursor-pointer"
                                : "border-border/50 hover:border-border cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-sm font-medium">{plan.label}</span>
                            {plan.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                                Current
                              </span>
                            )}
                            {plan.isUpgrade && !plan.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                                Upgrade
                              </span>
                            )}
                            {plan.isDowngrade && !plan.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-medium">
                                Downgrade
                              </span>
                            )}
                            {plan.isCategorySwitch && !plan.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                                Switch
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 mb-3">
                            <span className="text-xl font-bold">₦{plan.amount.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">
                              /{plan.duration === 7 ? 'week' : plan.duration === 30 ? 'mo' : plan.duration === 90 ? '3mo' : plan.duration === 180 ? '6mo' : 'year'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={plan.isCurrent ? "secondary" : plan.isUpgrade ? "default" : "outline"}
                            className={`w-full ${plan.isUpgrade && !plan.isCurrent ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                            disabled={plan.isCurrent || processingPlanChange !== null || (plansData.isFamilyMember && !plansData.isFamilyOwner)}
                            onClick={() => handlePlanChange(plan)}
                          >
                            {processingPlanChange === plan.planType ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : plan.isCurrent ? (
                              "Current"
                            ) : plan.isUpgrade ? (
                              "Upgrade Now"
                            ) : plan.isDowngrade ? (
                              "Schedule Downgrade"
                            ) : plan.isCategorySwitch ? (
                              "Switch Category"
                            ) : (
                              "Select"
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Info notices */}
                    <div className="mt-6 space-y-2">
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span><strong className="text-emerald-400">Upgrades</strong> take effect immediately. You'll pay the prorated difference.</span>
                      </p>
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <span><strong className="text-amber-400">Downgrades</strong> take effect at your next renewal date.</span>
                      </p>
                      {changePlanTab !== plansData.currentCategory && plansData.currentCategory && (
                        <p className="text-xs text-muted-foreground flex items-start gap-2">
                          <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span><strong className="text-blue-400">Category switches</strong> (individual ↔ family) are scheduled for your renewal date.</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Refund Request Modal */}
            {showRefundModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                <div className="bg-background border border-border rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Request Refund</h3>
                      <button
                        onClick={() => {
                          setShowRefundModal(false);
                          setRefundReason("");
                        }}
                        className="p-1 rounded-lg hover:bg-muted"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm">
                          Request a refund for your <span className="font-semibold text-amber-400">{refundEligibility?.planDisplayName || "Premium"}</span> subscription?
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          This will cancel your access immediately. Refunds are processed within 3-5 business days.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Refund amount</span>
                          <span className="font-semibold text-emerald-400">₦{refundEligibility?.refundAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-muted-foreground">Episodes read</span>
                          <span className="text-sm">{refundEligibility?.episodesRead}/{refundEligibility?.maxEpisodes! - 1} max</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Why would you like a refund? (optional)
                        </label>
                        <textarea
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder="Help us understand how we can improve..."
                          className="w-full p-3 rounded-lg bg-muted/50 border border-border/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
                          onClick={() => {
                            setShowRefundModal(false);
                            setRefundReason("");
                          }}
                        >
                          Keep My Subscription
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleRequestRefund}
                          disabled={requestingRefund}
                        >
                          {requestingRefund ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Yes, Request Refund"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Referral Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Invite Friends</CardTitle>
                    <CardDescription>Earn 7 free days for every friend who subscribes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingReferrals ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : referralData ? (
                  <div className="space-y-4">
                    {/* Referral Link */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">Your Referral Link</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 rounded bg-background font-mono text-sm tracking-wide overflow-x-auto whitespace-nowrap">
                          inkseries.com/?ref={referralData.referral_code}
                        </code>
                        <Button variant="outline" size="icon" onClick={copyReferralCode} title="Copy link">
                          {referralCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="icon" onClick={shareReferral} title="Share">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {referralCopied && (
                        <p className="text-xs text-green-500 mt-2">Link copied to clipboard!</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold text-primary">{referralData.successful_referrals}</p>
                        <p className="text-xs text-muted-foreground">Successful</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold text-orange-500">{referralData.pending_referrals}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-muted/30">
                        <p className="text-2xl font-bold text-green-500">{referralData.total_days_earned}</p>
                        <p className="text-xs text-muted-foreground">Days Earned</p>
                      </div>
                    </div>

                    {/* Bonus Days Banner */}
                    {referralData.bonus_days_stored > 0 && (
                      <div className="p-3 rounded-lg bg-gradient-to-r from-primary/20 to-orange-500/20 border border-primary/30">
                        <p className="text-sm font-medium text-primary">
                          🎁 {referralData.bonus_days_stored} bonus days waiting!
                        </p>
                        <p className="text-xs text-muted-foreground">
                          These will be added when you start your next subscription.
                        </p>
                      </div>
                    )}

                    {/* Early Access Badge */}
                    {referralData.has_early_access && (
                      <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <p className="text-sm font-medium text-purple-400 flex items-center gap-2">
                          <Crown className="w-4 h-4" /> Ambassador Status
                        </p>
                        <p className="text-xs text-muted-foreground">
                          You get early access to new stories 24 hours before everyone else!
                        </p>
                      </div>
                    )}

                    {/* Milestone Progress */}
                    {referralData.milestone_progress.current < referralData.milestone_progress.target && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Next Milestone</p>
                          <span className="text-xs text-primary font-medium">
                            {referralData.milestone_progress.current}/{referralData.milestone_progress.target}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all"
                            style={{ width: `${(referralData.milestone_progress.current / referralData.milestone_progress.target) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {referralData.milestone_progress.target - referralData.milestone_progress.current} more referral{referralData.milestone_progress.target - referralData.milestone_progress.current !== 1 ? 's' : ''} to earn: <span className="text-primary">{referralData.milestone_progress.reward}</span>
                        </p>
                      </div>
                    )}

                    {/* Friends Who Joined */}
                    {referralData.friends.length > 0 && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-sm font-medium mb-3">Friends Who Joined</p>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {referralData.friends.map((friend, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-foreground">{friend.firstName}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(friend.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground text-center">
                      Share your link. When friends join and start reading, you earn 2 free days!
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Unable to load referral information
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Family Plan Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Home className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Family Plan</CardTitle>
                    <CardDescription>Share premium access with up to 5 family members</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFamily ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : familyPlan ? (
                  <div className="space-y-4">
                    {/* Plan Status */}
                    <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium flex items-center gap-2">
                          <Home className="w-4 h-4 text-primary" />
                          {familyPlan.is_owner ? "Your Family Plan" : `${familyPlan.owner_name}'s Family`}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                          {familyPlan.members.length}/{familyPlan.max_members} members
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(familyPlan.expires_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Members List */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Family Members</p>
                      {familyPlan.members.map((member) => (
                        <div 
                          key={member.email} 
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium flex items-center gap-2">
                                {member.name || member.email}
                                {member.is_owner && (
                                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-medium">
                                    Owner
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          {familyPlan.is_owner && !member.is_owner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.email)}
                              disabled={removingMember === member.email}
                              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            >
                              {removingMember === member.email ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Invite New Member (Owner only) */}
                    {familyPlan.is_owner && familyPlan.members.length < familyPlan.max_members && (
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        <p className="text-sm font-medium">Invite a Family Member</p>
                        <div className="flex gap-2">
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleInviteMember} disabled={inviting || !inviteEmail.trim()}>
                            {inviting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Invite
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          They'll receive an email with instructions to join your family plan.
                        </p>
                      </div>
                    )}

                    {/* Leave Family (Member only) */}
                    {!familyPlan.is_owner && (
                      <Button
                        variant="outline"
                        onClick={handleLeaveFamily}
                        disabled={leavingFamily}
                        className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10"
                      >
                        {leavingFamily ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Leaving...
                          </>
                        ) : (
                          "Leave Family Plan"
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Create Family Plan */}
                    <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-primary to-orange-500">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Start a Family Plan</p>
                          <p className="text-sm text-muted-foreground">Share with up to 4 family members</p>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">Up to 4 accounts included</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">Everyone gets full premium access</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">Save up to 30% vs individual plans</span>
                        </li>
                      </ul>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Button 
                          onClick={() => handleCreateFamilyPlan("family_weekly")} 
                          disabled={creatingFamily}
                          variant="outline"
                          className="flex-col h-auto py-3"
                        >
                          <span className="font-semibold">₦1,500/week</span>
                          <span className="text-xs text-muted-foreground">₦375/account</span>
                        </Button>
                        <Button 
                          onClick={() => handleCreateFamilyPlan("family_monthly")} 
                          disabled={creatingFamily}
                          variant="outline"
                          className="flex-col h-auto py-3"
                        >
                          <span className="font-semibold">₦4,500/month</span>
                          <span className="text-xs text-muted-foreground">₦1,125/account</span>
                        </Button>
                        <Button 
                          onClick={() => handleCreateFamilyPlan("family_quarterly")} 
                          disabled={creatingFamily}
                          className="flex-col h-auto py-3 bg-gradient-to-r from-primary to-orange-500"
                        >
                          <span className="font-semibold">₦10,500/3mo</span>
                          <span className="text-xs">Save ₦1,500</span>
                        </Button>
                        <Button 
                          onClick={() => handleCreateFamilyPlan("family_biannual")} 
                          disabled={creatingFamily}
                          variant="outline"
                          className="flex-col h-auto py-3"
                        >
                          <span className="font-semibold">₦21,000/6mo</span>
                          <span className="text-xs text-muted-foreground">Save ₦3,000</span>
                        </Button>
                        <Button 
                          onClick={() => handleCreateFamilyPlan("family_annual")} 
                          disabled={creatingFamily}
                          variant="outline"
                          className="flex-col h-auto py-3"
                        >
                          <span className="font-semibold">₦40,000/year</span>
                          <span className="text-xs text-muted-foreground">Save ₦8,000</span>
                        </Button>
                      </div>
                      {creatingFamily && (
                        <div className="flex items-center justify-center mt-3 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting to payment...
                        </div>
                      )}
                    </div>

                    {/* Or Join Existing */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-card px-2 text-muted-foreground">or join an existing plan</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Have an invite code?</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter invite code"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                          className="flex-1 font-mono"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleJoinFamily} 
                          disabled={joining || !joinCode.trim()}
                        >
                          {joining ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Join"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gift Subscriptions Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Gift Subscriptions</CardTitle>
                    <CardDescription>Send the gift of reading to friends and family</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingGifts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Gift Tabs */}
                    <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
                      {[
                        { id: "send", label: "Send Gift" },
                        { id: "received", label: `Received${redeemableGifts.length > 0 ? ` (${redeemableGifts.length})` : ""}` },
                        { id: "sent", label: "Sent" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setGiftTab(tab.id as "send" | "received" | "sent")}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            giftTab === tab.id
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Send Gift Tab */}
                    {giftTab === "send" && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20">
                          <p className="text-sm text-muted-foreground mb-3">
                            Gift a subscription and the recipient will receive an email with a redemption code.
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium mb-1 block">Recipient's Email</label>
                              <Input
                                type="email"
                                placeholder="friend@email.com"
                                value={giftRecipientEmail}
                                onChange={(e) => setGiftRecipientEmail(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">Plan Type</label>
                              <select
                                value={giftPlanType}
                                onChange={(e) => setGiftPlanType(e.target.value as PlanType)}
                                className="w-full p-2 rounded-md border border-border bg-background text-sm"
                              >
                                <option value="weekly">Weekly - ₦500</option>
                                <option value="monthly">Monthly - ₦1,500</option>
                                <option value="3-month">3 Months - ₦4,000</option>
                                <option value="6-month">6 Months - ₦7,000</option>
                                <option value="yearly">Yearly - ₦14,400</option>
                              </select>
                            </div>
                            <Button
                              onClick={handlePurchaseGift}
                              disabled={purchasingGift || !giftRecipientEmail.trim()}
                              className="w-full bg-gradient-to-r from-primary to-orange-500"
                            >
                              {purchasingGift ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Gift className="w-4 h-4 mr-2" />
                                  Purchase Gift
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Received Gifts Tab */}
                    {giftTab === "received" && (
                      <div className="space-y-4">
                        {redeemableGifts.length > 0 ? (
                          <div className="space-y-3">
                            {redeemableGifts.map((gift) => (
                              <div
                                key={gift.id}
                                className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium flex items-center gap-2">
                                      <Gift className="w-4 h-4 text-green-500" />
                                      Gift from {gift.sender_name || gift.sender_email}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {gift.plan_type.replace("-", " ")} subscription
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Expires: {new Date(gift.expires_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRedeemGift(gift.gift_code)}
                                    disabled={redeemingGift}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {redeemingGift ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Redeem"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No gifts waiting for you</p>
                          </div>
                        )}

                        {/* Manual Redeem Code */}
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-sm font-medium mb-2">Have a gift code?</p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter gift code"
                              value={redeemCode}
                              onChange={(e) => setRedeemCode(e.target.value)}
                              className="flex-1 font-mono"
                            />
                            <Button
                              variant="outline"
                              onClick={() => handleRedeemGift()}
                              disabled={redeemingGift || !redeemCode.trim()}
                            >
                              {redeemingGift ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Redeem"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sent Gifts Tab */}
                    {giftTab === "sent" && (
                      <div className="space-y-3">
                        {sentGifts.length > 0 ? (
                          sentGifts.map((gift) => (
                            <div
                              key={gift.id}
                              className={`p-4 rounded-lg border ${
                                gift.is_redeemed
                                  ? "bg-muted/30 border-border/50"
                                  : "bg-primary/5 border-primary/20"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{gift.recipient_email}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {gift.plan_type.replace("-", " ")} subscription
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Sent: {new Date(gift.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    gift.is_redeemed
                                      ? "bg-green-500/20 text-green-500"
                                      : "bg-yellow-500/20 text-yellow-600"
                                  }`}
                                >
                                  {gift.is_redeemed ? "Redeemed" : "Pending"}
                                </span>
                              </div>
                              {!gift.is_redeemed && (
                                <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 p-2 rounded">
                                  Code: {gift.gift_code}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">You haven't sent any gifts yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Choose what updates you receive</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={handleNewsletterChange} />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">New Episode Alerts</p>
                      <p className="text-xs text-muted-foreground">Get notified when novels you follow release new episodes</p>
                    </div>
                  </div>
                  <Switch checked={chapterAlerts} onCheckedChange={handleChapterAlertsChange} />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Weekly Community Digest</p>
                      <p className="text-xs text-muted-foreground">Top discussions and trending stories</p>
                    </div>
                  </div>
                  <Switch checked={communityDigest} onCheckedChange={setCommunityDigest} />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Section */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Privacy & Security</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your account is secured with Google OAuth. No password is stored on Inkseries.
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-500">Account secured with Google</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
