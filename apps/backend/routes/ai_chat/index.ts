import { Router, type Request, type Response } from "express";
import { createSessionSchema } from "../../dtos/createSessionSession";

import { StatusCodes } from "http-status-codes"
import { db } from "../../db";
import { SessionDataModel } from "../../models/sessionDataModel";

const chatRouter = Router();

// generate a new session
chatRouter.post("/create/chat-session", async (req: Request, res: Response) => {
    const parsed = createSessionSchema.safeParse(req.body);

    if (!parsed.success) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json(
                {
                    success: false,
                    error: parsed.error.flatten
                }
            )
    }

    try {

        const new_chat_session = await db.insert(SessionDataModel)
            .values({
                user_id: req.userId,
                title: parsed.data.title
            })

        return res.
            status(StatusCodes.CREATED)
            .json({
                success: true,
                new_chat_session
            })

    } catch (error) {
        console.error(`Error while creating new session: ${error}`)

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({
                success: false,
                error: 'Failed to create new session'
            })
    }
})



export { chatRouter }

