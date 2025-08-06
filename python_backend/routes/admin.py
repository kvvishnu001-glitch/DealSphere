from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import get_db
from models import DealResponse, Analytics, UserResponse
from services.deals_service import DealsService
from services.analytics_service import AnalyticsService
from auth import get_current_user

router = APIRouter()

@router.get("/analytics", response_model=Analytics)
async def get_analytics(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard analytics - admin only"""
    analytics_service = AnalyticsService(db)
    analytics = await analytics_service.get_analytics()
    return analytics

@router.get("/deals/pending", response_model=List[DealResponse])
async def get_pending_deals(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get deals pending approval - admin only"""
    deals_service = DealsService(db)
    deals = await deals_service.get_pending_deals()
    return deals

@router.post("/deals/{deal_id}/approve")
async def approve_deal(
    deal_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Approve a deal - admin only"""
    deals_service = DealsService(db)
    success = await deals_service.approve_deal(deal_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    return {"success": True, "message": "Deal approved successfully"}