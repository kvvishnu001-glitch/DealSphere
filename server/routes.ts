import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { dealService } from "./services/dealService";
import { insertDealSchema, insertDealClickSchema, insertSocialShareSchema } from "@shared/schema";
import { seedDeals } from "./seedData";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Public deal routes
  app.get('/api/deals', async (req, res) => {
    try {
      const { limit, category, dealType } = req.query;
      const deals = await storage.getDeals(
        limit ? parseInt(limit as string) : undefined,
        category as string,
        dealType as string
      );
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get('/api/deals/:id', async (req, res) => {
    try {
      const deal = await storage.getDealById(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      res.json(deal);
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  // Track deal click
  app.post('/api/deals/:id/click', async (req, res) => {
    try {
      const clickData = insertDealClickSchema.parse({
        dealId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer'),
      });

      await storage.trackDealClick(clickData);
      
      // Get the deal's affiliate URL
      const deal = await storage.getDealById(req.params.id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      // Format affiliate URL with tracking
      const affiliateUrl = await dealService.formatAffiliateUrl(deal.affiliateUrl, deal.id);
      
      res.json({ affiliateUrl });
    } catch (error) {
      console.error("Error tracking click:", error);
      res.status(500).json({ message: "Failed to track click" });
    }
  });

  // Track social share
  app.post('/api/deals/:id/share', async (req, res) => {
    try {
      const shareData = insertSocialShareSchema.parse({
        dealId: req.params.id,
        platform: req.body.platform,
        ipAddress: req.ip,
      });

      await storage.trackSocialShare(shareData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking share:", error);
      res.status(500).json({ message: "Failed to track share" });
    }
  });

  // Protected admin routes
  app.get('/api/admin/deals/pending', isAuthenticated, async (req, res) => {
    try {
      const deals = await storage.getPendingDeals();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching pending deals:", error);
      res.status(500).json({ message: "Failed to fetch pending deals" });
    }
  });

  app.post('/api/admin/deals/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const deal = await storage.approveDeal(req.params.id);
      res.json(deal);
    } catch (error) {
      console.error("Error approving deal:", error);
      res.status(500).json({ message: "Failed to approve deal" });
    }
  });

  app.post('/api/admin/deals/:id/reject', isAuthenticated, async (req, res) => {
    try {
      await storage.rejectDeal(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting deal:", error);
      res.status(500).json({ message: "Failed to reject deal" });
    }
  });

  app.post('/api/admin/deals', isAuthenticated, async (req, res) => {
    try {
      const dealData = insertDealSchema.parse(req.body);
      const result = await dealService.processDealSubmission(dealData);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.get('/api/admin/analytics', isAuthenticated, async (req, res) => {
    try {
      const analytics = await dealService.getDealsAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Periodic task to update deal popularity (normally would use cron)
  app.post('/api/admin/update-popularity', isAuthenticated, async (req, res) => {
    try {
      await dealService.updateDealPopularity();
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating popularity:", error);
      res.status(500).json({ message: "Failed to update popularity" });
    }
  });

  // Seed sample deals (development only)
  app.post('/api/seed-deals', async (req, res) => {
    try {
      console.log("Starting to seed deals...");
      await seedDeals();
      console.log("Deals seeded successfully");
      res.json({ success: true, message: "Sample deals seeded successfully" });
    } catch (error) {
      console.error("Error seeding deals:", error);
      res.status(500).json({ message: "Failed to seed deals", error: error.message });
    }
  });

  // Quick add deals without AI validation (for testing)
  app.post('/api/quick-seed', async (req, res) => {
    try {
      console.log("Quick seeding deals without AI validation...");
      const deals = [
        {
          title: "Echo Dot (5th Gen) Smart Speaker with Alexa",
          description: "Compact smart speaker with improved audio, LED display, and Alexa voice control. Perfect for any room.",
          originalPrice: "59.99",
          salePrice: "19.99",
          discountPercentage: 67,
          imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
          affiliateUrl: "https://amazon.com/echo-dot-5th-gen",
          store: "Amazon",
          storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
          category: "electronics",
          rating: "4.7",
          reviewCount: 47821,
          sourceApi: "amazon_api",
          status: "approved",
          aiScore: 9.2,
          dealType: "top",
          isActive: true,
          isAiApproved: true
        },
        {
          title: "Fire TV Stick 4K Max Streaming Device",
          description: "Stream 4K Ultra HD content with Wi-Fi 6 support, Alexa Voice Remote, and faster app starts.",
          originalPrice: "54.99",
          salePrice: "27.99",
          discountPercentage: 49,
          imageUrl: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?ixlib=rb-4.0.3&w=800&h=600&fit=crop",
          affiliateUrl: "https://amazon.com/fire-tv-stick-4k-max",
          store: "Amazon",
          storeLogoUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&w=100&h=100&fit=crop",
          category: "electronics",
          rating: "4.6",
          reviewCount: 231654,
          sourceApi: "amazon_api",
          status: "approved",
          aiScore: 8.8,
          dealType: "hot",
          isActive: true,
          isAiApproved: true
        }
      ];

      for (const deal of deals) {
        await storage.createDeal(deal);
        console.log(`Added deal: ${deal.title}`);
      }

      res.json({ success: true, message: "Quick deals added successfully" });
    } catch (error) {
      console.error("Error quick seeding deals:", error);
      res.status(500).json({ message: "Failed to quick seed deals", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
