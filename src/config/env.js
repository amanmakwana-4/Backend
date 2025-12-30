import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4',
  beyondChatsBlogUrl: process.env.BEYONDCHATS_BLOG_URL || 'https://beyondchats.com/blogs/',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api'
};

export default env;
