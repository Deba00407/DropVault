import * as p from 'drizzle-orm/pg-core'

const UserTable = p.pgTable("users", {
    id: p.bigserial({mode: 'bigint'}).primaryKey(),
    name: p.text().notNull(),

    created_At: p.timestamp().defaultNow(),
    updated_At: p.timestamp().defaultNow().$onUpdate(() => new Date()),

    email: p.text().unique().notNull(),
    password: p.text().notNull()
});

type InsertUser = typeof UserTable.$inferInsert
type SelectUser = typeof UserTable.$inferSelect

export {UserTable, type InsertUser, type SelectUser};