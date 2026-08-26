import { Router, type Request, type Response } from "express";
import { StatusCodes } from "http-status-codes";
import { db } from "../../db";
import { SessionDataModel } from "../../models/sessionDataModel";
import { ConversationDataModel } from "../../models/conversationDataModel";
import { eq, and, desc } from "drizzle-orm";

const documentChatRouter = Router();

documentChatRouter.get("/sessions", async (req: Request, res: Response) => {
    const documentId = req.query.documentId as string | undefined;

    if (!documentId) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ error: "documentId query parameter is required" });
    }

    try {
        const sessions = await db
            .select()
            .from(SessionDataModel)
            .where(
                and(
                    eq(SessionDataModel.user_id, req.userId),
                    eq(SessionDataModel.document_id, documentId)
                )
            )
            .orderBy(desc(SessionDataModel.createdAt));

        return res.status(StatusCodes.OK).json({ sessions });
    } catch (error) {
        console.error("Error fetching sessions:", error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Failed to fetch sessions" });
    }
});

documentChatRouter.post("/sessions", async (req: Request, res: Response) => {
    const { title, documentId } = req.body;

    if (!title || !documentId) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ error: "title and documentId are required" });
    }

    try {
        const [newSession] = await db
            .insert(SessionDataModel)
            .values({
                user_id: req.userId,
                title,
                document_id: documentId,
            })
            .returning();

        return res.status(StatusCodes.CREATED).json({ session: newSession });
    } catch (error) {
        console.error("Error creating session:", error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Failed to create session" });
    }
});

documentChatRouter.get(
    "/sessions/:id/conversations",
    async (req: Request, res: Response) => {
        const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

        try {
            const session = await db
                .select()
                .from(SessionDataModel)
                .where(
                    and(
                        eq(SessionDataModel.id, id),
                        eq(SessionDataModel.user_id, req.userId)
                    )
                )
                .limit(1);

            if (session.length === 0) {
                return res
                    .status(StatusCodes.NOT_FOUND)
                    .json({ error: "Session not found" });
            }

            const conversations = await db
                .select()
                .from(ConversationDataModel)
                .where(eq(ConversationDataModel.session_id, id))
                .orderBy(ConversationDataModel.createdAt);

            return res.status(StatusCodes.OK).json({ conversations });
        } catch (error) {
            console.error("Error fetching conversations:", error);
            return res
                .status(StatusCodes.INTERNAL_SERVER_ERROR)
                .json({ error: "Failed to fetch conversations" });
        }
    }
);

export { documentChatRouter };
