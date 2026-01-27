import { Router } from 'express';
import { db } from '../database/db';
import { createNotification } from './notification.routes';
import { upload, getRelativePath, getAbsolutePath } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

// Hilfsfunktion: Prüfe ob eine wiederholbare Quest erneut gestartet werden kann
function canRepeatQuest(lastCompletedAt: string | null, repeatInterval: string | null): boolean {
  if (!lastCompletedAt || !repeatInterval) {
    return true;
  }
  
  const lastCompleted = new Date(lastCompletedAt);
  const now = new Date();
  
  if (repeatInterval === 'weekly') {
    const weekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
    return (now.getTime() - lastCompleted.getTime()) >= weekInMilliseconds;
  }
  
  if (repeatInterval === 'daily') {
    const dayInMilliseconds = 24 * 60 * 60 * 1000;
    return (now.getTime() - lastCompleted.getTime()) >= dayInMilliseconds;
  }
  
  return true;
}

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
    
    // Nur zugewiesene Quests für Nachwuchskräfte anzeigen
    // Eine Quest ist zugewiesen, wenn ein Eintrag in character_quests existiert
    const questsStmt = db.prepare(
      `SELECT 
         q.*,
         cq.status,
         cq.started_at,
         cq.completed_at,
         cq.grade,
         cq.feedback,
         eq.name as required_equipment_name
       FROM quests q
       INNER JOIN character_quests cq ON q.id = cq.quest_id AND cq.character_id = ?
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
      
      // Status standardmäßig auf 'available' setzen, falls nicht definiert
      if (!quest.status) {
        quest.status = 'available';
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
    const questStmt = db.prepare('SELECT * FROM quests WHERE id = ?');
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
    
    // Für wiederholbare Quests: Prüfe ob Wiederholung möglich ist
    if (quest.is_repeatable) {
      const existingQuest: any = db.prepare(
        'SELECT status, last_completed_at FROM character_quests WHERE character_id = ? AND quest_id = ?'
      ).get(characterId, questId);
      
      if (existingQuest && existingQuest.status === 'completed') {
        if (!canRepeatQuest(existingQuest.last_completed_at, quest.repeat_interval)) {
          const lastCompleted = new Date(existingQuest.last_completed_at);
          const nextAvailable = new Date(lastCompleted.getTime() + (quest.repeat_interval === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
          return res.status(403).json({ 
            error: 'Diese Quest kann noch nicht wiederholt werden',
            next_available: nextAvailable.toISOString(),
            repeat_interval: quest.repeat_interval
          });
        }
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

// Abgabe einreichen (mit optionalem Datei-Upload)
questRouter.post('/:questId/submit', upload.single('file'), async (req, res) => {
  try {
    const { questId } = req.params;
    const { characterId, submission_text } = req.body;
    
    if (!characterId) {
      return res.status(400).json({ error: 'characterId erforderlich' });
    }
    
    // Prüfe Abgabefrist
    const quest: any = db.prepare('SELECT due_date, title FROM quests WHERE id = ?').get(questId);
    if (quest && quest.due_date) {
      const dueDate = new Date(quest.due_date);
      const now = new Date();
      if (now > dueDate) {
        return res.status(403).json({ 
          error: 'Abgabefrist überschritten',
          due_date: quest.due_date,
          quest_title: quest.title
        });
      }
    }
    
    // Mindestens Text oder Datei muss vorhanden sein
    if (!submission_text && !req.file) {
      return res.status(400).json({ error: 'Mindestens Text oder Datei erforderlich' });
    }
    
    // Speichere relativen Pfad der hochgeladenen Datei
    const submission_file_url = req.file ? getRelativePath(req.file.path) : null;
    
    const stmt = db.prepare(`
      UPDATE character_quests
      SET submission_text = ?,
          submission_file_url = ?,
          submitted_at = datetime('now'),
          status = 'submitted'
      WHERE character_id = ? AND quest_id = ?
    `);
    const info = stmt.run(submission_text || null, submission_file_url, characterId, questId);
    
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
        `${questInfo.character_name} hat die Quest "${questInfo.title}" abgegeben!${req.file ? ' (mit Datei)' : ''}`
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
         SET status = 'completed', completed_at = datetime('now'), last_completed_at = datetime('now')
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

// Datei herunterladen
questRouter.get('/submission/:submissionId/download', async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Hole Submission-Info aus DB
    const submission: any = db.prepare(`
      SELECT submission_file_url, quest_id
      FROM character_quests
      WHERE id = ?
    `).get(submissionId);
    
    if (!submission || !submission.submission_file_url) {
      return res.status(404).json({ error: 'Datei nicht gefunden' });
    }
    
    const filePath = getAbsolutePath(submission.submission_file_url);
    
    // Prüfe ob Datei existiert
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Datei existiert nicht auf dem Server' });
    }
    
    // Sende Datei zum Download
    const fileName = path.basename(filePath);
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Fehler beim Senden der Datei:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Fehler beim Herunterladen der Datei' });
        }
      }
    });
  } catch (error) {
    console.error('Fehler beim Datei-Download:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
