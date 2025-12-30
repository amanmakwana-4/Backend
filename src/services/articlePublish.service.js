import axios from 'axios';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Article Publish Service - Updates articles via API
 */

const API_URL = `${env.apiBaseUrl}/articles`;

/**
 * Update an article with rewritten content
 */
export const publishRewrittenArticle = async (articleId, rewrittenContent, references = []) => {
  try {
    logger.info(`Publishing rewritten article: ${articleId}`);
    
    const response = await axios.put(`${API_URL}/${articleId}`, {
      rewrittenContent,
      references,
      status: 'rewritten'
    });
    
    logger.info(`Successfully published article: ${articleId}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to publish article: ${articleId}`, { error: error.message });
    throw error;
  }
};

/**
 * Get all articles with original status
 */
export const getOriginalArticles = async () => {
  try {
    const response = await axios.get(API_URL, {
      params: {
        status: 'original'
      }
    });
    
    return response.data.data || response.data;
  } catch (error) {
    logger.error('Failed to fetch original articles', { error: error.message });
    throw error;
  }
};

/**
 * Get article by ID
 */
export const getArticleById = async (articleId) => {
  try {
    const response = await axios.get(`${API_URL}/${articleId}`);
    return response.data.data || response.data;
  } catch (error) {
    logger.error(`Failed to fetch article: ${articleId}`, { error: error.message });
    throw error;
  }
};

/**
 * Update article status
 */
export const updateArticleStatus = async (articleId, status) => {
  try {
    const response = await axios.put(`${API_URL}/${articleId}`, {
      status
    });
    return response.data;
  } catch (error) {
    logger.error(`Failed to update article status: ${articleId}`, { error: error.message });
    throw error;
  }
};

export default {
  publishRewrittenArticle,
  getOriginalArticles,
  getArticleById,
  updateArticleStatus
};
