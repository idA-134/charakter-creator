import { Router } from 'express';
import { db } from '../database/db';
import { createNotification } from './notification.routes';
import { createUpload, deleteFile, getAbsolutePath, getRelativePath } from '../middleware/upload';

export const dozentRouter = Router();

// Middleware: Nur Dozenten/Admins
const requireDozent = (req: any, res: any, next: any) => {
  next();
};

const questResourceUpload = createUpload('quest-resources', 250);

/**
 * Berechnet skalierte XP basierend auf Mindestlevel der Quest
 * 
 * Level 1-9: Formel: baseXP * (1 + (minLevel - 1) * 0.25)
 * Level 10+: Feste prozentuale Belohnung basierend auf 4000 XP pro Level
 * 
 * Beispiele Level 1-9:
 * - Level 1: 100 XP * 1.0 = 100 XP
 * - Level 3: 100 XP * 1.5 = 150 XP
 * - Level 5: 100 XP * 2.0 = 200 XP
 * - Level 9: 100 XP * 3.0 = 300 XP
 * 
 * Ab Level 10:
 * - Easy (50 base): 5% von 4000 = 200 XP
 * - Medium (100 base): 10% von 4000 = 400 XP
 * - Hard (200 base): 20% von 4000 = 800 XP
 */
function calculateScaledXP(baseXP: number, minLevel: number): number {
  // Für Level 1-9: Exponentielle Skalierung
  if (minLevel < 10) {
    const scalingFactor = 1 + (minLevel - 1) * 0.25;
    return Math.floor(baseXP * scalingFactor);
  }
  
  // Ab Level 10: Feste prozentuale Belohnung (basierend auf 4000 XP pro Level)
  // Easy: 5%, Medium: 10%, Hard: 20%
  const percentages: { [key: number]: number } = {
    50: 0.05,   // Easy
    100: 0.10,  // Medium
    200: 0.20   // Hard
  };
  
  return Math.floor(4000 * (percentages[baseXP] || 0.10));
}

