import { Router } from 'express';
import { db } from '../database/db';
import { createNotification } from './notification.routes';

export const questRouter = Router();

// Alle verfügbaren Quests abrufen
questRouter.get('/', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM quests ORDER BY min_level ASC, difficulty ASC');
    const result = stmt.all();
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen der Quests:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quests für einen Character (mit Status)
questRouter.get('/character/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    
    // Character-Level abrufen
    const charStmt = db.prepare('SELECT level FROM characters WHERE id = ?');
    const character = charStmt.get(characterId);
    if (!character) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    const characterLevel = (character as any).level;
    
    // Quests mit Status abrufen
    const questsStmt = db.prepare(
      `SELECT 
         q.*,
         COALESCE(cq.status, 'available') as status,
         cq.started_at,
         cq.completed_at,
         cq.grade,
         cq.feedback,
         eq.name as required_equipment_name
       FROM quests q
       LEFT JOIN character_quests cq ON q.id = cq.quest_id AND cq.character_id = ?
       LEFT JOIN equipment eq ON q.required_equipment_id = eq.id
       WHERE q.min_level <= ?
       ORDER BY q.min_level ASC, q.difficulty ASC`
    );
    let quests = questsStmt.all(characterId, characterLevel);
    
    // Für jede Quest prüfen ob Equipment-Requirement erfüllt ist
    quests = (quests as any[]).map((quest: any) => {
      if (quest.required_equipment_id) {
        const hasEquipment: any = db.prepare(`
          SELECT COUNT(*) as count
          FROM character_equipment
          WHERE character_id = ? AND equipment_id = ?
        `).get(characterId, quest.required_equipment_id);
        
        quest.has_required_equipment = hasEquipment.count > 0;
        quest.is_locked = !quest.has_required_equipment;
      } else {
        quest.has_required_equipment = true;
        quest.is_locked = false;
      }
      return quest;
    });
    
    res.json(quests);
  } catch (error) {
    console.error('Fehler beim Abrufen der Character-Quests:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest starten
questRouter.post('/:questId/start', async (req, res) => {
  try {
    const { questId } = req.params;
    const { characterId } = req.body;
    
    if (!characterId) {
      return res.status(400).json({ error: 'characterId erforderlich' });
    }
    
    // Quest abrufen und Equipment-Requirement prüfen
    const questStmt = db.prepare('SELECT required_equipment_id FROM quests WHERE id = ?');
    const quest: any = questStmt.get(questId);
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest nicht gefunden' });
    }
    
    // Prüfe ob Equipment-Requirement erfüllt ist
    if (quest.required_equipment_id) {
      const hasEquipment: any = db.prepare(`
        SELECT COUNT(*) as count
        FROM character_equipment
        WHERE character_id = ? AND equipment_id = ?
      `).get(characterId, quest.required_equipment_id);
      
      if (hasEquipment.count === 0) {
        const equipmentName: any = db.prepare('SELECT name FROM equipment WHERE id = ?').get(quest.required_equipment_id);
        return res.status(403).json({ 
          error: 'Benötigtes Equipment fehlt',
          required_equipment: equipmentName?.name 
        });
      }
    }
    
    // SQLite: INSERT OR REPLACE für UPSERT
    const stmt = db.prepare(
      `INSERT INTO character_quests (character_id, quest_id, status, started_at)
       VALUES (?, ?, 'in_progress', datetime('now'))
       ON CONFLICT (character_id, quest_id)
       DO UPDATE SET status = 'in_progress', started_at = datetime('now')`
    );
    stmt.run(characterId, questId);
    
    // Resultat abrufen
    const resultStmt = db.prepare('SELECT * FROM character_quests WHERE character_id = ? AND quest_id = ?');
    const result = resultStmt.get(characterId, questId);
    
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Starten der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Abgabe einreichen (NWK)
questRouter.post('/:questId/submit', async (req, res) => {
  try {
    const { questId } = req.params;
    const { characterId, submission_text, submission_file_url } = req.body;
    
    if (!characterId) {
      return res.status(400).json({ error: 'characterId erforderlich' });
    }
    
    if (!submission_text && !submission_file_url) {
      return res.status(400).json({ error: 'Mindestens Text oder Datei-URL erforderlich' });
    }
    
    const stmt = db.prepare(`
      UPDATE character_quests
      SET submission_text = ?,
          submission_file_url = ?,
          submitted_at = datetime('now'),
          status = 'submitted'
      WHERE character_id = ? AND quest_id = ?
    `);
    const info = stmt.run(submission_text, submission_file_url, characterId, questId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Quest-Zuordnung nicht gefunden' });
    }
    
    // Quest- und Dozent-Info für Notification abrufen
    const questInfo: any = db.prepare(`
      SELECT q.title, q.created_by_user_id, c.name as character_name
      FROM quests q
      JOIN character_quests cq ON q.id = cq.quest_id
      JOIN characters c ON cq.character_id = c.id
      WHERE cq.character_id = ? AND cq.quest_id = ?
    `).get(characterId, questId);
    
    // Notification an Dozent senden
    if (questInfo && questInfo.created_by_user_id) {
      createNotification(
        questInfo.created_by_user_id,
        'submission_received',
        'Neue Abgabe eingegangen',
        `${questInfo.character_name} hat die Quest "${questInfo.title}" abgegeben!`
      );
    }
    
    const result = db.prepare(`
      SELECT cq.*, q.title, q.description
      FROM character_quests cq
      JOIN quests q ON cq.quest_id = q.id
      WHERE cq.character_id = ? AND cq.quest_id = ?
    `).get(characterId, questId);
    
    res.json({ message: 'Abgabe erfolgreich eingereicht', submission: result });
  } catch (error) {
    console.error('Fehler beim Einreichen der Abgabe:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest abschließen (Alt - für nicht-bewertete Quests)
questRouter.post('/:questId/complete', async (req, res) => {
  try {
    const { questId } = req.params;
    const { characterId } = req.body;
    
    if (!characterId) {
      return res.status(400).json({ error: 'characterId erforderlich' });
    }
    
    // SQLite Transaction
    const transaction = db.transaction(() => {
      // Quest-Daten abrufen
      const questStmt = db.prepare('SELECT * FROM quests WHERE id = ?');
      const quest = questStmt.get(questId) as any;
      if (!quest) {
        throw new Error('Quest nicht gefunden');
      }
      
      // Quest als abgeschlossen markieren
      const updateQuestStmt = db.prepare(
        `UPDATE character_quests
         SET status = 'completed', completed_at = datetime('now')
         WHERE character_id = ? AND quest_id = ?`
      );
      updateQuestStmt.run(characterId, questId);
      
      // Belohnungen vergeben - XP (LEAST → MIN)
      const updateCharStmt = db.prepare(
        `UPDATE characters
         SET xp = xp + ?,
             programmierung = MIN(programmierung + ?, 100),
             netzwerke = MIN(netzwerke + ?, 100),
             datenbanken = MIN(datenbanken + ?, 100),
             hardware = MIN(hardware + ?, 100),
             sicherheit = MIN(sicherheit + ?, 100),
             projektmanagement = MIN(projektmanagement + ?, 100),
             updated_at = datetime('now')
         WHERE id = ?`
      );
      updateCharStmt.run(
        quest.xp_reward,
        quest.programmierung_reward,
        quest.netzwerke_reward,
        quest.datenbanken_reward,
        quest.hardware_reward,
        quest.sicherheit_reward,
        quest.projektmanagement_reward,
        characterId
      );
      
      // Aktualisierte Character-Daten abrufen
      const characterStmt = db.prepare('SELECT * FROM characters WHERE id = ?');
      const character = characterStmt.get(characterId);
      
      return { quest, character };
    });
    
    const { quest, character } = transaction();
    
    res.json({
      message: 'Quest abgeschlossen!',
      rewards: {
        xp: quest.xp_reward,
        programmierung: quest.programmierung_reward,
        netzwerke: quest.netzwerke_reward,
        datenbanken: quest.datenbanken_reward,
        hardware: quest.hardware_reward,
        sicherheit: quest.sicherheit_reward,
        projektmanagement: quest.projektmanagement_reward
      },
      character
    });
  } catch (error) {
    console.error('Fehler beim Abschließen der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
