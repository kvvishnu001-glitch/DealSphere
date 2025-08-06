import OpenAI from "openai";
import type { InsertDeal } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

export interface DealValidationResult {
  isValid: boolean;
  score: number;
  category: string;
  dealType: 'top' | 'hot' | 'latest';
  reasons: string[];
  suggestedTitle?: string;
}

export class AIService {
  async validateDeal(deal: Partial<InsertDeal>): Promise<DealValidationResult> {
    try {
      console.log(`Validating deal: ${deal.title}`);
      const prompt = `
        Analyze this deal and provide a validation assessment in JSON format:

        Deal Details:
        - Title: ${deal.title}
        - Original Price: $${deal.originalPrice}
        - Sale Price: $${deal.salePrice}
        - Discount: ${deal.discountPercentage}%
        - Store: ${deal.store}
        - Category: ${deal.category}
        - Description: ${deal.description || 'No description'}

        Please evaluate this deal and respond with JSON in this exact format:
        {
          "isValid": boolean,
          "score": number (0-10),
          "category": "electronics|fashion|home|travel|sports|beauty|other",
          "dealType": "top|hot|latest",
          "reasons": ["reason1", "reason2", ...],
          "suggestedTitle": "optional improved title if needed"
        }

        Evaluation criteria:
        - Score 0-3: Poor deal (fake discounts, overpriced, suspicious)
        - Score 4-6: Average deal (moderate savings, decent value)
        - Score 7-8: Good deal (significant savings, popular items)
        - Score 9-10: Excellent deal (exceptional savings, high-demand items)

        Deal type classification:
        - "top": Score 8+, popular categories, high discount %
        - "hot": Score 6+, trending items, time-sensitive
        - "latest": Score 4+, newly added deals

        Category classification should be accurate based on the product type.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert deal validation AI that evaluates e-commerce deals for quality, authenticity, and value. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate the response structure
      if (typeof result.isValid !== 'boolean' || 
          typeof result.score !== 'number' ||
          !['top', 'hot', 'latest'].includes(result.dealType)) {
        throw new Error('Invalid AI response structure');
      }

      return {
        isValid: result.isValid,
        score: Math.max(0, Math.min(10, result.score)),
        category: result.category || deal.category || 'other',
        dealType: result.dealType,
        reasons: Array.isArray(result.reasons) ? result.reasons : [],
        suggestedTitle: result.suggestedTitle,
      };

    } catch (error) {
      console.error('AI validation error:', error);
      
      // Fallback validation based on simple rules
      const discountPercent = deal.discountPercentage || 0;
      let score = 5; // Default score
      let dealType: 'top' | 'hot' | 'latest' = 'latest';

      if (discountPercent >= 70) {
        score = 9;
        dealType = 'top';
      } else if (discountPercent >= 50) {
        score = 7;
        dealType = 'hot';
      } else if (discountPercent >= 30) {
        score = 6;
        dealType = 'hot';
      }

      return {
        isValid: discountPercent >= 10 && score >= 4,
        score,
        category: deal.category || 'other',
        dealType,
        reasons: ['Fallback validation due to AI service error'],
      };
    }
  }

  async categorizeDeal(title: string, description?: string): Promise<string> {
    try {
      const prompt = `
        Categorize this product into one of these categories: electronics, fashion, home, travel, sports, beauty, automotive, books, toys, health, food, other.

        Product: ${title}
        Description: ${description || 'No description'}

        Respond with JSON: {"category": "category_name"}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.category || 'other';

    } catch (error) {
      console.error('AI categorization error:', error);
      return 'other';
    }
  }

  async generateDealTitle(originalTitle: string, store: string, discount: number): Promise<string> {
    try {
      const prompt = `
        Improve this deal title to be more engaging and SEO-friendly while keeping it accurate and under 60 characters:

        Original: ${originalTitle}
        Store: ${store}
        Discount: ${discount}%

        Guidelines:
        - Include discount percentage
        - Make it compelling but not clickbait
        - Keep brand/product names accurate
        - Under 60 characters

        Respond with JSON: {"title": "improved_title"}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.title || originalTitle;

    } catch (error) {
      console.error('AI title generation error:', error);
      return originalTitle;
    }
  }
}

export const aiService = new AIService();
