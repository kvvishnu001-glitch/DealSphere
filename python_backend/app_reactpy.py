#!/usr/bin/env python3

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from reactpy import component, html
from reactpy.backend.fastapi import configure
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import uvicorn
import os
from contextlib import asynccontextmanager
from pathlib import Path

# Import existing modules
from database import get_db, init_database
from models import Deal as DealModel
from routes.admin import router as admin_router

# Import ReactPy components
from components.pages.home import Home

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_database()
    yield

app = FastAPI(
    title="DealSphere - Python + ReactPy",
    description="AI-powered deals platform built with Python and ReactPy",
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

# Serve static files (CSS, images, etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include existing API routers
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
    return {"status": "healthy", "message": "DealSphere Python + ReactPy API is running"}

@app.get("/api/deals")
async def get_deals(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db)):
    try:
        # Only return active, approved deals for public website
        result = await db.execute(
            select(DealModel).where(
                DealModel.is_active == True,
                DealModel.is_ai_approved == True,
                DealModel.status == 'approved'
            ).order_by(DealModel.created_at.desc()).limit(limit).offset(offset)
        )
        deals = result.scalars().all()
        
        # Convert to dict format for JSON response
        deals_list = []
        for deal in deals:
            deal_dict = {
                "id": deal.id,
                "title": deal.title,
                "description": deal.description,
                "original_price": float(deal.original_price),
                "sale_price": float(deal.sale_price),
                "discount_percentage": deal.discount_percentage,
                "image_url": deal.image_url,
                "affiliate_url": deal.affiliate_url,
                "store": deal.store,
                "store_logo_url": deal.store_logo_url,
                "category": deal.category,
                "rating": float(deal.rating) if deal.rating else None,
                "review_count": deal.review_count,
                "expires_at": deal.expires_at.isoformat() if deal.expires_at else None,
                "is_active": deal.is_active,
                "is_ai_approved": deal.is_ai_approved,
                "ai_score": float(deal.ai_score) if deal.ai_score else None,
                "ai_reasons": deal.ai_reasons,
                "popularity": deal.popularity,
                "click_count": deal.click_count,
                "share_count": deal.share_count,
                "deal_type": deal.deal_type,
                "source_api": deal.source_api,
                "created_at": deal.created_at.isoformat() if deal.created_at else None,
                "updated_at": deal.updated_at.isoformat() if deal.updated_at else None
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
        print(f"Error counting deals: {e}")
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
        
        return {"affiliate_url": deal.affiliate_url}
    except Exception as e:
        print(f"Error tracking click: {e}")
        return {"error": "Failed to track click"}

# Configure ReactPy to serve the Home component
configure(app, Home)

# Serve admin routes separately (you can create ReactPy admin components later)
@app.get("/admin")
async def serve_admin():
    return HTMLResponse("""
    <!DOCTYPE html>
    <html>
    <head>
        <title>DealSphere Admin</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
        <div class="min-h-screen bg-gray-100 flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-md">
                <h1 class="text-2xl font-bold mb-4">DealSphere Admin</h1>
                <p class="text-gray-600 mb-4">Admin interface will be converted to ReactPy soon.</p>
                <a href="/" class="text-blue-600 hover:underline">← Back to Home</a>
            </div>
        </div>
    </body>
    </html>
    """)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "app_reactpy:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True
    )