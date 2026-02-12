"""
auth.py — JWT authentication utilities

Provides password hashing (bcrypt), JWT token creation/verification,
and a FastAPI dependency to extract the current user from a Bearer token.
"""

import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db
import models

# ── Config ──────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))  # 24h default

# ── Password hashing ───────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _normalize_password(password: str) -> str:
    """
    Pre-hash password with SHA256 to ensure it fits within bcrypt's 72-byte limit.
    Returns the hex digest (64 chars).
    """
    return hashlib.sha256(password.encode()).hexdigest()

def hash_password(password: str) -> str:
    return pwd_context.hash(_normalize_password(password))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_normalize_password(plain_password), hashed_password)

# ── JWT tokens ──────────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ── FastAPI dependency ──────────────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """Extract user from Bearer token. Returns None if no/invalid token."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user

def require_user(
    user: Optional[models.User] = Depends(get_current_user),
) -> models.User:
    """Dependency that enforces authentication — raises 401 if not logged in."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
