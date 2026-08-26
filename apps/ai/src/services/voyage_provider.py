import os
import voyageai

client = voyageai.Client(
    api_key=os.getenv('VOYAGE_API_KEY')
)

model = os.getenv("MODEL")

class VoyagerHandler():

    async def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        result = client.embed(
            texts,
            model=model,
            input_type="document", # specify to differentiate user prompt from resource embeddings
        )

        return result.embeddings

    async def generate_query_embeddings(self, user_query: str) -> list[float]:
        result = client.embed(
            [user_query], # condense into 1 to make batch query
            model = model,
            input_type= "query"
        )

        return result.embeddings[0]

voyager_handler = VoyagerHandler()