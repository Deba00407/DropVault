from uuid import UUID
from pydantic import BaseModel, Field

class EmbeddedChunk(BaseModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    embedding: list[float]