import {SQSClient} from '@aws-sdk/client-sqs'
import {S3Client} from '@aws-sdk/client-s3'


const sqs = new SQSClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!
    }
});

const s3client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!
    }
});

export {sqs, s3client};