import { defineConfig } from "drizzle-kit";
import dotenv from 'dotenv';

dotenv.config();


export default defineConfig({
  schema: "./src/models/schema.js", 
  out: "./drizzle",                 
  driver: "pg", // <-- Changed from "dialect"
  dbCredentials: {
    connectionString: process.env.DATABASE_URL, // <-- Changed from "url"
  },
  verbose: true,
  strict: true,
});