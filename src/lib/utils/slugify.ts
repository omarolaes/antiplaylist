export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with dash
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/\s+/g, '-'); // Replace any remaining spaces with dashes
} 