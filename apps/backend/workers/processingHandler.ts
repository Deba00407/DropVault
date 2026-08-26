import type { Message } from "@aws-sdk/client-sqs";

import { s3client } from "../config/aws_config";
import { sqs } from "../config/aws_config";

import { GetObjectCommand } from "@aws-sdk/client-s3";
import { DeleteMessageCommand } from "@aws-sdk/client-sqs";

import { PDFParse, type TextResult } from "pdf-parse"
import { chunkData, type ChunkedDataType } from "../utils/chunker";
import { db } from "../db";
import { documentChunks } from "../models/chunkedDataModel";
import { fileMetadata } from "../schema";
import { eq } from "drizzle-orm";
import { type DocProcessingStatus } from "../models/docProcessingStatus";

type PostResponse = {
    operation_status: "Success" | "Failed"
};

// singleton class with all document processing logic
class Handler {

    async getS3Object(bucket: string, key: string): Promise<TextResult> {
        if (!bucket || !key) {
            console.error('Bucket and key are required to get object from S3');
            return Promise.reject();
        }

        const response = await s3client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key
            })
        )

        if (!response?.Body) {
            throw new Error(`AWS S3 object ${key} has no body`)
        }

        const bytes = await response.Body.transformToByteArray();

        const parser = new PDFParse(bytes);
        const data = await parser.getText();

        return data;
    }

    async deleteMessageFromSQS(msg: Message) {
        if (!msg.ReceiptHandle) {
            throw new Error("SQS message has no ReceiptHandle");
        }

        const id = msg.MessageId;

        await sqs.send(
            new DeleteMessageCommand({
                QueueUrl: process.env.AWS_SQS_URL!,
                ReceiptHandle: msg.ReceiptHandle
            })
        );

        console.log(`Deleted message with id:${id}`);
    }

    async generateEmbeddingsAndStoreInQdrantDB(document: string, data: ChunkedDataType[]) {
        if (!document || !data) {
            throw new Error('Required document id and data for embeddings. Found NULL');
        }

        try {
            const payload = {
                document_id: document,
                chunks: data
            };

            const response = await fetch(`${process.env.AI_SERVER_URL}/generate/embeddings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`AI server failed: ${error}`);
            }

            const result = (await response.json()) as PostResponse;

            if (result.operation_status === "Failed") {
                throw new Error('Failed to generate embeddings')
            }

        } catch (error) {
            console.error(`Failed to send chunked data to embedding server: ${error}`)
        }
    }

    private async updateDocStatus(key: string, new_status: DocProcessingStatus) {
        await db
            .update(fileMetadata)
            .set({ status: new_status })
            .where(eq(fileMetadata.objectKey, key));
    }

    async handleIncomingMessage(msg: Message) {
        if (!msg.Body) {
            console.error(`Body missing from SQS message: ${msg.MessageId}`);
            return;
        }

        const body = JSON.parse(msg.Body);
        const s3Details = body.Records[0].s3;

        const key = s3Details.object.key;
        const bucket = s3Details.bucket.name;

        const file_from_DB = await db
            .select()
            .from(fileMetadata)
            .where(eq(s3Details.object.key, fileMetadata.objectKey))
            .limit(1);

        if (!file_from_DB[0]) {
            throw new Error(`File with object key ${key} not found in bucket: ${bucket}`);
        }

        // update status to PROCESSING
        await db
            .update(fileMetadata)
            .set({ status: "PROCESSING" })
            .where(eq(fileMetadata.objectKey, key));

        const data = await this.getS3Object(s3Details.bucket.name, s3Details.object.key)
            .catch(async (err) => {
                await this.updateDocStatus(key, "FAILED");
                throw new Error(`Error while getting object: ${err}`);
            });

        // generate chunked data
        const chunked_data = await chunkData(data.text);

        // store each chunk in DB
        for (const chunk of chunked_data) {
            try {
                await db.insert(documentChunks).values({
                    documentId: file_from_DB[0].id,
                    chunkIndex: chunk.index,
                    content: chunk.content,
                });

            } catch (error) {
                console.error(`Failed saving chunk: ${chunk.content} into DB`);
                return;
            }
        }

        // send the chunked data in segments of len 10
        for (let i = 0; i < chunked_data.length; i += 10) {
            const segment = chunked_data.slice(i, i + 10);

            await this.generateEmbeddingsAndStoreInQdrantDB(file_from_DB[0].id, segment);
        }

        // update the status of the current file from "PROCESSING" to "CHUNKED"
        await this.updateDocStatus(key, "CHUNKED");

        await this.deleteMessageFromSQS(msg);
    }
};

const processingHandler = new Handler();

export { processingHandler };