import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Search, SlidersHorizontal, Sparkles, TrendingUp, Clock, CircleCheck as CheckCircle, Tag, X } from "lucide-react";
import Navbar from "@/react-app/components/Navbar";
import Footer from "@/react-app/components/Footer";
import NovelCard from "@/react-app/components/NovelCard";
import { Button } from "@/react-app/components/ui/button";
import { novels as staticNovels, genres, type Genre, type Novel } from "@/react-app/data/novels";
import { popularTags, allTags } from "@/react-app/data/tags";
import { type Novel as ApiNovel } from "@/react-app/hooks/useApi";
import { useNovelsCache } from "@/react-app/hooks/useNovelsCache";
import { formatRelativeDate } from "@/react-app/utils/formatDate";

type StatusFilter = "all" | "ongoing" | "completed" | "new";

// Convert API novel to static novel format for NovelCard compatibility
function apiToStaticNovel(apiNovel: ApiNovel): Novel {
  return {
    id: apiNovel.slug,
    title: apiNovel.title,
    author: apiNovel.author_name || "Unknown Author",
    authorAvatar: apiNovel.author_avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    cover: apiNovel.cover_image_url || "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=400&h=600&fit=crop",
    genre: apiNovel.genre as Genre || "Romance and First Love",
    rating: apiNovel.avg_rating || apiNovel.rating || 0,
    ratingCount: apiNovel.rating_count || 0,
    readCount: apiNovel.total_reads || 0,
    chapterCount: apiNovel.total_chapters || 0,
    status: apiNovel.status === "completed" ? "completed" : apiNovel.status === "coming_soon" ? "coming_soon" : apiNovel.status === "hiatus" ? "ongoing" : "ongoing",
    synopsis: apiNovel.synopsis || "",
    tags: apiNovel.tags ? (typeof apiNovel.tags === 'string' && apiNovel.tags.startsWith('[') ? JSON.parse(apiNovel.tags) : apiNovel.tags.split(",").map(t => t.trim())) : [],
    lastUpdated: formatRelativeDate(apiNovel.updated_at || apiNovel.created_at),
  } as Novel;
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const genreParam = searchParams.get("genre") || "";
  const searchParam = searchParams.get("search") || "";
  
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedGenre, setSelectedGenre] = useState<Genre>("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "rating">("popular");
  
  // Use cached novels for instant loading
  const { novels: apiNovelsRaw, isLoading } = useNovelsCache();
  const apiNovels = apiNovelsRaw.map(apiToStaticNovel);
  const useStaticData = apiNovelsRaw.length === 0 && !isLoading;

  // Set genre from URL param on mount
  useEffect(() => {
    if (genreParam) {
      // Find matching genre (case-insensitive)
      const matchedGenre = genres.find(g => 
        g.toLowerCase() === genreParam.toLowerCase() || 
        g.toLowerCase().includes(genreParam.toLowerCase())
      );
      if (matchedGenre) {
        setSelectedGenre(matchedGenre);
      }
    }
  }, [genreParam]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearTags = () => setSelectedTags([]);

  // Use API data or static data as fallback
  const novels = useStaticData ? staticNovels : (apiNovels.length > 0 ? apiNovels : staticNovels);

  const filteredNovels = useMemo(() => {
    let result = [...novels];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (novel) =>
          novel.title.toLowerCase().includes(query) ||
          novel.author.toLowerCase().includes(query) ||
          novel.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Genre filter
    if (selectedGenre !== "All") {
      result = result.filter((novel) => novel.genre === selectedGenre);
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((novel) => 
        selectedTags.some(tag => novel.tags.some(t => t.toLowerCase() === tag.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "new") {
        result = result.filter((novel) => (novel as any).isNew);
      } else {
        result = result.filter((novel) => novel.status === statusFilter);
      }
    }

    // Sorting
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.readCount - a.readCount);
        break;
      case "recent":
        result.sort((a, b) => {
          if (a.lastUpdated === "Today") return -1;
          if (b.lastUpdated === "Today") return 1;
          if (a.lastUpdated === "Yesterday") return -1;
          if (b.lastUpdated === "Yesterday") return 1;
          return 0;
        });
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [novels, searchQuery, selectedGenre, selectedTags, statusFilter, sortBy]);

  const statusFilters = [
    { value: "all", label: "All Stories", icon: Sparkles },
    { value: "ongoing", label: "Ongoing", icon: Clock },
    { value: "completed", label: "Completed", icon: CheckCircle },
    { value: "new", label: "New Releases", icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Explore{" "}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                African Stories
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Binge-worthy stories from across Africa. Lagos vibes. Nairobi drama. Accra energy. Joburg hustle.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, author, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-full bg-muted/50 border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {statusFilters.map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={statusFilter === value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(value)}
                className={statusFilter === value ? "bg-gradient-to-r from-primary to-orange-500" : ""}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>

          {/* Genre Tabs */}
          <div className="overflow-x-auto scrollbar-hide pb-2">
            <div className="flex gap-2 justify-start sm:justify-center min-w-max px-4 sm:px-0">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    selectedGenre === genre
                      ? "bg-foreground text-background"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Story Tags Filter */}
          <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Filter by Tags</span>
                {selectedTags.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    {selectedTags.length} selected
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearTags}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="text-xs text-primary hover:underline"
                >
                  {showAllTags ? "Show Less" : "Show All"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? allTags : popularTags).map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground border border-border/50"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{filteredNovels.length}</span> stories found
            </p>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-sm text-muted-foreground focus:text-foreground outline-none cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Updated</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Novel Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] rounded-2xl bg-muted/50 mb-3" />
                  <div className="h-4 bg-muted/50 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredNovels.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredNovels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No stories found</h3>
              <p className="text-muted-foreground text-sm">
                Try adjusting your search or filters to find more stories.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGenre("All");
                  setSelectedTags([]);
                  setStatusFilter("all");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
