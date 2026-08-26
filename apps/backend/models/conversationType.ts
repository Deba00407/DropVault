import { pgEnum } from "drizzle-orm/pg-core";

const conversationType = pgEnum('response_type',
    ["user", "model"]
);

export type ConversationType = (typeof conversationType.enumValues)[number];
export { conversationType };