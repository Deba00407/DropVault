import { GoogleGenAI } from "@google/genai";
import type { GeneratedPromptType } from "./promptGenerator";

class LLMHandler {
    private static instance: LLMHandler | null = null;

    private readonly aiClient: GoogleGenAI;

    private constructor() {
        this.aiClient = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });
    }

    public static getInstance(): LLMHandler {
        if (LLMHandler.instance === null) {
            LLMHandler.instance = new LLMHandler();
        }

        return LLMHandler.instance;
    }

    // Frontend will consume response incrementally
    public async *generateStream(prompt: GeneratedPromptType){
        const stream = await this.aiClient.interactions.create({
            model: "gemini-3.7-flash",
            input: prompt.userPrompt,
            system_instruction: prompt.systemPrompt,
            stream: true
        });

        for await (const event of stream){
            yield event;
        }
    }
}

export { LLMHandler }