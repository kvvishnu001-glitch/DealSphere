from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import get_db
from models import DealResponse, DealClickCreate, SocialShareCreate
from services.deals_service import DealsService

router = APIRouter()

@router.get("/deals", response_model=List[DealResponse])
async def get_deals(
    deal_type: Optional[str] = Query(None, description="Filter by deal type (top, hot, latest)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    store: Optional[str] = Query(None, description="Filter by store"),
    limit: int = Query(50, ge=1, le=100, description="Number of deals to return"),
    offset: int = Query(0, ge=0, description="Number of deals to skip"),
    db: AsyncSession = Depends(get_db)
):
    """Get deals with optional filtering - publicly accessible"""
    deals_service = DealsService(db)
    deals = await deals_service.get_deals(
        deal_type=deal_type,
        category=category,
        store=store,
        limit=limit,
        offset=offset,
        only_approved=True  # Only show approved deals to public
    )
    return deals

@router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(deal_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific deal by ID - publicly accessible"""
    deals_service = DealsService(db)
    deal = await deals_service.get_deal_by_id(deal_id)
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return deal

@router.post("/deals/{deal_id}/click")
async def track_deal_click(
    deal_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Track a deal click and return affiliate URL - publicly accessible"""
    deals_service = DealsService(db)
    
    # Get client info
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")
    
    click_data = DealClickCreate(
        deal_id=deal_id,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referrer
    )
    
    try:
        affiliate_url = await deals_service.track_deal_click(deal_id, click_data)
        return {"affiliateUrl": affiliate_url}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/deals/{deal_id}/share")
async def track_social_share(
    deal_id: str,
    platform: str,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Track a social share - publicly accessible"""
    deals_service = DealsService(db)
    
    ip_address = request.client.host if request.client else None
    
    share_data = SocialShareCreate(
        deal_id=deal_id,
        platform=platform,
        ip_address=ip_address
    )
    
    success = await deals_service.track_social_share(share_data)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to track share")
    
    return {"success": True}

@router.get("/categories", response_model=List[str])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all available categories - publicly accessible"""
    deals_service = DealsService(db)
    categories = await deals_service.get_categories()
    return categories

@router.get("/stores", response_model=List[str])
async def get_stores(db: AsyncSession = Depends(get_db)):
    """Get all available stores - publicly accessible"""
    deals_service = DealsService(db)
    stores = await deals_service.get_stores()
    return stores