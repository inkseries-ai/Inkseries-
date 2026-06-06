import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth } from "@getmocha/users-service/react";
import { useNavigationHistory } from "@/react-app/hooks/useNavigationHistory";
import { ArrowLeft, ChevronLeft, Settings, Bookmark, BookmarkCheck, Sun, Moon, Minus, Plus, X, List, Chrome as Home, Loader as Loader2, Share2, Check, Facebook, MessageCircle, Link as LinkIcon, Instagram, Download, CircleCheck as CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { novels as staticNovels, Novel } from "@/react-app/data/novels";
import { formatRelativeDate } from "@/react-app/utils/formatDate";
import { generateChaptersForNovel, Chapter } from "@/react-app/data/chapters";
import { getChapterContent } from "@/react-app/data/chapterContent";

import ChapterComments from "@/react-app/components/ChapterComments";
import ChapterReactions from "@/react-app/components/ChapterReactions";
import { ReadingStreak, useRecordReading } from "@/react-app/components/ReadingStreak";
import SubscribeModal from "@/react-app/components/SubscribeModal";
import WeeklyUpgradePrompt from "@/react-app/components/WeeklyUpgradePrompt";
import { useDownloads, getSubscriptionInfo, canTrialUserDownload, getRemainingTrialDownloads, TRIAL_DOWNLOAD_LIMIT } from "@/react-app/hooks/useDownloads";

type FontFamily = "serif" | "sans" | "mono";
type ChapterFormat = "chapter" | "parts_chapters" | "seasons_episodes" | "books_chapters" | "volumes_chapters";

interface ChapterWithPart extends Chapter {
  partNumber: number;
  seasonId: number | null;
  dbId: number | null;
}

interface SeasonInfo {
  id: number;
  season_number: number;
  title: string;
}

// Helper functions for chapter format labels
function formatChapterLabel(format: ChapterFormat, chapterNum: number, partNum: number = 1): { prefix: string | null; label: string } {
  const numberWords = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  const numWord = partNum <= 10 ? numberWords[partNum] : partNum.toString();
  
  switch (format) {
    case "parts_chapters":
      return { prefix: `Part ${numWord}`, label: `Episode ${chapterNum}` };
    case "seasons_episodes":
      return { prefix: `Season ${partNum}`, label: `Episode ${chapterNum}` };
    case "books_chapters":
      return { prefix: `Book ${numWord}`, label: `Episode ${chapterNum}` };
    case "volumes_chapters":
      return { prefix: `Vol. ${partNum}`, label: `Episode ${chapterNum}` };
    default:
      return { prefix: null, label: `Episode ${chapterNum}` };
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
    default:
      return chapterNum.toString().padStart(2, "0");
  }
}

// Load saved reading preferences
function loadReadingPrefs() {
  try {
    const saved = localStorage.getItem("inkseries-reader-prefs");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { fontSize: 16, fontFamily: "serif", isDarkMode: true, lineHeight: 1.8 };
}

export default function ReaderPage() {
  const { novelId, chapterNum } = useParams();
  const navigate = useNavigate();
  const { goBack } = useNavigationHistory();
  const contentRef = useRef<HTMLDivElement>(null);

  const savedPrefs = loadReadingPrefs();
  const [fontSize, setFontSize] = useState(savedPrefs.fontSize);
  const [fontFamily, setFontFamily] = useState<FontFamily>(savedPrefs.fontFamily);
  const [isDarkMode, setIsDarkMode] = useState(savedPrefs.isDarkMode);
  const [lineHeight, setLineHeight] = useState(savedPrefs.lineHeight || 1.8);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const [linkCopied, setLinkCopied] = useState(false);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<ChapterWithPart[]>([]);
  const [seasons, setSeasons] = useState<SeasonInfo[]>([]);
  const [currentSeason, setCurrentSeason] = useState<SeasonInfo | null>(null);
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [chapterFormat, setChapterFormat] = useState<ChapterFormat>("chapter");
  const [novelDbId, setNovelDbId] = useState<number | null>(null);
  
  const { user, redirectToLogin } = useAuth();
  const { recordReading } = useRecordReading();
  const { isDownloaded, downloadEpisode, removeDownload, getDownloadedEpisode, downloads } = useDownloads();
  
  // Download and subscription state
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [hasTrialOrSubscription, setHasTrialOrSubscription] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [_trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
  const [_trialExpired, setTrialExpired] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloaded" | "downloading">("idle");

  // Check subscription/trial status for premium access and downloads
  useEffect(() => {
    if (user) {
      // Check if admin first (bypass subscription requirement)
      fetch("/api/admin/check", { credentials: "include" })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.isAdmin) {
            setIsSubscriber(true);
            setHasTrialOrSubscription(true);
            setIsTrial(false);
          } else {
            // Check subscription status which includes trial
            fetch("/api/subscriptions/status", { credentials: "include" })
              .then(res => res.ok ? res.json() : null)
              .then(subData => {
                const hasAccess = subData?.isActive || subData?.isTrial;
                setHasTrialOrSubscription(!!hasAccess);
                setIsSubscriber(subData?.isActive && !subData?.isTrial);
                setIsTrial(!!subData?.isTrial);
                setTrialExpiresAt(subData?.trialExpiresAt || null);
                // Check if user had a trial that has expired
                if (subData?.trialExpiresAt && !subData?.isActive && !subData?.isTrial) {
                  setTrialExpired(true);
                }
              })
              .catch(() => {
                setHasTrialOrSubscription(false);
                setIsSubscriber(false);
                setIsTrial(false);
              });
          }
        })
        .catch(() => {
          getSubscriptionInfo().then(info => {
            setIsSubscriber(info.hasActiveSubscription && !info.isTrial);
            setIsTrial(info.isTrial);
          });
        });
    }
  }, [user]);

  // Check if current episode is downloaded
  useEffect(() => {
    const chNum = parseInt(chapterNum || "1", 10);
    if (novelId && chNum) {
      setDownloadStatus(isDownloaded(novelId, chNum) ? "downloaded" : "idle");
    }
  }, [novelId, chapterNum, isDownloaded]);

  // Save reading preferences to localStorage
  useEffect(() => {
    localStorage.setItem("inkseries-reader-prefs", JSON.stringify({
      fontSize, fontFamily, isDarkMode, lineHeight
    }));
  }, [fontSize, fontFamily, isDarkMode, lineHeight]);

  const chapterNumber = parseInt(chapterNum || "1", 10);
  const currentChapter = chapters.find((c) => c.number === chapterNumber);
  const currentPartNumber = currentChapter?.partNumber || 1;

  // Fetch novel and chapters from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Try to find in static data first
      const staticNovel = staticNovels.find((n) => n.id === novelId);
      
      if (staticNovel) {
        setNovel(staticNovel);
        const staticChapters = generateChaptersForNovel(staticNovel.id, staticNovel.chapterCount);
        // Add default partNumber for static chapters
        const chaptersWithPart: ChapterWithPart[] = staticChapters.map(ch => ({ ...ch, partNumber: 1, seasonId: null, dbId: null }));
        setChapters(chaptersWithPart);
        setSeasons([]);
        setCurrentSeason(null);
        const staticContent = getChapterContent(novelId || "", chapterNumber);
        setContent(staticContent);
        setIsLoading(false);
        return;
      }
      
      // Fetch from API for admin-added novels
      try {
        // Fetch novel and chapters list
        const novelRes = await fetch(`/api/novels/${novelId}`);
        if (novelRes.ok) {
          const data = await novelRes.json();
          const apiNovel = data.novel;
          const apiChaptersList = data.chapters || [];
          const apiSeasons: SeasonInfo[] = (data.seasons || []).map((s: { id: number; season_number: number; title: string }) => ({
            id: s.id,
            season_number: s.season_number,
            title: s.title,
          }));
          
          const convertedNovel: Novel = {
            id: apiNovel.slug || apiNovel.id.toString(),
            title: apiNovel.title,
            author: apiNovel.author_name || "Inkseries Author",
            authorAvatar: apiNovel.author_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
            cover: apiNovel.cover_image_url,
            synopsis: apiNovel.synopsis,
            genre: apiNovel.genre,
            tags: [apiNovel.genre],
            status: (apiNovel.status === "hiatus" ? "ongoing" : apiNovel.status) as "ongoing" | "completed" | "new",
            chapterCount: apiChaptersList.length,
            readCount: apiNovel.total_reads || 0,
            rating: apiNovel.avg_rating || apiNovel.rating || 4.5,
            ratingCount: apiNovel.rating_count || 0,
            lastUpdated: formatRelativeDate(apiNovel.updated_at || apiNovel.created_at),
          };
          setNovel(convertedNovel);
          setChapterFormat(apiNovel.chapter_format || "chapter");
          setSeasons(apiSeasons);
          setNovelDbId(apiNovel.id);
          
          // Convert chapters list
          const convertedChapters: ChapterWithPart[] = apiChaptersList.map((ch: { id: number; chapter_number: number; title: string; word_count: number; is_premium: number; published_at: string; scheduled_release_at: string | null; part_number: number; season_id: number | null }) => ({
            id: `ch-${ch.id}`,
            novelId: novelId || "",
            number: ch.chapter_number,
            title: ch.title,
            publishedAt: ch.published_at || new Date().toISOString(),
            wordCount: ch.word_count || 2000,
            isFree: !ch.is_premium,
            partNumber: ch.part_number || 1,
            seasonId: ch.season_id,
            dbId: ch.id,
          }));
          setChapters(convertedChapters);
          
          // Find current chapter and its season
          const currentCh = convertedChapters.find((c: ChapterWithPart) => c.number === chapterNumber);
          if (currentCh?.seasonId) {
            const season = apiSeasons.find((s: SeasonInfo) => s.id === currentCh.seasonId);
            setCurrentSeason(season || null);
          } else {
            setCurrentSeason(null);
          }
          
          // Fetch specific chapter content - add cache-busting for fresh content
          const chapterRes = await fetch(`/api/novels/${novelId}/chapters/${chapterNumber}?_t=${Date.now()}`, {
            credentials: "include",
            headers: { "Cache-Control": "no-cache" }
          });
          if (chapterRes.ok) {
            const chapterData = await chapterRes.json();
            setContent(chapterData.chapter?.content || "Chapter content not available.");
          } else {
            const errorData = await chapterRes.json();
            if (errorData.is_locked) {
              setContent(`This episode will be released on ${new Date(errorData.scheduled_release_at).toLocaleDateString()}.`);
            } else if (errorData.requiresSubscription) {
              // Show subscribe prompt instead of login redirect - works for both logged-in and non-logged-in users
              setContent("__REQUIRES_SUBSCRIPTION__");
            } else {
              setContent(errorData.error || "Chapter not found.");
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch novel data:", error);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
  }, [novelId, chapterNumber]);

  // Record reading activity for streaks
  useEffect(() => {
    if (user && content && !isLoading && currentChapter?.dbId &&
        content !== "__REQUIRES_SUBSCRIPTION__" && 
        !content.includes("will be released")) {
      recordReading(currentChapter.dbId);
    }
  }, [user, content, isLoading, currentChapter?.dbId, recordReading]);

  // Season-aware navigation - filter chapters by current season
  const seasonChapters = currentSeason 
    ? chapters.filter(ch => ch.seasonId === currentSeason.id)
    : chapters;
  
  const currentIndexInSeason = seasonChapters.findIndex(ch => ch.number === chapterNumber);
  const hasPrevInSeason = currentIndexInSeason > 0;
  const hasNextInSeason = currentIndexInSeason < seasonChapters.length - 1 && currentIndexInSeason !== -1;
  const prevChapterInSeason = hasPrevInSeason ? seasonChapters[currentIndexInSeason - 1] : null;
  const nextChapterInSeason = hasNextInSeason ? seasonChapters[currentIndexInSeason + 1] : null;
  
  // Cross-season previous navigation: if at first episode of a season, find last episode of previous season
  const getPreviousEpisode = (): { chapter: ChapterWithPart; season: SeasonInfo | null } | null => {
    // First check within current season
    if (hasPrevInSeason && prevChapterInSeason) {
      return { chapter: prevChapterInSeason, season: currentSeason };
    }
    
    // If at beginning of a season and seasons exist, check previous season
    if (currentSeason && seasons.length > 1) {
      const prevSeason = seasons.find(s => s.season_number === currentSeason.season_number - 1);
      if (prevSeason) {
        // Get chapters from previous season, sorted by chapter number descending to get the last one
        const prevSeasonChapters = chapters
          .filter(ch => ch.seasonId === prevSeason.id)
          .sort((a, b) => b.number - a.number);
        
        if (prevSeasonChapters.length > 0) {
          return { chapter: prevSeasonChapters[0], season: prevSeason };
        }
      }
    }
    
    // For non-season novels, check if there's any previous episode in the full chapters list
    if (!currentSeason) {
      const allChaptersSorted = [...chapters].sort((a, b) => a.number - b.number);
      const currentIdx = allChaptersSorted.findIndex(ch => ch.number === chapterNumber);
      if (currentIdx > 0) {
        return { chapter: allChaptersSorted[currentIdx - 1], season: null };
      }
    }
    
    return null;
  };
  
  const prevEpisodeData = getPreviousEpisode();
  const hasPreviousEpisode = prevEpisodeData !== null;
  const isAtBeginning = !hasPreviousEpisode;
  
  // First 3 chapters are always free regardless of is_premium
  // Users with active trial or subscription can access all premium episodes
  const prevChapterFree = prevEpisodeData?.chapter 
    ? (prevEpisodeData.chapter.number <= 3 || prevEpisodeData.chapter.isFree || hasTrialOrSubscription) 
    : false;
  const nextChapterFree = nextChapterInSeason ? (nextChapterInSeason.number <= 3 || nextChapterInSeason.isFree || hasTrialOrSubscription) : false;

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const element = contentRef.current;
      const scrollTop = window.scrollY - element.offsetTop;
      const scrollHeight = element.scrollHeight - window.innerHeight;
      const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
      setReadingProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save reading progress to API
  const saveProgress = useCallback(async (chapter: number, scrollPos: number) => {
    if (!user || !novelDbId) return;
    try {
      await fetch(`/api/library/${novelDbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          last_read_chapter: chapter,
          scroll_position: Math.round(scrollPos),
        }),
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  }, [user, novelDbId]);

  // Save progress when chapter changes
  useEffect(() => {
    if (user && novelDbId && chapterNumber) {
      saveProgress(chapterNumber, 0);
    }
  }, [user, novelDbId, chapterNumber, saveProgress]);

  // Save immediately when reaching end of chapter (95%+ progress)
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  useEffect(() => {
    if (readingProgress >= 95 && !hasReachedEnd && user && novelDbId) {
      setHasReachedEnd(true);
      saveProgress(chapterNumber, 100);
      // Check for new badges when completing a chapter
      fetch("/api/badges/check", { method: "POST", credentials: "include" });
    }
  }, [readingProgress, hasReachedEnd, user, novelDbId, chapterNumber, saveProgress]);

  // Reset end flag when chapter changes
  useEffect(() => {
    setHasReachedEnd(false);
  }, [chapterNumber]);

  // Share functionality
  const getShareUrl = () => {
    return `${window.location.origin}/read/${novel?.id}/${chapterNumber}`;
  };

  const shareToTikTok = async () => {
    const episodeTitle = currentChapter?.title || "this episode";
    const storyTitle = novel?.title || "this story";
    const caption = `I just finished ${episodeTitle} from ${storyTitle} on Inkseries and I'm not okay 😭 This story is everything. First 3 episodes are completely free — no card needed. inkseries.com 📖 #Inkseries #NigerianStories #AfricanYA #BookTok #NaijaBookTok`;
    
    try {
      await navigator.clipboard.writeText(caption);
      setShareNotification("Caption copied to clipboard. Paste it when you post 📋");
      setTimeout(() => setShareNotification(null), 4000);
      window.open("https://www.tiktok.com/", "_blank");
    } catch (err) {
      console.error("Failed to copy caption:", err);
    }
  };

  const shareToInstagram = async () => {
    const episodeTitle = currentChapter?.title || "this episode";
    const storyTitle = novel?.title || "this story";
    const caption = `Just finished ${episodeTitle} from ${storyTitle} on Inkseries 📖 African teenage fiction that actually sounds like our lives. First 3 episodes free — no card needed. Link in bio. #Inkseries #NigerianStories #AfricanYA #BookTok`;
    
    try {
      await navigator.clipboard.writeText(caption);
      setShareNotification("Caption copied to clipboard. Paste it when you post 📋");
      setTimeout(() => setShareNotification(null), 4000);
      window.open("https://www.instagram.com/", "_blank");
    } catch (err) {
      console.error("Failed to copy caption:", err);
    }
  };

  const shareToFacebook = () => {
    const episodeTitle = currentChapter?.title || "this episode";
    const storyTitle = novel?.title || "this story";
    const message = `Just finished reading ${episodeTitle} from ${storyTitle} on Inkseries 📖 African teenage fiction that actually hits different. Start reading free at inkseries.com — no card needed.`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}&quote=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "width=550,height=420");
  };

  const shareToWhatsApp = () => {
    const episodeTitle = currentChapter?.title || "this episode";
    const storyTitle = novel?.title || "this story";
    const episodeLink = getShareUrl();
    const message = `I just finished ${episodeTitle} from ${storyTitle} on Inkseries and I can't stop reading 😭 First 3 episodes are completely free — no card needed. Read it here: ${episodeLink} 📖`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Handle offline download
  const handleDownload = async () => {
    if (!user) {
      redirectToLogin();
      return;
    }
    
    // Check if trial user has reached download limit
    if (isTrial && !canTrialUserDownload(downloads.length, isTrial)) {
      alert(`Trial users can download up to ${TRIAL_DOWNLOAD_LIMIT} episodes. You've reached this limit. Subscribe for unlimited downloads!`);
      setShowSubscribeModal(true);
      return;
    }
    
    // Non-trial, non-subscriber cannot download
    if (!isSubscriber && !isTrial) {
      setShowSubscribeModal(true);
      return;
    }
    
    if (!novel || !currentChapter || !content) return;
    
    if (downloadStatus === "downloaded") {
      // Remove download
      const removed = await removeDownload(novelId || "", chapterNumber);
      if (removed) {
        setDownloadStatus("idle");
      }
      return;
    }
    
    setDownloadStatus("downloading");
    
    try {
      const success = await downloadEpisode({
        novelSlug: novel.id,
        novelTitle: novel.title,
        novelCover: novel.cover,
        chapterNumber,
        chapterTitle: currentChapter.title,
        content,
        wordCount: currentChapter.wordCount,
        seasonNumber: currentSeason?.season_number,
        seasonTitle: currentSeason?.title,
      });
      
      if (success) {
        setDownloadStatus("downloaded");
      } else {
        setDownloadStatus("idle");
      }
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadStatus("idle");
    }
  };

  // Load offline content if available and offline
  useEffect(() => {
    const loadOfflineContent = async () => {
      if (!navigator.onLine && novelId && chapterNumber) {
        const downloaded = await getDownloadedEpisode(novelId, chapterNumber);
        if (downloaded) {
          setContent(downloaded.content);
        }
      }
    };
    loadOfflineContent();
  }, [novelId, chapterNumber, getDownloadedEpisode]);

  // Save progress periodically and on page leave
  useEffect(() => {
    if (!user || !novelDbId) return;
    
    const saveCurrentProgress = () => {
      saveProgress(chapterNumber, readingProgress);
    };

    // Save every 30 seconds
    const interval = setInterval(saveCurrentProgress, 30000);
    
    // Save when leaving page
    window.addEventListener("beforeunload", saveCurrentProgress);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", saveCurrentProgress);
      saveCurrentProgress(); // Save when navigating away
    };
  }, [user, novelDbId, chapterNumber, readingProgress, saveProgress]);

  // Auto-hide controls when scrolling
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setShowControls(false);
          } else {
            setShowControls(true);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!novel || !currentChapter) {
    // Silently redirect to story page or home instead of showing error
    // This handles back navigation errors on all devices including iOS Safari swipe-back
    const fallbackPath = novelId ? `/novel/${novelId}` : "/";
    navigate(fallbackPath, { replace: true });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fontFamilyClasses: Record<FontFamily, string> = {
    serif: "font-serif",
    sans: "font-sans",
    mono: "font-mono",
  };

  const bgClass = isDarkMode ? "bg-[#1a1a1a]" : "bg-[#f5f1e8]";
  const textClass = isDarkMode ? "text-[#e0e0e0]" : "text-[#2d2d2d]";
  const mutedClass = isDarkMode ? "text-[#888]" : "text-[#666]";

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-300`}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/20 z-50">
        <div
          className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Top Navigation */}
      <header
        className={`fixed top-1 left-0 right-0 z-40 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className={`${bgClass} border-b border-border/20 backdrop-blur-xl`}>
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => goBack()}
                className={`p-2 rounded-lg hover:bg-muted/30 transition-colors ${mutedClass}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <p className="text-sm font-medium line-clamp-1">{novel.title}</p>
                <p className={`text-xs ${mutedClass}`}>
                  {currentSeason ? (
                    <>Season {currentSeason.season_number}: {currentSeason.title} — Episode {chapterNumber}</>
                  ) : (
                    formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).prefix 
                      ? `${formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).prefix}, ${formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).label}` 
                      : formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).label
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowChapterList(true)}
                className={`p-2 rounded-lg hover:bg-muted/30 transition-colors ${mutedClass}`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-2 rounded-lg hover:bg-muted/30 transition-colors ${
                  isBookmarked ? "text-primary" : mutedClass
                }`}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="w-5 h-5" />
                ) : (
                  <Bookmark className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleDownload}
                className={`p-2 rounded-lg hover:bg-muted/30 transition-colors ${
                  downloadStatus === "downloaded" ? "text-green-500" : mutedClass
                }`}
                title={
                  !user ? "Sign in to download" :
                  isTrial ? `Download for offline (${getRemainingTrialDownloads(downloads.length)} of ${TRIAL_DOWNLOAD_LIMIT} remaining)` :
                  !isSubscriber ? "Subscribe to download" :
                  downloadStatus === "downloaded" ? "Remove download" :
                  "Download for offline"
                }
              >
                {downloadStatus === "downloading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : downloadStatus === "downloaded" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg hover:bg-muted/30 transition-colors ${mutedClass}`}
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <div
            className={`relative w-full sm:max-w-md ${bgClass} rounded-t-3xl sm:rounded-2xl p-6 space-y-6 border border-border/20`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reading Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className={`p-2 rounded-lg hover:bg-muted/30 ${mutedClass}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Font Size */}
            <div className="space-y-3">
              <label className={`text-sm ${mutedClass}`}>Font Size</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                  className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="flex-1 text-center font-medium">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                  className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div className="space-y-3">
              <label className={`text-sm ${mutedClass}`}>Font Style</label>
              <div className="grid grid-cols-3 gap-2">
                {(["serif", "sans", "mono"] as const).map((family) => (
                  <button
                    key={family}
                    onClick={() => setFontFamily(family)}
                    className={`p-3 rounded-lg border transition-all ${
                      fontFamily === family
                        ? "border-primary bg-primary/10"
                        : "border-border/30 hover:border-border"
                    } ${fontFamilyClasses[family]}`}
                  >
                    {family === "serif" ? "Serif" : family === "sans" ? "Sans" : "Mono"}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="space-y-3">
              <label className={`text-sm ${mutedClass}`}>Theme</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                    isDarkMode
                      ? "border-primary bg-primary/10"
                      : "border-border/30 hover:border-border"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Dark
                </button>
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                    !isDarkMode
                      ? "border-primary bg-primary/10"
                      : "border-border/30 hover:border-border"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Light
                </button>
              </div>
            </div>

            {/* Line Height */}
            <div className="space-y-3">
              <label className={`text-sm ${mutedClass}`}>Line Spacing</label>
              <div className="grid grid-cols-3 gap-2">
                {([1.5, 1.8, 2.2] as const).map((height) => (
                  <button
                    key={height}
                    onClick={() => setLineHeight(height)}
                    className={`p-3 rounded-lg border transition-all ${
                      lineHeight === height
                        ? "border-primary bg-primary/10"
                        : "border-border/30 hover:border-border"
                    }`}
                  >
                    {height === 1.5 ? "Tight" : height === 1.8 ? "Normal" : "Relaxed"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chapter List Panel */}
      {showChapterList && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowChapterList(false)}
          />
          <div
            className={`relative w-full max-w-sm ${bgClass} border-r border-border/20 overflow-y-auto`}
          >
            <div className="sticky top-0 p-4 border-b border-border/20 flex items-center justify-between bg-inherit">
              <h3 className="font-semibold">
                {currentSeason ? `Season ${currentSeason.season_number}: ${currentSeason.title}` : "Chapters"}
              </h3>
              <button
                onClick={() => setShowChapterList(false)}
                className={`p-2 rounded-lg hover:bg-muted/30 ${mutedClass}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Season selector if multiple seasons exist */}
            {seasons.length > 1 && (
              <div className="p-2 border-b border-border/20">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {seasons.map((season) => (
                    <button
                      key={season.id}
                      onClick={() => setCurrentSeason(season)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        currentSeason?.id === season.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      S{season.season_number}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="p-2">
              {seasonChapters.map((chapter) => {
                const chapterAccessible = chapter.number <= 3 || chapter.isFree || hasTrialOrSubscription;
                return (
                <button
                  key={chapter.id}
                  onClick={() => {
                    if (chapterAccessible) {
                      navigate(`/read/${novel.id}/${chapter.number}`);
                      setShowChapterList(false);
                    }
                  }}
                  disabled={!chapterAccessible}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    chapter.number === chapterNumber
                      ? "bg-primary/20 text-primary"
                      : chapterAccessible
                      ? "hover:bg-muted/30"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {currentSeason 
                        ? `E${chapter.number}: ${chapter.title}`
                        : `${getChapterShortLabel(chapterFormat, chapter.number, chapter.partNumber)}: ${chapter.title}`
                      }
                    </span>
                    {!chapterAccessible && (
                      <span className={`text-xs ${mutedClass}`}>🔒</span>
                    )}
                  </div>
                </button>
              );
              })}
              
              {/* Show other seasons link */}
              {seasons.length > 0 && (
                <Link
                  to={`/novel/${novel.id}`}
                  className={`block w-full text-center p-3 mt-2 rounded-lg text-sm ${mutedClass} hover:bg-muted/30 transition-colors`}
                  onClick={() => setShowChapterList(false)}
                >
                  View all seasons →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 pb-32 px-4">
        <article
          ref={contentRef}
          className={`max-w-2xl mx-auto ${fontFamilyClasses[fontFamily]}`}
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          {/* Chapter Header */}
          <header className="text-center mb-12 pt-8">
            <img 
              src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
              alt="Inkseries" 
              className="w-10 h-10 mx-auto mb-4 opacity-60"
            />
            <p className={`text-sm ${mutedClass} mb-2`}>
              {currentSeason ? (
                <>
                  <span className="font-medium">Season {currentSeason.season_number}: {currentSeason.title}</span>
                  <span className="mx-2">—</span>
                  <span>Episode {chapterNumber}</span>
                </>
              ) : (
                <>
                  {formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).prefix && (
                    <span className="font-medium">{formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).prefix} — </span>
                  )}
                  {formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).label}
                </>
              )}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold">{currentChapter.title}</h1>
            <p className={`text-sm ${mutedClass} mt-4`}>
              {currentChapter.wordCount.toLocaleString()} words • {Math.round(currentChapter.wordCount / 200)} min read
            </p>
          </header>



          {/* Chapter Content */}
          <div className="leading-relaxed sm:leading-loose space-y-6">
            {content === "__REQUIRES_SUBSCRIPTION__" ? (
              // Show subscribe prompt for premium content - different messaging based on user status
              <div className="relative">
                {/* Floating close button */}
                <button
                  onClick={() => goBack()}
                  className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center shadow-lg hover:bg-zinc-800 transition-colors"
                  aria-label="Close and go back"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                
                <div className={`p-8 rounded-2xl border-2 border-primary/50 bg-gradient-to-br ${isDarkMode ? 'from-primary/10 to-orange-500/10' : 'from-amber-50 to-orange-50'}`}>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-orange-500 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-black" />
                    </div>
                    
                    {/* Status 1: Unregistered visitor - Show free trial offer */}
                    {!user && (
                      <>
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          This episode is for subscribers
                        </h3>
                        <p className={`${mutedClass} mb-2`}>
                          You've enjoyed 3 free episodes! Subscribe to unlock this and all other episodes.
                        </p>
                        <p className={`text-sm ${mutedClass} mb-6`}>
                          Start your <span className="text-primary font-semibold">FREE 3-day trial</span> and unlock all episodes instantly. <span className="font-medium">No payment required.</span>
                        </p>
                        <div className="space-y-3">
                          <Button 
                            onClick={() => redirectToLogin()}
                            className="w-full bg-gradient-to-r from-primary to-orange-500 text-black font-bold py-6 text-lg"
                          >
                            Start My Free Trial
                          </Button>
                          <p className={`text-xs ${mutedClass}`}>
                            Already have an account? <button onClick={() => redirectToLogin()} className="text-primary hover:underline">Sign in</button>
                          </p>
                        </div>
                      </>
                    )}
                    
                    {/* Status 3: Expired trial user - Show subscription plans only */}
                    {user && (
                      <>
                        <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Your free trial has ended.
                        </h3>
                        <p className={`${mutedClass} mb-6`}>
                          Subscribe to keep reading. No interruptions. No ads.
                        </p>
                        
                        <div className="grid gap-3 mb-4">
                          <button
                            onClick={() => setShowSubscribeModal(true)}
                            className={`p-4 rounded-xl border ${isDarkMode ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} transition-all text-left`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Weekly</p>
                                <p className={`text-sm ${mutedClass}`}>₦500 for 7 days</p>
                              </div>
                              <span className="text-primary font-medium">→</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setShowSubscribeModal(true)}
                            className={`p-4 rounded-xl border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-all text-left relative`}
                          >
                            <span className="absolute -top-2 left-4 px-2 py-0.5 bg-primary text-black text-xs font-bold rounded">
                              Most Popular
                            </span>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly</p>
                                <p className={`text-sm ${mutedClass}`}>₦1,500/month</p>
                              </div>
                              <span className="text-primary font-medium">→</span>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setShowSubscribeModal(true)}
                            className={`p-4 rounded-xl border ${isDarkMode ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} transition-all text-left`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Family</p>
                                <p className={`text-sm ${mutedClass}`}>₦4,500/month for 4 accounts</p>
                              </div>
                              <span className="text-primary font-medium">→</span>
                            </div>
                          </button>
                        </div>
                        
                        <Button 
                          onClick={() => setShowSubscribeModal(true)}
                          className="w-full bg-gradient-to-r from-primary to-orange-500 text-black font-bold py-6 text-lg"
                        >
                          Choose a Plan →
                        </Button>
                      </>
                    )}
                    
                    {/* Go back link */}
                    <button 
                      onClick={() => goBack()}
                      className={`w-full py-3 mt-3 text-sm ${mutedClass} hover:text-foreground transition-colors flex items-center justify-center gap-2`}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Go back to previous episode
                    </button>
                  </div>
                </div>
              </div>
            ) : content.includes('<p>') || content.includes('<strong>') || content.includes('<em>') || content.includes('<h2>') ? (
              // Render rich text HTML content
              <div 
                className="prose prose-invert max-w-none reader-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              // Render plain text content (legacy)
              content.split(/\n\s*\n|\n/).filter(p => p.trim()).map((paragraph, index) => (
                <p key={index} className="text-left indent-8">
                  {paragraph.trim()}
                </p>
              ))
            )}
          </div>

          {/* End of Chapter */}
          <div className="mt-16 pt-8 border-t border-border/20 text-center">
            <img 
              src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
              alt="Inkseries" 
              className="w-8 h-8 mx-auto mb-4 opacity-40"
            />
            <p className={`text-sm ${mutedClass} mb-6`}>
              {currentSeason 
                ? (hasNextInSeason 
                    ? `End of Episode ${chapterNumber}` 
                    : `End of Season ${currentSeason.season_number}`)
                : `End of ${formatChapterLabel(chapterFormat, chapterNumber, currentPartNumber).label}`
              }
            </p>
            
            {/* Season complete message */}
            {currentSeason && !hasNextInSeason && seasons.length > 1 && (
              <div className={`p-4 rounded-xl border border-border/20 bg-muted/10 mb-6`}>
                <p className="font-medium mb-2">You've completed {currentSeason.title}!</p>
                {(() => {
                  const nextSeason = seasons.find(s => s.season_number === currentSeason.season_number + 1);
                  if (nextSeason) {
                    const nextSeasonFirstEpisode = chapters.find(ch => ch.seasonId === nextSeason.id);
                    return nextSeasonFirstEpisode ? (
                      <Button
                        onClick={() => navigate(`/read/${novel.id}/${nextSeasonFirstEpisode.number}`)}
                        className="bg-gradient-to-r from-primary to-orange-500"
                      >
                        Start Season {nextSeason.season_number} →
                      </Button>
                    ) : null;
                  }
                  return (
                    <p className={`text-sm ${mutedClass}`}>More seasons coming soon!</p>
                  );
                })()}
              </div>
            )}
            
            {/* Episode 3 CTA - shown to non-subscribers after finishing the last free episode */}
            {chapterNumber === 3 && !hasTrialOrSubscription && (
              <div className={`p-8 rounded-2xl border-2 border-primary/50 bg-gradient-to-br ${isDarkMode ? 'from-primary/10 to-orange-500/10' : 'from-amber-50 to-orange-50'} mb-8`}>
                <div className="text-center">
                  {/* Status 1: Unregistered visitors - Show free trial offer */}
                  {!user && (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-orange-500 flex items-center justify-center">
                        <span className="text-3xl">🎉</span>
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        You've Reached the End of Free Episodes!
                      </h3>
                      <p className={`text-sm ${mutedClass} mb-6`}>
                        Start your <span className="text-primary font-semibold">FREE 3-day trial</span> and unlock all episodes instantly. <span className="font-medium">No payment required.</span>
                      </p>
                      <div className="space-y-3">
                        <Button 
                          onClick={() => redirectToLogin()}
                          className="w-full bg-gradient-to-r from-primary to-orange-500 text-black font-bold py-6 text-lg"
                        >
                          Start My Free Trial
                        </Button>
                        <p className={`text-xs ${mutedClass}`}>
                          Plans start at just ₦500/week after trial
                        </p>
                      </div>
                    </>
                  )}

                  {/* Status 3: Logged in user (expired trial or never had one) - Show subscription plans only */}
                  {user && (
                    <>
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-orange-500 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-black" />
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Subscribe to Keep Reading
                      </h3>
                      <p className={`${mutedClass} mb-6`}>
                        Choose a plan to unlock all episodes. No interruptions. No ads.
                      </p>
                      
                      <div className="grid gap-3 mb-4">
                        <button
                          onClick={() => setShowSubscribeModal(true)}
                          className={`p-4 rounded-xl border ${isDarkMode ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} transition-all text-left`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Weekly</p>
                              <p className={`text-sm ${mutedClass}`}>₦500 for 7 days</p>
                            </div>
                            <span className="text-primary font-medium">→</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setShowSubscribeModal(true)}
                          className={`p-4 rounded-xl border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-all text-left relative`}
                        >
                          <span className="absolute -top-2 left-4 px-2 py-0.5 bg-primary text-black text-xs font-bold rounded">
                            Most Popular
                          </span>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Monthly</p>
                              <p className={`text-sm ${mutedClass}`}>₦1,500/month</p>
                            </div>
                            <span className="text-primary font-medium">→</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => setShowSubscribeModal(true)}
                          className={`p-4 rounded-xl border ${isDarkMode ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'} transition-all text-left`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Family</p>
                              <p className={`text-sm ${mutedClass}`}>₦4,500/month for 4 accounts</p>
                            </div>
                            <span className="text-primary font-medium">→</span>
                          </div>
                        </button>
                      </div>
                      
                      <Button 
                        onClick={() => setShowSubscribeModal(true)}
                        className="w-full bg-gradient-to-r from-primary to-orange-500 text-black font-bold py-6 text-lg"
                      >
                        View All Plans →
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* "Want to keep reading?" prompt - only for non-subscribers on premium episodes after episode 3 */}
            {hasNextInSeason && !nextChapterFree && chapterNumber !== 3 && !hasTrialOrSubscription && (
              <div className={`p-6 rounded-2xl border border-primary/30 bg-primary/5 mb-6`}>
                <p className="font-medium mb-2">Want to keep reading?</p>
                <p className={`text-sm ${mutedClass} mb-4`}>
                  {!user ? "Sign in to start your free 3-day trial — no payment required" : "Subscribe to unlock all premium episodes"}
                </p>
                <Button 
                  className="bg-gradient-to-r from-primary to-orange-500"
                  onClick={() => !user ? redirectToLogin() : setShowSubscribeModal(true)}
                >
                  {!user ? "Start My Free Trial" : "Subscribe from ₦500/week"}
                </Button>
              </div>
            )}

            {/* Share Section */}
            <div className="mt-8 mb-6">
              <p className={`text-sm ${mutedClass} mb-4`}>
                <Share2 className="w-4 h-4 inline mr-2" />
                Share this episode
              </p>
              {shareNotification && (
                <div className="mb-4 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-sm text-center animate-pulse">
                  {shareNotification}
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={shareToWhatsApp}
                  className={`p-3 rounded-xl border border-border/30 hover:border-green-500 hover:bg-green-500/10 transition-all ${mutedClass} hover:text-green-500`}
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <button
                  onClick={shareToFacebook}
                  className={`p-3 rounded-xl border border-border/30 hover:border-blue-500 hover:bg-blue-500/10 transition-all ${mutedClass} hover:text-blue-500`}
                  title="Share on Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button
                  onClick={shareToTikTok}
                  className={`p-3 rounded-xl border border-border/30 hover:border-pink-500 hover:bg-pink-500/10 transition-all ${mutedClass} hover:text-pink-500`}
                  title="Share on TikTok"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                </button>
                <button
                  onClick={shareToInstagram}
                  className={`p-3 rounded-xl border border-border/30 hover:border-pink-400 hover:bg-pink-400/10 transition-all ${mutedClass} hover:text-pink-400`}
                  title="Share on Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </button>
                <button
                  onClick={copyLink}
                  className={`p-3 rounded-xl border border-border/30 hover:border-primary hover:bg-primary/10 transition-all ${
                    linkCopied ? "border-green-500 bg-green-500/10 text-green-500" : mutedClass + " hover:text-primary"
                  }`}
                  title={linkCopied ? "Copied!" : "Copy link"}
                >
                  {linkCopied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Reactions Section */}
          <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
            <ChapterReactions
              chapterId={currentChapter?.dbId || 0}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Reading Streak */}
          {user && (
            <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-neutral-800' : 'border-neutral-200'}`}>
              <ReadingStreak compact={false} />
            </div>
          )}

          {/* Comments Section */}
          <ChapterComments 
            chapterId={currentChapter?.dbId || null} 
            isDarkMode={isDarkMode} 
          />

          {/* Next Episode CTA */}
          {hasNextInSeason && nextChapterInSeason && (
            <div className={`mt-12 mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="text-center">
                <p className={`text-sm ${mutedClass} mb-2`}>Up Next</p>
                <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Episode {nextChapterInSeason.number}: {nextChapterInSeason.title}
                </h3>
                {nextChapterFree ? (
                  <Button
                    onClick={() => navigate(`/read/${novel.id}/${nextChapterInSeason.number}`)}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
                  >
                    Continue Reading →
                  </Button>
                ) : !user ? (
                  <Button
                    onClick={() => redirectToLogin()}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
                  >
                    Sign in for Free Trial →
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowSubscribeModal(true)}
                    className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
                  >
                    🔒 Unlock to Continue
                  </Button>
                )}
              </div>
            </div>
          )}
        </article>
      </main>

      {/* Bottom Navigation */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
          showControls ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className={`${bgClass} border-t border-border/20 backdrop-blur-xl`}>
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-center gap-8">
            {/* Previous Button */}
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                disabled={isAtBeginning || !prevChapterFree}
                onClick={() => {
                  if (prevEpisodeData) {
                    navigate(`/read/${novel.id}/${prevEpisodeData.chapter.number}`);
                  }
                }}
                className={`gap-2 ${isAtBeginning || !prevChapterFree ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {prevEpisodeData?.season 
                    ? `S${prevEpisodeData.season.season_number}:E${prevEpisodeData.chapter.number}`
                    : prevEpisodeData?.chapter 
                    ? `Ep ${prevEpisodeData.chapter.number}` 
                    : "Previous"}
                </span>
              </Button>
              {/* Tooltip for first episode */}
              {isAtBeginning && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  This is the first episode
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-800" />
                </div>
              )}
            </div>

            {/* Home Button */}
            <Link to="/" className={`p-2 rounded-lg hover:bg-muted/30 ${mutedClass}`}>
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </nav>


      {/* Subscribe Modal */}
      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        chapterTitle={nextChapterInSeason?.title}
        returnTo={`/read/${novel?.id}/${nextChapterInSeason?.number}`}
      />
      
      <WeeklyUpgradePrompt />
    </div>
  );
}
