import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import BirthdayCelebration from "@/react-app/components/BirthdayCelebration";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/react-app/components/ui/tabs";
import { BookOpen, Bookmark, Clock, Star, ArrowRight, Library as LibraryIcon, Loader as Loader2, Trophy, Sparkles, Download, Trash2, Wifi, WifiOff } from "lucide-react";
import { useDownloads, getSubscriptionInfo } from "@/react-app/hooks/useDownloads";

interface LibraryItem {
  id: number;
  novel_id: number;
  title: string;
  slug: string;
  cover_image_url: string;
  genre: string;
  total_chapters: number;
  author_name: string;
  is_bookmarked: number;
  last_read_chapter: number;
  scroll_position: number;
  updated_at: string;
}

export default function LibraryPage() {
  const { user, isPending } = useAuth();
  const [activeTab, setActiveTab] = useState("reading");
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBirthday, setIsBirthday] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [showBirthdayBanner, setShowBirthdayBanner] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { downloads, removeDownload, refreshDownloads } = useDownloads();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch downloads on mount
  useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  // Check subscription status for downloads
  useEffect(() => {
    const checkSubscription = async () => {
      const info = await getSubscriptionInfo();
      setHasActiveSubscription(info.hasActiveSubscription || info.isTrial);
      setCheckingSubscription(false);
    };
    if (user) {
      checkSubscription();
    } else {
      setCheckingSubscription(false);
    }
  }, [user]);

  const handleRemoveDownload = async (novelSlug: string, chapterNumber: number) => {
    await removeDownload(novelSlug, chapterNumber);
  };

  // Check if today is user's birthday
  const checkBirthday = useCallback(async () => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const profile = data.profile;
        setDisplayName(profile?.display_name || "Reader");
        
        if (profile?.birth_date) {
          const today = new Date();
          const birthDate = new Date(profile.birth_date);
          const isSameDay = today.getMonth() === birthDate.getMonth() && 
                           today.getDate() === birthDate.getDate();
          setIsBirthday(isSameDay);
          
          // Check if user dismissed banner today
          const dismissedKey = `birthday_dismissed_${today.toISOString().split('T')[0]}`;
          if (localStorage.getItem(dismissedKey)) {
            setShowBirthdayBanner(false);
          }
        }
      }
    } catch (e) {
      console.error("Failed to check birthday:", e);
    }
  }, [user]);

  const handleDismissBirthday = () => {
    const today = new Date();
    const dismissedKey = `birthday_dismissed_${today.toISOString().split('T')[0]}`;
    localStorage.setItem(dismissedKey, "true");
    setShowBirthdayBanner(false);
  };

  const fetchLibrary = useCallback(async () => {
    if (!user) return;
    
    try {
      const res = await fetch("/api/library", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary(data.library || []);
      }
    } catch (e) {
      console.error("Failed to fetch library:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchLibrary();
      checkBirthday();
      refreshDownloads();
    }
  }, [user, fetchLibrary, checkBirthday, refreshDownloads]);

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

  // Categorize library items
  const readingNow = library.filter(
    (item) => item.last_read_chapter > 0 && item.last_read_chapter < item.total_chapters
  );
  const bookmarked = library.filter(
    (item) => item.last_read_chapter === 0
  );
  const completed = library.filter(
    (item) => item.last_read_chapter > 0 && item.last_read_chapter >= item.total_chapters
  );

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Birthday Celebration */}
          {isBirthday && showBirthdayBanner && (
            <BirthdayCelebration 
              displayName={displayName} 
              onDismiss={handleDismissBirthday} 
            />
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-primary to-orange-500">
                <LibraryIcon className="w-6 h-6 sm:w-8 sm:h-8 text-background" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">My Library</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Your reading collection</p>
              </div>
            </div>
            
            {/* Badges Link */}
            <Link 
              to="/badges"
              className="group flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 hover:border-yellow-500/50 transition-all self-start sm:self-auto"
            >
              <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-yellow-400">
                <Sparkles className="w-3 h-3" />
                <span>Badges</span>
              </div>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Downloads Section - Prominent Card */}
              {downloads.length > 0 && (
                <button
                  onClick={() => setActiveTab("downloads")}
                  className={`w-full mb-6 p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                    activeTab === "downloads"
                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-500"
                      : "bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/30 hover:border-green-500/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Download className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-green-400">Downloaded Episodes</h3>
                      <p className="text-sm text-muted-foreground">{downloads.length} episode{downloads.length !== 1 ? 's' : ''} saved for offline reading</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 transition-colors ${activeTab === "downloads" ? "text-green-400" : "text-muted-foreground"}`} />
                </button>
              )}

              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="bg-muted/50 w-max sm:w-auto">
                  <TabsTrigger value="reading" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 text-xs sm:text-sm">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">Read</span>
                    <span className="hidden sm:inline">Reading Now</span> ({readingNow.length})
                  </TabsTrigger>
                  <TabsTrigger value="bookmarked" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 text-xs sm:text-sm">
                    <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">Saved</span>
                    <span className="hidden sm:inline">Bookmarked</span> ({bookmarked.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 text-xs sm:text-sm">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">Done</span>
                    <span className="hidden sm:inline">Completed</span> ({completed.length})
                  </TabsTrigger>
                  <TabsTrigger value="downloads" className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 text-xs sm:text-sm">
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="sm:hidden">Offline</span>
                    <span className="hidden sm:inline">Downloads</span> ({downloads.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Reading Now */}
              <TabsContent value="reading">
                {readingNow.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {readingNow.map((novel) => {
                      const progress = Math.round((novel.last_read_chapter / novel.total_chapters) * 100);
                      return (
                        <Card key={novel.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                          <CardContent className="p-0">
                            <div className="flex gap-4 p-4">
                              <Link to={`/novel/${novel.slug}`} className="flex-shrink-0">
                                <img
                                  src={novel.cover_image_url}
                                  alt={novel.title}
                                  className="w-20 h-28 object-contain bg-black/50 rounded-lg"
                                />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link to={`/novel/${novel.slug}`}>
                                  <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                                    {novel.title}
                                  </h3>
                                </Link>
                                <p className="text-sm text-muted-foreground mb-2">{novel.author_name || "Unknown"}</p>
                                
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTimeAgo(novel.updated_at)}</span>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Episode {novel.last_read_chapter}/{novel.total_chapters}</span>
                                    <span className="text-primary font-medium">{progress}%</span>
                                  </div>
                                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="px-4 pb-4">
                              <Button asChild size="sm" className="w-full bg-gradient-to-r from-primary to-orange-500">
                                <Link to={`/read/${novel.slug}/${novel.last_read_chapter}`}>
                                  Continue Reading
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No stories in progress"
                    description="Start reading a story and it will appear here"
                  />
                )}
              </TabsContent>

              {/* Bookmarked */}
              <TabsContent value="bookmarked">
                {bookmarked.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {bookmarked.map((novel) => (
                      <Card key={novel.id} className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all">
                        <CardContent className="p-0">
                          <Link to={`/novel/${novel.slug}`} className="block relative aspect-[3/4] overflow-hidden">
                            <img
                              src={novel.cover_image_url}
                              alt={novel.title}
                              className="w-full h-full object-contain bg-black/50 transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                            <div className="absolute top-2 right-2">
                              <Bookmark className="w-5 h-5 text-primary fill-primary" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <span className="text-xs text-primary font-medium">{novel.genre}</span>
                              <h3 className="font-semibold line-clamp-2">{novel.title}</h3>
                              <p className="text-sm text-muted-foreground">{novel.author_name || "Unknown"}</p>
                            </div>
                          </Link>
                          <div className="p-4 pt-2">
                            <div className="flex items-center justify-between text-sm mb-3">
                              <span className="text-muted-foreground">{novel.total_chapters} episodes</span>
                            </div>
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <Link to={`/read/${novel.slug}/1`}>Start Reading</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Bookmark}
                    title="No bookmarks yet"
                    description="Save stories you want to read later"
                  />
                )}
              </TabsContent>

              {/* Completed */}
              <TabsContent value="completed">
                {completed.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completed.map((novel) => (
                      <Card key={novel.id} className="group overflow-hidden border-border/50">
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            <Link to={`/novel/${novel.slug}`} className="flex-shrink-0">
                              <img
                                src={novel.cover_image_url}
                                alt={novel.title}
                                className="w-20 h-28 object-contain bg-black/50 rounded-lg"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={`/novel/${novel.slug}`}>
                                <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                                  {novel.title}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground mb-2">{novel.author_name || "Unknown"}</p>
                              
                              <div className="flex items-center gap-1 mb-2">
                                <Star className="w-4 h-4 text-primary fill-primary" />
                                <span className="text-sm text-primary">Completed</span>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                Finished {formatTimeAgo(novel.updated_at)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {novel.total_chapters} episodes
                              </p>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            <Button asChild variant="outline" size="sm" className="w-full">
                              <Link to={`/read/${novel.slug}/1`}>Read Again</Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Star}
                    title="No completed stories"
                    description="Finished stories will appear here"
                  />
                )}
              </TabsContent>

              {/* Downloads */}
              <TabsContent value="downloads">
                {/* Offline Status Banner */}
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                  isOnline ? "bg-green-500/10 border border-green-500/20" : "bg-amber-500/10 border border-amber-500/20"
                }`}>
                  {isOnline ? (
                    <>
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">You're online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-amber-500">You're offline — downloaded episodes are available</span>
                    </>
                  )}
                </div>

                {/* Subscription Expired Warning */}
                {!checkingSubscription && !hasActiveSubscription && downloads.length > 0 && (
                  <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <Download className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-400 mb-1">Downloads Expired</h4>
                        <p className="text-sm text-red-300/80 mb-3">
                          Your subscription has ended. Renew to access your downloaded episodes offline.
                        </p>
                        <Button asChild size="sm" className="bg-gradient-to-r from-primary to-orange-500">
                          <Link to="/#pricing">Renew Subscription</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {downloads.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {downloads.map((episode) => (
                      <Card key={`${episode.novelSlug}-${episode.chapterNumber}`} className={`group overflow-hidden border-border/50 transition-all ${hasActiveSubscription ? "hover:border-primary/50" : "opacity-60"}`}>
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            <Link to={`/novel/${episode.novelSlug}`} className="flex-shrink-0">
                              <img
                                src={episode.novelCover}
                                alt={episode.novelTitle}
                                className="w-20 h-28 object-contain bg-black/50 rounded-lg"
                              />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link to={`/novel/${episode.novelSlug}`}>
                                <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
                                  {episode.novelTitle}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground mb-1">
                                {episode.seasonTitle 
                                  ? `${episode.seasonTitle}, Episode ${episode.chapterNumber}`
                                  : `Episode ${episode.chapterNumber}`
                                }
                              </p>
                              <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                                {episode.chapterTitle}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Download className="w-3 h-3 text-green-500" />
                                <span>{episode.wordCount?.toLocaleString() || 0} words</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Downloaded {new Date(episode.downloadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="px-4 pb-4 flex gap-2">
                            {hasActiveSubscription ? (
                              <Button asChild size="sm" className="flex-1 bg-gradient-to-r from-primary to-orange-500">
                                <Link to={`/read/${episode.novelSlug}/${episode.chapterNumber}`}>
                                  Read
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                              </Button>
                            ) : (
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                <Link to="/#pricing">
                                  Renew to Read
                                </Link>
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRemoveDownload(episode.novelSlug, episode.chapterNumber)}
                              className="text-red-500 hover:text-red-400 hover:border-red-500/50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Download}
                    title="No downloads yet"
                    description="Download episodes for offline reading while you have an active subscription"
                  />
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button asChild>
        <Link to="/explore">Explore Stories</Link>
      </Button>
    </div>
  );
}
