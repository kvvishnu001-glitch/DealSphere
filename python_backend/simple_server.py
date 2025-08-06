#!/usr/bin/env python3

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uvicorn
import os
from contextlib import asynccontextmanager

# Simple imports without relative paths
from database import get_db, init_database, Base, engine
from models import Deal as DealModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_database()
    yield

app = FastAPI(
    title="DealSphere API",
    description="AI-powered deals and coupons platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "DealSphere Python API is running"}

@app.get("/api/deals")
async def get_deals(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(DealModel))
        deals = result.scalars().all()
        
        # Convert to dict format for JSON response
        deals_list = []
        for deal in deals:
            deal_dict = {
                "id": deal.id,
                "title": deal.title,
                "description": deal.description,
                "originalPrice": str(deal.original_price),
                "salePrice": str(deal.sale_price),
                "discountPercentage": deal.discount_percentage,
                "imageUrl": deal.image_url,
                "affiliateUrl": deal.affiliate_url,
                "store": deal.store,
                "storeLogoUrl": deal.store_logo_url,
                "category": deal.category,
                "rating": str(deal.rating) if deal.rating else None,
                "reviewCount": deal.review_count,
                "expiresAt": deal.expires_at.isoformat() if deal.expires_at else None,
                "isActive": deal.is_active,
                "isAiApproved": deal.is_ai_approved,
                "aiScore": str(deal.ai_score) if deal.ai_score else None,
                "aiReasons": deal.ai_reasons,
                "popularity": deal.popularity,
                "clickCount": deal.click_count,
                "shareCount": deal.share_count,
                "dealType": deal.deal_type,
                "sourceApi": deal.source_api,
                "createdAt": deal.created_at.isoformat() if deal.created_at else None,
                "updatedAt": deal.updated_at.isoformat() if deal.updated_at else None
            }
            deals_list.append(deal_dict)
        
        return deals_list
    except Exception as e:
        print(f"Error fetching deals: {e}")
        return []

@app.post("/api/deals/{deal_id}/click")
async def track_deal_click(deal_id: str, db: AsyncSession = Depends(get_db)):
    try:
        # Get deal
        result = await db.execute(select(DealModel).where(DealModel.id == deal_id))
        deal = result.scalar_one_or_none()
        
        if not deal:
            return {"error": "Deal not found"}
        
        # Increment click count
        deal.click_count = (deal.click_count or 0) + 1
        await db.commit()
        
        return {"affiliateUrl": deal.affiliate_url}
    except Exception as e:
        print(f"Error tracking click: {e}")
        return {"error": "Failed to track click"}

@app.post("/api/deals/{deal_id}/share")
async def track_deal_share(deal_id: str, db: AsyncSession = Depends(get_db)):
    try:
        # Get deal
        result = await db.execute(select(DealModel).where(DealModel.id == deal_id))
        deal = result.scalar_one_or_none()
        
        if not deal:
            return {"error": "Deal not found"}
        
        # Increment share count
        deal.share_count = (deal.share_count or 0) + 1
        await db.commit()
        
        return {"success": True}
    except Exception as e:
        print(f"Error tracking share: {e}")
        return {"error": "Failed to track share"}

@app.get("/")
async def root():
    return {"message": "DealSphere Python API is running", "status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "simple_server:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True
    )