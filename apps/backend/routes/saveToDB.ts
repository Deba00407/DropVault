import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { fileMetadata } from "../models/fileMetaDataModel";
import { StatusCodes } from "http-status-codes"
import { eq } from "drizzle-orm";

const dbSaveRouter = Router();

dbSaveRouter.post("/save", async (req: Request, res: Response) => {
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

// list out all user documents
dbSaveRouter.get("/list", async (req: Request, res: Response) => {
    const userId = req.userId;

    const documents = await db
        .select()
        .from(fileMetadata)
        .where(eq(fileMetadata.owner_id, userId))

    return res.status(StatusCodes.OK)
        .json({
            documents
        });
});

export { dbSaveRouter };
