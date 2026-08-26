import uuid
from fastapi import APIRouter
from qdrant_client.http.models import UpdateResult, UpdateStatus

from models.embedding.search_request import SearchRequest
from models.embedding.search_response import SearchResponse, SearchResult
from models.embedding.exporter import (
    EmbeddedChunk, EmbeddingRequest, EmbeddingResponse
)

from services.embeddings_handler import embeddings_handler
from services.voyage_provider import voyager_handler

router = APIRouter()

@router.post("")
async def generate_embeddings_and_store_in_collection(request: EmbeddingRequest):

    # Batch processing of chunks
    texts = [chunk.content for chunk in request.chunks]

    vectors = await voyager_handler.generate_embeddings(texts)

    embedded_chunks = [
            EmbeddedChunk(
                id = uuid.uuid4(),
                document_id=request.document_id,
                chunk_index=chunk.index,
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

@router.post("/query", response_model=SearchResponse)
async def query_embedded_collection(request: SearchRequest):

    print("1. Received query:", request.query)

    query_vectors = await voyager_handler.generate_query_embeddings(request.query)

    points = await embeddings_handler.query_collection(query_vectors, request.limit)

    return SearchResponse(
        results=[
            SearchResult(
                point_score=point.score,
                document_id=point.payload["document_id"],
                chunk_index=point.payload["chunk_index"],
            )
            for point in points
        ]
    )