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
  app.post('/api/admin/seed-deals', isAuthenticated, async (req, res) => {
    try {
      await seedDeals();
      res.json({ success: true, message: "Sample deals seeded successfully" });
    } catch (error) {
      console.error("Error seeding deals:", error);
      res.status(500).json({ message: "Failed to seed deals" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
