import { Router } from 'express';
import { db } from '../database/db';
import { createNotification } from './notification.routes';
import { upload, getRelativePath, getAbsolutePath } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

// Hilfsfunktion: Prüfe ob eine wiederholbare Quest erneut gestartet werden kann
function canRepeatQuest(lastCompletedAt: string | null, repeatInterval: string | null, repeatTime: string | null, repeatDayOfWeek: number | null, repeatDayOfMonth: number | null): boolean {
  if (!lastCompletedAt || !repeatInterval || !repeatTime) {
    return true;
  }
  
  const lastCompleted = new Date(lastCompletedAt);
  const now = new Date();
  
  // Parse repeat_time (HH:MM)
  const [hours, minutes] = repeatTime.split(':').map(Number);
  
  if (repeatInterval === 'daily') {
    // Nächste Wiederholung ist am nächsten Tag zur angegebenen Uhrzeit
    const nextRepeat = new Date(lastCompleted);
    nextRepeat.setDate(nextRepeat.getDate() + 1);
    nextRepeat.setHours(hours, minutes, 0, 0);
    
    return now >= nextRepeat;
  }
  
  if (repeatInterval === 'weekly') {
    // Nächste Wiederholung ist in der nächsten Woche am angegebenen Wochentag zur Uhrzeit
    const targetDay = repeatDayOfWeek ?? 1; // Default Montag
    const nextRepeat = new Date(lastCompleted);
    
    // Finde nächsten Wochentag
    const currentDay = nextRepeat.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Nächste Woche
    }
    
    nextRepeat.setDate(nextRepeat.getDate() + daysToAdd);
    nextRepeat.setHours(hours, minutes, 0, 0);
    
    return now >= nextRepeat;
  }
  
  if (repeatInterval === 'monthly') {
    // Nächste Wiederholung ist im nächsten Monat am angegebenen Tag zur Uhrzeit
    const targetDay = repeatDayOfMonth ?? 1;
    const nextRepeat = new Date(lastCompleted);
    
    nextRepeat.setMonth(nextRepeat.getMonth() + 1);
    nextRepeat.setDate(Math.min(targetDay, new Date(nextRepeat.getFullYear(), nextRepeat.getMonth() + 1, 0).getDate()));
    nextRepeat.setHours(hours, minutes, 0, 0);
    
    return now >= nextRepeat;
  }
  
  return true;
}

export const questRouter = Router();

