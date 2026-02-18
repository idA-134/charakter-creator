#!/usr/bin/env tsx
/**
 * PostgreSQL Schema Migration
 * Erstellt alle benötigten Tabellen in PostgreSQL
 */

import { db, pool } from './db';

async function createTables() {
  try {
    console.log('🚀 Starte PostgreSQL Schema Migration...\n');

    if (process.env.DB_RESET === 'true') {
      console.log('⚠️  DB_RESET=true -> Lösche bestehende Tabellen...');
      await db.query(`DROP TABLE IF EXISTS quest_resources CASCADE`);
      await db.query(`DROP TABLE IF EXISTS quest_submissions CASCADE`);
      await db.query(`DROP TABLE IF EXISTS notifications CASCADE`);
      await db.query(`DROP TABLE IF EXISTS character_titles CASCADE`);
      await db.query(`DROP TABLE IF EXISTS quest_assignments CASCADE`);
      await db.query(`DROP TABLE IF EXISTS group_members CASCADE`);
      await db.query(`DROP TABLE IF EXISTS groups CASCADE`);
      await db.query(`DROP TABLE IF EXISTS character_quests CASCADE`);
      await db.query(`DROP TABLE IF EXISTS quests CASCADE`);
      await db.query(`DROP TABLE IF EXISTS character_achievements CASCADE`);
      await db.query(`DROP TABLE IF EXISTS achievements CASCADE`);
      await db.query(`DROP TABLE IF EXISTS character_equipment CASCADE`);
      await db.query(`DROP TABLE IF EXISTS equipment CASCADE`);
      await db.query(`DROP TABLE IF EXISTS characters CASCADE`);
      await db.query(`DROP TABLE IF EXISTS users CASCADE`);
    }

    // Users Tabelle
    console.log('📋 Erstelle users Tabelle...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'nachwuchskraft',
        is_admin INTEGER DEFAULT 0,
        is_super_admin INTEGER DEFAULT 0,
        pending_approval INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (now()::text)
      )
    `);

    // Characters Tabelle
    console.log('📋 Erstelle characters Tabelle...');
    await db.query(`
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
      )
    `);

    // Equipment Tabelle
    console.log('📋 Erstelle equipment Tabelle...');
    await db.query(`
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
      )
    `);

    // Character Equipment
    console.log('📋 Erstelle character_equipment Tabelle...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS character_equipment (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        equipped INTEGER DEFAULT 0,
        acquired_at TEXT DEFAULT (now()::text),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        UNIQUE(character_id, equipment_id)
      )
    `);

    // Achievements Tabelle
    console.log('📋 Erstelle achievements Tabelle...');
    await db.query(`
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
      )
    `);

    // Character Achievements
    console.log('📋 Erstelle character_achievements Tabelle...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS character_achievements (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        unlocked_at TEXT DEFAULT (now()::text),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
        UNIQUE(character_id, achievement_id)
      )
    `);

    // Quests Tabelle
    console.log('📋 Erstelle quests Tabelle...');
    await db.query(`
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
        approval_status TEXT DEFAULT 'pending',
        approval_requested_at TEXT,
        approved_at TEXT,
        approved_by_user_id INTEGER,
        approval_feedback TEXT,
        created_at TEXT DEFAULT (now()::text),
        FOREIGN KEY (prerequisite_quest_id) REFERENCES quests(id) ON DELETE SET NULL,
        FOREIGN KEY (equipment_reward_id) REFERENCES equipment(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Sicherstellen, dass required_equipment_id auch bei bestehenden DBs existiert
    await db.query(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS required_equipment_id INTEGER`);
    await db.query(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending'`);
    await db.query(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS approval_requested_at TEXT`);
    await db.query(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS approved_at TEXT`);
    await db.query(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS approved_by_user_id INTEGER`);
    await db.query(`ALTER TABLE quests ADD COLUMN IF NOT EXISTS approval_feedback TEXT`);
    await db.query(`UPDATE quests SET approval_status = 'approved' WHERE approval_status IS NULL`);

    // Character Quests
    console.log('📋 Erstelle character_quests Tabelle...');
    await db.query(`
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
      )
    `);

    // Gruppen Tabelle
    console.log('📋 Erstelle groups Tabelle...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by_user_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (now()::text),
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Gruppen-Mitglieder
    console.log('📋 Erstelle group_members Tabelle...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TEXT DEFAULT (now()::text),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(group_id, user_id)
      )
    `);

    const adminUsers = await db.all(`
      SELECT id
      FROM users
      WHERE is_super_admin = 1 OR is_admin = 1 OR role = 'admin'
      ORDER BY id ASC
    `);

    if (adminUsers.length > 0) {
      const existingAdminsGroup: any = await db.get(`SELECT id FROM groups WHERE name = 'Admins'`);
      let adminsGroupId = existingAdminsGroup?.id as number | undefined;

      if (!adminsGroupId) {
        const createdGroup: any = await db.get(`
          INSERT INTO groups (name, description, created_by_user_id)
          VALUES ('Admins', 'Systemgruppe fuer Admins', $1)
          RETURNING id
        `, [adminUsers[0].id]);
        adminsGroupId = createdGroup?.id;
      }

      if (adminsGroupId) {
        for (const admin of adminUsers as any[]) {
          await db.run(
            `INSERT INTO group_members (group_id, user_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [adminsGroupId, admin.id]
          );
        }
      }
    }

    // Quest-Zuweisungen
    console.log('📋 Erstelle quest_assignments Tabelle...');
    await db.query(`
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
      )
    `);

    // Character Titles
    console.log('📋 Erstelle character_titles Tabelle...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS character_titles (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        unlocked_at TEXT DEFAULT (now()::text),
        is_active INTEGER DEFAULT 0,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        UNIQUE(character_id, title)
      )
    `);

    // Notifications
    console.log('📋 Erstelle notifications Tabelle...');
    await db.query(`
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
      )
    `);

    // Quest Resources
    console.log('📋 Erstelle quest_resources Tabelle...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS quest_resources (
        id SERIAL PRIMARY KEY,
        quest_id INTEGER NOT NULL,
        file_url TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT,
        size INTEGER,
        uploaded_by_user_id INTEGER,
        uploaded_at TEXT DEFAULT (now()::text),
        FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`);

    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    console.log('\n📊 Erstelle Tabellen-Liste...');

    const result = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\nErstellte Tabellen:');
    result.rows.forEach((row: any) => {
      console.log(`  ✓ ${row.table_name}`);
    });
  } catch (error) {
    console.error('❌ Migration fehlgeschlagen:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration
createTables();
