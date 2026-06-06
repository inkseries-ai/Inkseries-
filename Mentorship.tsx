import { useState } from "react";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import {
  PenTool,
  CheckCircle,
  Mail,
  Sparkles,
  BookOpen,
  Users,
  Star,
} from "lucide-react";

export default function MentorshipPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/writer-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-orange-500/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
              <PenTool className="w-4 h-4" />
              For Writers
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Write for
              <span className="block bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent">
                Inkseries
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Inkseries is currently a curated platform. All stories are written and published 
              by the Inkseries editorial team to ensure consistent quality for our teenage readers. 
              We are building toward opening submissions to Nigerian writers in the future.
            </p>

            <Card className="max-w-xl mx-auto bg-card/50 border-border/50">
              <CardContent className="p-6 md:p-8">
                {submitted ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
                    <p className="text-muted-foreground">
                      We'll reach out as soon as writer submissions open.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-6 text-center">
                      If you are a Nigerian writer interested in writing for Inkseries when 
                      submissions open, leave your email below and we will notify you first.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="w-full pl-12 pr-4 py-4 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </div>
                        ) : (
                          "Notify Me When Submissions Open"
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Look For Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What We Look For
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              When submissions open, we'll be looking for writers who can tell 
              compelling stories for Nigerian teenagers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Authentic Voice</h3>
                <p className="text-sm text-muted-foreground">
                  Stories that reflect the real experiences, language, and culture of Nigerian teens.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Engaging Plots</h3>
                <p className="text-sm text-muted-foreground">
                  Serialized stories with hooks that keep readers coming back for more each week.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Relatable Characters</h3>
                <p className="text-sm text-muted-foreground">
                  Characters that teens can see themselves in—their dreams, struggles, and triumphs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Genres Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Genres We Publish
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We focus on genres that resonate with our teenage audience.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {[
              "School Life and Friendships",
              "Romance and First Love",
              "Family and Identity",
              "Street and Hustle",
              "Thriller and Mystery",
              "African Fantasy and Mythology",
            ].map((genre) => (
              <div
                key={genre}
                className="flex items-center gap-2 px-4 py-2 bg-card/50 border border-border/50 rounded-full"
              >
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{genre}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
