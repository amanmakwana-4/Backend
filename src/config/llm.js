import OpenAI from 'openai';
import { env } from './env.js';

export const openai = new OpenAI({
  apiKey: env.openaiApiKey
});

export const llmConfig = {
  model: env.openaiModel,
  maxTokens: 4000,
  temperature: 0.7,
  systemPrompt: `You are an expert content rewriter. Your task is to rewrite articles to be:
1. Original and unique (no plagiarism)
2. Well-structured with proper headings
3. SEO-friendly
4. Engaging and informative
5. Maintaining the original meaning and key points

When given the original article and reference content, create a completely rewritten version that incorporates insights from all sources while being entirely original.`
};

export default openai;
