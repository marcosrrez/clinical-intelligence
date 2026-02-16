from llama_index.llms.ollama import Ollama
from llama_index.core import Settings
import json
from .org_manager import OrgManager
from .vector_store import VectorStoreManager
from .patterns import PatternEngine
from .knowledge_base import KnowledgeBaseManager

class ClinicalEngine:
    def __init__(self, model="llama3", base_url="http://localhost:11434"):
        self.llm = Ollama(model=model, base_url=base_url, request_timeout=240.0)
        self.org_manager = OrgManager()
        self.vector_store = VectorStoreManager()
        self.kb_manager = KnowledgeBaseManager()
        self.patterns = PatternEngine(self.llm)
        Settings.llm = self.llm

    async def _get_scribe_draft(self, org_id: str, raw_text: str, history_context: str, config: dict) -> str:
        prompt = f"""
        AGENT: CLINICAL SCRIBE
        GOAL: Generate a professional {config.get('preferred_schema', 'SOAP')} note.
        TONE: {config.get('tone_constraints')}
        
        PAST CONTEXT: {history_context}
        RAW NOTES: {raw_text}
        
        Return the note in valid JSON format.
        """
        response = await self.llm.acomplete(prompt + "\nJSON Response:")
        return response.text

    async def _get_auditor_critique(self, org_id: str, draft: str, org_instructions: str) -> str:
        # --- NEW: RETRIEVE ORG-SPECIFIC POLICY CONTEXT ---
        kb_query_engine = self.kb_manager.get_query_engine(org_id)
        policy_context = ""
        if kb_query_engine:
            # Query the KB for relevant documentation standards
            policy_response = kb_query_engine.query("What are the documentation requirements and risk assessment protocols for this organization?")
            policy_context = f"\nORG-SPECIFIC POLICIES:\n{policy_response}"

        prompt = f"""
        AGENT: CLINICAL AUDITOR / LIABILITY SHIELD
        GOAL: Review the clinical draft against standard clinical practices AND organization-specific policies.
        
        {policy_context}
        
        ORG INSTRUCTIONS: {org_instructions}
        
        DRAFT: {draft}
        
        Return a JSON critique with: liability_flags (list), clinical_clarity_score (0-1), suggestions (list), risk_level (Low/Medium/High).
        """
        response = await self.llm.acomplete(prompt + "\nJSON Critique:")
        return response.text

    async def process_session(self, org_id: str, client_id: str, raw_text: str):
        config = self.org_manager.get_org_config(org_id)
        instructions = self.org_manager.get_org_instructions(org_id)
        
        # 1. Retrieve Client Context (Memory)
        history = self.vector_store.query_client_history(org_id, client_id, raw_text, n_results=2)
        history_context = "\n".join(history['documents'][0]) if (history['documents'] and history['documents'][0]) else "New client."

        # 2. Scribe Draft
        scribe_response = await self._get_scribe_draft(org_id, raw_text, history_context, config)
        
        # 3. Auditor Critique (Now Knowledge-Aware)
        audit_response = await self._get_auditor_critique(org_id, scribe_response, instructions)
        
        # 4. Pattern Extraction
        markers = await self.patterns.extract_markers(scribe_response)
        
        # 5. Final Merge
        try:
            draft_json = json.loads(scribe_response.strip().replace("```json", "").replace("```", "").strip())
            audit_json = json.loads(audit_response.strip().replace("```json", "").replace("```", "").strip())
            
            return {
                "structured_note": draft_json,
                "audit": audit_json,
                "markers": markers.dict()
            }
        except Exception as e:
            return {"error": "Merging failed", "scribe_raw": scribe_response, "audit_raw": audit_response}
