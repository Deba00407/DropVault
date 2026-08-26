
import { pgEnum } from "drizzle-orm/pg-core";

const docProcessingStatus = pgEnum('doc_status',
    ["UPLOADED", "QUEUED", "PROCESSING", "READY", "FAILED", "CHUNKED"]
);

export type DocProcessingStatus = (typeof docProcessingStatus.enumValues)[number];
export {docProcessingStatus};