from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import engine, SessionLocal, get_db
import models
from pydantic import BaseModel

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Pydantic model for User creation
class UserCreate(BaseModel):
    username: str
    email: str

class UserResponse(UserCreate):
    id: int

    class Config:
        from_attributes = True

@app.get("/health")
def read_health():
    return {"status": "ok"}

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter((models.User.email == user.email) | (models.User.username == user.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    db_user = models.User(username=user.username, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
