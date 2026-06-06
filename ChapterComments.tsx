import { useState, useEffect } from "react";
import { MessageCircle, Send, AlertTriangle, Eye, EyeOff, Loader2, Heart, Reply } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { useAuth } from "@getmocha/users-service/react";

interface Comment {
  id: number;
  content: string;
  is_spoiler: number;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  likes_count: number;
  has_liked: boolean;
  parent_id: number | null;
  reply_to_name?: string | null;
}

interface ChapterCommentsProps {
  chapterId: number | null;
  isDarkMode: boolean;
}

export default function ChapterComments({ chapterId, isDarkMode }: ChapterCommentsProps) {
  const { user, redirectToLogin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [hideSpoilers, setHideSpoilers] = useState(true);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ commentId: number; parentId: number; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [likingComments, setLikingComments] = useState<Set<number>>(new Set());
  const [canComment, setCanComment] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const textClass = isDarkMode ? "text-white" : "text-gray-900";
  const mutedClass = isDarkMode ? "text-gray-400" : "text-gray-500";
  const bgClass = isDarkMode ? "bg-gray-800/50" : "bg-gray-100";
  const inputBgClass = isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300";

  useEffect(() => {
    if (chapterId) {
      fetchComments();
    }
  }, [chapterId]);

  // Check if user can comment (subscriber or trial)
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCanComment(false);
        setCheckingAccess(false);
        return;
      }
      try {
        const res = await fetch("/api/subscriptions/status", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setCanComment(data.isActive || data.isTrial);
        } else {
          setCanComment(false);
        }
      } catch {
        setCanComment(false);
      } finally {
        setCheckingAccess(false);
      }
    };
    checkAccess();
  }, [user]);



  const fetchComments = async () => {
    if (!chapterId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chapters/${chapterId}/comments`, { credentials: "include" });
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !chapterId || isPosting) return;

    setIsPosting(true);
    setError(null);

    try {
      const res = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: newComment.trim(),
          is_spoiler: isSpoiler,
        }),
      });

      if (res.ok) {
        setNewComment("");
        setIsSpoiler(false);
        fetchComments();
        fetch("/api/badges/check", { method: "POST", credentials: "include" });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to post comment");
      }
    } catch {
      setError("Failed to post comment. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !chapterId || isPosting || !replyingTo) return;

    setIsPosting(true);
    setError(null);

    try {
      const res = await fetch(`/api/chapters/${chapterId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: replyingTo.parentId,
          reply_to_name: replyingTo.authorName,
          is_spoiler: false,
        }),
      });

      if (res.ok) {
        setReplyContent("");
        setReplyingTo(null);
        fetchComments();
        fetch("/api/badges/check", { method: "POST", credentials: "include" });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to post reply");
      }
    } catch {
      setError("Failed to post reply. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (commentId: number) => {
    if (!user) {
      redirectToLogin();
      return;
    }

    if (likingComments.has(commentId)) return;

    setLikingComments(prev => new Set(prev).add(commentId));

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { 
                ...c, 
                has_liked: data.liked, 
                likes_count: data.liked ? c.likes_count + 1 : c.likes_count - 1 
              }
            : c
        ));
      }
    } catch (err) {
      console.error("Failed to like comment:", err);
    } finally {
      setLikingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const toggleSpoilerReveal = (commentId: number) => {
    setRevealedSpoilers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Organize comments into threads
  const parentComments = comments.filter(c => !c.parent_id);
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parent_id) {
      if (!acc[c.parent_id]) acc[c.parent_id] = [];
      acc[c.parent_id].push(c);
    }
    return acc;
  }, {} as Record<number, Comment[]>);

  const visibleParentComments = hideSpoilers 
    ? parentComments.filter(c => !c.is_spoiler || revealedSpoilers.has(c.id))
    : parentComments;

  const spoilerCount = comments.filter(c => c.is_spoiler && !c.parent_id).length;

  if (!chapterId) return null;

  const CommentItem = ({ comment, isReply = false, parentCommentId }: { comment: Comment; isReply?: boolean; parentCommentId?: number }) => {
    const replies = repliesByParent[comment.id] || [];
    const actualParentId = parentCommentId || comment.id;

    const startReply = () => {
      if (replyingTo?.commentId === comment.id) {
        setReplyingTo(null);
        setReplyContent("");
      } else {
        setReplyingTo({
          commentId: comment.id,
          parentId: actualParentId,
          authorName: comment.author_name || "Reader"
        });
        setReplyContent("");
      }
    };

    return (
      <div className={isReply ? "ml-12 mt-3" : ""}>
        <div
          className={`rounded-xl p-4 ${bgClass} ${comment.is_spoiler && !revealedSpoilers.has(comment.id) && !isReply ? "relative" : ""}`}
        >
          {/* Spoiler overlay */}
          {comment.is_spoiler && !revealedSpoilers.has(comment.id) && hideSpoilers && !isReply && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60 backdrop-blur-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSpoilerReveal(comment.id)}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Reveal spoiler
              </Button>
            </div>
          )}
          
          <div className="flex items-start gap-3">
            <div className={`${isReply ? "w-8 h-8" : "w-10 h-10"} rounded-full bg-gradient-to-br from-primary to-orange-500 flex-shrink-0 overflow-hidden`}>
              {comment.author_avatar ? (
                <img
                  src={comment.author_avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                  {(comment.author_name || "R")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`font-medium ${isReply ? "text-sm" : ""} ${textClass}`}>
                  {comment.author_name || "Reader"}
                </span>
                <span className={`text-xs ${mutedClass}`}>
                  {formatDate(comment.created_at)}
                </span>
                {comment.is_spoiler && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">
                    Spoiler
                  </span>
                )}
              </div>
              <p className={`${textClass} ${isReply ? "text-sm" : ""} whitespace-pre-wrap break-words`}>
                {comment.reply_to_name && (
                  <span className="text-primary font-medium">@{comment.reply_to_name} </span>
                )}
                {comment.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => handleLike(comment.id)}
                  disabled={likingComments.has(comment.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    comment.has_liked 
                      ? "text-red-500" 
                      : `${mutedClass} hover:text-red-500`
                  }`}
                >
                  <Heart className={`w-4 h-4 ${comment.has_liked ? "fill-current" : ""}`} />
                  <span>{comment.likes_count || 0}</span>
                </button>
                
                {user && canComment && (
                  <button
                    onClick={startReply}
                    className={`flex items-center gap-1.5 text-sm ${
                      replyingTo?.commentId === comment.id 
                        ? "text-primary" 
                        : `${mutedClass} hover:text-primary`
                    } transition-colors`}
                  >
                    <Reply className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo?.commentId === comment.id && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs ${mutedClass}`}>
                      Replying to <span className="text-primary font-medium">@{replyingTo.authorName}</span>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${replyingTo.authorName}...`}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm border ${inputBgClass} ${textClass} focus:outline-none focus:ring-2 focus:ring-primary/50`}
                      maxLength={500}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleReplySubmit();
                        }
                        if (e.key === "Escape") {
                          setReplyingTo(null);
                          setReplyContent("");
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleReplySubmit}
                      disabled={!replyContent.trim() || isPosting}
                      className="bg-gradient-to-r from-primary to-orange-500"
                    >
                      {isPosting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                      className={mutedClass}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="space-y-2">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} isReply parentCommentId={actualParentId} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`mt-8 pt-8 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold flex items-center gap-2 ${textClass}`}>
          <MessageCircle className="w-5 h-5 text-primary" />
          Comments ({comments.length})
        </h3>
        {spoilerCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHideSpoilers(!hideSpoilers)}
            className={`gap-2 ${mutedClass}`}
          >
            {hideSpoilers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {hideSpoilers ? "Show spoilers" : "Hide spoilers"}
          </Button>
        )}
      </div>

      {/* Comment Form */}
      {!user ? (
        <div className={`rounded-xl p-4 mb-6 ${bgClass} text-center`}>
          <p className={mutedClass}>
            <button onClick={redirectToLogin} className="text-primary hover:underline">Start your free trial</button>
            {" "}to join the discussion — no payment required
          </p>
        </div>
      ) : checkingAccess ? (
        <div className={`rounded-xl p-4 mb-6 ${bgClass} text-center`}>
          <Loader2 className={`w-5 h-5 animate-spin mx-auto ${mutedClass}`} />
        </div>
      ) : !canComment ? (
        <div className={`rounded-xl p-4 mb-6 ${bgClass} text-center`}>
          <p className={mutedClass}>
            <a href="/#pricing" className="text-primary hover:underline">Subscribe</a>
            {" "}to unlock comments and join the discussion
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className={`rounded-xl p-4 ${bgClass}`}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this episode..."
              className={`w-full h-24 resize-none rounded-lg p-3 border ${inputBgClass} ${textClass} placeholder:${mutedClass} focus:outline-none focus:ring-2 focus:ring-primary/50`}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-3">
              <label className={`flex items-center gap-2 cursor-pointer ${mutedClass}`}>
                <input
                  type="checkbox"
                  checked={isSpoiler}
                  onChange={(e) => setIsSpoiler(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-500 text-primary focus:ring-primary"
                />
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Contains spoilers</span>
              </label>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${mutedClass}`}>{newComment.length}/1000</span>
                <Button
                  type="submit"
                  disabled={!newComment.trim() || isPosting}
                  className="bg-gradient-to-r from-primary to-orange-500 gap-2"
                >
                  {isPosting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Post
                </Button>
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
        </form>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className={`w-6 h-6 animate-spin ${mutedClass}`} />
        </div>
      ) : comments.length === 0 ? (
        <div className={`text-center py-8 ${mutedClass}`}>
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleParentComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
          
          {/* Hidden spoilers notice */}
          {hideSpoilers && spoilerCount > 0 && spoilerCount !== revealedSpoilers.size && (
            <p className={`text-center text-sm ${mutedClass} py-2`}>
              {spoilerCount - revealedSpoilers.size} spoiler comment{spoilerCount - revealedSpoilers.size !== 1 ? "s" : ""} hidden
            </p>
          )}
        </div>
      )}

    </div>
  );
}
