import { Router, type Request, type Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";
import { db } from "../db";
import { fileMetadata } from "../models/fileMetaDataModel";
import { StatusCodes } from "http-status-codes"

const dbSaveRouter = Router();

dbSaveRouter.post("/save", async (req: Request, res: Response) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
    }

    const { fileKey, fileName, contentType, fileSize } = req.body;

    if (!fileKey || !fileName) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "fileKey and fileName are required" });
    }

    const [record] = await db
        .insert(fileMetadata)
        .values({
            fileName,
            objectKey: fileKey,
            owner_id: req.userId,
            contentType: contentType || null,
            fileSize: fileSize || null,
        })
        .returning();

    return res.status(StatusCodes.CREATED).json(record);
});

export { dbSaveRouter };
