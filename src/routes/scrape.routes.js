import { Router } from 'express';
import {
  scrapeBeyondChats,
  getScrapeStatus
} from '../controllers/scrape.controller.js';

const router = Router();

/**
 * Scrape Routes
 * 
 * POST   /api/scrape/beyondchats   - Scrape articles from BeyondChats blog
 * GET    /api/scrape/status        - Get scraping status and statistics
 */

// POST /api/scrape/beyondchats - Scrape BeyondChats articles
router.post('/beyondchats', scrapeBeyondChats);

// GET /api/scrape/status - Get scrape status
router.get('/status', getScrapeStatus);

export default router;
