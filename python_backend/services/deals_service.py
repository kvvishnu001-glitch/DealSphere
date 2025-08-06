from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, asc
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from models import Deal as DealModel, DealClick as DealClickModel, SocialShare as SocialShareModel
from models import DealResponse, DealCreate, DealClickCreate, SocialShareCreate

class DealsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_deals(
        self, 
        deal_type: Optional[str] = None,
        category: Optional[str] = None,
        store: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        only_approved: bool = True
    ) -> List[DealResponse]:
        """Get deals with optional filtering"""
        query = select(DealModel).where(DealModel.is_active == True)
        
        if only_approved:
            query = query.where(DealModel.is_ai_approved == True)
        
        if deal_type:
            query = query.where(DealModel.deal_type == deal_type)
        
        if category:
            query = query.where(DealModel.category == category)
            
        if store:
            query = query.where(DealModel.store == store)
        
        # Order by popularity for 'top', created_at for others
        if deal_type == 'top':
            query = query.order_by(desc(DealModel.popularity), desc(DealModel.created_at))
        elif deal_type == 'hot':
            query = query.order_by(desc(DealModel.click_count), desc(DealModel.created_at))
        else:  # latest or no deal_type
            query = query.order_by(desc(DealModel.created_at))
        
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        deals = result.scalars().all()
        
        return [DealResponse.model_validate(deal) for deal in deals]

    async def get_deal_by_id(self, deal_id: str) -> Optional[DealResponse]:
        """Get a single deal by ID"""
        query = select(DealModel).where(DealModel.id == deal_id)
        result = await self.db.execute(query)
        deal = result.scalar_one_or_none()
        
        if deal:
            return DealResponse.model_validate(deal)
        return None

    async def create_deal(self, deal_data: DealCreate) -> DealResponse:
        """Create a new deal"""
        deal = DealModel(
            id=str(uuid.uuid4()),
            **deal_data.model_dump()
        )
        
        self.db.add(deal)
        await self.db.commit()
        await self.db.refresh(deal)
        
        return DealResponse.model_validate(deal)

    async def track_deal_click(self, deal_id: str, click_data: DealClickCreate) -> str:
        """Track a deal click and return the affiliate URL"""
        # First, get the deal
        deal = await self.get_deal_by_id(deal_id)
        if not deal:
            raise ValueError("Deal not found")
        
        # Create click record
        click = DealClickModel(
            id=str(uuid.uuid4()),
            deal_id=deal_id,
            ip_address=click_data.ip_address,
            user_agent=click_data.user_agent,
            referrer=click_data.referrer
        )
        
        # Update deal click count
        query = select(DealModel).where(DealModel.id == deal_id)
        result = await self.db.execute(query)
        deal_model = result.scalar_one_or_none()
        
        if deal_model:
            deal_model.click_count = (deal_model.click_count or 0) + 1
            deal_model.popularity = (deal_model.popularity or 0) + 1
        
        self.db.add(click)
        await self.db.commit()
        
        return deal.affiliate_url

    async def track_social_share(self, share_data: SocialShareCreate) -> bool:
        """Track a social share"""
        share = SocialShareModel(
            id=str(uuid.uuid4()),
            **share_data.model_dump()
        )
        
        # Update deal share count
        query = select(DealModel).where(DealModel.id == share_data.deal_id)
        result = await self.db.execute(query)
        deal_model = result.scalar_one_or_none()
        
        if deal_model:
            deal_model.share_count = (deal_model.share_count or 0) + 1
            deal_model.popularity = (deal_model.popularity or 0) + 2  # Shares count more than clicks
        
        self.db.add(share)
        await self.db.commit()
        
        return True

    async def approve_deal(self, deal_id: str) -> bool:
        """Approve a deal (admin only)"""
        query = select(DealModel).where(DealModel.id == deal_id)
        result = await self.db.execute(query)
        deal = result.scalar_one_or_none()
        
        if deal:
            deal.is_ai_approved = True
            await self.db.commit()
            return True
        return False

    async def get_pending_deals(self) -> List[DealResponse]:
        """Get deals pending approval (admin only)"""
        query = select(DealModel).where(
            and_(
                DealModel.is_active == True,
                DealModel.is_ai_approved == False
            )
        ).order_by(desc(DealModel.created_at))
        
        result = await self.db.execute(query)
        deals = result.scalars().all()
        
        return [DealResponse.model_validate(deal) for deal in deals]

    async def get_categories(self) -> List[str]:
        """Get all unique categories"""
        query = select(DealModel.category).distinct().where(
            and_(
                DealModel.is_active == True,
                DealModel.is_ai_approved == True
            )
        )
        result = await self.db.execute(query)
        categories = result.scalars().all()
        return sorted([cat for cat in categories if cat])

    async def get_stores(self) -> List[str]:
        """Get all unique stores"""
        query = select(DealModel.store).distinct().where(
            and_(
                DealModel.is_active == True,
                DealModel.is_ai_approved == True
            )
        )
        result = await self.db.execute(query)
        stores = result.scalars().all()
        return sorted([store for store in stores if store])