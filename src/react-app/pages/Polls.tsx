import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { useAuth } from "@getmocha/users-service/react";
import { Vote, Clock, Users, Trophy, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Flame, Sparkles, Calendar, Loader as Loader2 } from "lucide-react";

interface PollOption {
  id: number;
  option_text: string;
  votes: number;
}

interface Poll {
  id: number;
  novel_id: number | null;
  question: string;
  context: string | null;
  is_spoiler: number;
  is_active: number;
  ends_at: string | null;
  total_votes: number;
  created_at: string;
  novel_title: string | null;
  novel_slug: string | null;
  novel_cover: string | null;
  options: PollOption[];
  userVote: number | null;
}

type TabType = "active" | "completed";

export default function PollsPage() {
  const { user, isPending: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("active");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [votingPollId, setVotingPollId] = useState<number | null>(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch("/api/polls", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPolls(data.polls || []);
      }
    } catch (err) {
      console.error("Failed to fetch polls:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: number, optionId: number) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setVotingPollId(pollId);
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ optionId }),
      });

      if (res.ok) {
        // Refresh polls to get updated counts
        await fetchPolls();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to vote");
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setVotingPollId(null);
    }
  };

  const getTimeRemaining = (endsAt: string | null): string => {
    if (!endsAt) return "Open";
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return "Ending soon";
  };

  const getVotePercentage = (votes: number, total: number): number => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getWinningOption = (poll: Poll): PollOption | null => {
    if (poll.options.length === 0) return null;
    return poll.options.reduce((max, opt) =>
      opt.votes > max.votes ? opt : max
    );
  };

  const activePolls = polls.filter((p) => p.is_active === 1);
  const completedPolls = polls.filter((p) => p.is_active === 0);
  const visiblePolls = activeTab === "active" ? activePolls : completedPolls;
  const filteredPolls = showSpoilers
    ? visiblePolls
    : visiblePolls.filter((p) => !p.is_spoiler);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-amber-500/5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Vote className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Shape the Story
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Story Polls
              </span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-4">
              Your voice matters. Vote on story directions and help shape the
              narratives you love.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                New polls every week
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Tabs & Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2">
            <Button
              variant={activeTab === "active" ? "default" : "outline"}
              onClick={() => setActiveTab("active")}
              className={
                activeTab === "active"
                  ? "bg-primary hover:bg-primary/90"
                  : "border-border/50"
              }
            >
              <Flame className="w-4 h-4 mr-2" />
              Active ({activePolls.length})
            </Button>
            <Button
              variant={activeTab === "completed" ? "default" : "outline"}
              onClick={() => setActiveTab("completed")}
              className={
                activeTab === "completed"
                  ? "bg-primary hover:bg-primary/90"
                  : "border-border/50"
              }
            >
              <Trophy className="w-4 h-4 mr-2" />
              Completed ({completedPolls.length})
            </Button>
          </div>

          {polls.some((p) => p.is_spoiler) && (
            <button
              onClick={() => setShowSpoilers(!showSpoilers)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors ${
                showSpoilers
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              {showSpoilers ? "Spoilers Visible" : "Show Spoilers"}
            </button>
          )}
        </div>

        {/* No Polls State */}
        {filteredPolls.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-12 text-center">
              <Vote className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Polls Available</h3>
              <p className="text-muted-foreground">
                {activeTab === "active"
                  ? "Check back soon for new polls!"
                  : "No completed polls yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Featured Poll */}
            {activeTab === "active" && filteredPolls.length > 0 && (
              <FeaturedPoll
                poll={filteredPolls[0]}
                user={user}
                onVote={handleVote}
                voting={votingPollId === filteredPolls[0].id}
                getTimeRemaining={getTimeRemaining}
                getVotePercentage={getVotePercentage}
                getWinningOption={getWinningOption}
              />
            )}

            {/* Polls Grid */}
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {filteredPolls.slice(activeTab === "active" ? 1 : 0).map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  user={user}
                  onVote={handleVote}
                  voting={votingPollId === poll.id}
                  getTimeRemaining={getTimeRemaining}
                  getVotePercentage={getVotePercentage}
                  getWinningOption={getWinningOption}
                />
              ))}
            </div>
          </>
        )}

        {/* Sign up prompt for non-users */}
        {!user && polls.length > 0 && (
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-amber-500/10 border-primary/30">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Want to Vote?</h3>
              <p className="text-muted-foreground mb-4">
                Sign up for free to participate in polls and shape the stories you love.
              </p>
              <Link to="/login">
                <Button className="bg-primary hover:bg-primary/90">
                  Sign Up to Vote
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <section className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              How{" "}
              <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
                Voting
              </span>{" "}
              Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card/50 border-border/50 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Vote className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Cast Your Vote</h3>
                <p className="text-sm text-muted-foreground">
                  When we face story decisions, we create polls. Your vote helps
                  shape what happens next.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Watch Results</h3>
                <p className="text-sm text-muted-foreground">
                  See real-time results as the community votes. Watch favorites
                  emerge as deadlines approach.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">See It Happen</h3>
                <p className="text-sm text-muted-foreground">
                  The winning choice becomes part of the story. Read the next
                  episode to see your choice come to life.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

interface PollComponentProps {
  poll: Poll;
  user: any;
  onVote: (pollId: number, optionId: number) => void;
  voting: boolean;
  getTimeRemaining: (endsAt: string | null) => string;
  getVotePercentage: (votes: number, total: number) => number;
  getWinningOption: (poll: Poll) => PollOption | null;
}

function FeaturedPoll({
  poll,
  user,
  onVote,
  voting,
  getTimeRemaining,
  getVotePercentage,
  getWinningOption,
}: PollComponentProps) {
  const hasVoted = poll.userVote !== null;
  const winner = getWinningOption(poll);
  const showResults = hasVoted || poll.is_active === 0;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card/50 to-amber-500/10 border-primary/30 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Novel Cover */}
          {poll.novel_cover && (
            <div className="lg:w-64 shrink-0">
              <Link to={`/novel/${poll.novel_slug || poll.novel_id}`}>
                <img
                  src={poll.novel_cover}
                  alt={poll.novel_title || "Story"}
                  className="w-full h-48 lg:h-full object-contain bg-black/50"
                />
              </Link>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Featured Poll
                </span>
              </div>
              {poll.is_spoiler === 1 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Spoiler
                </span>
              )}
            </div>

            {/* Novel Info */}
            {poll.novel_title && (
              <div className="mb-4">
                <Link
                  to={`/novel/${poll.novel_slug || poll.novel_id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                >
                  {poll.novel_title}
                </Link>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-3">{poll.question}</h2>
            {poll.context && (
              <p className="text-muted-foreground mb-6">{poll.context}</p>
            )}

            {/* Options */}
            <div className="space-y-3 mb-6">
              {poll.options.map((option) => (
                <PollOptionButton
                  key={option.id}
                  option={option}
                  poll={poll}
                  user={user}
                  isSelected={poll.userVote === option.id}
                  hasVoted={hasVoted}
                  isWinner={poll.is_active === 0 && winner?.id === option.id}
                  showResults={showResults}
                  onVote={() => onVote(poll.id, option.id)}
                  voting={voting}
                  getVotePercentage={getVotePercentage}
                />
              ))}
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {poll.total_votes.toLocaleString()} votes
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTimeRemaining(poll.ends_at)}
                </span>
              </div>
              {hasVoted && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Vote recorded
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PollCard({
  poll,
  user,
  onVote,
  voting,
  getTimeRemaining,
  getVotePercentage,
  getWinningOption,
}: PollComponentProps) {
  const hasVoted = poll.userVote !== null;
  const winner = getWinningOption(poll);
  const showResults = hasVoted || poll.is_active === 0;

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {poll.novel_cover && (
              <Link to={`/novel/${poll.novel_slug || poll.novel_id}`}>
                <img
                  src={poll.novel_cover}
                  alt={poll.novel_title || "Story"}
                  className="w-12 h-16 object-contain bg-black/50 rounded-lg ring-1 ring-border/50"
                />
              </Link>
            )}
            {poll.novel_title && (
              <div>
                <Link
                  to={`/novel/${poll.novel_slug || poll.novel_id}`}
                  className="font-medium text-foreground hover:text-primary transition-colors text-sm"
                >
                  {poll.novel_title}
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {poll.is_spoiler === 1 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                <AlertTriangle className="w-3 h-3" />
              </span>
            )}
            {poll.is_active === 0 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                <Trophy className="w-3 h-3" />
                Ended
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <h3 className="font-semibold mb-2">{poll.question}</h3>
        {poll.context && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {poll.context}
          </p>
        )}

        {/* Options */}
        <div className="space-y-2 mb-4">
          {poll.options.map((option) => (
            <PollOptionButton
              key={option.id}
              option={option}
              poll={poll}
              user={user}
              isSelected={poll.userVote === option.id}
              hasVoted={hasVoted}
              isWinner={poll.is_active === 0 && winner?.id === option.id}
              showResults={showResults}
              onVote={() => onVote(poll.id, option.id)}
              voting={voting}
              getVotePercentage={getVotePercentage}
              compact
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {poll.total_votes.toLocaleString()} votes
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {getTimeRemaining(poll.ends_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PollOptionButton({
  option,
  poll,
  user,
  isSelected,
  hasVoted,
  isWinner,
  showResults,
  onVote,
  voting,
  getVotePercentage,
  compact = false,
}: {
  option: PollOption;
  poll: Poll;
  user: any;
  isSelected: boolean;
  hasVoted: boolean;
  isWinner: boolean;
  showResults: boolean;
  onVote: () => void;
  voting: boolean;
  getVotePercentage: (votes: number, total: number) => number;
  compact?: boolean;
}) {
  const percentage = getVotePercentage(option.votes, poll.total_votes);
  const canVote = poll.is_active === 1 && !hasVoted && user;

  return (
    <button
      onClick={canVote ? onVote : undefined}
      disabled={!canVote || voting}
      className={`relative w-full text-left rounded-lg border transition-all overflow-hidden ${
        compact ? "p-3" : "p-4"
      } ${
        isSelected
          ? "border-primary bg-primary/10"
          : isWinner
          ? "border-green-500 bg-green-500/10"
          : "border-border/50 hover:border-primary/50 bg-background/50"
      } ${canVote ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Progress Bar */}
      {showResults && (
        <div
          className={`absolute inset-y-0 left-0 transition-all ${
            isSelected
              ? "bg-primary/20"
              : isWinner
              ? "bg-green-500/20"
              : "bg-muted/50"
          }`}
          style={{ width: `${percentage}%` }}
        />
      )}

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Radio Circle */}
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
              isSelected
                ? "border-primary bg-primary"
                : isWinner
                ? "border-green-500 bg-green-500"
                : "border-muted-foreground/50"
            }`}
          >
            {(isSelected || isWinner) && (
              <CheckCircle className="w-3 h-3 text-white" />
            )}
          </div>
          <span
            className={`${compact ? "text-sm" : ""} ${
              isSelected || isWinner ? "font-medium" : ""
            }`}
          >
            {option.option_text}
          </span>
        </div>

        {showResults && (
          <span
            className={`font-semibold shrink-0 ${compact ? "text-sm" : ""} ${
              isSelected
                ? "text-primary"
                : isWinner
                ? "text-green-400"
                : "text-muted-foreground"
            }`}
          >
            {percentage}%
          </span>
        )}
      </div>
    </button>
  );
}
