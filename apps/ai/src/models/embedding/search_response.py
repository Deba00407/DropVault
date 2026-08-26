from uuid import UUID
from pydantic import BaseModel, Field

class SearchResult(BaseModel):
    point_score: float
    document_id: UUID
    chunk_index: int = Field(ge=0)


class SearchResponse(BaseModel):
    results: list[SearchResult]