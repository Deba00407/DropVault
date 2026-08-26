import os
from qdrant_client import AsyncQdrantClient

from qdrant_client.models import VectorParams, PointStruct, Distance, UpdateResult

from models.embedding.embedding_response import EmbeddingResponse

qdrant_url = os.getenv('QDRANT_URL')
collection = os.getenv('EMBEDDINGS_COLLECTION')

client = AsyncQdrantClient(url=qdrant_url)

class EmbeddingsHandler:
    async def create_collection(self):
        if not (await client.collection_exists(collection)):
            await client.create_collection(
                collection_name=collection,
                vectors_config=VectorParams(
                    size=1024, # Default voyage ai dimensions
                    distance=Distance.COSINE
                )
            )

    async def insert_in_collection(self, res: EmbeddingResponse) -> UpdateResult:
        points = [
            PointStruct(
                id = chunk.id,
                vector = chunk.embedding,
                payload={
                    "document_id": chunk.document_id,
                    "chunk_index": chunk.chunk_index # store the chunk index and document id as payload so we can query postgres chunks for the right data required
                }
            ) 
            for chunk in res.chunks
        ]

        operation_info = await client.upsert(collection, points)

        return operation_info

    # By default return the top 5 best results based on similarity search from vector DB
    async def query_collection(self, query_vector: list[float], limit: int = 5):
        print('collection was queried: ', collection)

        response = await client.query_points(
            collection_name = collection,
            query = query_vector,
            limit = limit
        )

        return response.points

embeddings_handler = EmbeddingsHandler()