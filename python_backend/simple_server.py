#!/usr/bin/env python3

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, distinct
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from pathlib import Path

from database import get_db, init_database
from models import Deal as DealModel
from routes.admin import router as admin_router
from seo_helper import (
    generate_deal_seo, generate_home_seo, generate_category_seo,
    generate_about_seo, generate_contact_seo, generate_blog_seo,
    generate_generic_seo, inject_seo_into_html
)
from routes.seo import router as seo_router


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, login_limit: int = 5, login_window: int = 300,
                 api_limit: int = 100, api_window: int = 60):
        super().__init__(app)
        self.login_limit = login_limit
        self.login_window = login_window
        self.api_limit = api_limit
        self.api_window = api_window
        self.login_attempts = defaultdict(list)
        self.api_requests = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _clean_old_entries(self, entries: list, window: int):
        now = time.time()
        while entries and entries[0] < now - window:
            entries.pop(0)

    async def dispatch(self, request: Request, call_next):
        client_ip = self._get_client_ip(request)
        now = time.time()

        if request.url.path == "/api/admin/login" and request.method == "POST":
            self._clean_old_entries(self.login_attempts[client_ip], self.login_window)
            if len(self.login_attempts[client_ip]) >= self.login_limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many login attempts. Please try again later."}
                )
            self.login_attempts[client_ip].append(now)

        elif request.url.path.startswith("/api/") and request.url.path != "/api/health":
            self._clean_old_entries(self.api_requests[client_ip], self.api_window)
            if len(self.api_requests[client_ip]) >= self.api_limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Please slow down."}
                )
            self.api_requests[client_ip].append(now)

        response = await call_next(request)
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database()
    yield

app = FastAPI(
    title="DealSphere API",
    description="AI-powered deals and coupons platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
    openapi_url=None
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
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

# Include SEO router (sitemap.xml, robots.txt, seo categories)
app.include_router(seo_router)

# Serve static files for frontend (when built)
frontend_dist_path = Path("../client/dist")
HTML_PATH = "../client/dist/index.html"

def _read_html():
    with open(HTML_PATH, 'r', encoding='utf-8') as f:
        return f.read()

def _get_base_url(request: Request) -> str:
    forwarded_proto = request.headers.get("x-forwarded-proto", "https")
    host = request.headers.get("host", request.base_url.hostname)
    return f"{forwarded_proto}://{host}"

if frontend_dist_path.exists():
    app.mount("/assets", StaticFiles(directory="../client/dist/assets"), name="assets")

    @app.get("/")
    async def serve_home(request: Request, db: AsyncSession = Depends(get_db)):
        base_url = _get_base_url(request)
        html_content = _read_html()
        try:
            result = await db.execute(
                select(func.count()).select_from(DealModel).where(
                    DealModel.is_active == True,
                    DealModel.is_ai_approved == True,
                    DealModel.status == 'approved'
                )
            )
            deal_count = result.scalar() or 0
        except Exception:
            deal_count = 0
        seo_tags = generate_home_seo(base_url, deal_count)
        return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")

    @app.api_route("/deals/{deal_id}", methods=["GET", "HEAD"])
    async def serve_deal_page(deal_id: str, request: Request, db: AsyncSession = Depends(get_db)):
        base_url = _get_base_url(request)
        html_content = _read_html()
        try:
            result = await db.execute(select(DealModel).where(DealModel.id == deal_id))
            deal = result.scalar_one_or_none()
            if deal:
                seo_tags = generate_deal_seo(deal, base_url)
                return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")
        except Exception as e:
            print(f"Error serving deal page: {e}")
        return Response(content=html_content, media_type="text/html")

    @app.get("/category/{category_slug}")
    async def serve_category_page(category_slug: str, request: Request, db: AsyncSession = Depends(get_db)):
        import re as _re
        base_url = _get_base_url(request)
        html_content = _read_html()
        try:
            cat_result = await db.execute(
                select(distinct(DealModel.category)).where(
                    DealModel.is_active == True,
                    DealModel.is_ai_approved == True,
                    DealModel.status == 'approved'
                )
            )
            all_cats = [r[0] for r in cat_result.all() if r[0]]
            category_name = None
            for cat in all_cats:
                slug = _re.sub(r'[^a-z0-9]+', '-', cat.lower()).strip('-')
                if slug == category_slug:
                    category_name = cat
                    break
            if not category_name:
                category_name = category_slug.replace('-', ' ').title()
            
            result = await db.execute(
                select(func.count()).select_from(DealModel).where(
                    DealModel.is_active == True,
                    DealModel.is_ai_approved == True,
                    DealModel.status == 'approved',
                    func.lower(DealModel.category) == category_name.lower()
                )
            )
            deal_count = result.scalar() or 0
        except Exception:
            category_name = category_slug.replace('-', ' ').title()
            deal_count = 0
        seo_tags = generate_category_seo(category_name, category_slug, base_url, deal_count)
        return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")

    @app.get("/about")
    async def serve_about(request: Request):
        base_url = _get_base_url(request)
        html_content = _read_html()
        seo_tags = generate_about_seo(base_url)
        return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")

    @app.get("/contact")
    async def serve_contact(request: Request):
        base_url = _get_base_url(request)
        html_content = _read_html()
        seo_tags = generate_contact_seo(base_url)
        return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")

    @app.get("/blog")
    async def serve_blog(request: Request):
        base_url = _get_base_url(request)
        html_content = _read_html()
        seo_tags = generate_blog_seo(base_url)
        return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")

    @app.get("/admin")
    @app.get("/admin/dashboard")
    async def serve_admin():
        return FileResponse(HTML_PATH)

    @app.get("/privacy-policy")
    async def serve_privacy(request: Request):
        base_url = _get_base_url(request)
        html_content = _read_html()
        seo_tags = generate_generic_seo(
            "Privacy Policy | DealSphere",
            "Read DealSphere's privacy policy. Learn how we protect your data and handle information.",
            f"{base_url}/privacy-policy", base_url
        )
        return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")

    @app.get("/terms-conditions")
    async def serve_terms(request: Request):
        base_url = _get_base_url(request)
        html_content = _read_html()
        seo_tags = generate_generic_seo(
            "Terms & Conditions | DealSphere",
            "Read DealSphere's terms and conditions for using our deals and coupons platform.",
            f"{base_url}/terms-conditions", base_url
        )
        return Response(content=inject_seo_into_html(html_content, seo_tags), media_type="text/html")

    @app.get("/docs")
    @app.get("/redoc")
    @app.get("/openapi.json")
    async def block_docs():
        raise HTTPException(status_code=404, detail="Not found")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str, request: Request):
        if full_path.startswith("api/") or full_path.startswith("s/"):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(HTML_PATH)
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