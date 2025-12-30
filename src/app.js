import express from 'express';
import cors from 'cors';
import articleRoutes from './routes/article.routes.js';
import scrapeRoutes from './routes/scrape.routes.js';
import { logger } from './utils/logger.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? Object.keys(req.body) : undefined
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BeyondChats Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/articles', articleRoutes);
app.use('/api/scrape', scrapeRoutes);

// API base endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BeyondChats API',
    version: '1.0.0',
    endpoints: {
      articles: {
        list: 'GET /api/articles',
        single: 'GET /api/articles/:id',
        create: 'POST /api/articles',
        update: 'PUT /api/articles/:id',
        delete: 'DELETE /api/articles/:id'
      },
      scrape: {
        beyondchats: 'POST /api/scrape/beyondchats',
        status: 'GET /api/scrape/status'
      }
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'BeyondChats Backend API',
    version: '1.0.0',
    endpoints: {
      articles: '/api/articles',
      scrape: '/api/scrape'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app;
