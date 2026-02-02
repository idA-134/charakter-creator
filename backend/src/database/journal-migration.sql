-- Journal & Quest-Log Migration für PostgreSQL

-- Journal-Einträge Tabelle
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
);

-- Quest-Log Tabelle (Historie abgeschlossener Quests)
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
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_character_id ON journal_entries(character_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_quest_id ON journal_entries(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_log_character_id ON quest_log(character_id);
CREATE INDEX IF NOT EXISTS idx_quest_log_completed_at ON quest_log(completed_at DESC);

-- Trigger für updated_at in journal_entries
CREATE OR REPLACE FUNCTION update_journal_entries_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_update_timestamp
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_journal_entries_timestamp();

-- Kommentare für bessere Dokumentation
COMMENT ON TABLE journal_entries IS 'Tagebuch-Einträge der Nachwuchskräfte';
COMMENT ON TABLE quest_log IS 'Historie aller abgeschlossenen Quests';
COMMENT ON COLUMN journal_entries.mood IS 'Stimmung beim Erstellen des Eintrags (motivated, challenged, accomplished, etc.)';
COMMENT ON COLUMN quest_log.reflection IS 'Persönliche Reflektion der Nachwuchskraft zur abgeschlossenen Quest';
