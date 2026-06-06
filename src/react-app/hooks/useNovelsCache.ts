import { useState, useEffect } from "react";
import { api, type Novel as ApiNovel } from "./useApi";

// In-memory cache for instant subsequent loads
let cachedNovels: ApiNovel[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 60 seconds

// Clear the in-memory cache (call when SW cache is cleared)
export function clearNovelsCache() {
  cachedNovels = null;
  cacheTimestamp = 0;
}

// Preload novels (call this early, e.g., on app mount)
export function preloadNovels() {
  if (cachedNovels && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return; // Already cached
  }
  
  api.getNovels({ limit: 50 }).then(({ data }) => {
    if (data?.novels) {
      cachedNovels = data.novels;
      cacheTimestamp = Date.now();
    }
  });
}

// Hook for using cached novels
export function useNovelsCache() {
  const [novels, setNovels] = useState<ApiNovel[]>(cachedNovels || []);
  const [isLoading, setIsLoading] = useState(!cachedNovels);

  useEffect(() => {
    // If we have fresh cache, use it immediately
    if (cachedNovels && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setNovels(cachedNovels);
      setIsLoading(false);
      return;
    }

    // Fetch fresh data
    setIsLoading(true);
    api.getNovels({ limit: 50 }).then(({ data }) => {
      if (data?.novels && data.novels.length > 0) {
        cachedNovels = data.novels;
        cacheTimestamp = Date.now();
        setNovels(data.novels);
      }
      setIsLoading(false);
    });
  }, []);

  const refetch = async () => {
    setIsLoading(true);
    const { data } = await api.getNovels({ limit: 50 });
    if (data?.novels) {
      cachedNovels = data.novels;
      cacheTimestamp = Date.now();
      setNovels(data.novels);
    }
    setIsLoading(false);
  };

  return { novels, isLoading, refetch };
}
