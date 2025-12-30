import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

/**
 * Google Search scraping service
 * Note: For production, consider using official Google Search API
 */

const GOOGLE_SEARCH_URL = 'https://www.google.com/search';

// Delay between requests to avoid blocking
const DELAY_MS = 2000;

/**
 * Search Google for a query and return article/blog links
 */
export const searchGoogle = async (query, numResults = 2) => {
  try {
    logger.info(`Searching Google for: ${query}`);
    
    // Add search modifiers to get blog/article results
    const searchQuery = `${query} blog OR article`;
    
    const response = await axios.get(GOOGLE_SEARCH_URL, {
      params: {
        q: searchQuery,
        num: numResults + 5, // Request more to filter
        hl: 'en'
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    // Extract search results
    $('div.g, div[data-ved]').each((_, el) => {
      if (results.length >= numResults) return false;
      
      const $result = $(el);
      const linkEl = $result.find('a[href^="http"]').first();
      const href = linkEl.attr('href');
      const title = $result.find('h3').first().text().trim();
      
      if (href && title && !isExcludedDomain(href)) {
        results.push({
          title,
          url: href
        });
      }
    });
    
    logger.info(`Found ${results.length} results for: ${query}`);
    return results;
  } catch (error) {
    logger.error(`Google search failed for: ${query}`, { error: error.message });
    
    // If blocked, return empty results instead of throwing
    if (error.response?.status === 429 || error.response?.status === 503) {
      logger.warn('Google may have rate-limited the request');
      return [];
    }
    
    throw error;
  }
};

/**
 * Check if domain should be excluded from results
 */
const isExcludedDomain = (url) => {
  const excludedDomains = [
    'youtube.com',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'instagram.com',
    'pinterest.com',
    'reddit.com',
    'quora.com',
    'wikipedia.org',
    'beyondchats.com' // Exclude source domain
  ];
  
  try {
    const urlObj = new URL(url);
    return excludedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return true;
  }
};

/**
 * Search with retry and delay
 */
export const searchWithRetry = async (query, numResults = 2, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add delay before each attempt (except first)
      if (attempt > 1) {
        const delay = DELAY_MS * attempt;
        logger.info(`Waiting ${delay}ms before retry ${attempt}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const results = await searchGoogle(query, numResults);
      return results;
    } catch (error) {
      lastError = error;
      logger.warn(`Search attempt ${attempt} failed`, { error: error.message });
    }
  }
  
  logger.error(`All ${maxRetries} search attempts failed`);
  return []; // Return empty instead of throwing
};

export default {
  searchGoogle,
  searchWithRetry
};
