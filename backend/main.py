from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import List, Optional, Dict
import json
from datetime import datetime
import os
import shutil
import tempfile
from openai import OpenAI
from dotenv import load_dotenv

# Load backend environment variables (Secrets)
load_dotenv()

from core.engine import ClinicalEngine
from core.vector_store import VectorStoreManager
from core.database import create_db_and_tables, get_session, SessionRecord
from core.security import CryptoManager

app = FastAPI(title="Clinical Intelligence API")

# Initialize OpenAI Client (using secure env var only)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- CORE SERVICES ---
engine_service = ClinicalEngine()
vector_store = VectorStoreManager()
crypto = CryptoManager()

# --- LIFECYCLE ---
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- SCHEMAS ---
class SessionInput(BaseModel):
    org_id: str
    client_id: str
    raw_text: str

class SaveSessionInput(BaseModel):
    org_id: str
    client_id: str
    session_id: str
    text: str
    structured_json: str
    metadata: Dict = {}
    markers: Optional[Dict] = None

class HistoricalSession(BaseModel):
    id: int
    session_id: str
    created_at: str
    text: str
    markers: Dict

# --- ENDPOINTS ---

@app.post("/session/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        
        # Transcribe using Whisper
        with open(tmp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file
            )
        
        os.remove(tmp_path)
        return {"transcript": transcript.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"status": "Clinical Intelligence Engine Online"}

@app.post("/session/process")
async def process_session(session: SessionInput):
    try:
        # Returns: { structured_note, audit, markers }
        result = await engine_service.process_session(session.org_id, session.client_id, session.raw_text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/session/save")
async def save_session(data: SaveSessionInput, db: Session = Depends(get_session)):
    try:
        # 1. ENCRYPT SENSITIVE DATA
        enc_text = crypto.encrypt(data.text)
        enc_json = crypto.encrypt(data.structured_json)
        
        # 2. SAVE TO SQL DATABASE (System of Record)
        record = SessionRecord(
            org_id=data.org_id,
            client_id=data.client_id,
            session_id=data.session_id,
            encrypted_text=enc_text,
            encrypted_structured_json=enc_json,
            emotional_intensity=data.markers.get("emotional_intensity", 0.0) if data.markers else 0.0,
            goal_progress=data.markers.get("goal_progress", 0.0) if data.markers else 0.0,
            risk_score=data.markers.get("risk_score", 0.0) if data.markers else 0.0,
            primary_themes_csv=",".join(data.markers.get("primary_themes", [])) if data.markers else ""
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        # 3. SAVE TO VECTOR STORE (Reasoning Index)
        full_metadata = data.metadata
        if data.markers:
            full_metadata["markers"] = json.dumps(data.markers)
        vector_store.add_session(data.org_id, data.client_id, data.session_id, data.text, full_metadata)
        
        return {"status": "saved", "id": record.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/client/{client_id}/history", response_model=List[HistoricalSession])
async def get_client_history(client_id: str, db: Session = Depends(get_session)):
    try:
        statement = select(SessionRecord).where(SessionRecord.client_id == client_id).order_by(SessionRecord.created_at.desc())
        results = db.exec(statement).all()
        
        history = []
        for rec in results:
            # DECRYPT ON READ
            dec_text = crypto.decrypt(rec.encrypted_text)
            markers = {
                "emotional_intensity": rec.emotional_intensity,
                "goal_progress": rec.goal_progress,
                "risk_score": rec.risk_score,
                "primary_themes": rec.primary_themes_csv.split(",") if rec.primary_themes_csv else []
            }
            history.append(HistoricalSession(
                id=rec.id,
                session_id=rec.session_id,
                created_at=rec.created_at.isoformat(),
                text=dec_text, 
                markers=markers
            ))
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/org/{org_id}/sync_kb")
async def sync_org_kb(org_id: str):
    try:
        engine_service.kb_manager.index_org_kb(org_id)
        return {"status": "Knowledge base indexed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
