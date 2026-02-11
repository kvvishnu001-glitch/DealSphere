from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from typing import List
import uuid

from database import get_db
from models import Banner, BannerCreate, BannerUpdate, BannerResponse
from admin_auth import get_current_admin, check_permission

router = APIRouter()

@router.get("/banners", response_model=List[BannerResponse])
async def get_public_banners(
    position: str = None,
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    query = select(Banner).where(Banner.is_active == True)
    
    if position:
        query = query.where(Banner.position == position)
    
    query = query.order_by(Banner.sort_order.asc(), Banner.created_at.desc())
    result = await db.execute(query)
    banners = result.scalars().all()
    
    active_banners = []
    for b in banners:
        if b.start_date and b.start_date > now:
            continue
        if b.end_date and b.end_date < now:
            continue
        active_banners.append(b)
    
    return active_banners

@router.post("/banners/{banner_id}/impression")
async def track_impression(banner_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if banner:
        banner.impression_count = (banner.impression_count or 0) + 1
        await db.commit()
    return {"ok": True}

@router.post("/banners/{banner_id}/click")
async def track_banner_click(banner_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if banner:
        banner.click_count = (banner.click_count or 0) + 1
        await db.commit()
    return {"ok": True}

@router.get("/admin/banners", response_model=List[BannerResponse])
async def get_all_banners(
    current_admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    query = select(Banner).order_by(Banner.position, Banner.sort_order.asc(), Banner.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/admin/banners", response_model=BannerResponse)
async def create_banner(
    banner_data: BannerCreate,
    current_admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    
    banner = Banner(
        id=str(uuid.uuid4()),
        **banner_data.model_dump()
    )
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner

@router.put("/admin/banners/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: str,
    banner_data: BannerUpdate,
    current_admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    update_data = banner_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(banner, key, value)
    banner.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(banner)
    return banner

@router.delete("/admin/banners/{banner_id}")
async def delete_banner(
    banner_id: str,
    current_admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    await db.delete(banner)
    await db.commit()
    return {"message": "Banner deleted"}
