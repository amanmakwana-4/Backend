import Article from '../models/Article.model.js';
import { getOldestArticles } from '../services/beyondChatsScraper.service.js';
import { logger } from '../utils/logger.js';

/**
 * Scrape Controller - Handles scraping operations
 */

/**
 * POST /api/scrape/beyondchats
 * Scrape latest articles from BeyondChats blog
 */
export const scrapeBeyondChats = async (req, res) => {
  try {
    const { count = 5 } = req.body;
    
    logger.info(`Starting BeyondChats scrape for ${count} articles`);
    
    // Scrape articles
    const scrapedArticles = await getOldestArticles(count);
    
    if (scrapedArticles.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No articles found to scrape',
        data: []
      });
    }
    
    // Save articles to database
    const savedArticles = [];
    const skippedArticles = [];
    
    for (const articleData of scrapedArticles) {
      try {
        // Check if article already exists
        const existingArticle = await Article.findOne({ slug: articleData.slug });
        
        if (existingArticle) {
          skippedArticles.push(articleData.title);
          continue;
        }
        
        const article = new Article(articleData);
        await article.save();
        savedArticles.push(article);
        
        logger.info(`Saved article: ${article.title}`);
      } catch (error) {
        logger.error(`Failed to save article: ${articleData.title}`, { error: error.message });
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Scraped and saved ${savedArticles.length} articles`,
      data: {
        saved: savedArticles,
        skipped: skippedArticles,
        summary: {
          total: scrapedArticles.length,
          saved: savedArticles.length,
          skipped: skippedArticles.length
        }
      }
    });
  } catch (error) {
    logger.error('BeyondChats scrape failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Scraping failed',
      error: error.message
    });
  }
};

/**
 * GET /api/scrape/status
 * Get scraping status and statistics
 */
export const getScrapeStatus = async (req, res) => {
  try {
    const [totalArticles, originalArticles, rewrittenArticles] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ status: 'original' }),
      Article.countDocuments({ status: 'rewritten' })
    ]);
    
    const lastScraped = await Article.findOne()
      .sort({ createdAt: -1 })
      .select('createdAt title')
      .lean();
    
    res.status(200).json({
      success: true,
      data: {
        total: totalArticles,
        original: originalArticles,
        rewritten: rewrittenArticles,
        pendingRewrite: originalArticles,
        lastScraped: lastScraped ? {
          title: lastScraped.title,
          date: lastScraped.createdAt
        } : null
      }
    });
  } catch (error) {
    logger.error('Failed to get scrape status', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get status',
      error: error.message
    });
  }
};

export default {
  scrapeBeyondChats,
  getScrapeStatus
};
