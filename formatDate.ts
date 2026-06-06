/**
 * Format a date string into a human-readable relative time.
 * Examples: "Just now", "5m ago", "2h ago", "3d ago", "Jan 15"
 */
export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Recently";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Recently";
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    
    // For older dates, show month and day
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

/**
 * Format a date string into a readable full date.
 * Example: "January 15, 2025"
 */
export function formatFullDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    
    return date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  } catch {
    return "";
  }
}
