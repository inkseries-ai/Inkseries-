/**
 * Counts words accurately in a text string.
 * Handles edge cases like multiple spaces, newlines, tabs, and punctuation.
 */
export function countWords(text: string | null | undefined): number {
  if (!text || typeof text !== 'string') return 0;
  
  // Trim and normalize whitespace (replace all whitespace sequences with single space)
  const normalized = text.trim().replace(/\s+/g, ' ');
  
  // If empty after trim, return 0
  if (normalized === '') return 0;
  
  // Split by space and count
  return normalized.split(' ').length;
}
