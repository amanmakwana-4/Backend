/**
 * Auto Rewrite Script
 * 
 * This script automates the article rewriting process:
 * 1. Fetches articles with status 'original'
 * 2. Searches Google for related content
 * 3. Scrapes reference articles
 * 4. Uses LLM to rewrite the article
 * 5. Updates the article via API
 * 
 * Usage: npm run scrape
 * Or: node src/scripts/autoRewrite.script.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/db.js';
import Article from '../models/Article.model.js';
import { searchWithRetry } from '../services/googleSearch.service.js';
import { scrapeContent } from '../services/contentScraper.service.js';
import { rewriteArticle } from '../services/llmRewrite.service.js';
import { logger } from '../utils/logger.js';

// Configuration
const CONFIG = {
  maxArticlesToProcess: 5,      // Max articles to process in one run
  googleResultsPerArticle: 2,   // Number of Google results to fetch
  delayBetweenArticles: 5000,   // Delay between processing articles (ms)
  delayBetweenScrapes: 2000     // Delay between scraping references (ms)
};

/**
 * Main automation function
 */
const runAutoRewrite = async () => {
  logger.info('🚀 Starting Auto Rewrite Script');
  logger.info('================================');
  
  try {
    // Connect to database
    await connectDB();
    
    // Fetch original articles
    const articles = await Article.find({ status: 'original' })
      .sort({ createdAt: 1 }) // Oldest first
      .limit(CONFIG.maxArticlesToProcess)
      .lean();
    
    if (articles.length === 0) {
      logger.info('No articles pending rewrite. Exiting.');
      await disconnectDB();
      return;
    }
    
    logger.info(`Found ${articles.length} articles to process`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      
      logger.info('');
      logger.info(`📝 Processing article ${i + 1}/${articles.length}: ${article.title}`);
      logger.info('-'.repeat(60));
      
      try {
        // Step 1: Search Google for related content
        logger.info('🔍 Searching Google for related content...');
        const searchResults = await searchWithRetry(
          article.title,
          CONFIG.googleResultsPerArticle
        );
        
        logger.info(`Found ${searchResults.length} search results`);
        
        // Step 2: Scrape reference content
        const references = [];
        const scrapedContents = [];
        
        for (const result of searchResults) {
          try {
            logger.info(`📄 Scraping: ${result.url}`);
            const scraped = await scrapeContent(result.url);
            
            if (scraped.content && scraped.content.length > 200) {
              scrapedContents.push(scraped);
              references.push({
                title: scraped.title || result.title,
                url: result.url
              });
              logger.info(`✅ Scraped ${scraped.content.length} chars`);
            } else {
              logger.warn(`⚠️ Insufficient content from: ${result.url}`);
            }
            
            // Delay between scrapes
            await delay(CONFIG.delayBetweenScrapes);
          } catch (error) {
            logger.error(`❌ Failed to scrape: ${result.url}`, { error: error.message });
          }
        }
        
        // Step 3: Rewrite using LLM
        logger.info('🤖 Sending to LLM for rewriting...');
        const rewritten = await rewriteArticle(
          article.originalContent,
          scrapedContents,
          article.title
        );
        
        if (!rewritten.content) {
          throw new Error('LLM returned empty content');
        }
        
        logger.info(`✅ LLM generated ${rewritten.content.length} chars`);
        
        // Step 4: Update article in database
        logger.info('💾 Saving rewritten article...');
        await Article.findByIdAndUpdate(article._id, {
          rewrittenContent: rewritten.content,
          references,
          status: 'rewritten'
        });
        
        logger.info(`✅ Article rewritten successfully: ${article.title}`);
        successCount++;
        
      } catch (error) {
        logger.error(`❌ Failed to process article: ${article.title}`, { error: error.message });
        failCount++;
      }
      
      // Delay before next article
      if (i < articles.length - 1) {
        logger.info(`⏳ Waiting ${CONFIG.delayBetweenArticles / 1000}s before next article...`);
        await delay(CONFIG.delayBetweenArticles);
      }
    }
    
    // Summary
    logger.info('');
    logger.info('================================');
    logger.info('📊 Auto Rewrite Summary');
    logger.info('================================');
    logger.info(`Total processed: ${articles.length}`);
    logger.info(`✅ Success: ${successCount}`);
    logger.info(`❌ Failed: ${failCount}`);
    logger.info('================================');
    
  } catch (error) {
    logger.error('Script failed', { error: error.message, stack: error.stack });
  } finally {
    await disconnectDB();
    logger.info('🏁 Script completed');
  }
};

/**
 * Helper function for delays
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Run the script
runAutoRewrite().catch(error => {
  logger.error('Unhandled script error', { error: error.message });
  process.exit(1);
});
