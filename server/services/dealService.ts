import { storage } from "../storage";
import { aiService } from "./aiService";
import type { InsertDeal } from "@shared/schema";

export class DealService {
  async processDealSubmission(dealData: Partial<InsertDeal>): Promise<{ success: boolean; dealId?: string; message: string }> {
    try {
      // Calculate discount percentage if not provided
      if (!dealData.discountPercentage && dealData.originalPrice && dealData.salePrice) {
        const original = parseFloat(dealData.originalPrice.toString());
        const sale = parseFloat(dealData.salePrice.toString());
        dealData.discountPercentage = Math.round(((original - sale) / original) * 100);
      }

      // AI validation
      const validation = await aiService.validateDeal(dealData);
      
      if (!validation.isValid) {
        return {
          success: false,
          message: `Deal rejected by AI: ${validation.reasons.join(', ')}`
        };
      }

      // Improve title if AI suggests one
      if (validation.suggestedTitle) {
        dealData.title = validation.suggestedTitle;
      }

      // Auto-approve deals with high AI scores
      const autoApprove = validation.score >= 8.5;

      const deal: InsertDeal = {
        title: dealData.title || '',
        description: dealData.description,
        originalPrice: dealData.originalPrice || '0',
        salePrice: dealData.salePrice || '0',
        discountPercentage: dealData.discountPercentage || 0,
        imageUrl: dealData.imageUrl,
        affiliateUrl: dealData.affiliateUrl || '',
        store: dealData.store || '',
        storeLogoUrl: dealData.storeLogoUrl,
        category: validation.category,
        rating: dealData.rating,
        reviewCount: dealData.reviewCount || 0,
        expiresAt: dealData.expiresAt,
        isActive: true,
        isAiApproved: autoApprove,
        aiScore: validation.score.toString(),
        aiReasons: validation.reasons,
        popularity: 0,
        clickCount: 0,
        shareCount: 0,
        dealType: validation.dealType,
        sourceApi: dealData.sourceApi || 'manual',
      };

      const createdDeal = await storage.createDeal(deal);

      return {
        success: true,
        dealId: createdDeal.id,
        message: autoApprove ? 'Deal approved and published' : 'Deal submitted for review'
      };

    } catch (error) {
      console.error('Deal processing error:', error);
      return {
        success: false,
        message: 'Failed to process deal submission'
      };
    }
  }

  async formatAffiliateUrl(url: string, dealId: string): Promise<string> {
    // Basic affiliate URL formatting - in production, this would handle
    // specific affiliate program requirements (Amazon Associates, etc.)
    
    // Add tracking parameters
    const urlObj = new URL(url);
    urlObj.searchParams.set('ref', 'dealsphere');
    urlObj.searchParams.set('deal_id', dealId);
    
    return urlObj.toString();
  }

  async updateDealPopularity(): Promise<void> {
    await storage.updateDealPopularity();
  }

  async getDealsAnalytics() {
    return await storage.getAnalytics();
  }
}

export const dealService = new DealService();
