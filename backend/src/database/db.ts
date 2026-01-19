import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', '..', 'database.sqlite');
export const db = new Database(dbPath, { verbose: console.log });

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

console.log('✅ Datenbank verbunden:', dbPath);
