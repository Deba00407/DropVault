from uuid import UUID
from pydantic import BaseModel
from models.embedding.embedded_chunk import EmbeddedChunk

class EmbeddingResponse(BaseModel):
    document_id: UUID
    chunks: list[EmbeddedChunk]