/**
 * Converts a string to a URL-friendly slug.
 * @param text The input string to slugify.
 * @returns The slugified string.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-alphanumeric and non-hyphen characters
    .replace(/[^a-z0-9-]/g, '')
    // Replace multiple hyphens with a single hyphen
    .replace(/-+/g, '-')
    // Remove starting and trailing hyphens
    .replace(/^-+|-+$/g, '');
} 