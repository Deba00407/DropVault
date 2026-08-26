import * as z from "zod";

export const createSessionSchema = z.object({
    title: z.string().trim().min(1, {
        message: "Title cannot be empty",
    }).max(100),
});

export type CreateSession = z.infer<typeof createSessionSchema>;