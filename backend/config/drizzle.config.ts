import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: ["./auth-schema.ts", "./models/fileMetaDataModel.ts"],
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
