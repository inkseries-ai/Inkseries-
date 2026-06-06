import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";

import TrialExpiredPopup from "@/react-app/components/TrialExpiredPopup";
import WeeklyUpgradePrompt from "@/react-app/components/WeeklyUpgradePrompt";
import { Play, Star, ArrowRight, Check, Flame, Crown, Zap, Loader as Loader2, BookOpen, ChevronLeft, ChevronRight, Sparkles, Search, X } from "lucide-react";

interface Novel {
  id: number;
  slug: string;
  title: string;
  synopsis: string;
  cover_image_url: string | null;
  genre: string;
  author_name: string;
  rating: number;
  rating_count: number;
  avg_rating: number;
  total_chapters: number;
  total_reads: number;
  status: string;
  tags?: string;
}

interface LibraryItem {
  novel_id: number;
  title: string;
  slug: string;
  cover_image_url: string | null;
  genre: string;
  author_name: string;
  last_read_chapter: number;
  total_chapters: number;
}

const GENRES = [
  "School Life and Friendships",
  "Romance and First Love", 
  "Family and Identity",
  "Street and Hustle",
  "Thriller and Mystery",
  "African Fantasy and Mythology"
];

const individualPlans = [{
  name: "Weekly",
  price: "₦500",
  period: "/week",
  monthlyEquivalent: null,
  features: ["7 days unlimited access", "New episodes every week", "Ad-free reading", "Try before committing"],
  popular: false,
  savings: null,
  badge: "Starter"
}, {
  name: "Monthly",
  price: "₦1,500",
  period: "/month",
  monthlyEquivalent: null,
  features: ["Unlimited access to all novels", "New episodes every week", "Community discussions", "Ad-free reading"],
  popular: false,
  savings: null,
  badge: null
}, {
  name: "3 Months",
  price: "₦4,000",
  period: "/3 months",
  monthlyEquivalent: "₦1,333/month",
  features: ["Everything in Monthly", "Early access to new releases", "Priority support"],
  popular: false,
  savings: "Save ₦500",
  badge: null
}, {
  name: "6 Months",
  price: "₦7,000",
  period: "/6 months",
  monthlyEquivalent: "₦1,167/month",
  features: ["Everything in Monthly", "Early access to new releases", "Priority support"],
  popular: true,
  savings: "Save ₦2,000",
  badge: "Most Popular"
}, {
  name: "Yearly",
  price: "₦14,400",
  period: "/year",
  monthlyEquivalent: "₦1,200/month",
  features: ["Everything in Monthly", "Early access to new releases", "Exclusive author Q&As", "2 months free"],
  popular: false,
  savings: null,
  badge: "Best Value"
}];

const familyPlans = [{
  name: "Family Weekly",
  price: "₦1,500",
  period: "/week",
  monthlyEquivalent: "₦375 per account",
  features: ["Up to 4 accounts", "7 days access", "All premium features", "Save ₦500 vs 4 individual"],
  popular: false,
  savings: null,
  badge: "Starter"
}, {
  name: "Family Monthly",
  price: "₦4,500",
  period: "/month",
  monthlyEquivalent: "₦1,125 per account",
  features: ["Up to 4 accounts", "Independent profiles & history", "All premium features", "Manage from one dashboard"],
  popular: false,
  savings: null,
  badge: null
}, {
  name: "Family 3 Months",
  price: "₦11,000",
  period: "/3 months",
  monthlyEquivalent: "₦917 per account/month",
  features: ["Up to 4 accounts", "Independent profiles & history", "All premium features", "Priority family support"],
  popular: false,
  savings: null,
  badge: null
}, {
  name: "Family 6 Months",
  price: "₦20,000",
  period: "/6 months",
  monthlyEquivalent: "₦833 per account/month",
  features: ["Up to 4 accounts", "Independent profiles & history", "All premium features", "Priority family support"],
  popular: true,
  savings: null,
  badge: "Most Popular"
}, {
  name: "Family Annual",
  price: "₦40,000",
  period: "/year",
  monthlyEquivalent: "₦833 per account/month",
  features: ["Up to 4 accounts", "Independent profiles & history", "All premium features", "Priority family support"],
  popular: false,
  savings: null,
  badge: "Best Value"
}];

