import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
const db = new Database(dbPath);

/**
 * Script zum Hinzufügen der Journal/Tagebuch-Tabellen zur SQLite-Datenbank
 */
const addJournalTables = () => {
  try {
    console.log('Erstelle Journal-Tabellen (SQLite)...');
    
    // Journal-Einträge Tabelle
    db.exec(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        entry_text TEXT NOT NULL,
        entry_date TEXT DEFAULT (datetime('now')),
        quest_id INTEGER,
        mood TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ journal_entries Tabelle erstellt');
    
    // Quest-Log Tabelle (Historie abgeschlossener Quests)
    db.exec(`
      CREATE TABLE IF NOT EXISTS quest_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        character_id INTEGER NOT NULL,
        quest_id INTEGER NOT NULL,
        quest_title TEXT NOT NULL,
        quest_description TEXT,
        completed_at TEXT NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        grade TEXT,
        feedback TEXT,
        reflection TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ quest_log Tabelle erstellt');
    
    // Indizes für bessere Performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_journal_entries_character_id ON journal_entries(character_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_journal_entries_quest_id ON journal_entries(quest_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_quest_log_character_id ON quest_log(character_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_quest_log_completed_at ON quest_log(completed_at DESC)`);
    
    console.log('✅ Indizes erstellt');
    console.log('✅ Journal-Schema (SQLite) erfolgreich hinzugefügt!');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Journal-Tabellen:', error);
    throw error;
  } finally {
    db.close();
  }
};

// Script ausführen
if (require.main === module) {
  try {
    addJournalTables();
    console.log('Migration abgeschlossen');
    process.exit(0);
  } catch (error) {
    console.error('Migration fehlgeschlagen:', error);
    process.exit(1);
  }
}

export { addJournalTables };
