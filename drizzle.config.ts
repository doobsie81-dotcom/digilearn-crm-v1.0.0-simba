import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: process.env.NODE_ENV === "production" ? ".env" : ".env.local" });

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