// Horizontal scroll row component
function StoryRow({ title, icon: Icon, novels, accentColor = "primary", genreFilter }: { 
  title: string; 
  icon: React.ElementType; 
  novels: Novel[];
  accentColor?: string;
  genreFilter?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 300;
    scrollRef.current.scrollBy({ 
      left: direction === "left" ? -scrollAmount : scrollAmount, 
      behavior: "smooth" 
    });
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", checkScroll);
    return () => ref?.removeEventListener("scroll", checkScroll);
  }, [novels]);

  if (novels.length === 0) return null;

  return (
    <div className="relative group/row">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${accentColor === "orange" ? "text-orange-500" : "text-primary"}`} />
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        <Link to={genreFilter ? `/explore?genre=${encodeURIComponent(genreFilter)}` : "/explore"} className="text-sm text-muted-foreground hover:text-primary transition-colors">
          See all <ArrowRight className="w-4 h-4 inline ml-1" />
        </Link>
      </div>

      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/90 border border-border shadow-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Horizontal scroll container */}
      <div 
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide -mx-4 px-4"
        onScroll={checkScroll}
      >
        <div className="flex gap-4 pb-2">
          {novels.map((novel) => (
            <Link 
              key={novel.id} 
              to={`/novel/${novel.slug}`}
              className="group flex-shrink-0 w-[130px] sm:w-[150px]"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                <img 
                  src={novel.cover_image_url || "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=400&h=600&fit=crop"} 
                  alt={novel.title}
                  className="w-full h-full object-contain bg-black/50 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=400&h=600&fit=crop";
                  }}
                />
                {/* Coming Soon Badge */}
                {novel.status === "coming_soon" && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-1 text-[10px] font-semibold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 backdrop-blur-sm">
                      Coming Soon
                    </span>
                  </div>
                )}
                {/* Watermark */}
                <div className="absolute bottom-12 right-2 opacity-30">
                  <img 
                    src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
                    alt="" 
                    className="w-6 h-6 drop-shadow-lg" 
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Hover overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                  <div className="flex items-center gap-1 text-xs">
                    {(novel.rating_count || 0) >= 5 && (
                      <>
                        <Star className="w-3 h-3 text-primary fill-primary" />
                        <span>{(novel.avg_rating || novel.rating)?.toFixed(1)}</span>
                        <span className="text-muted-foreground mx-1">•</span>
                      </>
                    )}
                    <span>{novel.total_chapters || 0} eps</span>
                  </div>
                </div>
              </div>
              <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {novel.title}
              </h3>
              <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed mt-0.5">
                {novel.synopsis}
              </p>
              <p className="text-[10px] text-primary/70 mt-1">
                {novel.genre}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Novel[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [planType, setPlanType] = useState<"individual" | "family">("individual");
  const [existingSubscription, setExistingSubscription] = useState<{
    planName: string;
    expiresAt: string;
  } | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [continueReading, setContinueReading] = useState<LibraryItem[]>([]);
  const [storyOfTheWeek, setStoryOfTheWeek] = useState<Novel | null>(null);
  const [newThisWeek, setNewThisWeek] = useState<Novel[]>([]);
  const [trendingNovels, setTrendingNovels] = useState<Novel[]>([]);
  const [genreSections, setGenreSections] = useState<Record<string, Novel[]>>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, redirectToLogin } = useAuth();

  // Debounced search
  const searchNovels = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/novels?search=${encodeURIComponent(query.trim())}&limit=6`);
      const data = await res.json();
      setSearchResults(data.novels || []);
      setShowSearchDropdown(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchNovels(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchNovels]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Capture referral code from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      localStorage.setItem("referral_code", refCode.toUpperCase());
    }
  }, [searchParams]);

  // Fetch all novel data
  useEffect(() => {
    // Fetch featured story of the week
    fetch("/api/novels?featured=true&limit=1")
      .then(res => res.json())
      .then(data => {
        if (data.novels?.length > 0) {
          setStoryOfTheWeek(data.novels[0]);
        } else {
          // Fallback to most popular if no featured
          fetch("/api/novels?sort=popular&limit=1")
            .then(res => res.json())
            .then(data => {
              if (data.novels?.length > 0) setStoryOfTheWeek(data.novels[0]);
            });
        }
      })
      .catch(() => {});

    // Fetch newest novels (New This Week)
    fetch("/api/novels?sort=newest&limit=10")
      .then(res => res.json())
      .then(data => setNewThisWeek(data.novels || []))
      .catch(() => {});

    // Fetch trending/popular novels
    fetch("/api/novels?sort=popular&limit=10")
      .then(res => res.json())
      .then(data => setTrendingNovels(data.novels || []))
      .catch(() => {});

    // Fetch novels by genre
    GENRES.forEach(genre => {
      fetch(`/api/novels?genre=${encodeURIComponent(genre)}&limit=10`)
        .then(res => res.json())
        .then(data => {
          if (data.novels?.length > 0) {
            setGenreSections(prev => ({ ...prev, [genre]: data.novels }));
          }
        })
        .catch(() => {});
    });
  }, []);

  // Fetch user's in-progress stories and bookmarks
  useEffect(() => {
    if (!user) {
      setContinueReading([]);
      return;
    }
    
    fetch("/api/library", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        const library = data.library || [];
        // Sort: in-progress first (has started reading), then bookmarked (not started)
        const sorted = library.sort((a: LibraryItem, b: LibraryItem) => {
          const aInProgress = a.last_read_chapter > 0 && a.last_read_chapter < a.total_chapters;
          const bInProgress = b.last_read_chapter > 0 && b.last_read_chapter < b.total_chapters;
          if (aInProgress && !bInProgress) return -1;
          if (!aInProgress && bInProgress) return 1;
          return 0;
        });
        setContinueReading(sorted.slice(0, 10));
      })
      .catch(() => setContinueReading([]));
  }, [user]);

  // Check for pending subscription after login
  useEffect(() => {
    const checkPendingSubscription = async () => {
      if (!user) return;
      
      const pendingPlan = localStorage.getItem("pendingSubscriptionPlan");
      if (!pendingPlan) return;
      
      // Clear it immediately to prevent loops
      localStorage.removeItem("pendingSubscriptionPlan");
      
      // Check if user already has an active subscription
      try {
        const res = await fetch("/api/subscriptions/status", {
          credentials: "include"
        });
        const data = await res.json();
        
        if (data.isActive && !data.isTrial) {
          // User already has a subscription - show modal
          setExistingSubscription({
            planName: data.planType || "Subscription",
            expiresAt: data.expiresAt || ""
          });
          setShowSubscriptionModal(true);
          return;
        }
        
        // No active subscription - auto-initiate payment for the pending plan
        const planTypeMap: Record<string, string> = {
          "Weekly": "weekly",
          "Monthly": "monthly",
          "3 Months": "quarterly",
          "6 Months": "biannual",
          "Yearly": "yearly",
          "Family Weekly": "family_weekly",
          "Family Monthly": "family_monthly",
          "Family 3 Months": "family_quarterly",
          "Family 6 Months": "family_biannual",
          "Family Annual": "family_annual"
        };
        
        const selectedPlanType = planTypeMap[pendingPlan];
        if (!selectedPlanType) return;
        
        setSubscribing(pendingPlan);
        const isFamilyPlan = selectedPlanType.startsWith("family_");
        const endpoint = isFamilyPlan ? "/api/family/create" : "/api/payments/initialize";
        const body = isFamilyPlan ? { plan_type: selectedPlanType } : { plan: selectedPlanType };
        
        const paymentRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body)
        });
        const paymentData = await paymentRes.json();
        
        if (paymentData.authorization_url) {
          window.location.href = paymentData.authorization_url;
        } else {
          setSubscribing(null);
        }
      } catch {
        setSubscribing(null);
      }
    };
    
    checkPendingSubscription();
  }, [user]);

  const planNameToType: Record<string, string> = {
    "Weekly": "weekly",
    "Monthly": "monthly",
    "3 Months": "quarterly",
    "6 Months": "biannual",
    "Yearly": "yearly",
    "Family Weekly": "family_weekly",
    "Family Monthly": "family_monthly",
    "Family 3 Months": "family_quarterly",
    "Family 6 Months": "family_biannual",
    "Family Annual": "family_annual"
  };

  const currentPlans = planType === "individual" ? individualPlans : familyPlans;

  const handleSubscribe = async (planName: string) => {
    if (!user) {
      // Store the plan they want so we can auto-redirect after login
      localStorage.setItem("pendingSubscriptionPlan", planName);
      await redirectToLogin();
      return;
    }
    
    // Check if user already has an active subscription
    try {
      const statusRes = await fetch("/api/subscriptions/status", {
        credentials: "include"
      });
      const statusData = await statusRes.json();
      
      if (statusData.isActive && !statusData.isTrial) {
        // User already has a subscription - show modal
        setExistingSubscription({
          planName: statusData.planType || "Subscription",
          expiresAt: statusData.expiresAt || ""
        });
        setShowSubscriptionModal(true);
        return;
      }
    } catch {
      // Continue with payment if status check fails
    }
    
    const selectedPlanType = planNameToType[planName];
    if (!selectedPlanType) {
      navigate("/settings");
      return;
    }
    setSubscribing(planName);
    try {
      const isFamilyPlan = selectedPlanType.startsWith("family_");
      const endpoint = isFamilyPlan ? "/api/family/create" : "/api/payments/initialize";
      const body = isFamilyPlan ? { plan_type: selectedPlanType } : { plan: selectedPlanType };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(data.error || "Failed to initialize payment. Please try again.");
        setSubscribing(null);
      }
    } catch {
      alert("Payment service unavailable. Please try again later.");
      setSubscribing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated ticker bar */}
      <div className="bg-primary/10 border-b border-primary/20 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap py-2">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="mx-8 text-sm">
              ✨ <span className="text-primary font-semibold">Inkseries</span> — Stories that sound and feel like home ✨
            </span>
          ))}
        </div>
      </div>

      <Navbar />

      <TrialExpiredPopup />
      <WeeklyUpgradePrompt />

      {/* Hero - Story of the Week Spotlight */}
      <section className="relative pt-20 pb-6 md:pt-24 md:pb-10 overflow-hidden min-h-[420px] md:min-h-[500px]">
        {/* Netflix-style tilted mosaic background */}
        <div className="absolute inset-0 z-0">
          {/* Tilted grid container */}
          <div 
            className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2"
            style={{ transform: 'rotate(-12deg)' }}
          >
            <div className="grid grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 md:gap-3 p-4">
              {/* Generate grid of covers */}
              {[...Array(96)].map((_, index) => {
                // Get all available covers for the mosaic
                const allCovers = [
                  ...trendingNovels.map(n => n.cover_image_url),
                  ...Object.values(genreSections).flat().map(n => n.cover_image_url)
                ].filter(Boolean) as string[];
                
                // Placeholder for when no covers exist
                const placeholder = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png";
                
                // Use real covers if available, otherwise use placeholders
                const covers = allCovers.length > 0 ? allCovers : [placeholder];
                const coverUrl = covers[index % covers.length] || placeholder;
                
                return (
                  <div 
                    key={index}
                    className="aspect-[2/3] rounded-md overflow-hidden bg-zinc-800"
                  >
                    <img 
                      src={coverUrl}
                      alt=""
                      loading={index < 24 ? "eager" : "lazy"}
                      className="w-full h-full object-cover opacity-70"
                      onError={(e) => {
                        e.currentTarget.src = placeholder;
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Dark gradient overlays for text readability - Netflix style */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/40 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="absolute inset-0 bg-black/30 z-10" />
        </div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome tagline */}
          <div className="text-center lg:text-left mb-4">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1">
              Stories that sound and feel like home
            </h1>
            <p className="text-base md:text-lg text-muted-foreground italic">
              Serialized African Teenage fiction. New episodes every week.
            </p>
          </div>

          {/* Search Bar */}
          <div ref={searchRef} className="max-w-xl mx-auto lg:mx-0 mb-6 relative">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  setShowSearchDropdown(false);
                  navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for stories, authors, genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && searchResults.length > 0 && setShowSearchDropdown(true)}
                  className="w-full pl-12 pr-12 py-3 h-12 bg-background/80 border-border/50 backdrop-blur-sm text-base placeholder:text-muted-foreground/70 focus:border-primary"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-14 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {searchQuery && (
                  <button 
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Go"}
                  </button>
                )}
              </div>
            </form>

            {/* Search Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className="max-h-[320px] overflow-y-auto">
                      {searchResults.map((novel) => (
                        <Link
                          key={novel.id}
                          to={`/novel/${novel.slug}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0"
                        >
                          <div className="w-12 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={novel.cover_image_url || "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png"}
                              alt={novel.title}
                              className="w-full h-full object-contain bg-black/50"
                              onError={(e) => {
                                e.currentTarget.src = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2">{novel.title}</h4>
                            <p className="text-xs text-muted-foreground">by {novel.author_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-primary">{novel.genre}</span>
                              {(novel.rating_count || 0) >= 5 && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <div className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 text-primary fill-primary" />
                                    <span className="text-xs">{(novel.avg_rating || novel.rating).toFixed(1)}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setShowSearchDropdown(false);
                        navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="w-full p-3 text-sm text-primary font-medium hover:bg-muted/50 transition-colors border-t border-border"
                    >
                      See all results for "{searchQuery}"
                    </button>
                  </>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No stories found for "{searchQuery}"</p>
                    <Link
                      to="/explore"
                      onClick={() => setShowSearchDropdown(false)}
                      className="text-sm text-primary hover:underline"
                    >
                      Browse all stories
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Story of the Week badge */}
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30">
              <Crown className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Story of the Week</span>
            </div>
          </div>

          {storyOfTheWeek ? (
            <div className="grid lg:grid-cols-[1fr,280px] gap-6 lg:gap-8 items-center">
              {/* Story info */}
              <div className="order-2 lg:order-1">
                <p className="text-xs text-primary font-medium mb-1">{storyOfTheWeek.genre}</p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-2">
                  {storyOfTheWeek.title}
                </h2>
                <p className="text-sm text-muted-foreground mb-1">
                  by {storyOfTheWeek.author_name}
                </p>
                
                {/* Stats row */}
                <div className="flex items-center gap-3 mb-3 text-sm">
                  {(storyOfTheWeek.rating_count || 0) >= 5 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-primary fill-primary" />
                      <span className="font-semibold">{(storyOfTheWeek.avg_rating || storyOfTheWeek.rating)?.toFixed(1)}</span>
                    </div>
                  )}
                  {storyOfTheWeek.total_chapters > 0 && (
                    <>
                      {(storyOfTheWeek.rating_count || 0) >= 5 && <span className="text-muted-foreground">•</span>}
                      <span className="text-muted-foreground">{storyOfTheWeek.total_chapters} Episodes</span>
                    </>
                  )}
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground capitalize">{storyOfTheWeek.status}</span>
                </div>

                {/* Synopsis/Hook - keep it short */}
                <p className="text-sm text-muted-foreground mb-4 max-w-xl line-clamp-2">
                  {storyOfTheWeek.synopsis}
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <Link to={`/novel/${storyOfTheWeek.slug}`}>
                    <Button className="bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 glow w-full sm:w-auto">
                      <Play className="w-4 h-4 mr-2" />
                      Start Reading
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground text-center order-last sm:order-none w-full sm:w-auto sm:hidden">
                    First 3 episodes of every series — free. No card needed.
                  </p>
                  <Link to="/explore">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Explore All Stories
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <p className="hidden sm:block text-sm text-muted-foreground text-center mt-3">
                  First 3 episodes of every series — free. No card needed.
                </p>
              </div>

              {/* Cover image - more compact */}
              <div className="order-1 lg:order-2 relative mx-auto lg:mx-0 max-w-[180px] lg:max-w-[240px]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 rounded-xl blur-xl opacity-30 scale-105" />
                <Link to={`/novel/${storyOfTheWeek.slug}`} className="block relative group">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden border-2 border-primary/20 shadow-xl">
                    <img 
                      src={storyOfTheWeek.cover_image_url || "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=800&h=1200&fit=crop"} 
                      alt={storyOfTheWeek.title}
                      className="w-full h-full object-contain bg-black/50 group-hover:scale-105 transition-transform duration-500"
                      fetchPriority="high"
                      onError={(e) => {
                        e.currentTarget.src = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=800&h=1200&fit=crop";
                      }}
                    />
                    {/* Watermark */}
                    <div className="absolute bottom-12 right-3 opacity-40">
                      <img 
                        src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
                        alt="" 
                        className="w-8 h-8 drop-shadow-lg" 
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ) : (
            // Loading/fallback state
            <div className="text-center py-10">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">Serialized African Teenage fiction. New episodes every week</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xl mx-auto">
                Experience the home of African novels. Subscribe once, read unlimited stories.
              </p>
              <Link to="/explore">
                <Button className="bg-gradient-to-r from-primary to-orange-500">
                  <Play className="w-4 h-4 mr-2" />
                  Start Exploring
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-lg font-bold tracking-wider text-muted-foreground mb-10">
            HOW IT WORKS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-lg font-bold text-white mb-2">Browse</h3>
              <p className="text-sm text-gray-400">
                Explore stories by genre — School Life, Romance, Thriller, Fantasy and more.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">📖</div>
              <h3 className="text-lg font-bold text-white mb-2">Read Free</h3>
              <p className="text-sm text-gray-400">
                Every series starts with 3 free episodes. No signup needed.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">🔓</div>
              <h3 className="text-lg font-bold text-white mb-2">Try Everything</h3>
              <p className="text-sm text-gray-400">
                Sign up free and get 3 full days of unlimited access — no card needed.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-5xl mb-4">💳</div>
              <h3 className="text-lg font-bold text-white mb-2">Subscribe</h3>
              <p className="text-sm text-gray-400">
                Love it? Subscribe from ₦500/week to keep reading forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Continue Reading - For logged-in users with library items */}
      {user && continueReading.length > 0 && (
        <section className="py-8 bg-card/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Continue Reading</h2>
              </div>
              <Link to="/library" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                View Library <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
            </div>

            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-4 pb-2">
                {continueReading.map((item) => {
                  const hasProgress = item.last_read_chapter > 0;
                  const isComplete = item.last_read_chapter >= item.total_chapters;
                  const nextEpisode = hasProgress ? item.last_read_chapter + 1 : 1;
                  const progressPercent = hasProgress ? Math.round((item.last_read_chapter / item.total_chapters) * 100) : 0;
                  
                  return (
                    <Link 
                      key={item.novel_id} 
                      to={isComplete ? `/novel/${item.slug}` : `/read/${item.slug}/${nextEpisode}`}
                      className="group flex-shrink-0 w-[280px] sm:w-[320px]"
                    >
                      <div className="relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:glow-sm">
                        <div className="flex gap-4 p-4">
                          <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                            <img 
                              src={item.cover_image_url || "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=200&h=300&fit=crop"} 
                              alt={item.title}
                              className="w-full h-full object-contain bg-black/50 group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=200&h=300&fit=crop";
                              }}
                            />
                            {hasProgress && !isComplete && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-orange-500"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-2">
                              by {item.author_name}
                            </p>
                            {isComplete ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                                Completed
                              </span>
                            ) : hasProgress ? (
                              <>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                                  Episode {item.last_read_chapter} of {item.total_chapters}
                                </span>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {progressPercent}% complete
                                </p>
                              </>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                                In Library • {item.total_chapters} episodes
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="px-4 pb-4">
                          <div className="w-full py-2 rounded-lg bg-gradient-to-r from-primary/20 to-orange-500/20 text-center text-sm font-medium text-primary group-hover:from-primary group-hover:to-orange-500 group-hover:text-primary-foreground transition-all">
                            {isComplete ? "Read Again" : hasProgress ? `Resume Episode ${nextEpisode}` : "Start Reading"}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Story Rows */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* New This Week */}
          <StoryRow 
            title="New This Week" 
            icon={Sparkles} 
            novels={newThisWeek} 
            accentColor="primary"
          />

          {/* Trending Now */}
          <StoryRow 
            title="Trending Now" 
            icon={Flame} 
            novels={trendingNovels} 
            accentColor="orange"
          />

          {/* Genre Sections */}
          {Object.entries(genreSections).map(([genre, novels]) => (
            <StoryRow 
              key={genre}
              title={genre} 
              icon={BookOpen} 
              novels={novels}
              genreFilter={genre}
            />
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Unlock the Full <span className="text-gradient">Inkseries Experience</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
              One subscription unlocks it all — no limits, no interruptions.
            </p>
            
            {/* Benefits Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-10 sm:mb-14 max-w-5xl mx-auto text-left">
              <div className="bg-background/60 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary/50 transition-colors">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center mb-2 sm:mb-4">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">Unlimited Episodes</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Read as many stories as you want. No episode limits, ever.</p>
              </div>
              
              <div className="bg-background/60 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary/50 transition-colors">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center mb-2 sm:mb-4">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">Offline Reading</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Download episodes and read anywhere — even without internet.</p>
              </div>
              
              <div className="bg-background/60 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary/50 transition-colors">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center mb-2 sm:mb-4">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">100% Ad-Free</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Immerse yourself in stories without any interruptions.</p>
              </div>
              
              <div className="bg-background/60 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-6 hover:border-primary/50 transition-colors">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center mb-2 sm:mb-4">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">Weekly Updates</h3>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Fresh episodes drop every week. Never run out of content.</p>
              </div>
            </div>
            
            {/* Social Proof */}
            <div className="mb-10 sm:mb-14">
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="flex -space-x-2">
                  {['from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-violet-400 to-purple-500', 'from-rose-400 to-pink-500', 'from-sky-400 to-blue-500'].map((gradient, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} border-2 border-background`} />
                  ))}
                </div>
                <div className="text-left ml-2">
                  <p className="font-semibold text-foreground">Join 10,000+ readers</p>
                  <p className="text-xs text-muted-foreground">who love African stories</p>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
                <div className="bg-background/60 border border-border/50 rounded-xl p-4">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 text-primary fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">"Finally, stories that feel like home. I've been waiting for something like this!"</p>
                  <p className="text-xs font-medium">— Chioma A., Lagos</p>
                </div>
                
                <div className="bg-background/60 border border-border/50 rounded-xl p-4">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 text-primary fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">"The weekly episodes keep me hooked. Can't wait for Fridays anymore!"</p>
                  <p className="text-xs font-medium">— Emeka O., Abuja</p>
                </div>
                
                <div className="bg-background/60 border border-border/50 rounded-xl p-4">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} className="w-4 h-4 text-primary fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">"Best investment I've made. My kids love reading now!"</p>
                  <p className="text-xs font-medium">— Mrs. Adebayo, Ibadan</p>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-6">Choose Your Plan</h3>
            
            <div className="inline-flex items-center bg-muted rounded-full p-1 gap-1">
              <button 
                onClick={() => setPlanType("individual")} 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${planType === "individual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Individual
              </button>
              <button 
                onClick={() => setPlanType("family")} 
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${planType === "family" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Family (4 accounts)
              </button>
            </div>
          </div>

          {/* Weekly Plan Entry Banner */}
          <div className="mb-10 max-w-2xl mx-auto">
            <div className="bg-gradient-to-r from-[#F5A623]/10 to-orange-500/10 border-2 border-[#F5A623]/50 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <p className="text-lg sm:text-xl font-semibold mb-2">Not ready to commit?</p>
                <p className="text-2xl sm:text-3xl font-bold text-[#F5A623] mb-4">Try one week for ₦500</p>
                <p className="text-sm text-muted-foreground mb-5">Full access to all content for 7 days. No strings attached.</p>
                <button
                  onClick={() => handleSubscribe("weekly")}
                  className="px-8 py-3 bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Start Weekly Plan
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 max-w-5xl mx-auto grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {currentPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? "border-primary glow" : "border-border/50"}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-gradient-to-r from-primary to-orange-500 text-primary-foreground">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardContent className="p-5 sm:p-6">
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="flex flex-col mb-2">
                    <span className="text-2xl sm:text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.monthlyEquivalent && (
                    <p className="text-sm text-primary font-medium mb-4">{plan.monthlyEquivalent}</p>
                  )}
                  {plan.savings && (
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        {plan.savings}
                      </span>
                    </div>
                  )}
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-[#F5A623] hover:bg-[#E09515] text-black font-semibold" 
                    onClick={() => handleSubscribe(plan.name)} 
                    disabled={subscribing !== null}
                  >
                    {subscribing === plan.name ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {subscribing === plan.name ? "Processing..." : "Get Started"}
                  </Button>
                  {/* Auto-renewal note for weekly/monthly plans */}
                  {(plan.name === "Weekly" || plan.name === "Monthly" || plan.name === "Family Weekly" || plan.name === "Family Monthly") && (
                    <p className="text-[10px] text-zinc-500 mt-2 text-center leading-tight">
                      Auto-renewal requires card payment. Bank/USSD are one-time.
                    </p>
                  )}
                  {/* Refund policy note for one-time plans */}
                  {(plan.name === "3 Months" || plan.name === "6 Months" || plan.name === "Yearly" || plan.name === "Family 3 Months" || plan.name === "Family 6 Months" || plan.name === "Family Annual") && (
                    <p className="text-[10px] text-green-500 mt-2 text-center leading-tight">
                      7-day refund if fewer than 10 episodes read
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <p className="text-muted-foreground">
              Want to gift a subscription?{" "}
              <Link to="/settings" className="text-primary hover:underline font-medium">
                Send a gift card →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Email Capture */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-3xl blur-3xl" />
            <Card className="bg-card/80 backdrop-blur-xl border-border/50">
              <CardContent className="p-8 md:p-12">
                <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Be the First to Read "The Laundry Boy"
                </h2>
                <p className="text-muted-foreground mb-8">
                  Our most anticipated story drops soon. Sign up to get notified when new episodes go live - plus early access to all new releases.
                </p>
                <form 
                  onSubmit={async e => {
                    e.preventDefault();
                    try {
                      const response = await fetch("/api/early-access", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, source: "homepage" })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        alert("Thanks for signing up! Check your email soon.");
                        setEmail("");
                      } else {
                        alert(data.error || "Something went wrong. Please try again.");
                      }
                    } catch {
                      alert("Something went wrong. Please try again.");
                    }
                  }} 
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                >
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="flex-1 bg-background/50" 
                  />
                  <Button type="submit" className="bg-gradient-to-r from-primary to-orange-500 whitespace-nowrap">
                    Get Early Access
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-4">
                  No spam. Unsubscribe anytime.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Already Subscribed Modal */}
      {showSubscriptionModal && existingSubscription && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-700 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              You Already Have an Active Subscription
            </h3>
            <p className="text-muted-foreground mb-4">
              Your <span className="text-primary font-semibold capitalize">{existingSubscription.planName.replace(/_/g, ' ')}</span> plan is valid until{' '}
              <span className="text-white font-medium">
                {existingSubscription.expiresAt 
                  ? new Date(existingSubscription.expiresAt).toLocaleDateString('en-NG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'your next billing date'}
              </span>.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate("/settings")}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Manage My Subscription
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowSubscriptionModal(false)}
                className="w-full text-muted-foreground"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
