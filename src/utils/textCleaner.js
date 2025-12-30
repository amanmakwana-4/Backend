/**
 * Text cleaning utilities for scraped content
 */

/**
 * Remove extra whitespace and normalize text
 */
export const normalizeWhitespace = (text) => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
};

/**
 * Remove HTML tags from text
 */
export const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

/**
 * Clean scraped article content
 */
export const cleanArticleContent = (content) => {
  if (!content) return '';
  
  let cleaned = content;
  
  // Remove common unwanted patterns
  cleaned = cleaned
    .replace(/Share this article/gi, '')
    .replace(/Follow us on/gi, '')
    .replace(/Subscribe to our newsletter/gi, '')
    .replace(/Read more articles/gi, '')
    .replace(/Related posts/gi, '')
    .replace(/Comments \(\d+\)/gi, '')
    .replace(/Leave a comment/gi, '')
    .replace(/Advertisement/gi, '');
  
  // Normalize whitespace
  cleaned = normalizeWhitespace(cleaned);
  
  return cleaned;
};

/**
 * Generate slug from title
 */
export const generateSlug = (title) => {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
};

/**
 * Extract first N sentences from text
 */
export const extractExcerpt = (text, sentenceCount = 2) => {
  if (!text) return '';
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, sentenceCount).join(' ').trim();
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 200) => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength).replace(/\s+\S*$/, '') + '...';
};

export default {
  normalizeWhitespace,
  stripHtml,
  cleanArticleContent,
  generateSlug,
  extractExcerpt,
  truncateText
};
