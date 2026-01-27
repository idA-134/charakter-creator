import { db } from './db';

const createTables = () => {
  try {
    // Users Tabelle - erweitert mit Rollen
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'nachwuchskraft',
        is_admin INTEGER DEFAULT 0,
        is_super_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Characters Tabelle
    db.exec(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        title TEXT DEFAULT 'Azubi',
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        xp_to_next_level INTEGER DEFAULT 100,
        
        programmierung INTEGER DEFAULT 10,
        netzwerke INTEGER DEFAULT 10,
        datenbanken INTEGER DEFAULT 10,
        hardware INTEGER DEFAULT 10,
        sicherheit INTEGER DEFAULT 10,
        projektmanagement INTEGER DEFAULT 10,
        
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Equipment Tabelle
    db.exec(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Character Equipment
    db.exec(`
      CREATE TABLE IF NOT EXISTS character_equipment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        equipment_id INTEGER NOT NULL,
        equipped INTEGER DEFAULT 0,
        acquired_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        UNIQUE(character_id, equipment_id)
      )
    `);

    // Achievements Tabelle
    db.exec(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        category TEXT,
        xp_reward INTEGER DEFAULT 0,
        requirement_type TEXT,
        requirement_value INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Character Achievements
    db.exec(`
      CREATE TABLE IF NOT EXISTS character_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        achievement_id INTEGER NOT NULL,
        unlocked_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
        UNIQUE(character_id, achievement_id)
      )
    `);

    // Quests Tabelle - erweitert für Dozenten-System
    db.exec(`
      CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        
        min_level INTEGER DEFAULT 1,
        prerequisite_quest_id INTEGER,
        created_by_user_id INTEGER,
        
        is_repeatable INTEGER DEFAULT 0,
        repeat_interval TEXT,
        due_date TEXT,
        repeat_time TEXT,
        repeat_day_of_week INTEGER,
        repeat_day_of_month INTEGER,
        
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (prerequisite_quest_id) REFERENCES quests(id) ON DELETE SET NULL,
        FOREIGN KEY (equipment_reward_id) REFERENCES equipment(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Character Quests - erweitert mit Abgaben
    db.exec(`
      CREATE TABLE IF NOT EXISTS character_quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_by_user_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Gruppen-Mitglieder
    db.exec(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        joined_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(group_id, user_id)
      )
    `);

    // Quest-Zuweisungen (für Gruppen oder einzelne User)
    db.exec(`
      CREATE TABLE IF NOT EXISTS quest_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quest_id INTEGER NOT NULL,
        user_id INTEGER,
        group_id INTEGER,
        assigned_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        CHECK ((user_id IS NOT NULL AND group_id IS NULL) OR (user_id IS NULL AND group_id IS NOT NULL))
      )
    `);

    // Character Titles - Errungene Titel
    db.exec(`
      CREATE TABLE IF NOT EXISTS character_titles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        unlocked_at TEXT DEFAULT (datetime('now')),
        is_active INTEGER DEFAULT 0,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        UNIQUE(character_id, title)
      )
    `);

    console.log('✅ Datenbank-Tabellen erfolgreich erstellt!');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Tabellen:', error);
    throw error;
  }
};

// Script ausführen
if (require.main === module) {
  try {
    createTables();
    console.log('Migration abgeschlossen');
    process.exit(0);
  } catch (error) {
    console.error('Migration fehlgeschlagen:', error);
    process.exit(1);
  }
}

export { createTables };
