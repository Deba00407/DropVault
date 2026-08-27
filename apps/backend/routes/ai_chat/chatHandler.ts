
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { documentChunks } from "../../schema";

const baseUrl = process.env.AI_SERVER_URL!

export type SearchResult = {
    point_score: number;
    document_id: string;
    chunk_index: number;
};

export type IncomingPointsResponse = {
    results: SearchResult[];
};

export type DocumentChunk = typeof documentChunks.$inferSelect;

class ChatHandler {

    static instance : ChatHandler | null = null;

    constructor(){
        if(ChatHandler.instance){
            return ChatHandler.instance;
        }

        ChatHandler.instance = this;
    }

    async getRequiredPointsForModelContext(user_query: string, document_id: string, limit: number = 10): Promise<SearchResult[]> {
        try {
            const points_response = await fetch(`${baseUrl}/generate/embeddings/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: user_query,
                    document_id,
                    limit: limit,
                }),
            });

            if (!points_response.ok) {
                const error = await points_response.text();
                throw new Error(
                    `AI server failed (${points_response.status}): ${error}`
                );
            }

            const points = await points_response.json() as IncomingPointsResponse;

            return points.results;

        } catch (error) {
            console.error("Failed to retrieve relevant chunks:", error);
            throw error;
        }
    }

    async getChunksFromDatabase(points: SearchResult[]): Promise<DocumentChunk[]>{
        // get appropriate chunks from chunked db corresponding to points

        try {
            const chunks: DocumentChunk[] = [];

            for (const point of points) {

                const chunk = await db
                    .select()
                    .from(documentChunks)
                    .where(
                        and(
                            eq(
                                documentChunks.documentId,
                                point.document_id
                            ),
                            eq(
                                documentChunks.chunkIndex,
                                point.chunk_index
                            )
                        )
                    );

                chunks.push(...chunk);
            }

            return chunks;

        } catch (error) {
            console.error("Failed to retrieve relevant chunks from queried points:", error);
            throw error;
        }
    }
}

const chatHandler = new ChatHandler();

export { chatHandler };