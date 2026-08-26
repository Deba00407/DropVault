from uuid import UUID
from pydantic import BaseModel
from models.embedding.chunk import Chunk

class EmbeddingRequest(BaseModel):
    document_id: UUID
    chunks: list[Chunk]