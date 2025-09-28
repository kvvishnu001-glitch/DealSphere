#!/usr/bin/env python3

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uvicorn
import os
from contextlib import asynccontextmanager

# Simple imports without relative paths
from database import get_db, init_database
from models import Deal as DealModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    try:
        await init_database()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")
    yield

app = FastAPI(
    title="DealSphere API Debug",
    description="Debug version of DealSphere API",
    version="2.0.0-debug",
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
    return {"status": "healthy", "message": "DealSphere Debug API is running"}

@app.get("/api/debug")
async def debug_info():
    return {"debug": "Server is working", "python_version": "3.11"}

@app.get("/api/deals")
async def get_deals(db: AsyncSession = Depends(get_db)):
    try:
        # Only return active, approved deals for public website
        result = await db.execute(
            select(DealModel).where(
                DealModel.is_active == True,
                DealModel.is_ai_approved == True,
                DealModel.status == 'approved'
            ).order_by(DealModel.created_at.desc()).limit(10)
        )
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
                "category": deal.category,
                "dealType": deal.deal_type,
                "isActive": deal.is_active,
                "isAiApproved": deal.is_ai_approved
            }
            deals_list.append(deal_dict)
        
        return deals_list
    except Exception as e:
        print(f"Error fetching deals: {e}")
        return []

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting debug server on port {port}")
    uvicorn.run(
        "simple_debug_server:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True
    )