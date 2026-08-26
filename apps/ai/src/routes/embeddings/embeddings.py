import uuid
from fastapi import APIRouter
from qdrant_client.http.models import UpdateResult, UpdateStatus

from models.embedding.exporter import (
    EmbeddedChunk, EmbeddingRequest, EmbeddingResponse
)

from services.voyage_provider import generate_embeddings
from services.embeddings_handler import embeddings_handler

router = APIRouter()

@router.post("")
async def embeddings(request: EmbeddingRequest):

    # Batch processing of chunks
    texts = [chunk.content for chunk in request.chunks]

    vectors = generate_embeddings(texts)

    embedded_chunks = [
            EmbeddedChunk(
                id = uuid.uuid4(),
                document_id=request.document_id,
                content=chunk.content,
                embedding=vector
            ) 

            for chunk, vector in zip(request.chunks, vectors)
        ]

    response = EmbeddingResponse(
        document_id=request.document_id,
        chunks= embedded_chunks
    )

    info: UpdateResult = await embeddings_handler.insert_in_collection(response)

    if info.status == UpdateStatus.COMPLETED:
        return {
            "operation_status": "Success"
        }

    return {
        "operation_status": "Failed"
    }