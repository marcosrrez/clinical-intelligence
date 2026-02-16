import os
from pathlib import Path
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, load_index_from_storage
from llama_index.core.node_parser import SentenceSplitter

class KnowledgeBaseManager:
    def __init__(self, base_kb_path: str = "data/knowledge_bases", storage_path: str = "data/vector_store/indices"):
        self.base_kb_path = Path(base_kb_path)
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def _get_index_path(self, org_id: str) -> Path:
        return self.storage_path / org_id

    def index_org_kb(self, org_id: str):
        """Indexes the documents in the org's knowledge base folder."""
        kb_path = self.base_kb_path / org_id
        if not kb_path.exists():
            return None

        # Load documents from the org-specific directory
        documents = SimpleDirectoryReader(str(kb_path)).load_data()
        
        # Create or update index
        index = VectorStoreIndex.from_documents(
            documents, 
            transformations=[SentenceSplitter(chunk_size=512, chunk_overlap=50)]
        )
        
        # Persist the index for this specific org
        index.storage_context.persist(persist_dir=str(self._get_index_path(org_id)))
        return index

    def get_query_engine(self, org_id: str):
        """Returns a query engine for the org's specific knowledge base."""
        index_path = self._get_index_path(org_id)
        if not index_path.exists():
            # If index doesn't exist, try to build it now
            index = self.index_org_kb(org_id)
            if not index: return None
        else:
            storage_context = StorageContext.from_defaults(persist_dir=str(index_path))
            index = load_index_from_storage(storage_context)
        
        return index.as_query_engine(similarity_top_k=3)
