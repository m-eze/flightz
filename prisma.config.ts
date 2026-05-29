import { defineConfig } from "prisma/config";

// To use SQLite locally (no setup required):
//   DATABASE_URL="file:./prisma/flightz.db"
//
// To use Neon PostgreSQL (production):
//   DATABASE_URL="postgresql://user:pass@ep-xxx.aws-neon.net/nflightz?sslmode=require"
//   DIRECT_URL="postgresql://user:pass@ep-xxx.aws-neon.net/nflightz?sslmode=require"
//
// Neon's connection string ends in /nflightz — create the database first via their dashboard.

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/flightz.db";

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});