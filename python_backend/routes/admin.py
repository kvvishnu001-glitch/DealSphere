from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, desc, select, and_
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from database import get_db
from models import (
    Deal, AdminUser, DealClick, SocialShare, AuditLog,
    AdminUserCreate, AdminUserLogin, AdminUserResponse, AdminMetrics,
    AdminUserUpdate, AuditLogResponse,
    DealCreate, DealResponse, AVAILABLE_PERMISSIONS
)
from admin_auth import (
    authenticate_admin, create_access_token, get_current_admin,
    create_admin_user, check_permission, log_audit, hash_password
)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/login")
async def login_admin(request: Request, login_data: AdminUserLogin, db: AsyncSession = Depends(get_db)):
    admin = await authenticate_admin(login_data.username, login_data.password, db)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": admin.id})
    await log_audit(db, admin, "login", "auth", ip_address=request.client.host if request.client else None)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "admin": AdminUserResponse.model_validate(admin)
    }

@router.get("/me", response_model=AdminUserResponse)
async def get_current_admin_info(current_admin: AdminUser = Depends(get_current_admin)):
    return current_admin

@router.get("/permissions")
async def get_available_permissions(current_admin: AdminUser = Depends(get_current_admin)):
    return {"permissions": AVAILABLE_PERMISSIONS}

