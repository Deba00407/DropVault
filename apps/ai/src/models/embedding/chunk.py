from pydantic import BaseModel, Field

class Chunk(BaseModel):
    index: int = Field(ge=0)
    content: str = Field(min_length=1)