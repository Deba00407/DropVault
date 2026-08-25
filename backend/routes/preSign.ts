import { Router, type Request, type Response} from "express";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import crypto from 'crypto'

const router = Router();

const generateFileKey = (mime: string) => {
    return `users/files/${crypto.randomUUID()}_${mime}`;
};

type SignatureInput = {
    bucket: string,
    key: string
};

const client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!
    }
});

const presignUrlWithClient = ({bucket, key} : SignatureInput) => {
    const command = new PutObjectCommand({Bucket: bucket, Key: key});
    return getSignedUrl(client, command, {
        expiresIn: 3600 // 1 hr
    });
} 

router.post("/signature", async (req: Request, res: Response, next) => {

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

export {router}