@router.get("/users", response_model=List[AdminUserResponse])
async def list_users(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_users")
    result = await db.execute(select(AdminUser).order_by(desc(AdminUser.created_at)))
    users = result.scalars().all()
    return users

@router.post("/users", response_model=AdminUserResponse)
async def create_user(
    request: Request,
    user_data: AdminUserCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_users")
    
    valid_perms = [p for p in user_data.permissions if p in AVAILABLE_PERMISSIONS]
    
    admin = await create_admin_user(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        db=db,
        role=user_data.role,
        permissions=valid_perms,
        created_by=current_admin.id
    )
    
    await log_audit(
        db, current_admin, "create_user", "user", admin.id,
        {"username": admin.username, "role": admin.role, "permissions": valid_perms},
        ip_address=request.client.host if request.client else None
    )
    
    return admin

@router.put("/users/{user_id}", response_model=AdminUserResponse)
async def update_user(
    user_id: str,
    request: Request,
    user_data: AdminUserUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_users")
    
    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == 'super_admin' and current_admin.role != 'super_admin':
        raise HTTPException(status_code=403, detail="Cannot modify super admin")
    
    changes = {}
    if user_data.email is not None:
        user.email = user_data.email
        changes["email"] = user_data.email
    if user_data.role is not None:
        if user_data.role == 'super_admin' and current_admin.role != 'super_admin':
            raise HTTPException(status_code=403, detail="Only super admins can grant super admin role")
        user.role = user_data.role
        changes["role"] = user_data.role
    if user_data.permissions is not None:
        valid_perms = [p for p in user_data.permissions if p in AVAILABLE_PERMISSIONS]
        user.permissions = valid_perms
        changes["permissions"] = valid_perms
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
        changes["is_active"] = user_data.is_active
    
    user.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    
    await log_audit(
        db, current_admin, "update_user", "user", user_id,
        {"username": user.username, "changes": changes},
        ip_address=request.client.host if request.client else None
    )
    
    return user

@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_users")
    
    if user_id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own account")
    
    result = await db.execute(select(AdminUser).where(AdminUser.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == 'super_admin' and current_admin.role != 'super_admin':
        raise HTTPException(status_code=403, detail="Cannot modify super admin")
    
    user.is_active = not user.is_active
    user.updated_at = datetime.utcnow()
    await db.commit()
    
    action = "enable_user" if user.is_active else "disable_user"
    await log_audit(
        db, current_admin, action, "user", user_id,
        {"username": user.username, "is_active": user.is_active},
        ip_address=request.client.host if request.client else None
    )
    
    return {"message": f"User {'enabled' if user.is_active else 'disabled'}", "is_active": user.is_active}

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    admin_id: Optional[str] = None,
    action: Optional[str] = None,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_users")
    
    query = select(AuditLog)
    if admin_id:
        query = query.where(AuditLog.admin_id == admin_id)
    if action:
        query = query.where(AuditLog.action == action)
    
    query = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return logs

@router.get("/metrics", response_model=AdminMetrics)
async def get_admin_metrics(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "view_analytics")
    
    total_deals_result = await db.execute(select(func.count(Deal.id)))
    total_deals = total_deals_result.scalar() or 0
    
    ai_approved_result = await db.execute(select(func.count(Deal.id)).where(Deal.is_ai_approved == True))
    ai_approved_deals = ai_approved_result.scalar() or 0
    
    pending_result = await db.execute(select(func.count(Deal.id)).where(Deal.is_ai_approved == False))
    pending_deals = pending_result.scalar() or 0
    
    clicks_result = await db.execute(select(func.sum(Deal.click_count)))
    total_clicks = clicks_result.scalar() or 0
    
    shares_result = await db.execute(select(func.sum(Deal.share_count)))
    total_shares = shares_result.scalar() or 0
    
    revenue_estimate = float(total_clicks) * 0.05
    
    top_categories_result = await db.execute(
        select(
            Deal.category,
            func.count(Deal.id).label('count'),
            func.sum(Deal.click_count).label('clicks')
        ).group_by(Deal.category).order_by(desc('count')).limit(5)
    )
    top_categories = top_categories_result.all()
    
    top_categories_list = [
        {"category": cat.category, "deals_count": cat.count, "clicks": cat.clicks or 0}
        for cat in top_categories
    ]
    
    top_stores_result = await db.execute(
        select(
            Deal.store,
            func.count(Deal.id).label('count'),
            func.sum(Deal.click_count).label('clicks')
        ).group_by(Deal.store).order_by(desc('count')).limit(5)
    )
    top_stores = top_stores_result.all()
    
    top_stores_list = [
        {"store": store.store, "deals_count": store.count, "clicks": store.clicks or 0}
        for store in top_stores
    ]
    
    recent_deals_result = await db.execute(select(Deal).order_by(desc(Deal.created_at)).limit(10))
    recent_deals = recent_deals_result.scalars().all()
    
    recent_activity = [
        {
            "id": deal.id, "title": deal.title, "store": deal.store,
            "category": deal.category, "created_at": deal.created_at.isoformat(),
            "clicks": deal.click_count, "ai_approved": deal.is_ai_approved
        }
        for deal in recent_deals
    ]
    
    return AdminMetrics(
        total_deals=total_deals, ai_approved_deals=ai_approved_deals,
        pending_deals=pending_deals, total_clicks=total_clicks,
        total_shares=total_shares, revenue_estimate=revenue_estimate,
        top_categories=top_categories_list, top_stores=top_stores_list,
        recent_activity=recent_activity
    )

@router.get("/deals")
async def get_all_deals(
    page: int = 1, per_page: int = 25,
    search: str = "", category: str = "", deal_status: str = "",
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    page = max(1, page)
    per_page = max(1, min(per_page, 100))
    base_filter = Deal.status != "deleted"
    query = select(Deal).where(base_filter)
    count_query = select(func.count(Deal.id)).where(base_filter)

    if search:
        search_term = f"%{search}%"
        search_filter = Deal.title.ilike(search_term) | Deal.store.ilike(search_term) | Deal.category.ilike(search_term)
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    if category:
        query = query.where(Deal.category == category)
        count_query = count_query.where(Deal.category == category)
    if deal_status and deal_status != "needs_review":
        if deal_status == "approved":
            status_filter = and_(Deal.status == "approved", Deal.is_ai_approved == True)
        elif deal_status == "pending":
            status_filter = Deal.status == "pending"
        elif deal_status == "rejected":
            status_filter = Deal.status == "rejected"
        else:
            status_filter = Deal.status == deal_status
        query = query.where(status_filter)
        count_query = count_query.where(status_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    offset = (page - 1) * per_page
    query = query.order_by(desc(Deal.created_at)).offset(offset).limit(per_page)
    result = await db.execute(query)
    deals = result.scalars().all()

    return {
        "deals": [DealResponse.model_validate(d) for d in deals],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if total > 0 else 1
    }

@router.post("/deals", response_model=DealResponse)
async def create_deal(
    request: Request, deal_data: DealCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    deal = Deal(id=str(uuid.uuid4()), **deal_data.model_dump())
    db.add(deal)
    await db.commit()
    await db.refresh(deal)
    
    await log_audit(
        db, current_admin, "create_deal", "deal", deal.id,
        {"title": deal.title, "store": deal.store},
        ip_address=request.client.host if request.client else None
    )
    return deal

@router.put("/deals/{deal_id}", response_model=DealResponse)
async def update_deal(
    deal_id: str, request: Request, deal_data: DealCreate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    for field, value in deal_data.model_dump().items():
        setattr(deal, field, value)
    deal.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(deal)
    
    await log_audit(
        db, current_admin, "update_deal", "deal", deal_id,
        {"title": deal.title},
        ip_address=request.client.host if request.client else None
    )
    return deal

@router.delete("/deals/{deal_id}")
async def delete_deal(
    deal_id: str, request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal.status = 'deleted'
    deal.is_active = False
    deal.deleted_at = datetime.utcnow()
    deal.updated_at = datetime.utcnow()
    await db.commit()
    
    await log_audit(
        db, current_admin, "delete_deal", "deal", deal_id,
        {"title": deal.title},
        ip_address=request.client.host if request.client else None
    )
    return {"message": "Deal deleted and removed from website"}

@router.patch("/deals/{deal_id}/approve")
async def approve_deal(
    deal_id: str, request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "approve_deals")
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal.is_ai_approved = True
    deal.status = 'approved'
    deal.is_active = True
    deal.updated_at = datetime.utcnow()
    await db.commit()
    
    await log_audit(
        db, current_admin, "approve_deal", "deal", deal_id,
        {"title": deal.title},
        ip_address=request.client.host if request.client else None
    )
    return {"message": "Deal approved and is now live on website"}

@router.patch("/deals/{deal_id}/reject")
async def reject_deal(
    deal_id: str, request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "approve_deals")
    result = await db.execute(select(Deal).where(Deal.id == deal_id))
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    deal.is_ai_approved = False
    deal.status = 'rejected'
    deal.is_active = False
    deal.rejected_at = datetime.utcnow()
    deal.updated_at = datetime.utcnow()
    await db.commit()
    
    await log_audit(
        db, current_admin, "reject_deal", "deal", deal_id,
        {"title": deal.title},
        ip_address=request.client.host if request.client else None
    )
    return {"message": "Deal rejected and removed from website"}

@router.get("/deals/search")
async def search_admin_deals(
    q: str = "", category: str = "", store: str = "", deal_status: str = "",
    skip: int = 0, limit: int = 50,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    query = select(Deal)
    if q:
        search_term = f"%{q}%"
        query = query.where(Deal.title.ilike(search_term))
    if category:
        query = query.where(Deal.category == category)
    if store:
        query = query.where(Deal.store == store)
    if deal_status:
        query = query.where(Deal.status == deal_status)
    
    query = query.order_by(desc(Deal.created_at)).offset(skip).limit(limit)
    result = await db.execute(query)
    deals = result.scalars().all()
    return deals

@router.get("/deals/categories")
async def get_categories(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Deal.category).distinct())
    categories = [row[0] for row in result.all()]
    return {"categories": categories}

@router.get("/deals/stores")
async def get_stores(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Deal.store).distinct())
    stores = [row[0] for row in result.all()]
    return {"stores": stores}

@router.post("/cleanup/rejected-deals")
async def cleanup_rejected_deals(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    cutoff_date = datetime.utcnow() - timedelta(days=1)
    result = await db.execute(
        select(Deal).where(Deal.status == 'rejected', Deal.rejected_at < cutoff_date)
    )
    old_rejected_deals = result.scalars().all()
    
    for deal in old_rejected_deals:
        await db.delete(deal)
    await db.commit()
    
    await log_audit(
        db, current_admin, "cleanup_rejected_deals", "deal", None,
        {"count": len(old_rejected_deals)},
        ip_address=request.client.host if request.client else None
    )
    return {"message": f"Cleaned up {len(old_rejected_deals)} old rejected deals"}

@router.get("/url-health")
async def get_url_health_stats_endpoint(
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    from services.url_health_checker import get_url_health_stats, get_check_progress
    stats = await get_url_health_stats()
    progress = get_check_progress()
    stats["check_progress"] = progress
    return stats

@router.post("/url-health/check")
async def trigger_url_health_check(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    from services.url_health_checker import run_url_health_check
    result = await run_url_health_check(check_all=True)
    await log_audit(
        db, current_admin, "trigger_url_health_check", "deal", None,
        {"result": result},
        ip_address=request.client.host if request.client else None
    )
    return result

@router.post("/url-health/cleanup")
async def trigger_stale_cleanup(
    request: Request,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    check_permission(current_admin, "manage_deals")
    from services.url_health_checker import cleanup_stale_flagged_deals
    result = await cleanup_stale_flagged_deals()
    await log_audit(
        db, current_admin, "trigger_stale_cleanup", "deal", None,
        {"result": result},
        ip_address=request.client.host if request.client else None
    )
    return result


class BulkActionRequest(BaseModel):
    deal_ids: List[str]
    action: str


@router.post("/deals/bulk")
async def bulk_deal_action(
    request: Request,
    body: BulkActionRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    if body.action not in ("approve", "reject", "delete"):
        raise HTTPException(status_code=400, detail="Invalid action. Must be approve, reject, or delete.")
    if not body.deal_ids:
        raise HTTPException(status_code=400, detail="No deal IDs provided.")

    if body.action in ("approve", "reject"):
        check_permission(current_admin, "approve_deals")
    else:
        check_permission(current_admin, "manage_deals")

    now = datetime.utcnow()
    result = await db.execute(
        select(Deal).where(Deal.id.in_(body.deal_ids))
    )
    deals = result.scalars().all()
    affected = 0

    for deal in deals:
        if body.action == "approve":
            deal.status = "approved"
            deal.is_ai_approved = True
            deal.is_active = True
            deal.updated_at = now
            affected += 1
        elif body.action == "reject":
            deal.status = "rejected"
            deal.is_ai_approved = False
            deal.is_active = False
            deal.rejected_at = now
            deal.updated_at = now
            affected += 1
        elif body.action == "delete":
            deal.status = "deleted"
            deal.is_active = False
            deal.deleted_at = now
            deal.updated_at = now
            affected += 1

    await db.commit()
    await log_audit(
        db, current_admin, f"bulk_{body.action}", "deal", None,
        {"deal_ids": body.deal_ids, "affected": affected},
        ip_address=request.client.host if request.client else None
    )
    return {"message": f"Successfully {body.action}d {affected} deals", "affected": affected}
