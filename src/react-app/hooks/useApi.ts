import { useState, useEffect, useCallback } from "react";

// Generic API response type
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

// API fetch wrapper with error handling
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        data: null,
        error: errorData.error || `Request failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "An error occurred",
    };
  }
}

// Hook for GET requests
export function useApiGet<T>(url: string | null): ApiResponse<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiResponse<T>>({
    data: null,
    error: null,
    isLoading: !!url,
  });

  const fetchData = useCallback(async () => {
    if (!url) return;
    
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const { data, error } = await apiFetch<T>(url);
    setState({ data, error, isLoading: false });
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

// API methods for mutations
export const api = {
  // Novels
  async getNovels(params?: {
    genre?: string;
    status?: string;
    featured?: boolean;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.genre) searchParams.set("genre", params.genre);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.featured) searchParams.set("featured", "true");
    if (params?.search) searchParams.set("search", params.search);
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const query = searchParams.toString();
    return apiFetch<{ novels: Novel[] }>(`/api/novels${query ? `?${query}` : ""}`);
  },

  async getNovel(slug: string) {
    return apiFetch<{ novel: Novel; chapters: Chapter[] }>(`/api/novels/${slug}`);
  },

  async getChapter(slug: string, chapterNum: number) {
    return apiFetch<{
      chapter: Chapter;
      novel: { id: number; title: string; slug: string };
      navigation: { prev: Chapter | null; next: Chapter | null };
    }>(`/api/novels/${slug}/chapters/${chapterNum}`);
  },

  // Library
  async getLibrary() {
    return apiFetch<{ library: LibraryEntry[] }>("/api/library");
  },

  async updateLibrary(
    novelId: number,
    data: {
      is_bookmarked?: boolean;
      last_read_chapter?: number;
      scroll_position?: number;
    }
  ) {
    return apiFetch<{ success: boolean }>(`/api/library/${novelId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Comments
  async getComments(chapterId: number, hideSpoilers?: boolean) {
    const query = hideSpoilers ? "?hideSpoilers=true" : "";
    return apiFetch<{ comments: Comment[] }>(`/api/chapters/${chapterId}/comments${query}`);
  },

  async postComment(
    chapterId: number,
    data: { content: string; is_spoiler?: boolean; parent_id?: number }
  ) {
    return apiFetch<{ success: boolean }>(`/api/chapters/${chapterId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Profile
  async getProfile() {
    return apiFetch<{ profile: UserProfile }>("/api/profile");
  },

  async updateProfile(data: { display_name?: string; bio?: string }) {
    return apiFetch<{ success: boolean }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Badges
  async checkBadges() {
    return apiFetch<{ newlyEarned: string[] }>("/api/badges/check", {
      method: "POST",
    });
  },

  // Streaks
  async recordStreak() {
    return apiFetch<{ success: boolean }>("/api/streaks/record", {
      method: "POST",
    });
  },
};

// Types for API responses
export interface Novel {
  id: number;
  title: string;
  slug: string;
  author_id: number;
  author_name: string;
  author_avatar: string;
  author_bio?: string;
  cover_image_url: string;
  synopsis: string;
  genre: string;
  tags: string;
  status: "ongoing" | "completed" | "hiatus" | "coming_soon";
  is_featured: boolean;
  total_chapters: number;
  total_reads: number;
  total_likes: number;
  rating: number;
  avg_rating?: number;
  rating_count?: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  novel_id: number;
  chapter_number: number;
  title: string;
  content?: string;
  word_count: number;
  is_premium: boolean;
  is_published: boolean;
  audio_url: string | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryEntry {
  id: number;
  user_id: number;
  novel_id: number;
  last_read_chapter: number;
  scroll_position: number;
  is_bookmarked: boolean;
  title: string;
  slug: string;
  cover_image_url: string;
  genre: string;
  total_chapters: number;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  chapter_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  is_spoiler: boolean;
  author_name: string;
  author_avatar: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  auth_user_id: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  is_writer: boolean;
  is_admin: boolean;
  subscription_tier: "free" | "monthly" | "yearly";
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}
