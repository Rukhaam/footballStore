import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle(pool);