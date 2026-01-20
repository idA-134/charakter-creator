import { db } from './db';

const addNewColumns = () => {
  try {
    console.log('Erweitere Datenbank-Schema...');
    
    // Users Tabelle: role-Spalte hinzufügen
    try {
      db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'nachwuchskraft'`);
      console.log('✅ users.role hinzugefügt');
    } catch (e: any) {
      if (!e.message.includes('duplicate column name')) {
        throw e;
      }
      console.log('⏭️  users.role existiert bereits');
    }
    
    // Quests Tabelle: neue Spalten hinzufügen
    const questColumns = [
      { name: 'is_title_quest', type: 'INTEGER DEFAULT 0' },
      { name: 'title_reward', type: 'TEXT' },
      { name: 'equipment_reward_id', type: 'INTEGER' },
      { name: 'required_equipment_id', type: 'INTEGER' },
      { name: 'prerequisite_quest_id', type: 'INTEGER' },
      { name: 'created_by_user_id', type: 'INTEGER' }
    ];
    
    for (const col of questColumns) {
      try {
        db.exec(`ALTER TABLE quests ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ quests.${col.name} hinzugefügt`);
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          throw e;
        }
        console.log(`⏭️  quests.${col.name} existiert bereits`);
      }
    }
    
    // Character_quests Tabelle: neue Spalten hinzufügen
    const characterQuestColumns = [
      { name: 'submission_text', type: 'TEXT' },
      { name: 'submission_file_url', type: 'TEXT' },
      { name: 'submitted_at', type: 'TEXT' },
      { name: 'grade', type: 'TEXT' },
      { name: 'feedback', type: 'TEXT' },
      { name: 'graded_at', type: 'TEXT' },
      { name: 'graded_by_user_id', type: 'INTEGER' }
    ];
    
    for (const col of characterQuestColumns) {
      try {
        db.exec(`ALTER TABLE character_quests ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ character_quests.${col.name} hinzugefügt`);
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          throw e;
        }
        console.log(`⏭️  character_quests.${col.name} existiert bereits`);
      }
    }
    
    // Neue Tabellen erstellen
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
    console.log('✅ groups Tabelle erstellt');
    
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
    console.log('✅ group_members Tabelle erstellt');
    
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
    console.log('✅ quest_assignments Tabelle erstellt');
    
    console.log('\n✅ Datenbank-Schema erfolgreich erweitert!');
  } catch (error) {
    console.error('❌ Fehler beim Erweitern des Schemas:', error);
    throw error;
  }
};

// Script ausführen
if (require.main === module) {
  try {
    addNewColumns();
    console.log('Migration abgeschlossen');
    process.exit(0);
  } catch (error) {
    console.error('Migration fehlgeschlagen:', error);
    process.exit(1);
  }
}

export { addNewColumns };