// Alle verfügbaren Quests abrufen
questRouter.get('/', async (req, res) => {
  try {
    const result = await db.all('SELECT * FROM quests ORDER BY min_level ASC, difficulty ASC');
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
    const character = await db.get('SELECT level FROM characters WHERE id = $1', [characterId]);
    if (!character) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    const characterLevel = (character as any).level;
    
    // Nur zugewiesene Quests für Nachwuchskräfte anzeigen
    // Eine Quest ist zugewiesen, wenn ein Eintrag in character_quests existiert
    const quests = await db.all(
      `SELECT 
         q.*,
         cq.status,
         cq.started_at,
         cq.completed_at,
         cq.submitted_at,
         cq.grade,
         cq.feedback,
         cq.submission_text,
         cq.submission_file_url,
         eq.name as required_equipment_name
       FROM quests q
       INNER JOIN character_quests cq ON q.id = cq.quest_id AND cq.character_id = $1
       LEFT JOIN equipment eq ON q.required_equipment_id = eq.id
       WHERE q.min_level <= $2
       ORDER BY q.min_level ASC, q.difficulty ASC`
    , [characterId, characterLevel]);
    
    // Für jede Quest prüfen ob Equipment-Requirement erfüllt ist
    // Und bei wiederholbaren Quests Status automatisch zurücksetzen
    const enrichedQuests: any[] = [];

    for (const quest of quests as any[]) {
      if (quest.required_equipment_id) {
        const hasEquipment: any = await db.get(
          `SELECT COUNT(*) as count
           FROM character_equipment
           WHERE character_id = $1 AND equipment_id = $2`,
          [characterId, quest.required_equipment_id]
        );

        quest.has_required_equipment = Number(hasEquipment?.count ?? 0) > 0;
        quest.is_locked = !quest.has_required_equipment;
      } else {
        quest.has_required_equipment = true;
        quest.is_locked = false;
      }

      // Status standardmäßig auf 'available' setzen, falls nicht definiert
      if (!quest.status) {
        quest.status = 'available';
      }

      // Für wiederholbare Quests: Prüfen ob Zeit für Wiederholung erreicht ist
      if (quest.is_repeatable && quest.status === 'completed' && quest.last_completed_at) {
        const canRepeat = canRepeatQuest(
          quest.last_completed_at,
          quest.repeat_interval,
          quest.repeat_time,
          quest.repeat_day_of_week,
          quest.repeat_day_of_month
        );

        if (canRepeat) {
          await db.run(
            `UPDATE character_quests
             SET status = 'available',
                 submission_text = NULL,
                 submission_file_url = NULL,
                 submitted_at = NULL,
                 grade = NULL,
                 feedback = NULL,
                 graded_at = NULL,
                 graded_by_user_id = NULL
             WHERE character_id = $1 AND quest_id = $2`,
            [characterId, quest.id]
          );

          quest.status = 'available';
          quest.submission_text = null;
          quest.submission_file_url = null;
          quest.submitted_at = null;
          quest.grade = null;
          quest.feedback = null;
          quest.graded_at = null;
          quest.graded_by_user_id = null;
        }
      }

      enrichedQuests.push(quest);
    }

    res.json(enrichedQuests);
  } catch (error) {
    console.error('Fehler beim Abrufen der Character-Quests:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Ressourcen einer Quest abrufen (Dateien/Videos)
questRouter.get('/:questId/resources', async (req, res) => {
  try {
    const { questId } = req.params;

    const resources = await db.all(`
      SELECT id, quest_id, file_url, original_name, mime_type, size, uploaded_at
      FROM quest_resources
      WHERE quest_id = $1
      ORDER BY uploaded_at DESC
    `, [questId]);

    res.json(resources);
  } catch (error) {
    console.error('Fehler beim Abrufen der Quest-Ressourcen:', error);
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
    const quest: any = await db.get('SELECT * FROM quests WHERE id = $1', [questId]);
    
    if (!quest) {
      return res.status(404).json({ error: 'Quest nicht gefunden' });
    }
    
    // Prüfe ob Equipment-Requirement erfüllt ist
    if (quest.required_equipment_id) {
      const hasEquipment: any = await db.get(`
        SELECT COUNT(*) as count
        FROM character_equipment
        WHERE character_id = $1 AND equipment_id = $2
      `, [characterId, quest.required_equipment_id]);
      
      if (hasEquipment.count === 0) {
        const equipmentName: any = await db.get('SELECT name FROM equipment WHERE id = $1', [quest.required_equipment_id]);
        return res.status(403).json({ 
          error: 'Benötigtes Equipment fehlt',
          required_equipment: equipmentName?.name 
        });
      }
    }
    
    // Für wiederholbare Quests: Prüfe ob Wiederholung möglich ist
    if (quest.is_repeatable) {
      const existingQuest: any = await db.get(
        'SELECT status, last_completed_at FROM character_quests WHERE character_id = $1 AND quest_id = $2',
        [characterId, questId]
      );
      
      if (existingQuest && existingQuest.status === 'completed') {
        if (!canRepeatQuest(existingQuest.last_completed_at, quest.repeat_interval, quest.repeat_time, quest.repeat_day_of_week, quest.repeat_day_of_month)) {
          return res.status(403).json({ 
            error: 'Diese Quest kann noch nicht wiederholt werden',
            repeat_interval: quest.repeat_interval,
            repeat_time: quest.repeat_time
          });
        }
      }
    }
    
    // UPSERT
    await db.run(
      `INSERT INTO character_quests (character_id, quest_id, status, started_at)
       VALUES ($1, $2, 'in_progress', (now()::text))
       ON CONFLICT (character_id, quest_id)
       DO UPDATE SET status = 'in_progress', started_at = (now()::text)`,
      [characterId, questId]
    );
    
    // Resultat abrufen
    const result = await db.get('SELECT * FROM character_quests WHERE character_id = $1 AND quest_id = $2', [characterId, questId]);
    
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
    const quest: any = await db.get('SELECT due_date, title FROM quests WHERE id = $1', [questId]);
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
    
    const result = await db.get(`
      UPDATE character_quests
      SET submission_text = $1,
          submission_file_url = $2,
          submitted_at = (now()::text),
          status = 'submitted'
      WHERE character_id = $3 AND quest_id = $4
      RETURNING *
    `, [submission_text || null, submission_file_url, characterId, questId]);
    
    if (!result) {
      return res.status(404).json({ error: 'Quest-Zuordnung nicht gefunden' });
    }
    
    // Quest- und Dozent-Info für Notification abrufen
    const questInfo: any = await db.get(`
      SELECT q.title, q.created_by_user_id, c.name as character_name
      FROM quests q
      JOIN character_quests cq ON q.id = cq.quest_id
      JOIN characters c ON cq.character_id = c.id
      WHERE cq.character_id = $1 AND cq.quest_id = $2
    `, [characterId, questId]);
    
    // Notification an Dozent senden
    if (questInfo && questInfo.created_by_user_id) {
      createNotification(
        questInfo.created_by_user_id,
        'submission_received',
        'Neue Abgabe eingegangen',
        `${questInfo.character_name} hat die Quest "${questInfo.title}" abgegeben!${req.file ? ' (mit Datei)' : ''}`
      );
    }
    
    const submission = await db.get(`
      SELECT cq.*, q.title, q.description
      FROM character_quests cq
      JOIN quests q ON cq.quest_id = q.id
      WHERE cq.character_id = $1 AND cq.quest_id = $2
    `, [characterId, questId]);
    
    res.json({ message: 'Abgabe erfolgreich eingereicht', submission });
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
    
    // Transaction
    const { quest, character } = await db.transaction(async (client) => {
      const questResult = await client.query('SELECT * FROM quests WHERE id = $1', [questId]);
      const quest = questResult.rows[0] as any;
      if (!quest) {
        throw new Error('Quest nicht gefunden');
      }

      await client.query(
        `UPDATE character_quests
         SET status = 'completed', completed_at = (now()::text), last_completed_at = (now()::text)
         WHERE character_id = $1 AND quest_id = $2`,
        [characterId, questId]
      );

      // Quest ins Quest-Log verschieben
      await client.query(`
        INSERT INTO quest_log (character_id, quest_id, quest_title, quest_description, completed_at, xp_earned)
        VALUES ($1, $2, $3, $4, now(), $5)
      `, [characterId, questId, quest.title, quest.description, quest.xp_reward]);

      await client.query(
        `UPDATE characters
         SET xp = xp + $1,
             programmierung = LEAST(programmierung + $2, 100),
             netzwerke = LEAST(netzwerke + $3, 100),
             datenbanken = LEAST(datenbanken + $4, 100),
             hardware = LEAST(hardware + $5, 100),
             sicherheit = LEAST(sicherheit + $6, 100),
             projektmanagement = LEAST(projektmanagement + $7, 100),
             updated_at = (now()::text)
         WHERE id = $8`,
        [
          quest.xp_reward,
          quest.programmierung_reward,
          quest.netzwerke_reward,
          quest.datenbanken_reward,
          quest.hardware_reward,
          quest.sicherheit_reward,
          quest.projektmanagement_reward,
          characterId
        ]
      );

      const characterResult = await client.query('SELECT * FROM characters WHERE id = $1', [characterId]);
      const character = characterResult.rows[0];

      return { quest, character };
    });
    
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
    const submission: any = await db.get(`
      SELECT submission_file_url, quest_id
      FROM character_quests
      WHERE id = $1
    `, [submissionId]);
    
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
