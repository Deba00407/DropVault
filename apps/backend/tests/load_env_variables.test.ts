import { describe, expect, it } from "vitest";

describe("environment", () => {
    it("loads environment variables", () => {
        console.log(process.env.DATABASE_URL);

        expect(process.env.AI_SERVER_URL).toBeDefined();
    });
});