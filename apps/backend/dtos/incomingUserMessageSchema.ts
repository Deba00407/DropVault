import * as z from 'zod';

const userMessageSchema = z.object({
    query: z.string().trim().min(1, {
        message: "Message cannot be empty",
    }),
});

type IncomingUserMessage = z.infer<typeof userMessageSchema>;

export {type IncomingUserMessage}