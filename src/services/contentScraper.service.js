import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';
import { cleanArticleContent, stripHtml } from '../utils/textCleaner.js';

/**
 * Content scraper service for extracting article content from URLs
 */

/**
 * Scrape content using Axios + Cheerio (faster, for static sites)
 */
export const scrapeWithCheerio = async (url) => {
  try {
    logger.info(`Scraping with Cheerio: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement, .social-share, .related-posts, .author-bio, form').remove();
    
    // Get title
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() ||
                  $('meta[property="og:title"]').attr('content') || '';
    
    // Try multiple content selectors
    const contentSelectors = [
      'article',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.content-body',
      '.blog-content',
      'main .content',
      '[itemprop="articleBody"]'
    ];
    
    let content = '';
    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length > 0 && el.text().length > 200) {
        content = el.text();
        break;
      }
    }
    
    // Fallback to body if no content found
    if (!content || content.length < 200) {
      content = $('body').text();
    }
    
    return {
      title,
      content: cleanArticleContent(content),
      url
    };
  } catch (error) {
    logger.error(`Cheerio scrape failed for: ${url}`, { error: error.message });
    throw error;
  }
};

/**
 * Scrape content using Puppeteer (for JavaScript-rendered sites)
 */
export const scrapeWithPuppeteer = async (url) => {
  let browser = null;
  
  try {
    logger.info(`Scraping with Puppeteer: ${url}`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for content to load
    await page.waitForSelector('article, .post-content, .entry-content, main', {
      timeout: 5000
    }).catch(() => {});
    
    // Extract content
    const data = await page.evaluate(() => {
      // Remove unwanted elements
      const removeSelectors = ['script', 'style', 'nav', 'header', 'footer', 'aside', '.sidebar', '.comments', '.advertisement'];
      removeSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.remove());
      });
      
      const title = document.querySelector('h1')?.innerText?.trim() || 
                   document.title || '';
      
      const contentSelectors = ['article', '.post-content', '.entry-content', '.article-content', 'main'];
      let content = '';
      
      for (const sel of contentSelectors) {
        const el = document.querySelector(sel);
        if (el && el.innerText.length > 200) {
          content = el.innerText;
          break;
        }
      }
      
      if (!content) {
        content = document.body.innerText;
      }
      
      return { title, content };
    });
    
    return {
      title: data.title,
      content: cleanArticleContent(data.content),
      url
    };
  } catch (error) {
    logger.error(`Puppeteer scrape failed for: ${url}`, { error: error.message });
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Smart scrape - tries Cheerio first, falls back to Puppeteer
 */
export const scrapeContent = async (url) => {
  try {
    // First try with Cheerio (faster)
    const result = await scrapeWithCheerio(url);
    
    // If content is too short, try Puppeteer
    if (result.content.length < 500) {
      logger.info(`Content too short, trying Puppeteer for: ${url}`);
      return await scrapeWithPuppeteer(url);
    }
    
    return result;
  } catch (error) {
    // Fallback to Puppeteer if Cheerio fails
    logger.warn(`Cheerio failed, trying Puppeteer for: ${url}`);
    try {
      return await scrapeWithPuppeteer(url);
    } catch (puppeteerError) {
      logger.error(`Both scraping methods failed for: ${url}`);
      return {
        title: '',
        content: '',
        url,
        error: true
      };
    }
  }
};

/**
 * Scrape multiple URLs with delay
 */
export const scrapeMultipleUrls = async (urls, delayMs = 2000) => {
  const results = [];
  
  for (const url of urls) {
    try {
      const result = await scrapeContent(url);
      results.push(result);
      
      // Add delay between requests
      if (urls.indexOf(url) < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      logger.error(`Failed to scrape: ${url}`, { error: error.message });
      results.push({ url, content: '', error: true });
    }
  }
  
  return results;
};

export default {
  scrapeWithCheerio,
  scrapeWithPuppeteer,
  scrapeContent,
  scrapeMultipleUrls
};
