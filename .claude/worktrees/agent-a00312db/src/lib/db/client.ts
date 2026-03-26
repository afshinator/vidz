import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DATABASE_URL = process.env.DATABASE_URL;

function createDb() {
  if (!DATABASE_URL) {
    return null;
  }
  const sql = neon(DATABASE_URL);
  return drizzle(sql, { schema });
}

const db = createDb();

export function getDb() {
  if (!db) {
    throw new Error('DATABASE_URL is not set. Please configure your environment variables.');
  }
  return db;
}

export type DB = typeof db;