// Quest erstellen (Dozent)
dozentRouter.post('/quests', requireDozent, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      xp_reward,
      xp_scaling, // 'fixed' oder 'scaled' - neu!
      programmierung_reward,
      netzwerke_reward,
      datenbanken_reward,
      hardware_reward,
      sicherheit_reward,
      projektmanagement_reward,
      is_title_quest,
      title_reward,
      equipment_reward_id,
      required_equipment_id,
      min_level,
      prerequisite_quest_id,
      created_by_user_id,
      is_repeatable, // neu!
      repeat_interval, // neu! - 'daily', 'weekly', etc.
      due_date, // neu! - Abgabefrist
      repeat_time, // neu! - Uhrzeit für Wiederholung (HH:MM)
      repeat_day_of_week, // neu! - Wochentag für wöchentliche Wiederholung (0-6)
      repeat_day_of_month // neu! - Tag des Monats für monatliche Wiederholung (1-31)
    } = req.body;
    
    if (!title || !description || !created_by_user_id) {
      return res.status(400).json({ error: 'Title, Description und created_by_user_id sind erforderlich' });
    }
    
    // Validiere xp_scaling
    const scalingMode = xp_scaling || 'scaled'; // default: scaled
    if (!['fixed', 'scaled'].includes(scalingMode)) {
      return res.status(400).json({ error: 'xp_scaling muss "fixed" oder "scaled" sein' });
    }
    
    // Validiere repeat_interval falls is_repeatable true ist
    if (is_repeatable) {
      const validIntervals = ['daily', 'weekly', 'monthly'];
      if (!repeat_interval || !validIntervals.includes(repeat_interval)) {
        return res.status(400).json({ error: 'repeat_interval muss "daily", "weekly" oder "monthly" sein' });
      }
      
      // Validiere repeat_time (muss im Format HH:MM sein)
      if (!repeat_time || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(repeat_time)) {
        return res.status(400).json({ error: 'repeat_time muss im Format HH:MM sein (z.B. 14:30)' });
      }
      
      // Validiere je nach Intervall
      if (repeat_interval === 'weekly') {
        if (repeat_day_of_week === undefined || repeat_day_of_week < 0 || repeat_day_of_week > 6) {
          return res.status(400).json({ error: 'repeat_day_of_week muss zwischen 0 (Sonntag) und 6 (Samstag) sein' });
        }
      }
      
      if (repeat_interval === 'monthly') {
        if (repeat_day_of_month === undefined || repeat_day_of_month < 1 || repeat_day_of_month > 31) {
          return res.status(400).json({ error: 'repeat_day_of_month muss zwischen 1 und 31 sein' });
        }
      }
    }
    
    const questMinLevel = min_level || 1;
    let finalXP = 0;
    
    if (scalingMode === 'fixed') {
      // Fester XP-Wert - muss vom Benutzer gesetzt sein
      if (!xp_reward) {
        return res.status(400).json({ error: 'Bei festem XP-Wert muss xp_reward gesetzt sein' });
      }
      finalXP = xp_reward;
    } else {
      // Skalierter XP-Wert basierend auf Schwierigkeit und Level
      let baseXP = 50;
      if (difficulty === 'easy') baseXP = 50;
      else if (difficulty === 'medium') baseXP = 100;
      else if (difficulty === 'hard') baseXP = 200;
      
      finalXP = xp_reward || calculateScaledXP(baseXP, questMinLevel);
    }
    
    const newQuest = await db.get(`
      INSERT INTO quests (
        title, description, category, difficulty, xp_reward,
        programmierung_reward, netzwerke_reward, datenbanken_reward,
        hardware_reward, sicherheit_reward, projektmanagement_reward,
        is_title_quest, title_reward, equipment_reward_id, required_equipment_id,
        min_level, prerequisite_quest_id, created_by_user_id,
        is_repeatable, repeat_interval, due_date,
        repeat_time, repeat_day_of_week, repeat_day_of_month
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `, [
      title, description, category, difficulty, finalXP,
      programmierung_reward || 0, netzwerke_reward || 0, datenbanken_reward || 0,
      hardware_reward || 0, sicherheit_reward || 0, projektmanagement_reward || 0,
      is_title_quest ? 1 : 0, title_reward || null,
      equipment_reward_id || null, required_equipment_id || null,
      questMinLevel, prerequisite_quest_id || null, created_by_user_id,
      is_repeatable ? 1 : 0, repeat_interval || null, due_date || null,
      repeat_time || null, repeat_day_of_week ?? null, repeat_day_of_month ?? null
    ]);
    res.status(201).json(newQuest);
  } catch (error) {
    console.error('Fehler beim Erstellen der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest-Ressourcen (Dateien/Videos) hochladen
dozentRouter.post('/quests/:questId/resources', requireDozent, questResourceUpload.array('files', 10), async (req, res) => {
  try {
    const { questId } = req.params;
    const uploadedBy = req.body.uploaded_by_user_id ? Number(req.body.uploaded_by_user_id) : null;
    const files = (req.files as Express.Multer.File[]) || [];

    if (!files.length) {
      return res.status(400).json({ error: 'Keine Dateien hochgeladen' });
    }

    const quest = await db.get('SELECT id FROM quests WHERE id = $1', [questId]);
    if (!quest) {
      return res.status(404).json({ error: 'Quest nicht gefunden' });
    }

    const inserted: any[] = [];
    for (const file of files) {
      const fileUrl = getRelativePath(file.path);
      const result = await db.get(`
        INSERT INTO quest_resources (quest_id, file_url, original_name, mime_type, size, uploaded_by_user_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [questId, fileUrl, file.originalname, file.mimetype, file.size, uploadedBy]);
      if (result) {
        inserted.push(result);
      }
    }

    res.status(201).json(inserted);
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message : 'Interner Serverfehler';
    console.error('Fehler beim Hochladen der Quest-Ressourcen:', error);

    if (message.includes('quest_resources') || message.includes('no such table')) {
      return res.status(500).json({
        error: 'Tabelle quest_resources fehlt. Bitte Migration ausführen.'
      });
    }

    res.status(500).json({ error: message });
  }
});

// Quest-Ressource löschen
dozentRouter.delete('/quests/resources/:resourceId', requireDozent, async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource: any = await db.get('SELECT * FROM quest_resources WHERE id = $1', [resourceId]);
    if (!resource) {
      return res.status(404).json({ error: 'Ressource nicht gefunden' });
    }

    await db.run('DELETE FROM quest_resources WHERE id = $1', [resourceId]);
    if (resource.file_url) {
      deleteFile(getAbsolutePath(resource.file_url));
    }

    res.json({ message: 'Ressource gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Quest-Ressource:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest zuweisen (an User oder Gruppe)
dozentRouter.post('/quests/:questId/assign', requireDozent, async (req, res) => {
  try {
    const { questId } = req.params;
    const { user_id, group_id } = req.body;
    
    if (!user_id && !group_id) {
      return res.status(400).json({ error: 'Entweder user_id oder group_id erforderlich' });
    }
    
    if (user_id && group_id) {
      return res.status(400).json({ error: 'Nur user_id ODER group_id erlaubt' });
    }
    
    // Quest-Titel für Notification abrufen
    const quest: any = await db.get('SELECT title FROM quests WHERE id = $1', [questId]);
    const questTitle = quest?.title || 'Unbekannte Quest';
    
    // Zuweisung erstellen
    await db.run(
      `INSERT INTO quest_assignments (quest_id, user_id, group_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [questId, user_id || null, group_id || null]
    );
    
    // Wenn Gruppe: Quest für alle Mitglieder verfügbar machen
    if (group_id) {
      const members = await db.all(`
        SELECT u.id, c.id as character_id
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        LEFT JOIN characters c ON u.id = c.user_id
        WHERE gm.group_id = $1
      `, [group_id]);
      
      for (const member of members) {
        const typedMember = member as any;
        if (typedMember.character_id) {
          await db.run(
            `INSERT INTO character_quests (character_id, quest_id, status)
             VALUES ($1, $2, 'available')
             ON CONFLICT DO NOTHING`,
            [typedMember.character_id, questId]
          );
          // Notification an User senden
          await createNotification(
            typedMember.id,
            'quest_assigned',
            'Neue Quest zugewiesen',
            `Dir wurde die Quest "${questTitle}" zugewiesen!`
          );
        }
      }
    } else {
      // Einzelner User: Quest für Character verfügbar machen
      const character: any = await db.get('SELECT id FROM characters WHERE user_id = $1', [user_id]);
      if (character) {
        await db.run(
          `INSERT INTO character_quests (character_id, quest_id, status)
           VALUES ($1, $2, 'available')
           ON CONFLICT DO NOTHING`,
          [character.id, questId]
        );
        // Notification an User senden
        await createNotification(
          user_id,
          'quest_assigned',
          'Neue Quest zugewiesen',
          `Dir wurde die Quest "${questTitle}" zugewiesen!`
        );
      }
    }
    
    res.json({ message: 'Quest erfolgreich zugewiesen' });
  } catch (error) {
    console.error('Fehler beim Zuweisen der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle Abgaben abrufen (mit Quest-Creator Info zur Markierung)
dozentRouter.get('/submissions/all', requireDozent, async (req, res) => {
  try {
    // Hole alle Abgaben mit Quest-Creator Info
    const submissions = await db.all(`
      SELECT cq.*, c.name as character_name, c.level,
             u.id as user_id, u.username, 
             q.created_by_user_id as quest_creator_id, q.title as quest_title
      FROM character_quests cq
      JOIN characters c ON cq.character_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN quests q ON cq.quest_id = q.id
      WHERE cq.submitted_at IS NOT NULL
      ORDER BY cq.submitted_at DESC
    `);
    
    res.json(submissions);
  } catch (error) {
    console.error('Fehler beim Abrufen aller Abgaben:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle Abgaben für eine Quest abrufen (nur Dozent der Quest oder Admin)
dozentRouter.get('/quests/:questId/submissions', requireDozent, async (req, res) => {
  try {
    const { questId } = req.params;
    const user_id = req.query.user_id; // user_id des anfragenden Dozenten aus Query-Parameter
    
    // Quest-Creator abrufen
    const quest: any = await db.get('SELECT created_by_user_id FROM quests WHERE id = $1', [questId]);
    if (!quest) {
      return res.status(404).json({ error: 'Quest nicht gefunden' });
    }
    
    // Prüfe ob Anfragender der Creator ist (falls user_id übergeben wurde)
    if (user_id && parseInt(user_id as string) !== quest.created_by_user_id) {
      // Optional: Hier könnten wir prüfen ob der User Admin ist
      return res.status(403).json({ error: 'Nur der Dozent der Quest kann die Abgaben sehen' });
    }
    
    const submissions = await db.all(`
      SELECT cq.*, c.name as character_name, c.level,
             u.id as user_id, u.username
      FROM character_quests cq
      JOIN characters c ON cq.character_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE cq.quest_id = $1 AND cq.submitted_at IS NOT NULL
      ORDER BY cq.submitted_at DESC
    `, [questId]);
    
    res.json(submissions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Abgaben:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Abgabe bewerten (nur Dozent der Quest)
dozentRouter.post('/submissions/:submissionId/grade', requireDozent, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, graded_by_user_id } = req.body;
    
    if (!grade || !graded_by_user_id) {
      return res.status(400).json({ error: 'Grade und graded_by_user_id erforderlich' });
    }
    
    // Nur 'approved' oder 'rejected' erlaubt
    if (grade !== 'approved' && grade !== 'rejected') {
      return res.status(400).json({ error: 'Grade muss "approved" oder "rejected" sein' });
    }
    
    // Bei rejected muss feedback vorhanden sein
    if (grade === 'rejected' && !feedback) {
      return res.status(400).json({ error: 'Bei Ablehnung ist eine Begründung erforderlich' });
    }
    
    // Prüfe ob Submission existiert
    const submissionData: any = await db.get(`
      SELECT cq.*
      FROM character_quests cq
      WHERE cq.id = $1
    `, [submissionId]);
    
    if (!submissionData) {
      return res.status(404).json({ error: 'Abgabe nicht gefunden' });
    }
    
    // Alle Dozenten/Admins können alle Abgaben bewerten
    // Keine Einschränkung auf den Creator der Quest
    
    // Abgabe als bewertet markieren
    await db.run(`
      UPDATE character_quests
      SET grade = $1, feedback = $2, graded_at = (now()::text), 
          graded_by_user_id = $3, status = $4,
          completed_at = CASE WHEN $1 = 'approved' THEN (now()::text) ELSE NULL END
      WHERE id = $5`,
      [
        grade,
        feedback,
        graded_by_user_id,
        grade === 'approved' ? 'completed' : 'rejected',
        submissionId
      ]
    );
    
    // Quest-Informationen abrufen für Belohnungen
    const submission: any = await db.get(`
      SELECT cq.*, q.*, c.id as character_id, c.xp as current_xp, c.level as current_level, c.xp_to_next_level
      FROM character_quests cq
      JOIN quests q ON cq.quest_id = q.id
      JOIN characters c ON cq.character_id = c.id
      WHERE cq.id = $1
    `, [submissionId]);
    
    if (!submission) {
      return res.status(404).json({ error: 'Abgabe nicht gefunden' });
    }// XP ist bereits in der Quest gespeichert (wurde beim Erstellen skaliert)
      
    
    // Belohnungen nur bei approved vergeben
    if (grade === 'approved') {
      const finalXP = submission.xp_reward;
      const finalProg = submission.programmierung_reward;
      const finalNetz = submission.netzwerke_reward;
      const finalDB = submission.datenbanken_reward;
      const finalHW = submission.hardware_reward;
      const finalSec = submission.sicherheit_reward;
      const finalPM = submission.projektmanagement_reward;
      
      // Level-Up-Logik mit Level Cap (50)
      let newXp = submission.current_xp + finalXP;
      let newLevel = submission.current_level;
      let xpToNext = submission.xp_to_next_level;
      
      while (newXp >= xpToNext && newLevel < 50) {
        newXp -= xpToNext;
        newLevel += 1;
        
        // Ab Level 10: Feste 4000 XP pro Level
        // Davor: Exponentielles Wachstum
        if (newLevel >= 10) {
          xpToNext = 4000;
        } else {
          xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
        }
      }
      
      // Bei Max-Level überschüssige XP begrenzen
      if (newLevel >= 50) {
        newXp = Math.min(newXp, xpToNext - 1);
      }
      
      // Belohnungen vergeben mit Level-Up
      await db.run(`
        UPDATE characters
        SET xp = $1,
            level = $2,
            xp_to_next_level = $3,
            programmierung = LEAST(programmierung + $4, 250),
            netzwerke = LEAST(netzwerke + $5, 250),
            datenbanken = LEAST(datenbanken + $6, 250),
            hardware = LEAST(hardware + $7, 250),
            sicherheit = LEAST(sicherheit + $8, 250),
            projektmanagement = LEAST(projektmanagement + $9, 250),
            updated_at = (now()::text)
        WHERE id = $10
      `, [
        newXp, newLevel, xpToNext,
        finalProg, finalNetz, finalDB, finalHW, finalSec, finalPM,
        submission.character_id
      ]);
      
      // Titel vergeben falls Titel-Quest
      if (submission.is_title_quest && submission.title_reward) {
        // Titel zur character_titles Tabelle hinzufügen
        await db.run(
          `INSERT INTO character_titles (character_id, title, is_active)
           VALUES ($1, $2, 0)
           ON CONFLICT DO NOTHING`,
          [submission.character_id, submission.title_reward]
        );
        
        // Optional: Titel direkt als aktiv setzen und Character-Titel aktualisieren
        // (kann später vom User geändert werden)
        await db.run('UPDATE characters SET title = $1 WHERE id = $2', [submission.title_reward, submission.character_id]);
        
        // Titel als aktiv markieren
        await db.run(
          `UPDATE character_titles 
           SET is_active = 1 
           WHERE character_id = $1 AND title = $2`,
          [submission.character_id, submission.title_reward]
        );
      }
      
      // Equipment vergeben falls vorhanden
      if (submission.equipment_reward_id) {
        await db.run(
          `INSERT INTO character_equipment (character_id, equipment_id, equipped)
           VALUES ($1, $2, 0)
           ON CONFLICT DO NOTHING`,
          [submission.character_id, submission.equipment_reward_id]
        );
      }

      // Quest ins Quest-Log verschieben
      await db.run(`
        INSERT INTO quest_log (character_id, quest_id, quest_title, quest_description, completed_at, xp_earned, grade, feedback)
        VALUES ($1, $2, $3, $4, now(), $5, $6, $7)
      `, [
        submission.character_id,
        submission.quest_id,
        submission.title,
        submission.description,
        submission.xp_reward,
        grade,
        feedback
      ]);
    }
    
    const gradedSubmission = await db.get(`
      SELECT cq.*, c.name as character_name, u.username
      FROM character_quests cq
      JOIN characters c ON cq.character_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE cq.id = $1
    `, [submissionId]);
    
    res.json({
      message: grade === 'approved' ? 'Abgabe angenommen und Belohnungen vergeben' : 'Abgabe abgelehnt',
      submission: gradedSubmission,
      rewards: grade === 'approved' ? {
        xp: submission.xp_reward,
        programmierung: submission.programmierung_reward,
        netzwerke: submission.netzwerke_reward,
        datenbanken: submission.datenbanken_reward,
        hardware: submission.hardware_reward,
        sicherheit: submission.sicherheit_reward,
        projektmanagement: submission.projektmanagement_reward,
        title: submission.is_title_quest ? submission.title_reward : null,
        equipment_id: submission.equipment_reward_id || null
      } : null
    });
  } catch (error) {
    console.error('Fehler beim Bewerten der Abgabe:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle Quests abrufen (Admin - alle, Dozent - nur eigene)
dozentRouter.get('/quests/all', requireDozent, async (req, res) => {
  try {
    const { userId, isAdmin } = req.query;
    
    let query = `
      SELECT q.*,
             u.username as created_by_username,
             COUNT(DISTINCT qa.id) as assignment_count,
             COUNT(DISTINCT cq.id) as submission_count
      FROM quests q
      LEFT JOIN users u ON q.created_by_user_id = u.id
      LEFT JOIN quest_assignments qa ON q.id = qa.quest_id
      LEFT JOIN character_quests cq ON q.id = cq.quest_id AND cq.submitted_at IS NOT NULL
    `;
    
    const params: any[] = [];
    
    // Admin sieht alle Quests, Dozent nur eigene
    if (isAdmin !== 'true' && userId) {
      query += ' WHERE q.created_by_user_id = $1';
      params.push(userId);
    }
    
    query += `
      GROUP BY q.id, u.username
      ORDER BY q.created_at DESC
    `;
    
    const quests = await db.all(query, params.length > 0 ? params : undefined);
    
    res.json(quests);
  } catch (error) {
    console.error('Fehler beim Abrufen der Quests:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle eigenen Quests abrufen (Dozent)
dozentRouter.get('/quests/my/:userId', requireDozent, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const quests = await db.all(`
      SELECT q.*, 
             COUNT(DISTINCT qa.id) as assignment_count,
             COUNT(DISTINCT cq.id) as submission_count
      FROM quests q
      LEFT JOIN quest_assignments qa ON q.id = qa.quest_id
      LEFT JOIN character_quests cq ON q.id = cq.quest_id AND cq.submitted_at IS NOT NULL
      WHERE q.created_by_user_id = $1
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [userId]);
    
    // Convert counts from strings to numbers
    const questsWithCounts = quests.map((q: any) => ({
      ...q,
      assignment_count: parseInt(q.assignment_count) || 0,
      submission_count: parseInt(q.submission_count) || 0
    }));
    
    res.json(questsWithCounts);
  } catch (error) {
    console.error('Fehler beim Abrufen der Quests:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest bearbeiten
dozentRouter.put('/quests/:questId', requireDozent, async (req, res) => {
  try {
    const { questId } = req.params;
    const {
      title, description, category, difficulty, xp_reward,
      programmierung_reward, netzwerke_reward, datenbanken_reward,
      hardware_reward, sicherheit_reward, projektmanagement_reward,
      is_title_quest, title_reward, equipment_reward_id, required_equipment_id,
      min_level, prerequisite_quest_id
    } = req.body;
    
    const updatedQuest = await db.get(`
      UPDATE quests
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          category = COALESCE($3, category),
          difficulty = COALESCE($4, difficulty),
          xp_reward = COALESCE($5, xp_reward),
          programmierung_reward = COALESCE($6, programmierung_reward),
          netzwerke_reward = COALESCE($7, netzwerke_reward),
          datenbanken_reward = COALESCE($8, datenbanken_reward),
          hardware_reward = COALESCE($9, hardware_reward),
          sicherheit_reward = COALESCE($10, sicherheit_reward),
          projektmanagement_reward = COALESCE($11, projektmanagement_reward),
          is_title_quest = COALESCE($12, is_title_quest),
          title_reward = COALESCE($13, title_reward),
          equipment_reward_id = COALESCE($14, equipment_reward_id),
          required_equipment_id = COALESCE($15, required_equipment_id),
          min_level = COALESCE($16, min_level),
          prerequisite_quest_id = COALESCE($17, prerequisite_quest_id)
      WHERE id = $18
      RETURNING *
    `, [
      title, description, category, difficulty, xp_reward,
      programmierung_reward, netzwerke_reward, datenbanken_reward,
      hardware_reward, sicherheit_reward, projektmanagement_reward,
      is_title_quest !== undefined ? (is_title_quest ? 1 : 0) : null,
      title_reward, equipment_reward_id, required_equipment_id, min_level, prerequisite_quest_id,
      questId
    ]);
    res.json(updatedQuest);
  } catch (error) {
    console.error('Fehler beim Bearbeiten der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest löschen
dozentRouter.delete('/quests/:questId', requireDozent, async (req, res) => {
  try {
    const { questId } = req.params;
    
    const result = await db.run('DELETE FROM quests WHERE id = $1', [questId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Quest nicht gefunden' });
    }
    
    res.json({ message: 'Quest gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
