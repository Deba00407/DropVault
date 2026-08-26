import { describe, expect, it } from "vitest";

describe("AI service", () => {
    it("should communicate with the FastAPI server", async () => {
        const response = await fetch(
            `${process.env.AI_SERVER_URL}/health`
        );

        expect(response.status).toBe(200);

        const data = await response.json();

        expect(data).toEqual({
            status: "ok",
            service: "Ai service is running fine",
        });
    });
});