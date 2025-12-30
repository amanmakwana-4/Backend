import { openai, llmConfig } from '../config/llm.js';
import { logger } from '../utils/logger.js';

/**
 * LLM Rewrite Service - Uses OpenAI to rewrite articles
 */

/**
 * Rewrite an article using LLM
 * @param {string} originalContent - The original article content
 * @param {Array} referenceContents - Array of scraped reference contents
 * @param {string} title - Original article title
 */
export const rewriteArticle = async (originalContent, referenceContents = [], title = '') => {
  try {
    logger.info(`Rewriting article: ${title}`);
    
    // Build reference section
    let referencesText = '';
    if (referenceContents.length > 0) {
      referencesText = referenceContents
        .filter(ref => ref.content && ref.content.length > 100)
        .map((ref, i) => `\n--- Reference ${i + 1}: ${ref.title || 'Untitled'} ---\n${ref.content.substring(0, 3000)}`)
        .join('\n');
    }
    
    const prompt = `
TASK: Rewrite the following article to be completely original while maintaining the core message and key information.

ORIGINAL ARTICLE TITLE: ${title}

ORIGINAL CONTENT:
${originalContent.substring(0, 5000)}

${referencesText ? `REFERENCE MATERIALS (use these for additional insights and perspectives):${referencesText}` : ''}

REQUIREMENTS:
1. Create a completely original rewrite - no plagiarism
2. Maintain the key points and message
3. Add proper headings and structure (use markdown)
4. Make it engaging and SEO-friendly
5. Improve readability and flow
6. Incorporate insights from reference materials where relevant
7. Target word count: 800-1500 words
8. Include a compelling introduction and conclusion

OUTPUT FORMAT:
- Use markdown formatting
- Include H2 and H3 headings
- Use bullet points or numbered lists where appropriate
- Write in a professional but engaging tone

Please provide ONLY the rewritten article content:`;

    const response = await openai.chat.completions.create({
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: llmConfig.systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: llmConfig.maxTokens,
      temperature: llmConfig.temperature
    });
    
    const rewrittenContent = response.choices[0]?.message?.content;
    
    if (!rewrittenContent) {
      throw new Error('No content returned from LLM');
    }
    
    logger.info(`Successfully rewrote article: ${title}`);
    
    return {
      content: rewrittenContent,
      usage: response.usage
    };
  } catch (error) {
    logger.error(`LLM rewrite failed for: ${title}`, { error: error.message });
    throw error;
  }
};

/**
 * Generate a new title for the article
 */
export const generateTitle = async (originalTitle, content) => {
  try {
    const response = await openai.chat.completions.create({
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating engaging, SEO-friendly article titles. Respond with only the new title, nothing else.'
        },
        {
          role: 'user',
          content: `Create a new, engaging title for an article originally titled "${originalTitle}". 
          
The article content starts with: ${content.substring(0, 500)}

Requirements:
- Make it catchy and click-worthy
- Keep it under 70 characters for SEO
- Don't use clickbait tactics
- Make it different from the original

Respond with ONLY the new title:`
        }
      ],
      max_tokens: 100,
      temperature: 0.8
    });
    
    return response.choices[0]?.message?.content?.trim() || originalTitle;
  } catch (error) {
    logger.error('Failed to generate new title', { error: error.message });
    return originalTitle;
  }
};

/**
 * Generate meta description for SEO
 */
export const generateMetaDescription = async (content) => {
  try {
    const response = await openai.chat.completions.create({
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert. Generate compelling meta descriptions. Respond with only the meta description, nothing else.'
        },
        {
          role: 'user',
          content: `Generate an SEO-friendly meta description (150-160 characters) for this article:

${content.substring(0, 1000)}

Respond with ONLY the meta description:`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });
    
    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    logger.error('Failed to generate meta description', { error: error.message });
    return '';
  }
};

export default {
  rewriteArticle,
  generateTitle,
  generateMetaDescription
};
