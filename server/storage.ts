import {
  users,
  deals,
  dealClicks,
  socialShares,
  type User,
  type UpsertUser,
  type Deal,
  type InsertDeal,
  type DealClick,
  type InsertDealClick,
  type SocialShare,
  type InsertSocialShare,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Deal operations
  getDeals(limit?: number, category?: string, dealType?: string): Promise<Deal[]>;
  getDealById(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  getPendingDeals(limit?: number): Promise<Deal[]>;
  approveDeal(id: string): Promise<Deal>;
  rejectDeal(id: string): Promise<void>;
  updateDealPopularity(): Promise<void>;
  
  // Analytics operations
  trackDealClick(click: InsertDealClick): Promise<DealClick>;
  trackSocialShare(share: InsertSocialShare): Promise<SocialShare>;
  getAnalytics(): Promise<{
    totalDeals: number;
    aiApproved: number;
    pendingReview: number;
    clicksToday: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Deal operations
  async getDeals(limit = 50, category?: string, dealType?: string): Promise<Deal[]> {
    const whereConditions = [
      eq(deals.isActive, true),
      eq(deals.isAiApproved, true)
    ];

    if (category) {
      whereConditions.push(eq(deals.category, category));
    }

    if (dealType) {
      whereConditions.push(eq(deals.dealType, dealType));
    }

    return await db.select().from(deals)
      .where(and(...whereConditions))
      .orderBy(desc(deals.popularity), desc(deals.createdAt))
      .limit(limit);
  }

  async getDealById(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async createDeal(deal: InsertDeal): Promise<Deal> {
    const [newDeal] = await db.insert(deals).values(deal).returning();
    return newDeal;
  }

  async updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal> {
    const [updatedDeal] = await db
      .update(deals)
      .set({ ...deal, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return updatedDeal;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  async getPendingDeals(limit = 20): Promise<Deal[]> {
    return await db
      .select()
      .from(deals)
      .where(and(eq(deals.isActive, true), eq(deals.isAiApproved, false)))
      .orderBy(desc(deals.createdAt))
      .limit(limit);
  }

  async approveDeal(id: string): Promise<Deal> {
    const [deal] = await db
      .update(deals)
      .set({ isAiApproved: true, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return deal;
  }

  async rejectDeal(id: string): Promise<void> {
    await db.update(deals)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deals.id, id));
  }

  async updateDealPopularity(): Promise<void> {
    // Update popularity based on clicks and shares
    await db.execute(sql`
      UPDATE deals 
      SET popularity = (click_count * 2 + share_count * 5)
      WHERE is_active = true AND is_ai_approved = true
    `);
  }

  // Analytics operations
  async trackDealClick(click: InsertDealClick): Promise<DealClick> {
    const [newClick] = await db.insert(dealClicks).values(click).returning();
    
    // Increment click count
    await db
      .update(deals)
      .set({ 
        clickCount: sql`${deals.clickCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(deals.id, click.dealId));

    return newClick;
  }

  async trackSocialShare(share: InsertSocialShare): Promise<SocialShare> {
    const [newShare] = await db.insert(socialShares).values(share).returning();
    
    // Increment share count
    await db
      .update(deals)
      .set({ 
        shareCount: sql`${deals.shareCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(deals.id, share.dealId));

    return newShare;
  }

  async getAnalytics(): Promise<{
    totalDeals: number;
    aiApproved: number;
    pendingReview: number;
    clicksToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalDealsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(eq(deals.isActive, true));

    const [aiApprovedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(eq(deals.isActive, true), eq(deals.isAiApproved, true)));

    const [pendingReviewResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(deals)
      .where(and(eq(deals.isActive, true), eq(deals.isAiApproved, false)));

    const [clicksTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dealClicks)
      .where(gte(dealClicks.clickedAt, today));

    return {
      totalDeals: totalDealsResult?.count || 0,
      aiApproved: aiApprovedResult?.count || 0,
      pendingReview: pendingReviewResult?.count || 0,
      clicksToday: clicksTodayResult?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
