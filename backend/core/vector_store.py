import chromadb
from chromadb.config import Settings
from pathlib import Path

class VectorStoreManager:
    def __init__(self, base_path: str = "data/vector_store"):
        self.base_path = Path(base_path)
        self.client = chromadb.PersistentClient(path=str(self.base_path))

    def get_collection(self, org_id: str):
        # One collection per organization for data isolation
        return self.client.get_or_create_collection(name=f"org_{org_id}")

    def add_session(self, org_id: str, client_id: str, session_id: str, text: str, metadata: dict):
        collection = self.get_collection(org_id)
        collection.add(
            documents=[text],
            metadatas=[{**metadata, "client_id": client_id, "session_id": session_id}],
            ids=[session_id]
        )

    def query_client_history(self, org_id: str, client_id: str, query: str, n_results: int = 5):
        collection = self.get_collection(org_id)
        return collection.query(
            query_texts=[query],
            where={"client_id": client_id},
            n_results=n_results
        )
