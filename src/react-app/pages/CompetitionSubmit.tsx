import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Trophy, Lock, Crown, Loader as Loader2, Send, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, BookOpen } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Textarea } from "@/react-app/components/ui/textarea";
import { Label } from "@/react-app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { Checkbox } from "@/react-app/components/ui/checkbox";
import { countWords } from "@/react-app/utils/wordCount";

interface NovelOption {
  id: number;
  title: string;
  author: string;
}

const GENRES = [
  "School Life and Friendships",
  "Romance and First Love",
  "Family and Identity",
  "Street and Hustle",
  "Thriller and Mystery",
  "African Fantasy and Mythology",
];

export default function CompetitionSubmit() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<{
    story_title: string;
    status: string;
    created_at: string;
  } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [novels, setNovels] = useState<NovelOption[]>([]);
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    school_name: "",
    class_year: "",
    age: "",
    // Story 1
    story_title: "",
    genre: "",
    synopsis: "",
    story_content: "",
    // Story 2
    story_2_title: "",
    story_2_genre: "",
    story_2_synopsis: "",
    story_2_content: "",
    // Story 3
    story_3_title: "",
    story_3_genre: "",
    story_3_synopsis: "",
    story_3_content: "",
    // Novel summaries
    novel_1_id: "",
    novel_1_summary: "",
    novel_2_id: "",
    novel_2_summary: "",
    novel_3_id: "",
    novel_3_summary: "",
    is_original_work: false,
    agree_terms: false,
    referral_source: "",
    has_written_before: false,
    // Social media verification
    follows_facebook: false,
    follows_instagram: false,
    follows_tiktok: false,

    follows_whatsapp: false,
  });

  // Check subscription status
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setIsCheckingSubscription(false);
        return;
      }
      
      try {
        // Check if user is admin (admins bypass subscription requirement)
        const adminRes = await fetch("/api/admin/check", { credentials: "include" });
        const adminData = await adminRes.json();
        if (adminData.isAdmin) {
          setIsAdmin(true);
          setIsEligible(true);
        } else {
          const response = await fetch("/api/subscriptions/status");
          const data = await response.json();
          
          const eligiblePlans = ["quarterly", "biannual", "yearly"];
          setIsEligible(data.isActive && eligiblePlans.includes(data.plan));
          setSubscriptionPlan(data.plan);
        }
        
        // Check if already submitted
        const statusRes = await fetch("/api/competition/status");
        const statusData = await statusRes.json();
        setHasSubmitted(statusData.hasSubmitted);
        setExistingSubmission(statusData.submission);
        
        // Pre-fill email from user
        if (user.google_user_data?.email) {
          setFormData(prev => ({
            ...prev,
            email: user.google_user_data?.email || "",
            full_name: user.google_user_data?.name || "",
          }));
        }
      } catch (error) {
        console.error("Error checking eligibility:", error);
      } finally {
        setIsCheckingSubscription(false);
      }
    };
    
    checkEligibility();
  }, [user]);

  // Fetch available novels
  useEffect(() => {
    const fetchNovels = async () => {
      try {
        const response = await fetch("/api/novels");
        const data = await response.json();
        setNovels(data.novels?.map((n: { id: number; title: string; author: string }) => ({
          id: n.id,
          title: n.title,
          author: n.author,
        })) || []);
      } catch (error) {
        console.error("Error fetching novels:", error);
      }
    };
    fetchNovels();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const wordCount = countWords(formData.story_content);
  const wordCount2 = countWords(formData.story_2_content);
  const wordCount3 = countWords(formData.story_3_content);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    
    if (!formData.is_original_work || !formData.agree_terms) {
      setSubmitError("Please confirm this is your original work and agree to the terms.");
      return;
    }

    // Validate social media follows
    if (!formData.follows_facebook || !formData.follows_instagram || !formData.follows_tiktok || !formData.follows_whatsapp) {
      setSubmitError("Please confirm you are following all our social media channels to participate.");
      return;
    }
    
    if (wordCount < 2000) {
      setSubmitError("Story 1 must be at least 2,000 words.");
      return;
    }
    
    if (wordCount2 < 2000) {
      setSubmitError("Story 2 must be at least 2,000 words.");
      return;
    }
    
    if (wordCount3 < 2000) {
      setSubmitError("Story 3 must be at least 2,000 words.");
      return;
    }

    // Validate novel summaries
    if (!formData.novel_1_id || !formData.novel_2_id || !formData.novel_3_id) {
      setSubmitError("Please select 3 novels from Inkseries.");
      return;
    }

    const summary1Words = countWords(formData.novel_1_summary);
    const summary2Words = countWords(formData.novel_2_summary);
    const summary3Words = countWords(formData.novel_3_summary);

    if (summary1Words < 150 || summary1Words > 300) {
      setSubmitError("Novel 1 summary must be between 150-300 words.");
      return;
    }
    if (summary2Words < 150 || summary2Words > 300) {
      setSubmitError("Novel 2 summary must be between 150-300 words.");
      return;
    }
    if (summary3Words < 150 || summary3Words > 300) {
      setSubmitError("Novel 3 summary must be between 150-300 words.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/competition/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          novel_1_id: parseInt(formData.novel_1_id),
          novel_2_id: parseInt(formData.novel_2_id),
          novel_3_id: parseInt(formData.novel_3_id),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Submission failed");
      }
      
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending || isCheckingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
            <Lock className="w-16 h-16 text-zinc-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
            <p className="text-zinc-400 mb-6">
              Please sign in to submit your competition entry.
            </p>
            <Button 
              onClick={() => navigate("/explore")}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Sign In to Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Not eligible (no 3-month+ subscription)
  // TEMPORARILY UNLOCKED FOR TESTING - remove "false &&" to re-enable
  if (!isEligible) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
            <Crown className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Subscription Required</h1>
            <p className="text-zinc-400 mb-4">
              To participate in the Young Writers Challenge, you need an active 3-month, 6-month, or yearly subscription.
            </p>
            {subscriptionPlan === "monthly" && (
              <p className="text-amber-400 text-sm mb-6">
                You currently have a monthly subscription. Please upgrade to a 3-month or longer plan to participate.
              </p>
            )}
            <Link to="/settings">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                Subscribe Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already submitted
  if (hasSubmitted && existingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Already Submitted!</h1>
            <p className="text-zinc-400 mb-6">
              You have already submitted your entry for the Young Writers Challenge.
            </p>
            <div className="bg-zinc-900/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-zinc-300"><strong>Story:</strong> {existingSubmission.story_title}</p>
              <p className="text-zinc-300"><strong>Status:</strong> <span className="capitalize text-amber-400">{existingSubmission.status}</span></p>
              <p className="text-zinc-300"><strong>Submitted:</strong> {new Date(existingSubmission.created_at).toLocaleDateString()}</p>
            </div>
            <Link to="/explore">
              <Button variant="outline" className="border-amber-500/50 text-amber-400">
                Explore Stories
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
        <div className="max-w-2xl mx-auto px-4 py-20">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Submission Received!</h1>
            <p className="text-zinc-400 mb-6">
              Your story has been submitted successfully. Our judges will review all entries and announce winners soon.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <p className="text-amber-400 text-sm">
                Keep an eye on your email for updates about the competition results.
              </p>
            </div>
            <Link to="/explore">
              <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                Continue Reading
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Submission form
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black">
      {/* Hero */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 rounded-full px-4 py-2 mb-6">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-amber-400 text-sm font-medium">Young Writers Challenge 2026</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Submit Your Story
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Share your creative writing and compete for prizes up to ₦500,000
          </p>
          {isAdmin && (
            <p className="text-sm text-amber-400 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2 inline-block">
              Admin Access — subscription requirement bypassed
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold">1</span>
              Personal Information
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name" className="text-zinc-300">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                  placeholder="Your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-zinc-300">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-zinc-300">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                  placeholder="+234..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="age" className="text-zinc-300">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="13"
                  max="19"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                  placeholder="13-19"
                  required
                />
              </div>
              <div>
                <Label htmlFor="school_name" className="text-zinc-300">School Name *</Label>
                <Input
                  id="school_name"
                  value={formData.school_name}
                  onChange={(e) => handleInputChange("school_name", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                  placeholder="Your school name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="class_year" className="text-zinc-300">Class *</Label>
                <Select
                  value={formData.class_year}
                  onValueChange={(value) => handleInputChange("class_year", value)}
                >
                  <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-700 text-white">
                    <SelectValue placeholder="Select your class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SS1">SS1</SelectItem>
                    <SelectItem value="SS2">SS2</SelectItem>
                    <SelectItem value="SS3">SS3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Story 1 */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold">2</span>
              Story 1
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="story_title" className="text-zinc-300">Story Title *</Label>
                  <Input
                    id="story_title"
                    value={formData.story_title}
                    onChange={(e) => handleInputChange("story_title", e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                    placeholder="Enter your story title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="genre" className="text-zinc-300">Genre *</Label>
                  <Select
                    value={formData.genre}
                    onValueChange={(value) => handleInputChange("genre", value)}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="synopsis" className="text-zinc-300">Synopsis (100-200 words) *</Label>
                <Textarea
                  id="synopsis"
                  value={formData.synopsis}
                  onChange={(e) => handleInputChange("synopsis", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[100px]"
                  placeholder="Write a brief summary of your story..."
                  required
                />
                <p className="text-zinc-500 text-sm mt-1">
                  {countWords(formData.synopsis)} words
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="story_content" className="text-zinc-300">Story Content *</Label>
                  <span className={`text-sm ${wordCount >= 2000 ? "text-green-400" : "text-amber-400"}`}>
                    {wordCount.toLocaleString()} words {wordCount < 2000 && "(min. 2,000)"}
                  </span>
                </div>
                <Textarea
                  id="story_content"
                  value={formData.story_content}
                  onChange={(e) => handleInputChange("story_content", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[300px] font-mono text-sm"
                  placeholder="Paste your story here..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Story 2 */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold">3</span>
              Story 2
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="story_2_title" className="text-zinc-300">Story Title *</Label>
                  <Input
                    id="story_2_title"
                    value={formData.story_2_title}
                    onChange={(e) => handleInputChange("story_2_title", e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                    placeholder="Enter your story title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="story_2_genre" className="text-zinc-300">Genre *</Label>
                  <Select
                    value={formData.story_2_genre}
                    onValueChange={(value) => handleInputChange("story_2_genre", value)}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={`s2-${genre}`} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="story_2_synopsis" className="text-zinc-300">Synopsis (100-200 words) *</Label>
                <Textarea
                  id="story_2_synopsis"
                  value={formData.story_2_synopsis}
                  onChange={(e) => handleInputChange("story_2_synopsis", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[100px]"
                  placeholder="Write a brief summary of your story..."
                  required
                />
                <p className="text-zinc-500 text-sm mt-1">
                  {countWords(formData.story_2_synopsis)} words
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="story_2_content" className="text-zinc-300">Story Content *</Label>
                  <span className={`text-sm ${wordCount2 >= 2000 ? "text-green-400" : "text-amber-400"}`}>
                    {wordCount2.toLocaleString()} words {wordCount2 < 2000 && "(min. 2,000)"}
                  </span>
                </div>
                <Textarea
                  id="story_2_content"
                  value={formData.story_2_content}
                  onChange={(e) => handleInputChange("story_2_content", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[300px] font-mono text-sm"
                  placeholder="Paste your story here..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Story 3 */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold">4</span>
              Story 3
            </h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="story_3_title" className="text-zinc-300">Story Title *</Label>
                  <Input
                    id="story_3_title"
                    value={formData.story_3_title}
                    onChange={(e) => handleInputChange("story_3_title", e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                    placeholder="Enter your story title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="story_3_genre" className="text-zinc-300">Genre *</Label>
                  <Select
                    value={formData.story_3_genre}
                    onValueChange={(value) => handleInputChange("story_3_genre", value)}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={`s3-${genre}`} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="story_3_synopsis" className="text-zinc-300">Synopsis (100-200 words) *</Label>
                <Textarea
                  id="story_3_synopsis"
                  value={formData.story_3_synopsis}
                  onChange={(e) => handleInputChange("story_3_synopsis", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[100px]"
                  placeholder="Write a brief summary of your story..."
                  required
                />
                <p className="text-zinc-500 text-sm mt-1">
                  {countWords(formData.story_3_synopsis)} words
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="story_3_content" className="text-zinc-300">Story Content *</Label>
                  <span className={`text-sm ${wordCount3 >= 2000 ? "text-green-400" : "text-amber-400"}`}>
                    {wordCount3.toLocaleString()} words {wordCount3 < 2000 && "(min. 2,000)"}
                  </span>
                </div>
                <Textarea
                  id="story_3_content"
                  value={formData.story_3_content}
                  onChange={(e) => handleInputChange("story_3_content", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[300px] font-mono text-sm"
                  placeholder="Paste your story here..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional Information */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold">5</span>
              Novel Summaries
            </h2>
            <p className="text-zinc-400 mb-6">
              Select 3 novels from Inkseries that you have read and write a brief summary for each (150-300 words).
            </p>
            <div className="space-y-6">
              {/* Novel 1 */}
              <div className="bg-zinc-900/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Novel 1</span>
                </div>
                <div>
                  <Label htmlFor="novel_1_id" className="text-zinc-300">Select Novel *</Label>
                  <Select
                    value={formData.novel_1_id}
                    onValueChange={(value) => handleInputChange("novel_1_id", value)}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Choose a novel you've read" />
                    </SelectTrigger>
                    <SelectContent>
                      {novels.filter(n => 
                        String(n.id) !== formData.novel_2_id && 
                        String(n.id) !== formData.novel_3_id
                      ).map((novel) => (
                        <SelectItem key={`n1-${novel.id}`} value={String(novel.id)}>
                          {novel.title} — {novel.author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="novel_1_summary" className="text-zinc-300">Your Summary *</Label>
                  <Textarea
                    id="novel_1_summary"
                    value={formData.novel_1_summary}
                    onChange={(e) => handleInputChange("novel_1_summary", e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[120px]"
                    placeholder="Write your summary of this novel..."
                  />
                  <p className="text-zinc-500 text-sm mt-1">
                    {countWords(formData.novel_1_summary)} words (150-300 required)
                  </p>
                </div>
              </div>

              {/* Novel 2 */}
              <div className="bg-zinc-900/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Novel 2</span>
                </div>
                <div>
                  <Label htmlFor="novel_2_id" className="text-zinc-300">Select Novel *</Label>
                  <Select
                    value={formData.novel_2_id}
                    onValueChange={(value) => handleInputChange("novel_2_id", value)}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Choose a novel you've read" />
                    </SelectTrigger>
                    <SelectContent>
                      {novels.filter(n => 
                        String(n.id) !== formData.novel_1_id && 
                        String(n.id) !== formData.novel_3_id
                      ).map((novel) => (
                        <SelectItem key={`n2-${novel.id}`} value={String(novel.id)}>
                          {novel.title} — {novel.author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="novel_2_summary" className="text-zinc-300">Your Summary *</Label>
                  <Textarea
                    id="novel_2_summary"
                    value={formData.novel_2_summary}
                    onChange={(e) => handleInputChange("novel_2_summary", e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[120px]"
                    placeholder="Write your summary of this novel..."
                  />
                  <p className="text-zinc-500 text-sm mt-1">
                    {countWords(formData.novel_2_summary)} words (150-300 required)
                  </p>
                </div>
              </div>

              {/* Novel 3 */}
              <div className="bg-zinc-900/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">Novel 3</span>
                </div>
                <div>
                  <Label htmlFor="novel_3_id" className="text-zinc-300">Select Novel *</Label>
                  <Select
                    value={formData.novel_3_id}
                    onValueChange={(value) => handleInputChange("novel_3_id", value)}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-900 border-zinc-700 text-white">
                      <SelectValue placeholder="Choose a novel you've read" />
                    </SelectTrigger>
                    <SelectContent>
                      {novels.filter(n => 
                        String(n.id) !== formData.novel_1_id && 
                        String(n.id) !== formData.novel_2_id
                      ).map((novel) => (
                        <SelectItem key={`n3-${novel.id}`} value={String(novel.id)}>
                          {novel.title} — {novel.author}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="novel_3_summary" className="text-zinc-300">Your Summary *</Label>
                  <Textarea
                    id="novel_3_summary"
                    value={formData.novel_3_summary}
                    onChange={(e) => handleInputChange("novel_3_summary", e.target.value)}
                    className="mt-1 bg-zinc-900 border-zinc-700 text-white min-h-[120px]"
                    placeholder="Write your summary of this novel..."
                  />
                  <p className="text-zinc-500 text-sm mt-1">
                    {countWords(formData.novel_3_summary)} words (150-300 required)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-zinc-600 rounded-full flex items-center justify-center text-white text-sm font-bold">6</span>
              Additional Information (Optional)
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="referral_source" className="text-zinc-300">How did you hear about this competition?</Label>
                <Input
                  id="referral_source"
                  value={formData.referral_source}
                  onChange={(e) => handleInputChange("referral_source", e.target.value)}
                  className="mt-1 bg-zinc-900 border-zinc-700 text-white"
                  placeholder="e.g., School announcement, social media, friend..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_written_before"
                  checked={formData.has_written_before}
                  onCheckedChange={(checked) => handleInputChange("has_written_before", !!checked)}
                />
                <Label htmlFor="has_written_before" className="text-zinc-300 cursor-pointer">
                  I have written stories before
                </Label>
              </div>
            </div>
          </div>

          {/* Social Media Verification */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold">7</span>
              Follow Our Social Media *
            </h2>
            <p className="text-zinc-400 mb-6">
              To participate in the competition, you must follow all our social media channels. Please verify by checking each box below.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-zinc-900/50 rounded-lg p-4">
                <Checkbox
                  id="follows_facebook"
                  checked={formData.follows_facebook}
                  onCheckedChange={(checked) => handleInputChange("follows_facebook", !!checked)}
                />
                <Label htmlFor="follows_facebook" className="text-zinc-300 cursor-pointer flex-1">
                  I follow <a href="https://www.facebook.com/share/18fxZPL6ED/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-medium">Inkseries on Facebook</a>
                </Label>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/50 rounded-lg p-4">
                <Checkbox
                  id="follows_instagram"
                  checked={formData.follows_instagram}
                  onCheckedChange={(checked) => handleInputChange("follows_instagram", !!checked)}
                />
                <Label htmlFor="follows_instagram" className="text-zinc-300 cursor-pointer flex-1">
                  I follow <a href="https://www.instagram.com/inkseriesofficial" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-medium">@inkseriesofficial on Instagram</a>
                </Label>
              </div>
              <div className="flex items-center gap-3 bg-zinc-900/50 rounded-lg p-4">
                <Checkbox
                  id="follows_tiktok"
                  checked={formData.follows_tiktok}
                  onCheckedChange={(checked) => handleInputChange("follows_tiktok", !!checked)}
                />
                <Label htmlFor="follows_tiktok" className="text-zinc-300 cursor-pointer flex-1">
                  I follow <a href="https://www.tiktok.com/@inkseriesofficial" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-medium">@inkseriesofficial on TikTok</a>
                </Label>
              </div>

              <div className="flex items-center gap-3 bg-zinc-900/50 rounded-lg p-4">
                <Checkbox
                  id="follows_whatsapp"
                  checked={formData.follows_whatsapp}
                  onCheckedChange={(checked) => handleInputChange("follows_whatsapp", !!checked)}
                />
                <Label htmlFor="follows_whatsapp" className="text-zinc-300 cursor-pointer flex-1">
                  I have joined the <a href="https://whatsapp.com/channel/0029VbCh1Us0AgW21Kf7rC3v" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline font-medium">Inkseries WhatsApp Channel</a>
                </Label>
              </div>
            </div>
          </div>

          {/* Agreements */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-black text-sm font-bold">8</span>
              Confirmation
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="is_original_work"
                  checked={formData.is_original_work}
                  onCheckedChange={(checked) => handleInputChange("is_original_work", !!checked)}
                  className="mt-1"
                />
                <Label htmlFor="is_original_work" className="text-zinc-300 cursor-pointer">
                  I confirm that this story is my original work and has not been plagiarized or copied from any other source. *
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="agree_terms"
                  checked={formData.agree_terms}
                  onCheckedChange={(checked) => handleInputChange("agree_terms", !!checked)}
                  className="mt-1"
                />
                <Label htmlFor="agree_terms" className="text-zinc-300 cursor-pointer">
                  I agree to the <Link to="/terms" className="text-amber-400 hover:underline">Terms and Conditions</Link> of the competition. *
                </Label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400">{submitError}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.is_original_work || !formData.agree_terms}
              className="bg-amber-500 hover:bg-amber-600 text-black px-12 py-6 text-lg font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Entry
                </>
              )}
            </Button>
          </div>

          {/* Prize Reminder */}
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl p-6 text-center">
            <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Prizes Await!</h3>
            <p className="text-zinc-300">
              1st Place: ₦500,000 • 2nd Place: ₦300,000 • 3rd Place: ₦100,000 • 4th Place: ₦50,000
            </p>
            <p className="text-amber-400 text-sm mt-2">Plus Top 20 finalists get featured on Inkseries!</p>
          </div>
        </form>
      </div>
    </div>
  );
}
