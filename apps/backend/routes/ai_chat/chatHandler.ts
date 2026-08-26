
/* 
    Chat handler is responsible for:

    1. Take user prompts
    2. Send over the user prompts to ai server
    3. Get back chunks data from ai server
    4. Retrieve chunk data from db for the received details
    5. Send back to client
*/

const baseUrl = process.env.AI_SERVER_URL!

type SearchResult = {
    point_score: number;
    document_id: string;
    chunk_index: number;
};

type IncomingPointsResponse = {
    results: SearchResult[];
};

class ChatHandler {

    async getRequiredChunksForModelContext(user_query: string, limit: number = 10): Promise<SearchResult[]> {
        try {
            const points_response = await fetch(`${baseUrl}/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: user_query,
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
}

const chatHandler = new ChatHandler();

export { chatHandler };