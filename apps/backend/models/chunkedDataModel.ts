import {
    pgTable,
    uuid,
    text,
    integer,
    timestamp,
} from "drizzle-orm/pg-core";

import { fileMetadata } from './fileMetaDataModel'

export const documentChunks = pgTable("document_chunks", {
    id: uuid("id").defaultRandom().primaryKey(),

    documentId: uuid("document_id")
        .notNull()
        .references(() => fileMetadata.id, {
            onDelete: "cascade",
        }),

    chunkIndex: integer("chunk_index").notNull(),

    content: text("content").notNull(),

    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull()
});