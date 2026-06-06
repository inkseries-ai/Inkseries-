import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Card, CardContent } from "@/react-app/components/ui/card";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import { useAuth } from "@getmocha/users-service/react";
import {
  MessageCircle,
  TrendingUp,
  Users,
  BookOpen,
  AlertTriangle,
  Search,
  Flame,
  Star,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { formatRelativeDate } from "@/react-app/utils/formatDate";

interface RecentComment {
  id: number;
  content: string;
  created_at: string;
  is_spoiler: number;
  chapter_id: number;
  chapter_number: number;
  chapter_title: string;
  novel_id: number;
  novel_title: string;
  novel_slug: string;
  author_name: string;
  author_avatar: string | null;
}

interface ActiveEpisode {
  chapter_id: number;
  chapter_number: number;
  chapter_title: string;
  novel_id: number;
  novel_title: string;
  novel_slug: string;
  cover_image_url: string | null;
  comment_count: number;
}

export default function CommunityPage() {
  useAuth(); // Keep auth context active
  const [searchQuery, setSearchQuery] = useState("");
  const [showSpoilers, setShowSpoilers] = useState(false);
  
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const [activeEpisodes, setActiveEpisodes] = useState<ActiveEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [commentsRes, activeRes] = await Promise.all([
          fetch("/api/community/recent-comments?limit=30"),
          fetch("/api/community/most-active-episodes?limit=3"),
        ]);
        
        const commentsData = await commentsRes.json();
        const activeData = await activeRes.json();
        
        setRecentComments(commentsData.comments || []);
        setActiveEpisodes(activeData.episodes || []);
      } catch (err) {
        console.error("Failed to fetch community data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const getInitials = (name: string | null) => {
    if (!name) return "R";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };
  
  const truncateContent = (content: string, maxWords: number = 50) => {
    const words = content.split(/\s+/);
    if (words.length <= maxWords) return content;
    return words.slice(0, maxWords).join(" ") + "...";
  };
  
  const filteredComments = recentComments.filter((comment) => {
    if (!showSpoilers && comment.is_spoiler === 1) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        comment.novel_title.toLowerCase().includes(query) ||
        comment.content.toLowerCase().includes(query) ||
        comment.author_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Join the Conversation
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent">
                The Inkseries
              </span>{" "}
              <span className="text-white">Community</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              See what readers are saying about their favorite episodes. Jump into 
              the conversation and share your thoughts.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Search & Filters */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search stories, comments, or readers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50 border-border/50"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                  <button
                    onClick={() => setShowSpoilers(!showSpoilers)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
                      showSpoilers
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {showSpoilers ? "Spoilers Visible" : "Show Spoilers"}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Comments Feed */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Latest Episode Comments
              </h2>

              {isLoading ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </CardContent>
                </Card>
              ) : filteredComments.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? "No comments found matching your search." 
                        : "No comments yet. Be the first to share your thoughts on an episode!"}
                    </p>
                    {!searchQuery && (
                      <Link to="/explore">
                        <Button className="mt-4 bg-gradient-to-r from-primary to-orange-500">
                          Browse Stories
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredComments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    getInitials={getInitials}
                    truncateContent={truncateContent}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Most Active This Week */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Most Active This Week
                </h3>
                {activeEpisodes.length > 0 ? (
                  <div className="space-y-4">
                    {activeEpisodes.map((episode, index) => (
                      <Link
                        key={episode.chapter_id}
                        to={`/novel/${episode.novel_slug}/read/${episode.chapter_number}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-primary/10 transition-colors group"
                      >
                        <div className="relative flex-shrink-0">
                          {episode.cover_image_url ? (
                            <img
                              src={episode.cover_image_url}
                              alt={episode.novel_title}
                              className="w-12 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gradient-to-br from-primary/30 to-orange-500/30 rounded flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          {index === 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                              <Flame className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {episode.novel_title}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            Episode {episode.chapter_number}: {episode.chapter_title || `Episode ${episode.chapter_number}`}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                            <MessageCircle className="w-3 h-3" />
                            <span>{episode.comment_count} comments this week</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0 mt-2" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active discussions this week yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="bg-gradient-to-br from-primary/10 to-amber-500/10 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Community Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Be respectful to fellow readers and authors
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Always mark spoilers appropriately
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    No hate speech or discrimination
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Keep discussions on-topic
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    Report issues to moderators
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CTA to Explore */}
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-10 h-10 mx-auto text-primary mb-3" />
                <h3 className="font-semibold mb-2">Join the Discussion</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start reading to leave comments on your favorite episodes.
                </p>
                <Link to="/explore">
                  <Button className="w-full bg-gradient-to-r from-primary to-orange-500">
                    Browse Stories
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function CommentCard({
  comment,
  getInitials,
  truncateContent,
}: {
  comment: RecentComment;
  getInitials: (name: string | null) => string;
  truncateContent: (content: string, maxWords?: number) => string;
}) {
  return (
    <Link
      to={`/novel/${comment.novel_slug}/read/${comment.chapter_number}`}
      className="block"
    >
      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-all group cursor-pointer">
        <CardContent className="p-5">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                {comment.author_avatar ? (
                  <img src={comment.author_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(comment.author_name)
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">
                    {comment.author_name || "Reader"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(comment.created_at)}
                  </span>
                </div>
                {comment.is_spoiler === 1 && (
                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full flex items-center gap-1 flex-shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    Spoiler
                  </span>
                )}
              </div>

              {/* Story/Episode Info */}
              <div className="flex items-center gap-2 mb-2 text-sm">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  {comment.novel_title}
                </span>
                <span className="text-muted-foreground text-xs">
                  Episode {comment.chapter_number}
                  {comment.chapter_title && `: ${comment.chapter_title}`}
                </span>
              </div>

              {/* Comment Content */}
              <p className="text-foreground/90 text-sm leading-relaxed">
                {comment.is_spoiler === 1 
                  ? <span className="italic text-muted-foreground">[Spoiler hidden - click to view]</span>
                  : truncateContent(comment.content, 50)}
              </p>
              
              {/* Read More */}
              <div className="mt-2 flex items-center gap-1 text-xs text-primary group-hover:underline">
                <span>Read full comment</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
