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
                vector = chunk.embedding
            ) 
            for chunk in res.chunks
        ]

        operation_info = await client.upsert(collection, points)

        return operation_info

    async def query_collection(self):
        print('collection was queried: ', collection)

embeddings_handler = EmbeddingsHandler()