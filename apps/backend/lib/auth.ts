import {betterAuth} from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '../db'
import * as schema from '../auth-schema'

export const auth = betterAuth({
    database: drizzleAdapter(db,{
        provider: "pg",
        schema,
        usePlural: true,
        transaction: true,
        debugLogs: true
    }),

    emailAndPassword: {
        enabled: true
    },

    trustedOrigins: [
        process.env.CLIENT_URL || "http://localhost:3000",
    ],
});
