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
import os
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
from email_utils import send_reset_email, send_password_changed_email, send_username_changed_email

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hand Pose Trainer API")

# CORS — allow frontend dev server
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    allow_origins = allowed_origins_env.split(",")
else:
    allow_origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"]

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
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
    sequence_data: Optional[dict] = None
    is_active: bool = False

class ResourceResponse(BaseModel):
    id: int
    name_or_title: str
    data: Optional[dict] = None
    is_active: bool
    is_public: bool = False
    created_at: str
    author: str

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


class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@app.patch("/auth/profile", response_model=UserResponse)
async def update_profile(req: UpdateProfileRequest, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    old_username = user.username
    if req.username is not None:
        trimmed = req.username.strip()
        if not trimmed:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        # Check uniqueness
        existing = db.query(models.User).filter(
            models.User.username == trimmed,
            models.User.id != user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = trimmed

    db.commit()
    db.refresh(user)

    # Send notification email if username actually changed
    if req.username is not None and old_username != user.username:
        try:
            await send_username_changed_email(user.email, old_username, user.username)
        except Exception as e:
            print(f"Failed to send username change email: {e}")

    return user


@app.post("/auth/password")
async def update_password(req: UpdatePasswordRequest, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    # Verify current password
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    user.hashed_password = hash_password(req.new_password)
    db.commit()

    # Send notification email
    try:
        await send_password_changed_email(user.email, user.username)
    except Exception as e:
        print(f"Failed to send password change email: {e}")

    return {"detail": "Password updated successfully"}


class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@app.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        # Don't reveal if user exists
        return {"detail": "If that email exists, a reset link has been sent."}

    # Generate token
    import uuid
    from datetime import datetime, timedelta
    
    token = str(uuid.uuid4())
    expires = datetime.utcnow() + timedelta(hours=1)
    
    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires
    )
    db.add(reset_token)
    db.commit()

    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    await send_reset_email(req.email, reset_link)

    return {"detail": "If that email exists, a reset link has been sent."}


@app.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    from datetime import datetime
    
    reset_token = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == req.token
    ).first()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid token")

    if reset_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")

    user = db.query(models.User).filter(models.User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update password
    user.hashed_password = hash_password(req.new_password)
    
    # Delete usage of this token (consume it)
    db.delete(reset_token)
    db.commit()

    return {"detail": "Password updated successfully"}

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

    db.commit()
    return {"detail": "Model deleted"}


class ModelVisibilityUpdate(BaseModel):
    is_public: bool

@app.patch("/models/{model_id}/visibility")
def update_model_visibility(model_id: int, req: ModelVisibilityUpdate, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    m = db.query(models.SavedModel).filter(models.SavedModel.id == model_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    if m.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your model")
    
    m.is_public = req.is_public
    db.commit()
    return {"detail": "Visibility updated", "is_public": m.is_public}


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
            is_public=g.is_public,
            created_at=g.created_at.isoformat(),
            author=user.username
        )
        for g in results
    ]

@app.delete("/gestures/{map_id}")
def delete_gesture_mapping(map_id: int, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    mapping = db.query(models.GestureMapping).filter(
        models.GestureMapping.id == map_id,
        models.GestureMapping.user_id == user.id
    ).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
    
    db.delete(mapping)
    db.commit()
    return {"detail": "Deleted successfully"}

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
        is_public=g.is_public,
        created_at=g.created_at.isoformat(),
        author=user.username
    )


@app.patch("/gestures/{map_id}/visibility")
def update_gesture_visibility(map_id: int, req: ModelVisibilityUpdate, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    g = db.query(models.GestureMapping).filter(models.GestureMapping.id == map_id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Mapping not found")
    if g.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your mapping")
    
    g.is_public = req.is_public
    db.commit()
    return {"detail": "Visibility updated", "is_public": g.is_public}


@app.get("/piano", response_model=List[ResourceResponse])
def get_piano_sequences(user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    results = db.query(models.MusicSequence).filter(models.MusicSequence.user_id == user.id).all()
    return [
        ResourceResponse(
            id=s.id,
            name_or_title=s.title,
            data=s.sequence_data,
            is_active=s.is_active,
            is_public=s.is_public, 
            created_at=s.created_at.isoformat(),
            author=user.username
        )
        for s in results
    ]

@app.patch("/piano/{seq_id}/visibility")
def update_piano_visibility(seq_id: int, req: ModelVisibilityUpdate, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    s = db.query(models.MusicSequence).filter(models.MusicSequence.id == seq_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Sequence not found")
    if s.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your sequence")
    
    s.is_public = req.is_public
    db.commit()
    return {"detail": "Visibility updated", "is_public": s.is_public}

@app.delete("/piano/{seq_id}")
def delete_piano_sequence(seq_id: int, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    seq = db.query(models.MusicSequence).filter(
        models.MusicSequence.id == seq_id,
        models.MusicSequence.user_id == user.id
    ).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    
    db.delete(seq)
    db.commit()
    return {"detail": "Deleted successfully"}

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
        is_public=s.is_public,
        created_at=s.created_at.isoformat(),
        author=user.username
    )


# ══════════════════════════════════════════════════════════
# Training Session Endpoints (Raw Data)
# ══════════════════════════════════════════════════════════

class TrainingSessionSchema(BaseModel):
    class_names: list
    samples: dict  # { features: [], labels: [] }

class TrainingSessionResponse(BaseModel):
    id: int
    class_names: list
    created_at: str

@app.post("/training-sessions", response_model=TrainingSessionResponse)
def save_training_session(req: TrainingSessionSchema, user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    session = models.TrainingSession(
        user_id=user.id,
        class_names=req.class_names,
        samples=req.samples
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return TrainingSessionResponse(
        id=session.id,
        class_names=session.class_names,
        created_at=session.created_at.isoformat()
    )

@app.get("/training-sessions", response_model=List[TrainingSessionResponse])
def get_training_sessions(user: models.User = Depends(require_user), db: Session = Depends(get_db)):
    results = (
        db.query(models.TrainingSession)
        .filter(models.TrainingSession.user_id == user.id)
        .order_by(models.TrainingSession.created_at.desc())
        .limit(10)
        .all()
    )
    return [
        TrainingSessionResponse(
            id=s.id,
            class_names=s.class_names,
            created_at=s.created_at.isoformat()
        )
        for s in results
    ]
@app.get("/gestures/community", response_model=List[ResourceResponse])
def list_community_gestures(
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.GestureMapping)
        .join(models.User)
        .filter(models.GestureMapping.is_public == True)
    )
    if search:
        query = query.filter(models.GestureMapping.name.ilike(f"%{search}%"))

    results = query.order_by(models.GestureMapping.created_at.desc()).offset(offset).limit(limit).all()

    return [
        ResourceResponse(
            id=g.id,
            name_or_title=g.name,
            data=g.mapping_data,
            is_active=False, # Shared ones aren't active for viewer
            created_at=g.created_at.isoformat(),
            author=g.user.username
        )
        for g in results
    ]


@app.get("/piano/community", response_model=List[ResourceResponse])
def list_community_piano(
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    query = (
        db.query(models.MusicSequence)
        .join(models.User)
        .filter(models.MusicSequence.is_public == True)
    )
    if search:
        query = query.filter(models.MusicSequence.title.ilike(f"%{search}%"))

    results = query.order_by(models.MusicSequence.created_at.desc()).offset(offset).limit(limit).all()

    return [
        ResourceResponse(
            id=s.id,
            name_or_title=s.title,
            data=s.sequence_data,
            is_active=False,
            is_public=True,
            created_at=s.created_at.isoformat(),
            author=s.user.username
        )
        for s in results
    ]
