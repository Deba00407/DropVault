import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    timestamp,
} from "drizzle-orm/pg-core";

import { docProcessingStatus } from "./docProcessingStatus";

export const fileMetadata = pgTable("file_metadata", {
    id: uuid("id").defaultRandom().primaryKey(),

    fileName: varchar("file_name", { length: 255 }).notNull(),

    objectKey: text("object_key").notNull().unique(),

    contentType: varchar("content_type", { length: 100 }),

    fileSize: integer("file_size"),

    status: docProcessingStatus('doc_current_status').default('UPLOADED'),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    processedAt: timestamp("processed_at").defaultNow().notNull()
});