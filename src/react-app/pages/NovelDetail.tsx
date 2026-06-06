import { useParams, Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigationHistory } from "@/react-app/hooks/useNavigationHistory";
import { formatRelativeDate } from "@/react-app/utils/formatDate";
import { ArrowLeft, Eye, BookOpen, Clock, Heart, Share2, Lock, Play, Crown, Calendar, Users, Bell, Loader as Loader2, Star, ChevronDown, Copy, Check, MessageCircle, Download, Instagram } from "lucide-react";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import Countdown from "@/react-app/components/Countdown";

import TrialExpiredPopup from "@/react-app/components/TrialExpiredPopup";
import WeeklyUpgradePrompt from "@/react-app/components/WeeklyUpgradePrompt";
import StarRating from "@/react-app/components/StarRating";
import SubscribeModal from "@/react-app/components/SubscribeModal";
import { Button } from "@/react-app/components/ui/button";
import { Badge } from "@/react-app/components/ui/badge";
import { novels as staticNovels, formatReadCount, type Novel } from "@/react-app/data/novels";
import { generateChaptersForNovel } from "@/react-app/data/chapters";

type ChapterFormat = "chapter" | "parts_chapters" | "seasons_episodes" | "books_chapters" | "volumes_chapters";

function getGroupLabel(format: ChapterFormat, partNum: number): string {
  const numberWords = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  const numWord = partNum <= 10 ? numberWords[partNum] : partNum.toString();
  
  switch (format) {
    case "parts_chapters":
      return `Part ${numWord}`;
    case "seasons_episodes":
      return `Season ${partNum}`;
    case "books_chapters":
      return `Book ${numWord}`;
    case "volumes_chapters":
      return `Volume ${partNum}`;
    default:
      return "";
  }
}

function formatChapterLabel(format: ChapterFormat, chapterNum: number, partNum: number = 1): { prefix: string; label: string } {
  switch (format) {
    case "parts_chapters":
      return { prefix: getGroupLabel(format, partNum), label: `Episode ${chapterNum}` };
    case "seasons_episodes":
      return { prefix: getGroupLabel(format, partNum), label: `Episode ${chapterNum}` };
    case "books_chapters":
      return { prefix: getGroupLabel(format, partNum), label: `Episode ${chapterNum}` };
    case "volumes_chapters":
      return { prefix: getGroupLabel(format, partNum), label: `Episode ${chapterNum}` };
    case "chapter":
    default:
      return { prefix: "", label: `Episode ${chapterNum}` };
  }
}

function getChapterShortLabel(format: ChapterFormat, chapterNum: number, partNum: number = 1): string {
  switch (format) {
    case "parts_chapters":
      return `P${partNum}:E${chapterNum}`;
    case "seasons_episodes":
      return `S${partNum}:E${chapterNum}`;
    case "books_chapters":
      return `B${partNum}:E${chapterNum}`;
    case "volumes_chapters":
      return `V${partNum}:E${chapterNum}`;
    case "chapter":
    default:
      return chapterNum.toString().padStart(2, "0");
  }
}

interface ApiChapter {
  id: number;
  chapter_number: number;
  part_number: number;
  season_id: number | null;
  title: string;
  word_count: number | null;
  is_premium: number;
  is_published: number;
  audio_url: string | null;
  published_at: string | null;
  scheduled_release_at: string | null;
  is_locked: boolean;
  preview: string | null;
}

interface ApiSeason {
  id: number;
  season_number: number;
  title: string;
  synopsis: string | null;
  cover_image_url: string | null;
  release_date: string | null;
  episode_count: number;
}

interface ChapterDisplay {
  id: string;
  number: number;
  partNumber: number;
  seasonId: number | null;
  title: string;
  wordCount: number;
  isFree: boolean;
  isLocked: boolean;
  scheduledReleaseAt: string | null;
  publishedAt: string;
  preview?: string;
}

interface SeasonDisplay {
  id: number;
  seasonNumber: number;
  title: string;
  synopsis: string | null;
  coverImageUrl: string | null;
  releaseDate: string | null;
  episodeCount: number;
}

