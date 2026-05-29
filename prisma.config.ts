import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// PostgreSQL (Neon) — DATABASE_URL must be set in .env.local
// Example: DATABASE_URL="postgresql://user:***@ep-xxx.aws.neon.net/nflightz?sslmode=require"

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set.\n" +
    "Copy .env.example to .env.local and fill in your Neon PostgreSQL credentials.\n" +
    "Get a free database at https://neon.tech"
  );
}

export default defineConfig({
  migrations: {
    seed: "npx tsx ./prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});