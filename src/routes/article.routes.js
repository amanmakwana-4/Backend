import { Router } from 'express';
import {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
} from '../controllers/article.controller.js';

const router = Router();

/**
 * Article Routes
 * 
 * GET    /api/articles          - Fetch all articles (with pagination & filtering)
 * GET    /api/articles/:id      - Fetch single article by ID
 * POST   /api/articles          - Create new article
 * PUT    /api/articles/:id      - Update existing article
 * DELETE /api/articles/:id      - Delete article
 */

// GET /api/articles - Fetch all articles
router.get('/', getAllArticles);

// GET /api/articles/:id - Fetch single article
router.get('/:id', getArticleById);

// POST /api/articles - Create new article
router.post('/', createArticle);

// PUT /api/articles/:id - Update article
router.put('/:id', updateArticle);

// DELETE /api/articles/:id - Delete article
router.delete('/:id', deleteArticle);

export default router;
