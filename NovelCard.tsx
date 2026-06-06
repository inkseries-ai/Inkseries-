import { Link } from "react-router";
import { Eye, Star, BookOpen, Tag } from "lucide-react";
import { Badge } from "@/react-app/components/ui/badge";
import type { Novel } from "@/react-app/data/novels";
import { formatReadCount } from "@/react-app/data/novels";

interface NovelCardProps {
  novel: Novel;
}

export default function NovelCard({ novel }: NovelCardProps) {
  const statusColors: Record<string, string> = {
    ongoing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    completed: "bg-primary/20 text-primary border-primary/30",
    new: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    coming_soon: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  const statusLabels: Record<string, string> = {
    ongoing: "Ongoing",
    completed: "Completed",
    new: "New Release",
    coming_soon: "Coming Soon",
  };

  return (
    <Link to={`/novel/${novel.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
        {/* Cover Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={novel.cover}
            alt={novel.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain bg-black/50 transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/novel-cover-placeholder.png?w=400&h=600&fit=crop";
            }}
          />
          {/* Watermark */}
          <div className="absolute bottom-3 right-3 opacity-40">
            <img 
              src="https://019c7e46-a70c-702a-a31e-1ed858d1b13c.mochausercontent.com/favicon.png" 
              alt="" 
              loading="lazy"
              className="w-8 h-8 drop-shadow-lg"
            />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`${statusColors[novel.status]} border text-xs font-medium`}>
              {statusLabels[novel.status]}
            </Badge>
          </div>

          {/* Quick Stats Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formatReadCount(novel.readCount)}
              </span>
              {novel.ratingCount >= 5 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  {novel.rating.toFixed(1)}
                  <span className="text-[10px]">({novel.ratingCount})</span>
                </span>
              )}
              {novel.chapterCount > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {novel.chapterCount} ch
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {novel.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">by {novel.author}</p>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {novel.synopsis}
          </p>

          {/* Story Tags */}
          {novel.tags && novel.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {novel.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded-md bg-primary/10 text-primary border border-primary/20"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
              {novel.tags.length > 2 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-muted text-muted-foreground">
                  +{novel.tags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <Badge variant="secondary" className="text-xs">
              {novel.genre}
            </Badge>
            <span className="text-xs text-muted-foreground">{novel.lastUpdated}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
