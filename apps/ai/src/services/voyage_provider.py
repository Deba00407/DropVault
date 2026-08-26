import os
import voyageai

client = voyageai.Client(
    api_key=os.getenv('VOYAGE_API_KEY')
)

model = os.getenv("MODEL")

def generate_embeddings(texts: list[str]) -> list[list[float]]:
    result = client.embed(
        texts,
        model=model,
        input_type="document", # specify to differentiate user prompt from resource embeddings
    )

    return result.embeddings