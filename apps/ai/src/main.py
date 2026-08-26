from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI

from dotenv import load_dotenv

load_dotenv()

from routes.embeddings.embeddings import router as embedding_router
from services.embeddings_handler import embeddings_handler

# Create a new qdrant collection on startup, if not existend
@asynccontextmanager
async def lifespan(app: FastAPI):
    await embeddings_handler.create_collection()

    yield
 
app = FastAPI(lifespan=lifespan)


@app.get("/")
def root():
    return {"message": "AI service is running"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "Ai service is running fine"
    }

app.include_router(embedding_router, prefix="/generate/embeddings")

if __name__ == '__main__':
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)