import type { Message } from "@aws-sdk/client-sqs";

import { s3client } from "../config/aws_config";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import {PDFParse, type TextResult} from "pdf-parse"

// singleton class with all document processing logic
class Handler{

    async getS3Object(bucket: string, key: string) : Promise<TextResult>{
        if(!bucket || !key){
            console.error('Bucket and key are required to get object from S3');
            return Promise.reject();
        }

        const response = await s3client.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: key
            })
        )

        if(!response?.Body){
            throw new Error(`AWS S3 object ${key} has no body`)
        }

        const bytes = await response.Body.transformToByteArray();

        const parser = new PDFParse(bytes);
        const data = await parser.getText();

        return data;
    }

    async handleIncomingMessage(msg: Message){
        if(!msg.Body){
            console.error(`Body missing from SQS message: ${msg.MessageId}`);
            return;
        }

        const body = JSON.parse(msg.Body);
        const s3Details = body.Records[0].s3;
        
        const data = await this.getS3Object(s3Details.bucket.name, s3Details.object.key);

        console.log(data.text);
    }
};

const processingHandler = new Handler();

export {processingHandler};