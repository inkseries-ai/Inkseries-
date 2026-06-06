import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { Loader as Loader2, BookOpen, Sparkles } from "lucide-react";

const GENRES = [
  { id: "school-life", label: "School Life & Friendships", icon: "📚" },
  { id: "romance", label: "Romance & First Love", icon: "💕" },
  { id: "family", label: "Family & Identity", icon: "👨‍👩‍👧" },
  { id: "street", label: "Street & Hustle", icon: "🔥" },
  { id: "thriller", label: "Thriller & Mystery", icon: "🔪" },
  { id: "fantasy", label: "African Fantasy & Mythology", icon: "✨" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [displayName, setDisplayName] = useState(user?.google_user_data?.name || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(g => g !== genreId)
        : [...prev, genreId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0) {
      setError("Please select at least one genre you enjoy.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get referral code from localStorage if present
      const storedReferralCode = localStorage.getItem("referral_code");
      
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          displayName: displayName.trim() || user?.google_user_data?.name,
          favoriteGenres: selectedGenres,
          referralCode: storedReferralCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      // Clear the referral code after successful onboarding
      localStorage.removeItem("referral_code");

      // Check for new badges after completing onboarding
      fetch("/api/badges/check", { method: "POST", credentials: "include" });

      navigate("/explore");
    } catch (err) {
      console.error("Onboarding error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-transparent pt-8 pb-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <img 
            src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
            alt="Inkseries" 
            className="w-16 h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold mb-2">Welcome to Inkseries!</h1>
          <p className="text-muted-foreground">
            Let's personalize your reading experience
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 -mt-8">
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-8">
          {/* Display Name */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <Sparkles className="w-4 h-4 text-primary" />
              What should we call you?
            </Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="h-12"
            />
            <p className="text-sm text-muted-foreground">
              This is how other readers will see you in comments and discussions
            </p>
          </div>

          {/* Favorite Genres */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-medium">
              <BookOpen className="w-4 h-4 text-primary" />
              What genres do you enjoy?
            </Label>
            <p className="text-sm text-muted-foreground">
              Select all that interest you — we'll use this to recommend stories
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedGenres.includes(genre.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl block mb-1">{genre.icon}</span>
                  <span className="text-sm font-medium">{genre.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 text-lg font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Setting up your profile...
              </>
            ) : (
              "Start Reading"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-16" />
    </div>
  );
}
