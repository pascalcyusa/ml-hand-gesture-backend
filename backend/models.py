from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # Nullable for OAuth/social login support
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="user", uselist=False)
    gesture_mappings = relationship("GestureMapping", back_populates="user")
    music_sequences = relationship("MusicSequence", back_populates="user")
    high_scores = relationship("HighScore", back_populates="user")
    logs = relationship("Log", back_populates="user")
    saved_models = relationship("SavedModel", back_populates="user")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    preferences = Column(JSON, nullable=True)  # Store UI preferences etc.

    user = relationship("User", back_populates="profile")


class GestureMapping(Base):
    __tablename__ = "gesture_mappings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)  # e.g. "Spike Prime Config 1"
    mapping_data = Column(JSON)  # Store the actual mapping logic/configuration
    is_active = Column(Boolean, default=False) # Whether this is the currently active mapping
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="gesture_mappings")


class MusicSequence(Base):
    __tablename__ = "music_sequences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String) # e.g. "Piano Session 1"
    sequence_data = Column(JSON)  # Store the sequence of notes/events per class
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="music_sequences")


class HighScore(Base):
    __tablename__ = "high_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    game_mode = Column(String) # e.g., "practice", "challenge"
    achieved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="high_scores")


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Logs might be anonymous or system-level
    level = Column(String) # INFO, WARN, ERROR
    message = Column(Text)
    context = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")


class SavedModel(Base):
    __tablename__ = "saved_models"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    class_names = Column(JSON)             # ["thumbs_up", "peace"]
    model_data = Column(JSON)              # topology + weights (base64 encoded)
    dataset = Column(JSON, nullable=True)  # { features: [...], labels: [...] } for retraining
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_models")
