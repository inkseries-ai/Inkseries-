import { useState, useEffect, useCallback } from "react";

export interface DownloadedEpisode {
  id: string; // unique key: `${novelSlug}-${chapterNumber}`
  novelSlug: string;
  novelTitle: string;
  novelCover: string;
  chapterNumber: number;
  chapterTitle: string;
  content: string;
  wordCount: number;
  downloadedAt: number; // timestamp
  seasonNumber?: number;
  seasonTitle?: string;
}

const DB_NAME = "inkseries-downloads";
const DB_VERSION = 1;
const STORE_NAME = "episodes";
export const TRIAL_DOWNLOAD_LIMIT = 15;

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("novelSlug", "novelSlug", { unique: false });
        store.createIndex("downloadedAt", "downloadedAt", { unique: false });
      }
    };
  });
}

// Get all downloads
async function getAllDownloads(): Promise<DownloadedEpisode[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

// Get single download
async function getDownload(id: string): Promise<DownloadedEpisode | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

// Save download
async function saveDownload(episode: DownloadedEpisode): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(episode);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Delete download
async function deleteDownload(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Delete all downloads for a novel
async function deleteNovelDownloads(novelSlug: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("novelSlug");
    const request = index.openCursor(IDBKeyRange.only(novelSlug));
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
  });
}

// Clear all downloads
async function clearAllDownloads(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Get storage estimate
async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return null;
}

// Hook for managing downloads
export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadedEpisode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all downloads on mount
  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const all = await getAllDownloads();
      // Sort by downloaded date, newest first
      all.sort((a, b) => b.downloadedAt - a.downloadedAt);
      setDownloads(all);
    } catch (error) {
      console.error("Failed to load downloads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDownloaded = useCallback((novelSlug: string, chapterNumber: number): boolean => {
    const id = `${novelSlug}-${chapterNumber}`;
    return downloads.some(d => d.id === id);
  }, [downloads]);

  const downloadEpisode = useCallback(async (episode: Omit<DownloadedEpisode, "id" | "downloadedAt">): Promise<boolean> => {
    try {
      const id = `${episode.novelSlug}-${episode.chapterNumber}`;
      const fullEpisode: DownloadedEpisode = {
        ...episode,
        id,
        downloadedAt: Date.now(),
      };
      await saveDownload(fullEpisode);
      await loadDownloads();
      return true;
    } catch (error) {
      console.error("Failed to download episode:", error);
      return false;
    }
  }, []);

  const removeDownload = useCallback(async (novelSlug: string, chapterNumber: number): Promise<boolean> => {
    try {
      const id = `${novelSlug}-${chapterNumber}`;
      await deleteDownload(id);
      await loadDownloads();
      return true;
    } catch (error) {
      console.error("Failed to remove download:", error);
      return false;
    }
  }, []);

  const removeNovelDownloads = useCallback(async (novelSlug: string): Promise<boolean> => {
    try {
      await deleteNovelDownloads(novelSlug);
      await loadDownloads();
      return true;
    } catch (error) {
      console.error("Failed to remove novel downloads:", error);
      return false;
    }
  }, []);

  const clearDownloads = useCallback(async (): Promise<boolean> => {
    try {
      await clearAllDownloads();
      setDownloads([]);
      return true;
    } catch (error) {
      console.error("Failed to clear downloads:", error);
      return false;
    }
  }, []);

  const getDownloadedEpisode = useCallback(async (novelSlug: string, chapterNumber: number): Promise<DownloadedEpisode | null> => {
    const id = `${novelSlug}-${chapterNumber}`;
    return getDownload(id);
  }, []);

  const getNovelDownloads = useCallback((novelSlug: string): DownloadedEpisode[] => {
    return downloads.filter(d => d.novelSlug === novelSlug);
  }, [downloads]);

  return {
    downloads,
    isLoading,
    isDownloaded,
    downloadEpisode,
    removeDownload,
    removeNovelDownloads,
    clearDownloads,
    getDownloadedEpisode,
    getNovelDownloads,
    getStorageEstimate,
    refreshDownloads: loadDownloads,
  };
}

// Check if user has active subscription
export async function checkSubscriptionStatus(): Promise<boolean> {
  try {
    const res = await fetch("/api/subscriptions/status", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      return data.hasActiveSubscription === true;
    }
    return false;
  } catch {
    return false;
  }
}

// Check subscription status with trial info
export interface SubscriptionInfo {
  hasActiveSubscription: boolean;
  isTrial: boolean;
  trialExpiresAt: string | null;
}

export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  try {
    const res = await fetch("/api/subscriptions/status", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      return {
        hasActiveSubscription: data.hasActiveSubscription === true || data.isActive === true,
        isTrial: data.isTrial === true,
        trialExpiresAt: data.trialExpiresAt || null,
      };
    }
    return { hasActiveSubscription: false, isTrial: false, trialExpiresAt: null };
  } catch {
    return { hasActiveSubscription: false, isTrial: false, trialExpiresAt: null };
  }
}

// Check if trial user can download more episodes
export function canTrialUserDownload(downloadCount: number, isTrial: boolean): boolean {
  if (!isTrial) return true; // Paid subscribers have no limit
  return downloadCount < TRIAL_DOWNLOAD_LIMIT;
}

// Get remaining trial downloads
export function getRemainingTrialDownloads(downloadCount: number): number {
  return Math.max(0, TRIAL_DOWNLOAD_LIMIT - downloadCount);
}
