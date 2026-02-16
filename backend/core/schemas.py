from pydantic import BaseModel, Field
from typing import List, Optional

class SoapNoteSchema(BaseModel):
    subjective: str = Field(..., description="Client's self-reported feelings and experiences.")
    objective: str = Field(..., description="Observable data, appearance, and clinical markers.")
    assessment: str = Field(..., description="Clinical interpretation and progress analysis.")
    plan: str = Field(..., description="Next steps, interventions, and homework.")
    risk_assessment: str = Field(..., description="Specific assessment of safety, self-harm, or other risks.")

class AuditCritique(BaseModel):
    liability_flags: List[str] = Field(..., description="List of phrases or omissions that increase liability.")
    clinical_clarity_score: float = Field(..., description="Score from 0-1 on how clear and professional the note is.")
    suggestions: List[str] = Field(..., description="Specific improvements for the Scribe to make.")
    risk_level: str = Field(..., description="Low, Medium, or High.")

class FinalClinicalOutput(BaseModel):
    structured_note: SoapNoteSchema
    audit: AuditCritique
    version: str = "1.0"
