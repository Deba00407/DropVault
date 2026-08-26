import { Router, type Request, type Response} from "express";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3client as client} from "../config/aws_config";

import crypto from 'crypto'

const preSignRouter = Router();

const generateFileKey = (mime: string) => {
    return `${crypto.randomUUID()}.${mime}`;
};

type SignatureInput = {
    bucket: string,
    key: string
};

const presignUrlWithClient = ({bucket, key} : SignatureInput) => {
    const command = new PutObjectCommand({Bucket: bucket, Key: key});
    return getSignedUrl(client, command, {
        expiresIn: 3600 // 1 hr
    });
} 

preSignRouter.post("/signature", async (req: Request, res: Response, next) => {

    const { mime } = req.body;
    const fileName = generateFileKey(mime);

    const signedUrl = await presignUrlWithClient({
        bucket: process.env.AWS_BUCKET!,
        key: fileName
    });

    res.send({
        uploadUrl: signedUrl,
        fileKey: fileName
    });

    next();
})

export { preSignRouter }