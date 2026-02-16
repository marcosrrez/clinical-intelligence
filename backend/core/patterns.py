from pydantic import BaseModel, Field
from typing import List

class SessionMarkers(BaseModel):
    primary_themes: List[str] = Field(..., description="Top 3 clinical themes identified.")
    emotional_intensity: float = Field(..., description="Scale of 1-10.")
    goal_progress: float = Field(..., description="Scale of 1-10 on treatment plan alignment.")
    risk_score: float = Field(..., description="Scale of 1-10 based on safety markers.")

class PatternEngine:
    def __init__(self, llm):
        self.llm = llm

    async def extract_markers(self, note_text: str) -> SessionMarkers:
        prompt = f"""
        AGENT: CLINICAL ANALYST
        TASK: Extract quantitative markers from this clinical note.
        NOTE: {note_text}
        
        Return JSON: primary_themes (list), emotional_intensity (1-10), goal_progress (1-10), risk_score (1-10).
        """
        response = await self.llm.acomplete(prompt + "
JSON Output:")
        try:
            import json
            clean_json = response.text.strip().replace("```json", "").replace("```", "").strip()
            return SessionMarkers(**json.loads(clean_json))
        except:
            return SessionMarkers(primary_themes=["Error"], emotional_intensity=5.0, goal_progress=5.0, risk_score=1.0)
