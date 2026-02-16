import asyncio
from core.engine import ClinicalEngine

async def test_processing():
    engine = ClinicalEngine()
    test_raw_text = """
    Client came in today appearing anxious. 
    They reported trouble sleeping since our last session. 
    We discussed their childhood relationship with their mother.
    They stated: "I just feel like I'm never enough."
    No suicidal ideation reported. 
    Plan is to meet again next Thursday to continue EMDR prep.
    """
    
    print("Processing test session...")
    result = await engine.process_session("default_org", test_raw_text)
    print("
--- LLM RESPONSE ---")
    print(result)

if __name__ == "__main__":
    asyncio.run(test_processing())
