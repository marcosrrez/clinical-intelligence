from sqlmodel import SQLModel, Field, create_engine, Session as SQLSession
from datetime import datetime
from typing import Optional
from pathlib import Path

# --- MODELS ---
class SessionRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    org_id: str = Field(index=True)
    client_id: str = Field(index=True)
    session_id: str = Field(index=True, unique=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Sensitive Fields (Store ENCRYPTED)
    encrypted_text: str 
    encrypted_structured_json: str
    
    # Non-sensitive / Metadata (Store PLAIN for querying)
    emotional_intensity: float
    goal_progress: float
    risk_score: float
    primary_themes_csv: str  # Comma-separated list

# --- DATABASE SETUP ---
sqlite_file_name = "data/clinical.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    Path("data").mkdir(exist_ok=True)
    SQLModel.metadata.create_all(engine)

def get_session():
    with SQLSession(engine) as session:
        yield session