// Chapter row component for reuse in both flat and grouped views
function ChapterRow({ 
  chapter, 
  novel, 
  chapterFormat, 
  formatScheduledDate,
  onLockedClick,
  hasActiveAccess,
}: { 
  chapter: ChapterDisplay; 
  novel: { id: string }; 
  chapterFormat: ChapterFormat;
  formatScheduledDate: (date: string) => string;
  onLockedClick?: (chapterTitle: string, chapterNum: number, chapterDbId?: number) => void;
  hasActiveAccess?: boolean;
}) {
  // First 3 episodes are always free regardless of is_premium
  const isFirstThree = chapter.number <= 3;
  // User can read if: first 3 episodes, OR has active subscription/trial, OR chapter marked free
  const canRead = (isFirstThree || hasActiveAccess || chapter.isFree) && !chapter.isLocked;
  // Premium locked = episode 4+ AND user has no access AND not scheduled
  const isPremiumLocked = !isFirstThree && !hasActiveAccess && !chapter.isFree && !chapter.isLocked;
  
  return (
    <div className="space-y-0">
    <Link
      to={canRead ? `/read/${novel.id}/${chapter.number}` : "#"}
      className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${
        canRead
          ? "border-border/50 hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
          : "border-border/30 bg-muted/20 cursor-pointer hover:border-primary/30 hover:bg-primary/5"
      } ${isPremiumLocked && chapter.preview ? "rounded-b-none border-b-0" : ""}`}
      onClick={(e) => {
        if (!canRead) {
          e.preventDefault();
          if (onLockedClick && !chapter.isLocked) {
            // Premium chapter (not scheduled) - show subscribe modal
            const label = formatChapterLabel(chapterFormat, chapter.number, chapter.partNumber);
            onLockedClick(`${label.label}: ${chapter.title}`, chapter.number, parseInt(chapter.id));
          }
        }
      }}
    >
      {/* Chapter Number */}
      <div className={`w-14 h-12 rounded-lg flex items-center justify-center shrink-0 ${
        chapter.isLocked 
          ? "bg-primary/10 border border-primary/30" 
          : "bg-muted/50"
      }`}>
        {chapter.isLocked ? (
          <Clock className="w-5 h-5 text-primary" />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {getChapterShortLabel(chapterFormat, chapter.number, chapter.partNumber)}
          </span>
        )}
      </div>

      {/* Chapter Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`font-medium line-clamp-2 ${canRead ? "group-hover:text-primary" : ""}`}>
            {formatChapterLabel(chapterFormat, chapter.number, chapter.partNumber).label}: {chapter.title}
          </h3>
          {chapter.isLocked ? (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs shrink-0">
              <Clock className="w-3 h-3 mr-1" />
              Scheduled
            </Badge>
          ) : isFirstThree ? (
            <Badge variant="secondary" className="text-xs shrink-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              Free
            </Badge>
          ) : isPremiumLocked ? (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs shrink-0">
              <Lock className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          ) : null}
        </div>
        
        {/* Locked Episode Info */}
        {chapter.isLocked && chapter.scheduledReleaseAt ? (
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-primary font-medium">
              Releases {formatScheduledDate(chapter.scheduledReleaseAt)}
            </span>
            <span className="text-muted-foreground">•</span>
            <Countdown targetDate={chapter.scheduledReleaseAt} compact />
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {chapter.publishedAt}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {chapter.wordCount.toLocaleString()} words
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {Math.round(chapter.wordCount / 200)} min
            </span>
          </div>
        )}
      </div>

      {/* Read Button */}
      {canRead && (
        <Button variant="ghost" size="sm" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          Read
        </Button>
      )}
    </Link>
    
    {/* Blurred Preview for Premium Locked Chapters */}
    {isPremiumLocked && chapter.preview && (
      <div 
        className="relative px-4 pb-4 pt-2 border border-t-0 border-border/30 bg-muted/10 rounded-b-xl cursor-pointer hover:bg-primary/5 transition-colors"
        onClick={() => {
          if (onLockedClick) {
            const label = formatChapterLabel(chapterFormat, chapter.number, chapter.partNumber);
            onLockedClick(`${label.label}: ${chapter.title}`, chapter.number, parseInt(chapter.id));
          }
        }}
      >
        <div className="relative overflow-hidden">
          <p className="text-sm text-muted-foreground line-clamp-2 blur-[3px] select-none">
            {chapter.preview}
          </p>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-primary font-medium">
          <Crown className="w-3.5 h-3.5" />
          <span>Subscribe to continue reading</span>
        </div>
      </div>
    )}
    </div>
  );
}

export default function NovelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { goBack, getPreviousPath, getPageName } = useNavigationHistory();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterDisplay[]>([]);
  const [seasons, setSeasons] = useState<SeasonDisplay[]>([]);
  const [chapterFormat, setChapterFormat] = useState<ChapterFormat>("chapter");
  const [nextEpisode, setNextEpisode] = useState<{ chapter_number: number; title: string; scheduled_release_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1])); // First season expanded by default
  const [ratingData, setRatingData] = useState<{ average: number; count: number; userRating: number | null }>({
    average: 0,
    count: 0,
    userRating: null,
  });
  const [userProgress, setUserProgress] = useState<{ lastReadChapter: number; isBookmarked: boolean } | null>(null);
  const [novelDbId, setNovelDbId] = useState<number | null>(null);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [lockedChapterTitle, setLockedChapterTitle] = useState<string>("");
  const [lockedChapterNum, setLockedChapterNum] = useState<number>(1);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{ isActive: boolean; isTrial: boolean; trialExpiresAt: string | null }>({ isActive: false, isTrial: false, trialExpiresAt: null });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const [visibleEpisodes, setVisibleEpisodes] = useState(10);
  const { user, redirectToLogin } = useAuth();

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  
  const handleShare = (platform: string) => {
    const storyTitle = novel?.title || 'this story';
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let shareLink = '';
    switch (platform) {
      case 'whatsapp':
        const whatsappText = `🔥 I just found "${storyTitle}" on Inkseries and it's SO good!\n\nYou HAVE to check it out 👇\n${shareUrl}`;
        shareLink = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        break;
      case 'facebook':
        const fbQuote = `🔥 I just found "${storyTitle}" on Inkseries and it's SO good! You HAVE to check it out!`;
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(fbQuote)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
        });
        setShowShareMenu(false);
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const shareToTikTok = () => {
    const storyTitle = novel?.title || 'this story';
    const caption = `🔥 I just found "${storyTitle}" on Inkseries and it's SO good!\n\nYou HAVE to check it out 👇\n${shareUrl}\n\n#Inkseries #NigerianStories #AfricanYA #BookTok #NaijaBookTok`;
    
    navigator.clipboard.writeText(caption).then(() => {
      setShareNotification('Caption copied to clipboard. Paste it when you post 📋');
      setTimeout(() => {
        setShareNotification(null);
        window.open('https://www.tiktok.com/', '_blank');
      }, 4000);
    });
    setShowShareMenu(false);
  };

  const shareToInstagram = () => {
    const storyTitle = novel?.title || 'this story';
    const caption = `🔥 I just found "${storyTitle}" on Inkseries and it's SO good!\n\nYou HAVE to check it out 👇\n${shareUrl}\n\n#Inkseries #NigerianStories #AfricanYA #BookTok`;
    
    navigator.clipboard.writeText(caption).then(() => {
      setShareNotification('Caption copied to clipboard. Paste it when you post 📋');
      setTimeout(() => {
        setShareNotification(null);
        window.open('https://www.instagram.com/', '_blank');
      }, 4000);
    });
    setShowShareMenu(false);
  };

  const handleDownloadCover = async () => {
    if (!novel) return;
    
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Load cover image
      const coverImg = new Image();
      coverImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        coverImg.onload = () => resolve();
        coverImg.onerror = reject;
        coverImg.src = novel.cover;
      });

      // Set canvas size to match cover
      canvas.width = coverImg.naturalWidth;
      canvas.height = coverImg.naturalHeight;

      // Draw cover image
      ctx.drawImage(coverImg, 0, 0);

      // Load and draw logo
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = reject;
        logoImg.src = 'https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png';
      });

      // Calculate logo size and position (bottom-right, similar to UI overlay)
      const logoSize = Math.min(canvas.width, canvas.height) * 0.12;
      const padding = logoSize * 0.4;
      const logoX = canvas.width - logoSize - padding;
      const logoY = canvas.height - logoSize - padding - 30; // Offset for URL text

      // Draw logo with slight opacity
      ctx.globalAlpha = 0.5;
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      ctx.globalAlpha = 1;

      // Add inkseries.com URL text below logo
      const fontSize = Math.max(16, Math.min(canvas.width, canvas.height) * 0.03);
      ctx.font = `bold ${fontSize}px "Source Sans 3", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      const textX = logoX + logoSize / 2;
      const textY = logoY + logoSize + fontSize + 5;
      
      // Add text shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.fillText('inkseries.com', textX, textY);
      ctx.shadowColor = 'transparent';

      // Download as PNG
      const link = document.createElement('a');
      link.download = `${novel.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-cover.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download cover:', error);
      // Fallback: open cover in new tab
      window.open(novel.cover, '_blank');
    }
    
    setShowShareMenu(false);
  };

  const handleLockedClick = (chapterTitle: string, chapterNum: number, _chapterDbId?: number) => {
    if (!user) {
      redirectToLogin();
      return;
    }
    setLockedChapterTitle(chapterTitle);
    setLockedChapterNum(chapterNum);
    setShowSubscribeModal(true);
  };

  const toggleBookmark = async () => {
    if (!user || !novelDbId) return;
    
    setIsTogglingBookmark(true);
    try {
      const newBookmarkState = !userProgress?.isBookmarked;
      const response = await fetch(`/api/library/${novelDbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_bookmarked: newBookmarkState }),
      });
      
      if (response.ok) {
        setUserProgress(prev => prev 
          ? { ...prev, isBookmarked: newBookmarkState }
          : { lastReadChapter: 1, isBookmarked: newBookmarkState }
        );
        // Check for new badges after updating library
        if (newBookmarkState) {
          fetch("/api/badges/check", { method: "POST", credentials: "include" });
        }
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  // Fetch all data in parallel on mount
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setNotFound(false);

    // Helper to load static data
    function loadStaticData() {
      const staticNovel = staticNovels.find((n) => n.id === id);
      if (staticNovel) {
        setNovel(staticNovel);
        const staticChapters = generateChaptersForNovel(staticNovel.id, staticNovel.chapterCount);
        setChapters(staticChapters.map((ch) => ({
          ...ch,
          id: ch.id,
          partNumber: 1,
          seasonId: null,
          isFree: ch.isFree,
          isLocked: false,
          scheduledReleaseAt: null,
          publishedAt: ch.publishedAt,
        })));
        setSeasons([]);
        return true;
      }
      return false;
    }

    // Fetch all data in parallel
    const fetchAllData = async () => {
      const promises: Promise<void>[] = [];
      
      // 1. Novel + chapters (main data) - add cache-busting for fresh content
      const novelPromise = fetch(`/api/novels/${id}?_t=${Date.now()}`, {
        headers: { "Cache-Control": "no-cache" }
      })
        .then(async (response) => {
          if (response.ok) {
            const data = await response.json();
            if (data.novel) {
              const apiNovel = data.novel;
              setChapterFormat((apiNovel.chapter_format as ChapterFormat) || "chapter");
              setNovelDbId(apiNovel.id);
              
              const displayNovel: Novel = {
                id: apiNovel.slug || apiNovel.id.toString(),
                title: apiNovel.title,
                author: apiNovel.author_name || "Unknown Author",
                authorAvatar: apiNovel.author_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
                cover: apiNovel.cover_image_url || "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=400&h=600&fit=crop",
                genre: apiNovel.genre || "Romance and First Love",
                rating: apiNovel.avg_rating || apiNovel.rating || 0,
                ratingCount: apiNovel.rating_count || 0,
                readCount: apiNovel.total_reads || 0,
                chapterCount: apiNovel.total_chapters || 0,
                status: apiNovel.status === "completed" ? "completed" : apiNovel.status === "hiatus" ? "ongoing" : "ongoing",
                synopsis: apiNovel.synopsis || "",
                tags: apiNovel.tags ? (typeof apiNovel.tags === 'string' && apiNovel.tags.startsWith('[') ? JSON.parse(apiNovel.tags) : apiNovel.tags.split(",").map((t: string) => t.trim())) : [],
                lastUpdated: formatRelativeDate(apiNovel.updated_at || apiNovel.created_at),
              };
              setNovel(displayNovel);
              
              const apiChapters: ApiChapter[] = data.chapters || [];
              const displayChapters: ChapterDisplay[] = apiChapters.map((ch) => ({
                id: ch.id.toString(),
                number: ch.chapter_number,
                partNumber: ch.part_number || 1,
                seasonId: ch.season_id,
                title: ch.title,
                wordCount: ch.word_count || 2000,
                isFree: ch.is_premium === 0,
                isLocked: ch.is_locked,
                scheduledReleaseAt: ch.scheduled_release_at,
                publishedAt: formatRelativeDate(ch.published_at),
                preview: ch.preview || undefined,
              }));
              setChapters(displayChapters);
              
              const apiSeasons: ApiSeason[] = data.seasons || [];
              const displaySeasons: SeasonDisplay[] = apiSeasons.map((s) => ({
                id: s.id,
                seasonNumber: s.season_number,
                title: s.title,
                synopsis: s.synopsis,
                coverImageUrl: s.cover_image_url,
                releaseDate: s.release_date,
                episodeCount: s.episode_count,
              }));
              setSeasons(displaySeasons);
              
              if (displaySeasons.length > 0) {
                setExpandedSeasons(new Set([displaySeasons[0].seasonNumber]));
              }
              
              if (data.next_episode_release) {
                const nextCh = displayChapters.find(ch => ch.isLocked);
                if (nextCh) {
                  setNextEpisode({
                    chapter_number: nextCh.number,
                    title: nextCh.title,
                    scheduled_release_at: data.next_episode_release,
                  });
                }
              }
            } else if (!loadStaticData()) {
              setNotFound(true);
            }
          } else if (!loadStaticData()) {
            setNotFound(true);
          }
        })
        .catch(() => {
          if (!loadStaticData()) setNotFound(true);
        });
      promises.push(novelPromise);
      
      // 2. Rating data (independent)
      const ratingPromise = fetch(`/api/novels/${id}/rating`, { credentials: "include" })
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setRatingData(data); })
        .catch(() => {});
      promises.push(ratingPromise);
      
      // 3. User library/progress (if logged in)
      if (user) {
        const libraryPromise = fetch("/api/library", { credentials: "include" })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.library) {
              const libraryEntry = data.library.find((item: { novel_slug: string; last_read_chapter: number | null; is_bookmarked: number }) => 
                item.novel_slug === id
              );
              if (libraryEntry) {
                setUserProgress({
                  lastReadChapter: libraryEntry.last_read_chapter || 1,
                  isBookmarked: libraryEntry.is_bookmarked === 1,
                });
              }
            }
          })
          .catch(() => {});
        promises.push(libraryPromise);
        
        // 4. Subscription status (if logged in)
        const subPromise = fetch("/api/subscriptions/status", { credentials: "include" })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              setSubscriptionStatus({
                isActive: data.isActive,
                isTrial: data.isTrial,
                trialExpiresAt: data.trialExpiresAt,
              });
            }
          })
          .catch(() => {});
        promises.push(subPromise);
      }
      
      await Promise.all(promises);
      setLoading(false);
    };
    
    fetchAllData();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (notFound || !novel) {
    // Silently redirect to homepage instead of showing error
    // This handles back navigation errors on all devices including iOS Safari swipe-back
    navigate("/", { replace: true });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const freeChapters = chapters.filter((c) => c.isFree && !c.isLocked).length;
  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  const formatScheduledDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-NG", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const statusColors = {
    ongoing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    completed: "bg-primary/20 text-primary border-primary/30",
    new: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    coming_soon: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  const statusLabels = {
    ongoing: "Ongoing",
    completed: "Completed",
    new: "New Release",
    coming_soon: "Coming Soon",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <TrialExpiredPopup />
      <WeeklyUpgradePrompt />

      {/* Hero Section with Cover */}
      <section className="pt-20 relative overflow-hidden">
        {/* Background Blur */}
        <div className="absolute inset-0 z-0">
          <img
            src={novel.cover}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover opacity-20 blur-3xl scale-110"
            onError={(e) => {
              e.currentTarget.src = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=400&h=600&fit=crop";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => goBack()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {getPreviousPath() ? `Back to ${getPageName(getPreviousPath()!)}` : "Back to Explore"}
          </button>

          <div className="grid lg:grid-cols-[320px_1fr] gap-8 lg:gap-12">
            {/* Cover & Actions */}
            <div className="space-y-6">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 mx-auto lg:mx-0 max-w-[280px] lg:max-w-none">
                <img
                  src={novel.cover}
                  alt={novel.title}
                  fetchPriority="high"
                  className="w-full h-full object-contain bg-black/50"
                  onError={(e) => {
                    e.currentTarget.src = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=400&h=600&fit=crop";
                  }}
                />
                {/* Watermark */}
                <div className="absolute bottom-4 right-4 opacity-50">
                  <img 
                    src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
                    alt="" 
                    loading="lazy"
                    className="w-10 h-10 drop-shadow-lg"
                  />
                </div>
                <div className="absolute top-3 left-3">
                  <Badge className={`${statusColors[novel.status]} border`}>
                    {statusLabels[novel.status]}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Link to={`/read/${novel.id}/${userProgress ? userProgress.lastReadChapter : 1}`}>
                  <Button className="w-full h-12 bg-gradient-to-r from-primary to-orange-500 hover:opacity-90 text-base font-semibold">
                    <Play className="w-5 h-5 mr-2" />
                    {userProgress && userProgress.lastReadChapter > 1 
                      ? `Continue Reading • Episode ${userProgress.lastReadChapter}`
                      : "Start Reading"
                    }
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-10"
                    onClick={toggleBookmark}
                    disabled={!user || isTogglingBookmark}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${userProgress?.isBookmarked ? "fill-red-500 text-red-500" : ""}`} />
                    {userProgress?.isBookmarked ? "In Library" : "Add to Library"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowShareMenu(!showShareMenu);
                    }}
                  >
                    {linkCopied ? (
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                    ) : (
                      <Share2 className="w-4 h-4 mr-2" />
                    )}
                    {linkCopied ? "Copied!" : "Share"}
                  </Button>
                </div>
                
                {/* Share Dropdown Menu - Portal style for mobile */}
                {showShareMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[100] bg-black/20" 
                      onClick={() => setShowShareMenu(false)}
                    />
                    <div className="fixed left-4 right-4 bottom-4 z-[101] rounded-2xl border border-border bg-card shadow-2xl p-4 sm:absolute sm:left-auto sm:right-0 sm:bottom-auto sm:top-[140px] sm:w-56">
                      <p className="text-sm font-medium text-muted-foreground mb-3 sm:hidden">Share this story</p>
                      <div className="grid grid-cols-6 gap-2 sm:grid-cols-1">
                        <button
                          onClick={() => handleShare('whatsapp')}
                          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <MessageCircle className="w-6 h-6 sm:w-4 sm:h-4 text-green-500" />
                          <span className="text-xs sm:text-sm">WhatsApp</span>
                        </button>
                        <button
                          onClick={() => handleShare('facebook')}
                          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <svg className="w-6 h-6 sm:w-4 sm:h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <span className="text-xs sm:text-sm">Facebook</span>
                        </button>
                        <button
                          onClick={shareToTikTok}
                          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <svg className="w-6 h-6 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                          </svg>
                          <span className="text-xs sm:text-sm">TikTok</span>
                        </button>
                        <button
                          onClick={shareToInstagram}
                          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <Instagram className="w-6 h-6 sm:w-4 sm:h-4 text-pink-400" />
                          <span className="text-xs sm:text-sm">Instagram</span>
                        </button>
                        <button
                          onClick={() => handleShare('copy')}
                          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <Copy className="w-6 h-6 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">Copy</span>
                        </button>
                        <button
                          onClick={handleDownloadCover}
                          className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-lg text-sm hover:bg-muted transition-colors"
                        >
                          <Download className="w-6 h-6 sm:w-4 sm:h-4 text-primary" />
                          <span className="text-xs sm:text-sm">Cover</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                {/* Share notification toast */}
                {shareNotification && (
                  <div className="fixed bottom-20 left-4 right-4 sm:bottom-4 sm:left-auto sm:right-4 z-[110] animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      {shareNotification}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Title & Author */}
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">{novel.title}</h1>
                <div className="flex items-center gap-3">
                  <img
                    src={novel.authorAvatar}
                    alt={novel.author}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-border"
                  />
                  <div>
                    <p className="font-medium">{novel.author}</p>
                    <p className="text-sm text-muted-foreground">Author</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 sm:gap-6">
                <StarRating
                  novelSlug={id || ""}
                  initialAverage={ratingData.average || novel.rating}
                  initialCount={ratingData.count}
                  initialUserRating={ratingData.userRating}
                  size="md"
                  showCount={true}
                />
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{formatReadCount(novel.readCount)}</span>
                  <span className="text-muted-foreground text-sm">reads</span>
                </div>
                {novel.chapterCount > 0 && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">{novel.chapterCount}</span>
                    <span className="text-muted-foreground text-sm">episodes</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <span className="font-semibold">{Math.round(totalWords / 200)}</span>
                  <span className="text-muted-foreground text-sm">min read</span>
                </div>
              </div>

              {/* Tags */}
              {novel.tags && novel.tags.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Story Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">{novel.genre}</Badge>
                    {novel.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline"
                        className="bg-muted/50 hover:bg-muted transition-colors"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Synopsis */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Synopsis</h2>
                <p className="text-muted-foreground leading-relaxed">{novel.synopsis}</p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Step into stories where old-school rules meet new-school dreams, where family drama 
                  gets real, and secrets can change everything. Follow teens like you figuring out 
                  love, heartbreak, and who they really are in today's Africa.
                </p>
              </div>

              {/* Subscription CTA */}
              <div className="bg-gradient-to-r from-primary/10 to-orange-500/10 rounded-2xl p-6 border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Unlock all {Math.max(0, novel.chapterCount - freeChapters)} premium episodes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {!user 
                        ? "Start your FREE 3-day trial — no payment required" 
                        : "Subscribe to Inkseries and get unlimited access to this story and thousands more."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button 
                        className="bg-gradient-to-r from-primary to-orange-500"
                        onClick={() => !user ? redirectToLogin() : setShowSubscribeModal(true)}
                      >
                        {!user ? "Start My Free Trial" : "Subscribe from ₦500/week"}
                      </Button>
                      {user && <span className="text-sm text-muted-foreground">or ₦14,400/year (save 20%)</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter List */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Next Episode Countdown Banner */}
          {nextEpisode && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-orange-500/10 to-primary/10 border border-primary/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Episode</p>
                    <h3 className="font-semibold">
                      {formatChapterLabel(chapterFormat, nextEpisode.chapter_number).prefix && (
                        <span className="text-primary mr-2">{formatChapterLabel(chapterFormat, nextEpisode.chapter_number).prefix}</span>
                      )}
                      {formatChapterLabel(chapterFormat, nextEpisode.chapter_number).label}: {nextEpisode.title}
                    </h3>
                  </div>
                </div>
                <Countdown 
                  targetDate={nextEpisode.scheduled_release_at} 
                  label="Releases in"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Episodes <span className="text-muted-foreground font-normal">({chapters.length})</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="text-emerald-400">{freeChapters} free</span> • {chapters.length - freeChapters} premium
            </p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                // If novel has seasons, group episodes by season
                if (seasons.length > 0) {
                  const toggleSeason = (seasonNum: number) => {
                    setExpandedSeasons(prev => {
                      const next = new Set(prev);
                      if (next.has(seasonNum)) {
                        next.delete(seasonNum);
                      } else {
                        next.add(seasonNum);
                      }
                      return next;
                    });
                  };
                  
                  return seasons.map((season) => {
                    const seasonChapters = chapters.filter(ch => ch.seasonId === season.id);
                    const isExpanded = expandedSeasons.has(season.seasonNumber);
                    
                    return (
                      <div key={season.id} className="rounded-2xl border border-border/50 overflow-hidden bg-card/50">
                        {/* Season Header - Clickable */}
                        <button
                          onClick={() => toggleSeason(season.seasonNumber)}
                          className="w-full text-left p-5 flex items-start gap-4 hover:bg-muted/30 transition-colors"
                        >
                          {/* Season Cover or Number Badge */}
                          {season.coverImageUrl ? (
                            <div className="relative w-20 h-28 shrink-0">
                              <img 
                                src={season.coverImageUrl} 
                                alt={season.title}
                                loading="lazy"
                                className="w-full h-full rounded-lg object-contain bg-black/50"
                              />
                              {/* Season badge overlay */}
                              <div className="absolute top-1 left-1 w-7 h-7 rounded-md bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg">
                                <span className="text-xs font-bold text-white">S{season.seasonNumber}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shrink-0">
                              <span className="text-xl font-bold text-white">S{season.seasonNumber}</span>
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-primary border-primary/50">
                                Season {season.seasonNumber}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {season.episodeCount} {season.episodeCount === 1 ? 'episode' : 'episodes'}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg mb-2">{season.title}</h3>
                            {season.synopsis && (
                              <p className="text-sm text-muted-foreground leading-relaxed">{season.synopsis}</p>
                            )}
                            {season.releaseDate && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Released: {new Date(season.releaseDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          
                          {/* Expand/Collapse Icon */}
                          <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </button>
                        
                        {/* Episode List - Collapsible */}
                        {isExpanded && (
                          <div className="border-t border-border/50 p-4 space-y-2 bg-muted/20">
                            {seasonChapters.length > 0 ? (
                              seasonChapters.map((chapter) => (
                                <ChapterRow 
                                  key={chapter.id} 
                                  chapter={chapter} 
                                  novel={novel} 
                                  chapterFormat="seasons_episodes" 
                                  formatScheduledDate={formatScheduledDate}
                                  onLockedClick={handleLockedClick}
                                  hasActiveAccess={subscriptionStatus.isActive || subscriptionStatus.isTrial}
                                />
                              ))
                            ) : (
                              <p className="text-center text-muted-foreground py-4">
                                No episodes in this season yet
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                }
                
                // Fallback: Group chapters by partNumber for grouped formats (no seasons)
                const isGroupedFormat = chapterFormat !== "chapter";
                
                if (!isGroupedFormat) {
                  // Simple flat list for plain chapter format
                  return (
                    <div className="grid gap-2">
                      {chapters.slice(0, visibleEpisodes).map((chapter) => (
                        <ChapterRow key={chapter.id} chapter={chapter} novel={novel} chapterFormat={chapterFormat} formatScheduledDate={formatScheduledDate} onLockedClick={handleLockedClick} hasActiveAccess={subscriptionStatus.isActive || subscriptionStatus.isTrial} />
                      ))}
                    </div>
                  );
                }
                
                // Group chapters by partNumber (with pagination)
                const visibleChapters = chapters.slice(0, visibleEpisodes);
                const grouped = visibleChapters.reduce((acc, chapter) => {
                  const part = chapter.partNumber;
                  if (!acc[part]) acc[part] = [];
                  acc[part].push(chapter);
                  return acc;
                }, {} as Record<number, ChapterDisplay[]>);
                
                const partNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);
                
                return partNumbers.map((partNum) => (
                  <div key={partNum} className="space-y-2">
                    {/* Group Header */}
                    <div className="flex items-center gap-3 py-3 px-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{getGroupLabel(chapterFormat, partNum)}</h3>
                        <p className="text-xs text-muted-foreground">
                          {grouped[partNum].length} episodes
                        </p>
                      </div>
                    </div>
                    {/* Chapters in this group */}
                    <div className="grid gap-2 pl-4 border-l-2 border-primary/20 ml-5">
                      {grouped[partNum].map((chapter) => (
                        <ChapterRow key={chapter.id} chapter={chapter} novel={novel} chapterFormat={chapterFormat} formatScheduledDate={formatScheduledDate} onLockedClick={handleLockedClick} hasActiveAccess={subscriptionStatus.isActive || subscriptionStatus.isTrial} />
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Load More */}
          {chapters.length > visibleEpisodes && (
            <div className="mt-6 text-center">
              <Button 
                variant="outline"
                onClick={() => setVisibleEpisodes(prev => prev + 10)}
              >
                Load more episodes ({chapters.length - visibleEpisodes} remaining)
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Reader Stats */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-6 rounded-2xl bg-background border border-border/50">
              <Users className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold">{formatReadCount(novel.readCount)}</p>
              <p className="text-sm text-muted-foreground">Total Readers</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-background border border-border/50">
              <Star className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold">{ratingData.average || novel.rating}/5.0</p>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-background border border-border/50">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="text-2xl font-bold">{novel.lastUpdated}</p>
              <p className="text-sm text-muted-foreground">Last Updated</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Subscribe Modal */}
      <SubscribeModal 
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        chapterTitle={lockedChapterTitle}
        returnTo={novel ? `/read/${novel.id}/${lockedChapterNum}` : undefined}
      />
    </div>
  );
}
