import { ReceiveMessageCommand } from "@aws-sdk/client-sqs"

import { sqs } from "../config/aws_config";

import { processingHandler } from "./processingHandler";

let isRunning = true;

process.on("SIGINT", () => {
    console.log("Received SIGINT. Shutting down worker...");
    isRunning = false;
});

process.on("SIGTERM", () => {
    console.log("Received SIGTERM. Shutting down worker...");
    isRunning = false;
});

// Long running process queue
async function pollQueue() {
    while (isRunning) {
        try {
            const response = await sqs.send(
                new ReceiveMessageCommand({
                    QueueUrl: process.env.AWS_SQS_URL!,

                    // process one document at a time
                    MaxNumberOfMessages: 1,

                    WaitTimeSeconds: 20,

                    // We need the receipt handle later to delete
                    // the message after successful processing.
                    AttributeNames: ["All"],
                    MessageAttributeNames: ["All"],
                })
            );

            if (!response.Messages?.length) {
                continue;
            }

            for (const message of response.Messages) {
                processingHandler.handleIncomingMessage(message);
            }
        } catch (error) {
            console.error("Error polling SQS:", error);

            // Prevent a tight retry loop if AWS temporarily fails.
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }

    console.log("Worker stopped.");
}

pollQueue().catch((error) => {
    console.error("Worker terminated unexpectedly:", error);
    process.exit(1);
});
