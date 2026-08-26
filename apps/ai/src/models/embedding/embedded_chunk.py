from uuid import UUID
from pydantic import BaseModel

class EmbeddedChunk(BaseModel):
    id: UUID
    document_id: UUID
    content: str
    embedding: list[float]