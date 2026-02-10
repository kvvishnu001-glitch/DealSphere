import bcrypt
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import AdminUser, AuditLog
from database import get_db

import os

SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable must be set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer()

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    password_bytes = password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise credentials_exception
        return admin_id
    except JWTError:
        raise credentials_exception

async def get_current_admin(
    admin_id: str = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
) -> AdminUser:
    result = await db.execute(select(AdminUser).where(AdminUser.id == admin_id))
    admin = result.scalar_one_or_none()
    if admin is None or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin user not found or inactive"
        )
    return admin

def check_permission(admin: AdminUser, required_permission: str):
    if admin.role == 'super_admin':
        return True
    perms = admin.permissions or []
    if required_permission not in perms:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You don't have permission to perform this action ({required_permission})"
        )
    return True

async def log_audit(
    db: AsyncSession,
    admin: AdminUser,
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    audit = AuditLog(
        id=str(uuid.uuid4()),
        admin_id=admin.id,
        admin_username=admin.username,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit)
    await db.commit()

async def authenticate_admin(username: str, password: str, db: AsyncSession) -> Optional[AdminUser]:
    result = await db.execute(select(AdminUser).where(AdminUser.username == username))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(password, admin.password_hash):
        return None
    return admin

async def create_admin_user(
    username: str, email: str, password: str, db: AsyncSession,
    role: str = "admin", permissions: List[str] = None, created_by: str = None
) -> AdminUser:
    result = await db.execute(
        select(AdminUser).where(
            (AdminUser.username == username) | (AdminUser.email == email)
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    admin = AdminUser(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=role,
        permissions=permissions or [],
        created_by=created_by
    )
    
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    return admin