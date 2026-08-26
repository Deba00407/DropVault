import {
    pgTable,
    uuid,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { SessionDataModel } from "./sessionDataModel";
import { conversationType } from "./conversationType";

export const ConversationDataModel = pgTable("conversations", {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    session_id: uuid("session_id")
        .notNull()
        .references(() => SessionDataModel.id, {
            onDelete: "cascade"
        }),

    conversation_type: conversationType("conversation_type").notNull(),

    content: text("content").notNull(),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    }).defaultNow().$onUpdate(() => new Date()).notNull(),
});