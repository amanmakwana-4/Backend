import axios from 'axios';
import * as cheerio from 'cheerio';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { cleanArticleContent, generateSlug } from '../utils/textCleaner.js';

/**
 * Service to scrape articles from BeyondChats blog
 */

/**
 * Get the last page number from the blog pagination
 */
export const getLastPageNumber = async () => {
  try {
    const response = await axios.get(env.beyondChatsBlogUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Look for pagination - adjust selector based on actual site structure
    const paginationLinks = $('a[href*="/blogs/page/"]');
    let maxPage = 1;
    
    paginationLinks.each((_, el) => {
      const href = $(el).attr('href');
      const match = href.match(/\/page\/(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1], 10);
        if (pageNum > maxPage) maxPage = pageNum;
      }
    });
    
    logger.info(`Found ${maxPage} pages on BeyondChats blog`);
    return maxPage;
  } catch (error) {
    logger.error('Error getting last page number', { error: error.message });
    throw error;
  }
};

/**
 * Scrape article links from a specific page
 */
export const scrapeArticleLinks = async (pageNumber = 1) => {
  try {
    const url = pageNumber === 1 
      ? env.beyondChatsBlogUrl 
      : `${env.beyondChatsBlogUrl}page/${pageNumber}/`;
    
    logger.info(`Scraping article links from: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Adjust selectors based on actual BeyondChats blog structure
    // Common patterns for WordPress blogs
    $('article, .post, .blog-post, .entry').each((_, el) => {
      const $article = $(el);
      const titleEl = $article.find('h2 a, h3 a, .entry-title a, .post-title a').first();
      const title = titleEl.text().trim();
      const url = titleEl.attr('href');
      
      if (title && url) {
        articles.push({
          title,
          url,
          slug: generateSlug(title)
        });
      }
    });
    
    logger.info(`Found ${articles.length} articles on page ${pageNumber}`);
    return articles;
  } catch (error) {
    logger.error(`Error scraping page ${pageNumber}`, { error: error.message });
    throw error;
  }
};

/**
 * Scrape full content from a single article URL
 */
export const scrapeArticleContent = async (articleUrl) => {
  try {
    logger.info(`Scraping article content from: ${articleUrl}`);
    
    const response = await axios.get(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, .sidebar, .comments, .related-posts, .share-buttons').remove();
    
    // Try multiple selectors for content
    const contentSelectors = [
      '.entry-content',
      '.post-content', 
      '.article-content',
      'article .content',
      '.blog-content',
      'main article'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        content = el.text();
        break;
      }
    }
    
    // Fallback to article or main content
    if (!content) {
      content = $('article').text() || $('main').text();
    }
    
    return cleanArticleContent(content);
  } catch (error) {
    logger.error(`Error scraping article content: ${articleUrl}`, { error: error.message });
    throw error;
  }
};

/**
 * Get oldest N articles from the last page
 */
export const getOldestArticles = async (count = 5) => {
  try {
    const lastPage = await getLastPageNumber();
    const articleLinks = await scrapeArticleLinks(lastPage);
    
    // Get the oldest articles (last ones on the last page)
    const oldestLinks = articleLinks.slice(-count);
    
    const articles = [];
    for (const link of oldestLinks) {
      try {
        const content = await scrapeArticleContent(link.url);
        articles.push({
          title: link.title,
          slug: link.slug,
          originalContent: content,
          sourceUrl: link.url,
          source: 'beyondchats',
          status: 'original'
        });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`Failed to scrape article: ${link.title}`, { error: error.message });
      }
    }
    
    logger.info(`Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    logger.error('Error getting oldest articles', { error: error.message });
    throw error;
  }
};

export default {
  getLastPageNumber,
  scrapeArticleLinks,
  scrapeArticleContent,
  getOldestArticles
};
