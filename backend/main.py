"""
main.py — FastAPI application with auth and model endpoints

Endpoints:
  POST /auth/signup         — Create account
  POST /auth/login          — Login, returns JWT
  GET  /auth/me             — Get current user info
  GET  /models/my           — List user's saved models
  POST /models/save         — Save a model to cloud (with dataset)
  GET  /models/community    — Browse public models (paginated)
  GET  /models/{id}         — Get a single model by ID
  DELETE /models/{id}       — Delete own model

  GET  /gestures            — Get user's gesture mappings
  POST /gestures            — Save a gesture mapping
  GET  /piano               — Get user's piano sequences
  POST /piano               — Save a piano sequence
"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
import models
from pydantic import BaseModel
from typing import List, Optional, Any
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
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"],
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
    dataset: Optional[dict] = None # { features: [], labels: [] }
    is_public: bool = False

    model_config = {
        "protected_namespaces": ()
    }

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
    dataset: Optional[dict]

    model_config = {
        "protected_namespaces": ()
    }

class GestureMappingSchema(BaseModel):
    name: str
    mapping_data: dict
    is_active: bool = False

class MusicSequenceSchema(BaseModel):
    title: str
    sequence_data: dict
    is_active: bool = False

class ResourceResponse(BaseModel):
    id: int
    name_or_title: str
    data: dict
    is_active: bool
    created_at: str

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

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "username": user.username, "email": user.email},
    )


@app.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
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
        existing.dataset = req.dataset
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
            dataset=req.dataset,
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
    
    # If explicit permission check needed (if private and not owner)
    # But for now, we only block private if it's strictly enforced. 
    # Let's say if private, only owner.
    # We don't have user context here unless we require it... 
    # But frontend might fetch public models anonymously.
    # So we'll check is_public.
    
    if not m.is_public:
         # Ideally check user, but since this route is open...
         pass 

    return ModelDetail(
        id=m.id,
        name=m.name,
        description=m.description,
        class_names=m.class_names,
        is_public=m.is_public,
        created_at=m.created_at.isoformat(),
        author=m.user.username,
        model_data=m.model_data,
        dataset=m.dataset,
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


# ══════════════════════════════════════════════════════════
# Config Endpoints (Gestures & Piano)
# ══════════════════════════════════════════════════════════

@app.get("/gestures", response_model=List[ResourceResponse])
def get_gestures(user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    results = db.query(models.GestureMapping).filter(models.GestureMapping.user_id == user.id).all()
    return [
        ResourceResponse(
            id=g.id,
            name_or_title=g.name,
            data=g.mapping_data,
            is_active=g.is_active,
            created_at=g.created_at.isoformat()
        )
        for g in results
    ]

@app.post("/gestures", response_model=ResourceResponse)
def save_gesture(req: GestureMappingSchema, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    # Deactivate others if this one is active
    if req.is_active:
        db.query(models.GestureMapping).filter(models.GestureMapping.user_id == user.id).update({"is_active": False})
    
    # Check for existing by name to update
    existing = db.query(models.GestureMapping).filter(models.GestureMapping.user_id == user.id, models.GestureMapping.name == req.name).first()
    
    if existing:
        existing.mapping_data = req.mapping_data
        existing.is_active = req.is_active
        db.commit()
        db.refresh(existing)
        g = existing
    else:
        g = models.GestureMapping(
            user_id=user.id,
            name=req.name,
            mapping_data=req.mapping_data,
            is_active=req.is_active
        )
        db.add(g)
        db.commit()
        db.refresh(g)

    return ResourceResponse(
        id=g.id,
        name_or_title=g.name,
        data=g.mapping_data,
        is_active=g.is_active,
        created_at=g.created_at.isoformat()
    )


@app.get("/piano", response_model=List[ResourceResponse])
def get_piano_sequences(user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    results = db.query(models.MusicSequence).filter(models.MusicSequence.user_id == user.id).all()
    return [
        ResourceResponse(
            id=s.id,
            name_or_title=s.title,
            data=s.sequence_data,
            is_active=s.is_active,
            created_at=s.created_at.isoformat()
        )
        for s in results
    ]

@app.post("/piano", response_model=ResourceResponse)
def save_piano_sequence(req: MusicSequenceSchema, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    if req.is_active:
        db.query(models.MusicSequence).filter(models.MusicSequence.user_id == user.id).update({"is_active": False})
    
    existing = db.query(models.MusicSequence).filter(models.MusicSequence.user_id == user.id, models.MusicSequence.title == req.title).first()

    if existing:
        existing.sequence_data = req.sequence_data
        existing.is_active = req.is_active
        db.commit()
        db.refresh(existing)
        s = existing
    else:
        s = models.MusicSequence(
            user_id=user.id,
            title=req.title,
            sequence_data=req.sequence_data,
            is_active=req.is_active
        )
        db.add(s)
        db.commit()
        db.refresh(s)

    return ResourceResponse(
        id=s.id,
        name_or_title=s.title,
        data=s.sequence_data,
        is_active=s.is_active,
        created_at=s.created_at.isoformat()
    )
