#!/usr/bin/env python3

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from reactpy.backend.fastapi import configure
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import uvicorn
import os
from contextlib import asynccontextmanager

# Import components
from components.home_page import HomePage

# Simple imports without relative paths
from database import get_db, init_database
from models import Deal as DealModel
from routes.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_database()
    yield

app = FastAPI(
    title="DealSphere API",
    description="AI-powered deals platform with ReactPy frontend",
    version="2.0.0",
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

# Include API routers
app.include_router(admin_router, prefix="/api")

# Include deals router
try:
    from routes.deals import router as deals_router
    app.include_router(deals_router, prefix="/api")
except ImportError as e:
    print(f"Warning: Could not import deals router: {e}")

# Include sample files router
from routes.sample_files import router as sample_files_router
app.include_router(sample_files_router, prefix="/api/admin/sample-files")

# Include file upload router
try:
    from routes.file_upload_simple import router as file_upload_router
    app.include_router(file_upload_router, prefix="/api/admin")
except ImportError as e:
    print(f"Warning: Could not import file upload router: {e}")

# Import and include automation router
try:
    from routes.automation import router as automation_router
    app.include_router(automation_router, prefix="/api")
except ImportError as e:
    print(f"Warning: Could not import automation router: {e}")

# Import and include affiliate management router
try:
    from routes.affiliate_management import router as affiliate_router
    app.include_router(affiliate_router, prefix="/api")
except ImportError as e:
    print(f"Warning: Could not import affiliate management router: {e}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "DealSphere ReactPy API is running"}

@app.get("/api/deals")
async def get_deals(db: AsyncSession = Depends(get_db)):
    try:
        # Only return active, approved deals for public website
        result = await db.execute(
            select(DealModel).where(
                DealModel.is_active == True,
                DealModel.is_ai_approved == True,
                DealModel.status == 'approved'
            ).order_by(DealModel.created_at.desc())
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

@app.get("/api/deals/count")
async def get_deals_count(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(DealModel).where(
                DealModel.is_active == True,
                DealModel.is_ai_approved == True,
                DealModel.status == 'approved'
            )
        )
        deals = result.scalars().all()
        return {"count": len(deals)}
    except Exception as e:
        print(f"Error fetching deals count: {e}")
        return {"count": 0}

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
async def create_share_url(deal_id: str, platform: str = "general", db: AsyncSession = Depends(get_db)):
    """Create short URL for sharing and track social share"""
    try:
        from services.deals_service import DealsService
        from models import SocialShareCreate
        
        deals_service = DealsService(db)
        
        share_data = SocialShareCreate(
            deal_id=deal_id,
            platform=platform,
            ip_address="127.0.0.1"  # Default for simple server
        )
        
        short_url = await deals_service.create_share_url(deal_id, share_data)
        
        if not short_url:
            raise HTTPException(status_code=400, detail="Failed to create share URL")
        
        return {"shortUrl": short_url}
    except Exception as e:
        print(f"Error creating share URL: {e}")
        return {"error": "Failed to create share URL"}

@app.get("/s/{short_code}")
async def redirect_short_url(short_code: str, db: AsyncSession = Depends(get_db)):
    """Redirect short URL to deal page"""
    try:
        from services.deals_service import DealsService
        
        deals_service = DealsService(db)
        deal_url = await deals_service.resolve_short_url(short_code)
        
        if not deal_url:
            raise HTTPException(status_code=404, detail="Short URL not found")
        
        # Redirect to the deal page
        return RedirectResponse(url=deal_url, status_code=302)
    except Exception as e:
        print(f"Error resolving short URL: {e}")
        raise HTTPException(status_code=404, detail="Short URL not found")

# Configure ReactPy to serve the HomePage component
configure(app, HomePage)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "reactpy_server:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True
    )