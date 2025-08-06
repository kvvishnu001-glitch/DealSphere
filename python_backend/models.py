from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from database import Base

# SQLAlchemy Models
class Deal(Base):
    __tablename__ = "deals"
    
    id = Column(String, primary_key=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    original_price = Column(Numeric(10, 2), nullable=False)
    sale_price = Column(Numeric(10, 2), nullable=False)
    discount_percentage = Column(Integer, nullable=False)
    image_url = Column(Text)
    affiliate_url = Column(Text, nullable=False)
    store = Column(String, nullable=False)
    store_logo_url = Column(Text)
    category = Column(String, nullable=False)
    rating = Column(Numeric(2, 1))
    review_count = Column(Integer, default=0)
    expires_at = Column(DateTime)
    is_active = Column(Boolean, default=True)
    is_ai_approved = Column(Boolean, default=False)
    ai_score = Column(Numeric(3, 1))
    ai_reasons = Column(JSON)
    popularity = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    deal_type = Column(String, nullable=False, default='latest')
    source_api = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    clicks = relationship("DealClick", back_populates="deal")
    shares = relationship("SocialShare", back_populates="deal")

class DealClick(Base):
    __tablename__ = "deal_clicks"
    
    id = Column(String, primary_key=True)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    ip_address = Column(String)
    user_agent = Column(Text)
    referrer = Column(Text)
    clicked_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="clicks")

class SocialShare(Base):
    __tablename__ = "social_shares"
    
    id = Column(String, primary_key=True)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    platform = Column(String, nullable=False)
    ip_address = Column(String)
    shared_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="shares")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    profile_image_url = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Session(Base):
    __tablename__ = "sessions"
    
    sid = Column(String, primary_key=True)
    sess = Column(JSON, nullable=False)
    expire = Column(DateTime, nullable=False)

# Pydantic Models
class DealBase(BaseModel):
    title: str
    description: Optional[str] = None
    original_price: float
    sale_price: float
    discount_percentage: int
    image_url: Optional[str] = None
    affiliate_url: str
    store: str
    store_logo_url: Optional[str] = None
    category: str
    rating: Optional[float] = None
    review_count: Optional[int] = 0
    expires_at: Optional[datetime] = None
    deal_type: str = 'latest'
    source_api: Optional[str] = None

class DealCreate(DealBase):
    pass

class DealResponse(DealBase):
    id: str
    is_active: bool
    is_ai_approved: bool
    ai_score: Optional[float] = None
    ai_reasons: Optional[Dict[str, Any]] = None
    popularity: int
    click_count: int
    share_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class DealClickCreate(BaseModel):
    deal_id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

class SocialShareCreate(BaseModel):
    deal_id: str
    platform: str
    ip_address: Optional[str] = None

class Analytics(BaseModel):
    total_deals: int
    ai_approved: int
    pending_review: int
    clicks_today: int

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    first_name: Optional[str]
    last_name: Optional[str]
    profile_image_url: Optional[str]
    
    class Config:
        from_attributes = True

class AdminUserCreate(BaseModel):
    username: str
    email: str
    password: str

class AdminUserLogin(BaseModel):
    username: str
    password: str

class AdminUserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AdminMetrics(BaseModel):
    total_deals: int
    ai_approved_deals: int
    pending_deals: int
    total_clicks: int
    total_shares: int
    revenue_estimate: float
    top_categories: List[Dict[str, Any]]
    top_stores: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]