#!/usr/bin/env python3

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import uvicorn
import os
from contextlib import asynccontextmanager
from pathlib import Path

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

# Include routers
app.include_router(admin_router, prefix="/api")

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
    return {"status": "healthy", "message": "DealSphere Python API is running"}

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

# Serve static files for frontend (when built)
frontend_dist_path = Path("../client/dist")
if frontend_dist_path.exists():
    app.mount("/assets", StaticFiles(directory="../client/dist/assets"), name="assets")
    
    # Specific route for admin
    @app.get("/admin")
    async def serve_admin():
        return FileResponse("../client/dist/index.html")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # API routes should not be caught here
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Serve index.html for all frontend routes
        return FileResponse("../client/dist/index.html")
else:
    @app.get("/")
    async def root():
        return {"message": "DealSphere Python API is running", "status": "healthy", "note": "Frontend not built"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "simple_server:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True
    )