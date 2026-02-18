import { Router } from 'express';
import { db } from '../database/db';

const journalRouter = Router();

// Alle Journal-Einträge eines Charakters abrufen
journalRouter.get('/character/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;

    // Prüfe ob Character existiert
    const character = await db.get(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (!character) {
      return res.status(404).json({ error: 'Charakter nicht gefunden' });
    }

    // Journal-Einträge mit Quest-Informationen abrufen
    const entries = await db.all(`
      SELECT 
        je.*,
        q.title as quest_title,
        q.category as quest_category
      FROM journal_entries je
      LEFT JOIN quests q ON je.quest_id = q.id
      WHERE je.character_id = $1
      ORDER BY je.entry_date DESC
    `, [characterId]);

    res.json(entries);
  } catch (error) {
    console.error('Fehler beim Abrufen der Journal-Einträge:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Journal-Einträge' });
  }
});

// Neuen Journal-Eintrag erstellen
journalRouter.post('/character/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { entry_text, quest_id, mood } = req.body;

    // Prüfe ob Character existiert
    const character = await db.get(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (!character) {
      return res.status(404).json({ error: 'Charakter nicht gefunden' });
    }

    if (!entry_text || entry_text.trim().length === 0) {
      return res.status(400).json({ error: 'Eintrag darf nicht leer sein' });
    }

    // Journal-Eintrag erstellen
    const result = await db.query(`
      INSERT INTO journal_entries (character_id, entry_text, quest_id, mood)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [characterId, entry_text, quest_id || null, mood || null]);

    const entry = result.rows[0];

    // Wenn Quest-ID vorhanden, Quest-Informationen hinzufügen
    if (quest_id) {
      const quest = await db.get('SELECT title, category FROM quests WHERE id = $1', [quest_id]);
      if (quest) {
        (entry as any).quest_title = quest.title;
        (entry as any).quest_category = quest.category;
      }
    }

    res.status(201).json(entry);
  } catch (error) {
    console.error('Fehler beim Erstellen des Journal-Eintrags:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Journal-Eintrags' });
  }
});

// Journal-Eintrag aktualisieren
journalRouter.put('/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    const { entry_text, mood } = req.body;

    // Prüfe ob Eintrag existiert
    const entry = await db.get(`
      SELECT je.* 
      FROM journal_entries je
      WHERE je.id = $1
    `, [entryId]);

    if (!entry) {
      return res.status(404).json({ error: 'Journal-Eintrag nicht gefunden' });
    }

    if (!entry_text || entry_text.trim().length === 0) {
      return res.status(400).json({ error: 'Eintrag darf nicht leer sein' });
    }

    // Eintrag aktualisieren
    const result = await db.query(`
      UPDATE journal_entries 
      SET entry_text = $1, mood = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [entry_text, mood || null, entryId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Journal-Eintrags:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Journal-Eintrags' });
  }
});

// Journal-Eintrag löschen
journalRouter.delete('/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;

    // Prüfe ob Eintrag existiert
    const entry = await db.get(`
      SELECT je.* 
      FROM journal_entries je
      WHERE je.id = $1
    `, [entryId]);

    if (!entry) {
      return res.status(404).json({ error: 'Journal-Eintrag nicht gefunden' });
    }

    await db.run('DELETE FROM journal_entries WHERE id = $1', [entryId]);
    res.json({ message: 'Journal-Eintrag gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Journal-Eintrags:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Journal-Eintrags' });
  }
});

// Quest-Log eines Charakters abrufen
journalRouter.get('/questlog/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;

    // Prüfe ob Character existiert
    const character = await db.get(
      'SELECT * FROM characters WHERE id = $1',
      [characterId]
    );

    if (!character) {
      return res.status(404).json({ error: 'Charakter nicht gefunden' });
    }

    // Quest-Log abrufen
    const questLog = await db.all(`
      SELECT * FROM quest_log
      WHERE character_id = $1
      ORDER BY completed_at DESC
    `, [characterId]);

    res.json(questLog);
  } catch (error) {
    console.error('Fehler beim Abrufen des Quest-Logs:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Quest-Logs' });
  }
});

// Reflektion zu Quest-Log-Eintrag hinzufügen
journalRouter.put('/questlog/:logId/reflection', async (req, res) => {
  try {
    const { logId } = req.params;
    const { reflection } = req.body;

    // Prüfe ob Quest-Log-Eintrag existiert
    const logEntry = await db.get(`
      SELECT ql.* 
      FROM quest_log ql
      WHERE ql.id = $1
    `, [logId]);

    if (!logEntry) {
      return res.status(404).json({ error: 'Quest-Log-Eintrag nicht gefunden' });
    }

    // Reflektion aktualisieren
    const result = await db.query(`
      UPDATE quest_log 
      SET reflection = $1
      WHERE id = $2
      RETURNING *
    `, [reflection, logId]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Reflektion:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Reflektion' });
  }
});

export default journalRouter;
