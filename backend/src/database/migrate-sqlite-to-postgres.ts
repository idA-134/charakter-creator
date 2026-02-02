#!/usr/bin/env tsx
/**
 * SQLite zu PostgreSQL Migrations-Script
 * 
 * Dieses Script:
 * 1. Liest alle Daten aus der SQLite Datenbank
 * 2. Erstellt das PostgreSQL Schema
 * 3. Konvertiert und überträgt alle Daten
 * 4. Verifiziert die Migration
 * 
 * Nutzung:
 *   tsx src/database/migrate-sqlite-to-postgres.ts
 */

import Database from 'better-sqlite3';
import { Pool } from 'pg';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// SQLite Connection
const sqlitePath = path.join(__dirname, '..', '..', 'database.sqlite');
const sqlite = new Database(sqlitePath, { readonly: true });

// PostgreSQL Connection
const postgres = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface MigrationStats {
  table: string;
  rowsRead: number;
  rowsWritten: number;
  success: boolean;
  error?: string;
}

const stats: MigrationStats[] = [];

/**
 * Erstelle PostgreSQL Schema (SQLite kompatibel)
 */
async function createPostgresSchema() {
  console.log('\n📋 Erstelle PostgreSQL Schema...');

  if (process.env.DB_RESET === 'true') {
    await postgres.query('DROP TABLE IF EXISTS quest_submissions CASCADE');
    await postgres.query('DROP TABLE IF EXISTS notifications CASCADE');
    await postgres.query('DROP TABLE IF EXISTS character_titles CASCADE');
    await postgres.query('DROP TABLE IF EXISTS quest_assignments CASCADE');
    await postgres.query('DROP TABLE IF EXISTS group_members CASCADE');
    await postgres.query('DROP TABLE IF EXISTS groups CASCADE');
    await postgres.query('DROP TABLE IF EXISTS character_quests CASCADE');
    await postgres.query('DROP TABLE IF EXISTS quests CASCADE');
    await postgres.query('DROP TABLE IF EXISTS character_achievements CASCADE');
    await postgres.query('DROP TABLE IF EXISTS achievements CASCADE');
    await postgres.query('DROP TABLE IF EXISTS character_equipment CASCADE');
    await postgres.query('DROP TABLE IF EXISTS equipment CASCADE');
    await postgres.query('DROP TABLE IF EXISTS characters CASCADE');
    await postgres.query('DROP TABLE IF EXISTS users CASCADE');
  }

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'nachwuchskraft',
      is_admin INTEGER DEFAULT 0,
      is_super_admin INTEGER DEFAULT 0,
      pending_approval INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (now()::text)
    );

    CREATE TABLE IF NOT EXISTS characters (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      title TEXT DEFAULT 'Azubi',
      backstory TEXT,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      xp_to_next_level INTEGER DEFAULT 100,
      programmierung INTEGER DEFAULT 10,
      netzwerke INTEGER DEFAULT 10,
      datenbanken INTEGER DEFAULT 10,
      hardware INTEGER DEFAULT 10,
      sicherheit INTEGER DEFAULT 10,
      projektmanagement INTEGER DEFAULT 10,
      created_at TEXT DEFAULT (now()::text),
      updated_at TEXT DEFAULT (now()::text),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      rarity TEXT DEFAULT 'common',
      programmierung_bonus INTEGER DEFAULT 0,
      netzwerke_bonus INTEGER DEFAULT 0,
      datenbanken_bonus INTEGER DEFAULT 0,
      hardware_bonus INTEGER DEFAULT 0,
      sicherheit_bonus INTEGER DEFAULT 0,
      projektmanagement_bonus INTEGER DEFAULT 0,
      min_level INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (now()::text)
    );

    CREATE TABLE IF NOT EXISTS character_equipment (
      id SERIAL PRIMARY KEY,
      character_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      equipped INTEGER DEFAULT 0,
      acquired_at TEXT DEFAULT (now()::text),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
      UNIQUE(character_id, equipment_id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      category TEXT,
      xp_reward INTEGER DEFAULT 0,
      requirement_type TEXT,
      requirement_value INTEGER,
      created_at TEXT DEFAULT (now()::text)
    );

    CREATE TABLE IF NOT EXISTS character_achievements (
      id SERIAL PRIMARY KEY,
      character_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      unlocked_at TEXT DEFAULT (now()::text),
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(character_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS quests (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      difficulty TEXT DEFAULT 'beginner',
      xp_reward INTEGER DEFAULT 50,
      programmierung_reward INTEGER DEFAULT 0,
      netzwerke_reward INTEGER DEFAULT 0,
      datenbanken_reward INTEGER DEFAULT 0,
      hardware_reward INTEGER DEFAULT 0,
      sicherheit_reward INTEGER DEFAULT 0,
      projektmanagement_reward INTEGER DEFAULT 0,
      is_title_quest INTEGER DEFAULT 0,
      title_reward TEXT,
      equipment_reward_id INTEGER,
      required_equipment_id INTEGER,
      min_level INTEGER DEFAULT 1,
      prerequisite_quest_id INTEGER,
      created_by_user_id INTEGER,
      is_repeatable INTEGER DEFAULT 0,
      repeat_interval TEXT,
      due_date TEXT,
      repeat_time TEXT,
      repeat_day_of_week INTEGER,
      repeat_day_of_month INTEGER,
      created_at TEXT DEFAULT (now()::text),
      FOREIGN KEY (prerequisite_quest_id) REFERENCES quests(id) ON DELETE SET NULL,
      FOREIGN KEY (equipment_reward_id) REFERENCES equipment(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS character_quests (
      id SERIAL PRIMARY KEY,
      character_id INTEGER NOT NULL,
      quest_id INTEGER NOT NULL,
      status TEXT DEFAULT 'available',
      started_at TEXT,
      completed_at TEXT,
      submission_text TEXT,
      submission_file_url TEXT,
      submitted_at TEXT,
      grade TEXT,
      feedback TEXT,
      graded_at TEXT,
      graded_by_user_id INTEGER,
      last_completed_at TEXT,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
      FOREIGN KEY (graded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(character_id, quest_id)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by_user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (now()::text),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      joined_at TEXT DEFAULT (now()::text),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS quest_assignments (
      id SERIAL PRIMARY KEY,
      quest_id INTEGER NOT NULL,
      user_id INTEGER,
      group_id INTEGER,
      assigned_at TEXT DEFAULT (now()::text),
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      CHECK ((user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL))
    );

    CREATE TABLE IF NOT EXISTS character_titles (
      id SERIAL PRIMARY KEY,
      character_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      unlocked_at TEXT DEFAULT (now()::text),
      is_active INTEGER DEFAULT 0,
      FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
      UNIQUE(character_id, title)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (now()::text),
      read_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
  `;

  await postgres.query(schema);
  console.log('✅ Schema erstellt');
}

/**
 * Migriere eine Tabelle von SQLite zu PostgreSQL
 */
async function migrateTable(tableName: string) {
  console.log(`\n📦 Migriere Tabelle: ${tableName}`);
  
  try {
    // Lese alle Zeilen aus SQLite
    const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all() as Record<string, any>[];
    console.log(`   Gefunden: ${rows.length} Zeilen`);

    if (rows.length === 0) {
      stats.push({ table: tableName, rowsRead: 0, rowsWritten: 0, success: true });
      return;
    }

    // SQLite Spalten holen
    const sqliteColumns = Object.keys(rows[0]);

    // PostgreSQL Spalten holen
    const pgColumnsResult = await postgres.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
      [tableName]
    );
    const pgColumns = pgColumnsResult.rows.map((r: any) => r.column_name);

    // Nur Spalten verwenden, die es in beiden DBs gibt
    const insertColumns = sqliteColumns.filter((col) => pgColumns.includes(col));

    if (insertColumns.length === 0) {
      console.warn(`   ⚠️  Keine passenden Spalten gefunden, überspringe Tabelle ${tableName}`);
      stats.push({ table: tableName, rowsRead: rows.length, rowsWritten: 0, success: true });
      return;
    }

    // INSERT Statement
    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      INSERT INTO ${tableName} (${insertColumns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT DO NOTHING
    `;

    let written = 0;
    for (const row of rows) {
      const values = insertColumns.map(col => (row as any)[col]);

      try {
        await postgres.query(query, values);
        written++;
      } catch (error: any) {
        console.warn(`   ⚠️  Fehler bei Zeile: ${error.message}`);
      }
    }

    // Update Sequence für SERIAL columns
    if (insertColumns.includes('id')) {
      await postgres.query(`
        SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
          COALESCE((SELECT MAX(id) FROM ${tableName}), 1), 
          true
        )
      `);
    }

    console.log(`   ✅ Geschrieben: ${written} Zeilen`);
    stats.push({ table: tableName, rowsRead: rows.length, rowsWritten: written, success: true });

  } catch (error: any) {
    console.error(`   ❌ Fehler: ${error.message}`);
    stats.push({ 
      table: tableName, 
      rowsRead: 0, 
      rowsWritten: 0, 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Verifiziere Migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifiziere Migration...');
  
  for (const stat of stats) {
    if (!stat.success) continue;

    const sqliteCount = sqlite.prepare(`SELECT COUNT(*) as count FROM ${stat.table}`).get() as { count: number };
    const pgResult = await postgres.query(`SELECT COUNT(*) as count FROM ${stat.table}`);
    const pgCount = parseInt(pgResult.rows[0].count);

    if (sqliteCount.count === pgCount) {
      console.log(`   ✅ ${stat.table}: ${pgCount} Zeilen (OK)`);
    } else {
      console.log(`   ⚠️  ${stat.table}: SQLite=${sqliteCount.count}, PostgreSQL=${pgCount}`);
    }
  }
}

/**
 * Hauptfunktion
 */
async function main() {
  console.log('🚀 SQLite zu PostgreSQL Migration');
  console.log('==================================');
  console.log(`SQLite: ${sqlitePath}`);
  console.log(`PostgreSQL: ${process.env.DATABASE_URL}`);

  try {
    // Test PostgreSQL Verbindung
    await postgres.query('SELECT NOW()');
    console.log('✅ PostgreSQL Verbindung OK');

    // Erstelle Schema
    await createPostgresSchema();

    // Deaktiviere FK-Checks während Migration
    await postgres.query(`SET session_replication_role = 'replica'`);

    // Migriere Tabellen in der richtigen Reihenfolge (wegen Foreign Keys)
    await migrateTable('users');
    await migrateTable('characters');
    await migrateTable('equipment');
    await migrateTable('character_equipment');
    await migrateTable('achievements');
    await migrateTable('character_achievements');
    await migrateTable('quests');
    await migrateTable('character_quests');
    await migrateTable('groups');
    await migrateTable('group_members');
    await migrateTable('quest_assignments');
    await migrateTable('character_titles');
    await migrateTable('notifications');

    // Verifiziere
    await verifyMigration();

    // FK-Checks wieder aktivieren
    await postgres.query(`SET session_replication_role = 'origin'`);

    // Zusammenfassung
    console.log('\n📊 Migrations-Zusammenfassung');
    console.log('=============================');
    console.table(stats);

    const totalRead = stats.reduce((sum, s) => sum + s.rowsRead, 0);
    const totalWritten = stats.reduce((sum, s) => sum + s.rowsWritten, 0);
    const failed = stats.filter(s => !s.success).length;

    console.log(`\n✅ Migration abgeschlossen!`);
    console.log(`   Gelesen: ${totalRead} Zeilen`);
    console.log(`   Geschrieben: ${totalWritten} Zeilen`);
    console.log(`   Fehler: ${failed} Tabellen`);

  } catch (error: any) {
    console.error('\n❌ Migration fehlgeschlagen:', error.message);
    process.exit(1);
  } finally {
    sqlite.close();
    await postgres.end();
  }
}

// Start Migration
main();
