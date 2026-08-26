import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    text,
} from "drizzle-orm/pg-core";
import { users } from "../auth-schema";

export const SessionDataModel = pgTable("session_data", {
    id: uuid("id")
        .defaultRandom()
        .primaryKey(),

    title: varchar("title", {
        length: 100,
    }).notNull(),

    user_id: text("user_id")
        .notNull()
        .references(() => users.id, {
            onDelete: "cascade"
        }),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).defaultNow().notNull(),

    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    }).defaultNow().$onUpdate(() => new Date()).notNull(),
});