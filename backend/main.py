"""
main.py — FastAPI application with auth and model endpoints

Endpoints:
  POST /auth/signup         — Create account
  POST /auth/login          — Login, returns JWT
  GET  /auth/me             — Get current user info
  GET  /models/my           — List user's saved models
  POST /models/save         — Save a model to cloud
  GET  /models/community    — Browse public models (paginated)
  GET  /models/{id}         — Get a single model by ID
  DELETE /models/{id}       — Delete own model
"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from pydantic import BaseModel
from typing import List, Optional
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    require_user,
    get_current_user,
)

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hand Pose Trainer API")

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ══════════════════════════════════════════════════════════
# Pydantic Schemas
# ══════════════════════════════════════════════════════════

class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class ModelSaveRequest(BaseModel):
    name: str
    description: Optional[str] = None
    class_names: list
    model_data: dict   # { modelTopology, weightSpecs, weightData }
    is_public: bool = False

class ModelListItem(BaseModel):
    id: int
    name: str
    description: Optional[str]
    class_names: list
    is_public: bool
    created_at: str
    author: str

    class Config:
        from_attributes = True

class ModelDetail(ModelListItem):
    model_data: dict


# ══════════════════════════════════════════════════════════
# Health Check
# ══════════════════════════════════════════════════════════

@app.get("/health")
def read_health():
    return {"status": "ok"}


# ══════════════════════════════════════════════════════════
# Auth Endpoints
# ══════════════════════════════════════════════════════════

@app.post("/auth/signup", response_model=TokenResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Check existing
    existing = db.query(models.User).filter(
        (models.User.email == req.email) | (models.User.username == req.username)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    user = models.User(
        username=req.username,
        email=req.email,
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "username": user.username, "email": user.email},
    )


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "username": user.username, "email": user.email},
    )


@app.get("/auth/me", response_model=UserResponse)
def get_me(user: models.User = Depends(require_user)):
    return user


# ══════════════════════════════════════════════════════════
# Model Endpoints
# ══════════════════════════════════════════════════════════

@app.get("/models/my", response_model=List[ModelListItem])
def list_my_models(user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    results = (
        db.query(models.SavedModel)
        .filter(models.SavedModel.user_id == user.id)
        .order_by(models.SavedModel.created_at.desc())
        .all()
    )
    return [
        ModelListItem(
            id=m.id,
            name=m.name,
            description=m.description,
            class_names=m.class_names,
            is_public=m.is_public,
            created_at=m.created_at.isoformat(),
            author=user.username,
        )
        for m in results
    ]


@app.post("/models/save", response_model=ModelListItem)
def save_model(req: ModelSaveRequest, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    # Upsert — if user already has a model with this name, update it
    existing = (
        db.query(models.SavedModel)
        .filter(models.SavedModel.user_id == user.id, models.SavedModel.name == req.name)
        .first()
    )

    if existing:
        existing.description = req.description
        existing.class_names = req.class_names
        existing.model_data = req.model_data
        existing.is_public = req.is_public
        db.commit()
        db.refresh(existing)
        m = existing
    else:
        m = models.SavedModel(
            user_id=user.id,
            name=req.name,
            description=req.description,
            class_names=req.class_names,
            model_data=req.model_data,
            is_public=req.is_public,
        )
        db.add(m)
        db.commit()
        db.refresh(m)

    return ModelListItem(
        id=m.id,
        name=m.name,
        description=m.description,
        class_names=m.class_names,
        is_public=m.is_public,
        created_at=m.created_at.isoformat(),
        author=user.username,
    )


@app.get("/models/community", response_model=List[ModelListItem])
def list_community_models(
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.SavedModel)
        .join(models.User)
        .filter(models.SavedModel.is_public == True)
    )
    if search:
        query = query.filter(models.SavedModel.name.ilike(f"%{search}%"))

    results = query.order_by(models.SavedModel.created_at.desc()).offset(offset).limit(limit).all()

    return [
        ModelListItem(
            id=m.id,
            name=m.name,
            description=m.description,
            class_names=m.class_names,
            is_public=m.is_public,
            created_at=m.created_at.isoformat(),
            author=m.user.username,
        )
        for m in results
    ]


@app.get("/models/{model_id}", response_model=ModelDetail)
def get_model(model_id: int, db: Session = Depends(get_db)):
    m = db.query(models.SavedModel).filter(models.SavedModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    if not m.is_public:
        raise HTTPException(status_code=403, detail="Model is private")

    return ModelDetail(
        id=m.id,
        name=m.name,
        description=m.description,
        class_names=m.class_names,
        is_public=m.is_public,
        created_at=m.created_at.isoformat(),
        author=m.user.username,
        model_data=m.model_data,
    )


@app.delete("/models/{model_id}")
def delete_model(model_id: int, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    m = db.query(models.SavedModel).filter(models.SavedModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    if m.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your model")

    db.delete(m)
    db.commit()
    return {"detail": "Model deleted"}
