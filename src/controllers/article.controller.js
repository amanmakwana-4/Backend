import Article from '../models/Article.model.js';
import { logger } from '../utils/logger.js';
import { generateSlug } from '../utils/textCleaner.js';

/**
 * Article Controller - Handles all CRUD operations for articles
 */

/**
 * GET /api/articles
 * Fetch all articles with optional filtering
 */
export const getAllArticles = async (req, res) => {
  try {
    const { status, source, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Article.countDocuments(filter)
    ]);
    
    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error fetching articles', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch articles',
      error: error.message
    });
  }
};

/**
 * GET /api/articles/:id
 * Fetch single article by ID
 */
export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findById(id).lean();
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    logger.error('Error fetching article', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch article',
      error: error.message
    });
  }
};

/**
 * POST /api/articles
 * Create a new article
 */
export const createArticle = async (req, res) => {
  try {
    const { title, originalContent, source, sourceUrl, status } = req.body;
    
    // Validation
    if (!title || !originalContent) {
      return res.status(400).json({
        success: false,
        message: 'Title and originalContent are required'
      });
    }
    
    // Generate slug
    const slug = generateSlug(title);
    
    // Check for duplicate slug
    const existingArticle = await Article.findOne({ slug });
    if (existingArticle) {
      return res.status(409).json({
        success: false,
        message: 'Article with this title already exists'
      });
    }
    
    const article = new Article({
      title,
      slug,
      originalContent,
      source: source || 'beyondchats',
      sourceUrl,
      status: status || 'original'
    });
    
    await article.save();
    
    logger.info('Article created', { id: article._id, title });
    
    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      data: article
    });
  } catch (error) {
    logger.error('Error creating article', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create article',
      error: error.message
    });
  }
};

/**
 * PUT /api/articles/:id
 * Update an existing article
 */
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, originalContent, rewrittenContent, references, status } = req.body;
    
    const article = await Article.findById(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    // Update fields if provided
    if (title) {
      article.title = title;
      article.slug = generateSlug(title);
    }
    if (originalContent) article.originalContent = originalContent;
    if (rewrittenContent) article.rewrittenContent = rewrittenContent;
    if (references) article.references = references;
    if (status) article.status = status;
    
    await article.save();
    
    logger.info('Article updated', { id: article._id, title: article.title });
    
    res.status(200).json({
      success: true,
      message: 'Article updated successfully',
      data: article
    });
  } catch (error) {
    logger.error('Error updating article', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to update article',
      error: error.message
    });
  }
};

/**
 * DELETE /api/articles/:id
 * Delete an article
 */
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    
    const article = await Article.findByIdAndDelete(id);
    
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }
    
    logger.info('Article deleted', { id, title: article.title });
    
    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting article', { error: error.message, id: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to delete article',
      error: error.message
    });
  }
};

export default {
  getAllArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle
};
