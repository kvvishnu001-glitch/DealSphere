import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deals table
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: decimal("sale_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  imageUrl: text("image_url"),
  affiliateUrl: text("affiliate_url").notNull(),
  store: varchar("store").notNull(),
  storeLogoUrl: text("store_logo_url"),
  category: varchar("category").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }),
  reviewCount: integer("review_count").default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  isAiApproved: boolean("is_ai_approved").default(false),
  aiScore: decimal("ai_score", { precision: 3, scale: 1 }),
  aiReasons: jsonb("ai_reasons"),
  popularity: integer("popularity").default(0),
  clickCount: integer("click_count").default(0),
  shareCount: integer("share_count").default(0),
  dealType: varchar("deal_type").notNull().default('latest'), // 'top', 'hot', 'latest'
  sourceApi: varchar("source_api"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deal clicks tracking
export const dealClicks = pgTable("deal_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull().references(() => deals.id),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  clickedAt: timestamp("clicked_at").defaultNow(),
});

// Social shares tracking
export const socialShares = pgTable("social_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull().references(() => deals.id),
  platform: varchar("platform").notNull(), // 'facebook', 'twitter', 'whatsapp', 'copy'
  ipAddress: varchar("ip_address"),
  sharedAt: timestamp("shared_at").defaultNow(),
});

// Relations
export const dealsRelations = relations(deals, ({ many }) => ({
  clicks: many(dealClicks),
  shares: many(socialShares),
}));

export const dealClicksRelations = relations(dealClicks, ({ one }) => ({
  deal: one(deals, {
    fields: [dealClicks.dealId],
    references: [deals.id],
  }),
}));

export const socialSharesRelations = relations(socialShares, ({ one }) => ({
  deal: one(deals, {
    fields: [socialShares.dealId],
    references: [deals.id],
  }),
}));

// Zod schemas
export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDealClickSchema = createInsertSchema(dealClicks).omit({
  id: true,
  clickedAt: true,
});

export const insertSocialShareSchema = createInsertSchema(socialShares).omit({
  id: true,
  sharedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type DealClick = typeof dealClicks.$inferSelect;
export type InsertDealClick = z.infer<typeof insertDealClickSchema>;
export type SocialShare = typeof socialShares.$inferSelect;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;
