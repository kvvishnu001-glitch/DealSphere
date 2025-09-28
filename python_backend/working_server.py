#!/usr/bin/env python3

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from reactpy import component, html, hooks
from reactpy.backend.fastapi import configure
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uvicorn
import os
from contextlib import asynccontextmanager

# Import database and models
from database import get_db, init_database
from models import Deal as DealModel

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    try:
        await init_database()
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
    yield

# Create FastAPI app
app = FastAPI(
    title="DealSphere",
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

# API Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "DealSphere is running with ReactPy"}

@app.get("/api/deals")
async def get_deals(db: AsyncSession = Depends(get_db)):
    try:
        # Get active deals
        result = await db.execute(
            select(DealModel).where(
                DealModel.is_active == True,
                DealModel.is_ai_approved == True,
                DealModel.status == 'approved'
            ).order_by(DealModel.created_at.desc()).limit(20)
        )
        deals = result.scalars().all()
        
        # Convert to dict format
        deals_list = []
        for deal in deals:
            deals_list.append({
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
            })
        
        return deals_list
    except Exception as e:
        print(f"Error fetching deals: {e}")
        return []

# Simple ReactPy Component
@component
def DealSphere():
    # State for deals
    deals, set_deals = hooks.use_state([])
    loading, set_loading = hooks.use_state(True)
    
    # Fetch deals
    async def fetch_deals():
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get("http://localhost:5000/api/deals") as response:
                    if response.status == 200:
                        deals_data = await response.json()
                        set_deals(deals_data)
        except Exception as e:
            print(f"Error fetching deals: {e}")
        finally:
            set_loading(False)
    
    # Effect to load deals
    hooks.use_effect(lambda: fetch_deals(), [])
    
    if loading:
        return html.div(
            {"style": {"padding": "20px", "text-align": "center"}},
            html.h1("🔄 Loading DealSphere..."),
            html.p("Fetching the best deals for you!")
        )
    
    return html.div(
        {"style": {"fontFamily": "Arial, sans-serif", "padding": "20px"}},
        
        # Header
        html.header(
            {"style": {"backgroundColor": "#f8f9fa", "padding": "20px", "marginBottom": "20px", "borderRadius": "8px"}},
            html.h1(
                {"style": {"color": "#333", "margin": "0", "fontSize": "2.5em"}},
                "💰 DealSphere"
            ),
            html.p(
                {"style": {"color": "#666", "margin": "10px 0 0 0", "fontSize": "1.2em"}},
                f"Discover {len(deals)} AI-verified deals"
            )
        ),
        
        # Deals Grid
        html.div(
            {"style": {"display": "grid", "gridTemplateColumns": "repeat(auto-fill, minmax(300px, 1fr))", "gap": "20px"}},
            [DealCard(deal) for deal in deals[:12]] if deals else [
                html.p(
                    {"style": {"textAlign": "center", "color": "#666", "gridColumn": "1 / -1"}},
                    "No deals available at the moment. Check back soon!"
                )
            ]
        ),
        
        # Footer
        html.footer(
            {"style": {"marginTop": "40px", "textAlign": "center", "color": "#666", "borderTop": "1px solid #eee", "paddingTop": "20px"}},
            html.p("🚀 DealSphere - Powered by Python & ReactPy"),
            html.p("✨ Pure Python stack - No Node.js required!")
        )
    )

@component
def DealCard(deal):
    """Individual deal card component"""
    def handle_click(event):
        print(f"Deal clicked: {deal.get('title', 'Unknown')}")
    
    discount = deal.get('discountPercentage', 0)
    original_price = float(deal.get('originalPrice', 0))
    sale_price = float(deal.get('salePrice', 0))
    
    return html.div(
        {
            "style": {
                "border": "1px solid #ddd",
                "borderRadius": "8px",
                "padding": "15px",
                "backgroundColor": "white",
                "boxShadow": "0 2px 4px rgba(0,0,0,0.1)",
                "cursor": "pointer",
                "transition": "transform 0.2s"
            },
            "onClick": handle_click,
            "onMouseOver": lambda e: e["target"].style.update({"transform": "translateY(-2px)"}),
            "onMouseOut": lambda e: e["target"].style.update({"transform": "translateY(0)"})
        },
        
        # Deal Image
        html.img({
            "src": deal.get('imageUrl', 'https://via.placeholder.com/250x150'),
            "alt": deal.get('title', ''),
            "style": {
                "width": "100%",
                "height": "150px",
                "objectFit": "cover",
                "borderRadius": "4px",
                "marginBottom": "10px"
            }
        }),
        
        # Deal Title
        html.h3(
            {"style": {"margin": "0 0 10px 0", "fontSize": "1.1em", "color": "#333"}},
            deal.get('title', 'Great Deal')[:50] + ('...' if len(deal.get('title', '')) > 50 else '')
        ),
        
        # Store
        html.p(
            {"style": {"margin": "0 0 10px 0", "color": "#666", "fontSize": "0.9em"}},
            f"🏪 {deal.get('store', 'Store')}"
        ),
        
        # Prices
        html.div(
            {"style": {"display": "flex", "justifyContent": "space-between", "alignItems": "center"}},
            html.div(
                html.span(
                    {"style": {"fontSize": "1.4em", "fontWeight": "bold", "color": "#28a745"}},
                    f"${sale_price:.2f}"
                ),
                html.span(
                    {"style": {"fontSize": "0.9em", "color": "#999", "textDecoration": "line-through", "marginLeft": "8px"}},
                    f"${original_price:.2f}"
                )
            ),
            html.span(
                {"style": {"backgroundColor": "#dc3545", "color": "white", "padding": "4px 8px", "borderRadius": "4px", "fontSize": "0.8em", "fontWeight": "bold"}},
                f"{discount}% OFF"
            )
        )
    )

# Configure ReactPy to serve the main component
configure(app, DealSphere)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Starting DealSphere server on port {port}")
    uvicorn.run(
        "working_server:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True
    )