import { db } from './db';

/**
 * Script zum Hinzufügen der Journal/Tagebuch-Tabellen zur Datenbank
 */
const addJournalTables = async () => {
  try {
    console.log('Erstelle Journal-Tabellen...');
    
    // Journal-Einträge Tabelle
    await db.run(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL,
        entry_text TEXT NOT NULL,
        entry_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        quest_id INTEGER,
        mood TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ journal_entries Tabelle erstellt');
    
    // Quest-Log Tabelle (Historie abgeschlossener Quests)
    await db.run(`
      CREATE TABLE IF NOT EXISTS quest_log (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL,
        quest_id INTEGER NOT NULL,
        quest_title TEXT NOT NULL,
        quest_description TEXT,
        completed_at TIMESTAMP NOT NULL,
        xp_earned INTEGER DEFAULT 0,
        grade TEXT,
        feedback TEXT,
        reflection TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ quest_log Tabelle erstellt');
    
    // Indizes für bessere Performance
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_journal_entries_character_id 
      ON journal_entries(character_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_journal_entries_quest_id 
      ON journal_entries(quest_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_quest_log_character_id 
      ON quest_log(character_id)
    `);
    
    await db.run(`
      CREATE INDEX IF NOT EXISTS idx_quest_log_completed_at 
      ON quest_log(completed_at DESC)
    `);
    
    console.log('✅ Indizes erstellt');
    console.log('✅ Journal-Schema erfolgreich hinzugefügt!');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Journal-Tabellen:', error);
    throw error;
  }
};

// Script ausführen
if (require.main === module) {
  addJournalTables()
    .then(() => {
      console.log('Migration abgeschlossen');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration fehlgeschlagen:', error);
      process.exit(1);
    });
}

export { addJournalTables };
