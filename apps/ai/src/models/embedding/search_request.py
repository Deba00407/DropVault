from uuid import UUID
from pydantic import BaseModel

class SearchRequest(BaseModel):
    query: str
    document_id: str # For scoping RAG
    limit: int