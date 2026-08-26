import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: ["./auth-schema.ts", "./models/*"],
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
