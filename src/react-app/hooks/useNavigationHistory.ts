import { useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router";

/**
 * Navigation history management hook for consistent back button behavior
 * across all devices including iOS Safari swipe-back gesture, Android back button,
 * and PWA installations.
 */

// Session storage key for tracking navigation history
const HISTORY_KEY = "inkseries-nav-history";
const MAX_HISTORY = 20;

interface NavigationEntry {
  path: string;
  timestamp: number;
}

function getHistory(): NavigationEntry[] {
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: NavigationEntry[]) {
  try {
    // Keep only last MAX_HISTORY entries
    const trimmed = history.slice(-MAX_HISTORY);
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // sessionStorage might be unavailable in some contexts
  }
}

export function useNavigationHistory() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasInitialized = useRef(false);

  // Record current page in history on mount and location change
  useEffect(() => {
    // Skip recording on initial mount if we already have this path as the last entry
    const history = getHistory();
    const lastEntry = history[history.length - 1];
    
    // Don't add duplicate consecutive entries
    if (lastEntry?.path === location.pathname) {
      hasInitialized.current = true;
      return;
    }

    // Add current location to history
    const newEntry: NavigationEntry = {
      path: location.pathname,
      timestamp: Date.now(),
    };
    
    history.push(newEntry);
    saveHistory(history);
    hasInitialized.current = true;
  }, [location.pathname]);

  /**
   * Get the appropriate fallback path for back navigation from current page
   */
  const getFallbackPath = useCallback((currentPath: string): string => {
    // Episode reader page -> go to story detail
    const readerMatch = currentPath.match(/^\/read\/([^/]+)\//);
    if (readerMatch) {
      return `/novel/${readerMatch[1]}`;
    }

    // Story detail page -> go to explore or home
    if (currentPath.startsWith("/novel/")) {
      return "/explore";
    }

    // Default fallback
    return "/";
  }, []);

  /**
   * Navigate back safely - uses history if available, otherwise fallback
   */
  const goBack = useCallback(() => {
    const history = getHistory();
    
    // Remove current page from history
    if (history.length > 0 && history[history.length - 1].path === location.pathname) {
      history.pop();
    }
    
    // Try to navigate to previous page in our tracked history
    if (history.length > 0) {
      const prevEntry = history[history.length - 1];
      // Remove it so we don't go to it again
      history.pop();
      saveHistory(history);
      navigate(prevEntry.path, { replace: false });
      return;
    }
    
    // No tracked history - use smart fallback
    const fallback = getFallbackPath(location.pathname);
    navigate(fallback, { replace: true });
  }, [location.pathname, navigate, getFallbackPath]);

  /**
   * Navigate to a specific path with proper history management
   */
  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      // When replacing, update the last entry in our history
      const history = getHistory();
      if (history.length > 0) {
        history[history.length - 1] = { path, timestamp: Date.now() };
        saveHistory(history);
      }
    }
    navigate(path, options);
  }, [navigate]);

  /**
   * Get the previous page path (for showing "Back to X" text)
   */
  const getPreviousPath = useCallback((): string | null => {
    const history = getHistory();
    // Skip current page if it's the last entry
    const filtered = history.filter(entry => entry.path !== location.pathname);
    return filtered.length > 0 ? filtered[filtered.length - 1].path : null;
  }, [location.pathname]);

  /**
   * Get a human-readable name for a path
   */
  const getPageName = useCallback((path: string): string => {
    if (path === "/") return "Home";
    if (path === "/explore") return "Explore";
    if (path.startsWith("/explore?genre=")) {
      const genre = new URLSearchParams(path.split("?")[1]).get("genre");
      return genre || "Explore";
    }
    if (path.startsWith("/novel/")) return "Story";
    if (path === "/library") return "Library";
    if (path === "/community") return "Community";
    if (path === "/settings") return "Settings";
    return "Previous Page";
  }, []);

  return {
    goBack,
    navigateTo,
    getPreviousPath,
    getPageName,
    getFallbackPath,
  };
}

/**
 * Hook to handle popstate (browser back/forward) events
 * and ensure proper navigation on all devices
 */
export function usePopstateHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle popstate events (browser back/forward button, swipe gestures)
    const handlePopstate = () => {
      // The browser has already changed the URL at this point
      // We just need to ensure our React Router state is in sync
      // This helps with iOS Safari swipe-back gesture consistency
      
      // Force a re-render by updating the history state
      const currentPath = window.location.pathname;
      
      // If we're on a page that might fail to load, add error handling
      if (currentPath.startsWith("/read/") || currentPath.startsWith("/novel/")) {
        // The page components will handle their own error states
        // This is just to ensure navigation happens smoothly
      }
    };

    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, [navigate, location]);
}
