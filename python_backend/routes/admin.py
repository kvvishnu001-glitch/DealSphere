from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List
import uuid

from database import get_db
from models import (
    Deal, AdminUser, DealClick, SocialShare,
    AdminUserCreate, AdminUserLogin, AdminUserResponse, AdminMetrics,
    DealCreate, DealResponse
)
from admin_auth import (
    authenticate_admin, create_access_token, get_current_admin,
    create_admin_user
)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/register", response_model=AdminUserResponse)
async def register_admin(admin_data: AdminUserCreate, db: Session = Depends(get_db)):
    """Register a new admin user"""
    try:
        admin = create_admin_user(admin_data.username, admin_data.email, admin_data.password, db)
        return admin
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login")
async def login_admin(login_data: AdminUserLogin, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    admin = authenticate_admin(login_data.username, login_data.password, db)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": admin.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": AdminUserResponse.model_validate(admin)
    }

@router.get("/me", response_model=AdminUserResponse)
async def get_current_admin_info(current_admin: AdminUser = Depends(get_current_admin)):
    """Get current admin user information"""
    return current_admin

@router.get("/metrics", response_model=AdminMetrics)
async def get_admin_metrics(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get admin dashboard metrics"""
    
    # Basic counts
    total_deals = db.query(Deal).count()
    ai_approved_deals = db.query(Deal).filter(Deal.is_ai_approved == True).count()
    pending_deals = db.query(Deal).filter(Deal.is_ai_approved == False).count()
    
    # Click and share counts
    total_clicks = db.query(func.sum(Deal.click_count)).scalar() or 0
    total_shares = db.query(func.sum(Deal.share_count)).scalar() or 0
    
    # Revenue estimate (assuming $0.05 per click)
    revenue_estimate = float(total_clicks) * 0.05
    
    # Top categories
    top_categories = db.query(
        Deal.category,
        func.count(Deal.id).label('count'),
        func.sum(Deal.click_count).label('clicks')
    ).group_by(Deal.category).order_by(desc('count')).limit(5).all()
    
    top_categories_list = [
        {
            "category": cat.category,
            "deals_count": cat.count,
            "clicks": cat.clicks or 0
        }
        for cat in top_categories
    ]
    
    # Top stores
    top_stores = db.query(
        Deal.store,
        func.count(Deal.id).label('count'),
        func.sum(Deal.click_count).label('clicks')
    ).group_by(Deal.store).order_by(desc('count')).limit(5).all()
    
    top_stores_list = [
        {
            "store": store.store,
            "deals_count": store.count,
            "clicks": store.clicks or 0
        }
        for store in top_stores
    ]
    
    # Recent activity (last 10 deals)
    recent_deals = db.query(Deal).order_by(desc(Deal.created_at)).limit(10).all()
    recent_activity = [
        {
            "id": deal.id,
            "title": deal.title,
            "store": deal.store,
            "category": deal.category,
            "created_at": deal.created_at.isoformat(),
            "clicks": deal.click_count,
            "ai_approved": deal.is_ai_approved
        }
        for deal in recent_deals
    ]
    
    return AdminMetrics(
        total_deals=total_deals,
        ai_approved_deals=ai_approved_deals,
        pending_deals=pending_deals,
        total_clicks=total_clicks,
        total_shares=total_shares,
        revenue_estimate=revenue_estimate,
        top_categories=top_categories_list,
        top_stores=top_stores_list,
        recent_activity=recent_activity
    )

@router.get("/deals", response_model=List[DealResponse])
async def get_all_deals(
    skip: int = 0,
    limit: int = 50,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all deals for admin management"""
    deals = db.query(Deal).order_by(desc(Deal.created_at)).offset(skip).limit(limit).all()
    return deals

@router.post("/deals", response_model=DealResponse)
async def create_deal(
    deal_data: DealCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new deal"""
    deal = Deal(
        id=str(uuid.uuid4()),
        **deal_data.model_dump()
    )
    
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal

@router.put("/deals/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: str,
    deal_data: DealCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update an existing deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    for field, value in deal_data.model_dump().items():
        setattr(deal, field, value)
    
    deal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(deal)
    return deal

@router.delete("/deals/{deal_id}")
async def delete_deal(
    deal_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Delete related records first
    db.query(DealClick).filter(DealClick.deal_id == deal_id).delete()
    db.query(SocialShare).filter(SocialShare.deal_id == deal_id).delete()
    
    db.delete(deal)
    db.commit()
    return {"message": "Deal deleted successfully"}

@router.patch("/deals/{deal_id}/approve")
async def approve_deal(
    deal_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Approve a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal.is_ai_approved = True
    deal.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Deal approved successfully"}

@router.patch("/deals/{deal_id}/reject")
async def reject_deal(
    deal_id: str,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Reject a deal"""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal.is_ai_approved = False
    deal.is_active = False
    deal.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Deal rejected successfully"}