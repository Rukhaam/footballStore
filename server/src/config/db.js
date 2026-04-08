import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pkg;

// Initialize the PostgreSQL connection pool using your Supabase URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection just to be safe
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export the db object so we can use it in our controllers
export const db = drizzle(pool);