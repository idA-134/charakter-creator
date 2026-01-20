import { Router } from 'express';
import { db } from '../database/db';
import { createNotification } from './notification.routes';

export const dozentRouter = Router();

// Middleware: Nur Dozenten/Admins
const requireDozent = (req: any, res: any, next: any) => {
  next();
};

/**
 * Berechnet skalierte XP basierend auf Mindestlevel der Quest
 * Formel: baseXP * (1 + (minLevel - 1) * 0.25)
 * 
 * Beispiele:
 * - Level 1: 100 XP * 1.0 = 100 XP
 * - Level 3: 100 XP * 1.5 = 150 XP
 * - Level 5: 100 XP * 2.0 = 200 XP
 * - Level 10: 100 XP * 3.25 = 325 XP
 * - Level 20: 100 XP * 5.75 = 575 XP
 */
function calculateScaledXP(baseXP: number, minLevel: number): number {
  const scalingFactor = 1 + (minLevel - 1) * 0.25;
  return Math.floor(baseXP * scalingFactor);
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
      created_by_user_id
    } = req.body;
    
    if (!title || !description || !created_by_user_id) {
      return res.status(400).json({ error: 'Title, Description und created_by_user_id sind erforderlich' });
    }
    
    // Basis-XP basierend auf Schwierigkeit
    let baseXP = 50;
    if (difficulty === 'easy') baseXP = 50;
    else if (difficulty === 'medium') baseXP = 100;
    else if (difficulty === 'hard') baseXP = 200;
    
    // Skaliere XP basierend auf Mindestlevel (falls nicht manuell gesetzt)
    const questMinLevel = min_level || 1;
    const presetXP = xp_reward || calculateScaledXP(baseXP, questMinLevel);
    
    const stmt = db.prepare(`
      INSERT INTO quests (
        title, description, category, difficulty, xp_reward,
        programmierung_reward, netzwerke_reward, datenbanken_reward,
        hardware_reward, sicherheit_reward, projektmanagement_reward,
        is_title_quest, title_reward, equipment_reward_id, required_equipment_id,
        min_level, prerequisite_quest_id, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      title, description, category, difficulty, presetXP,
      programmierung_reward || 0, netzwerke_reward || 0, datenbanken_reward || 0,
      hardware_reward || 0, sicherheit_reward || 0, projektmanagement_reward || 0,
      is_title_quest ? 1 : 0, title_reward || null, 
      equipment_reward_id || null, required_equipment_id || null,
      questMinLevel, prerequisite_quest_id || null, created_by_user_id
    );
    
    const newQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newQuest);
  } catch (error) {
    console.error('Fehler beim Erstellen der Quest:', error);
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
    const quest: any = db.prepare('SELECT title FROM quests WHERE id = ?').get(questId);
    const questTitle = quest?.title || 'Unbekannte Quest';
    
    // Zuweisung erstellen
    const assignStmt = db.prepare(`
      INSERT INTO quest_assignments (quest_id, user_id, group_id)
      VALUES (?, ?, ?)
    `);
    assignStmt.run(questId, user_id || null, group_id || null);
    
    // Wenn Gruppe: Quest für alle Mitglieder verfügbar machen
    if (group_id) {
      const members = db.prepare(`
        SELECT u.id, c.id as character_id
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id
        LEFT JOIN characters c ON u.id = c.user_id
        WHERE gm.group_id = ?
      `).all(group_id);
      
      const questAssignStmt = db.prepare(`
        INSERT OR IGNORE INTO character_quests (character_id, quest_id, status)
        VALUES (?, ?, 'available')
      `);
      
      for (const member of members) {
        const typedMember = member as any;
        if (typedMember.character_id) {
          questAssignStmt.run(typedMember.character_id, questId);
          // Notification an User senden
          createNotification(
            typedMember.id,
            'quest_assigned',
            'Neue Quest zugewiesen',
            `Dir wurde die Quest "${questTitle}" zugewiesen!`
          );
        }
      }
    } else {
      // Einzelner User: Quest für Character verfügbar machen
      const character: any = db.prepare('SELECT id FROM characters WHERE user_id = ?').get(user_id);
      if (character) {
        const questAssignStmt = db.prepare(`
          INSERT OR IGNORE INTO character_quests (character_id, quest_id, status)
          VALUES (?, ?, 'available')
        `);
        questAssignStmt.run(character.id, questId);
        // Notification an User senden
        createNotification(
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

// Alle Abgaben für eine Quest abrufen
dozentRouter.get('/quests/:questId/submissions', requireDozent, async (req, res) => {
  try {
    const { questId } = req.params;
    
    const submissions = db.prepare(`
      SELECT cq.*, c.name as character_name, c.level,
             u.id as user_id, u.username
      FROM character_quests cq
      JOIN characters c ON cq.character_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE cq.quest_id = ? AND cq.submitted_at IS NOT NULL
      ORDER BY cq.submitted_at DESC
    `).all(questId);
    
    res.json(submissions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Abgaben:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Abgabe bewerten
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
    
    // Abgabe als bewertet markieren
    const updateStmt = db.prepare(`
      UPDATE character_quests
      SET grade = ?, feedback = ?, graded_at = datetime('now'), 
          graded_by_user_id = ?, status = ?,
          completed_at = CASE WHEN ? = 'approved' THEN datetime('now') ELSE NULL END
      WHERE id = ?
    `);
    updateStmt.run(
      grade, 
      feedback, 
      graded_by_user_id, 
      grade === 'approved' ? 'completed' : 'rejected',
      grade,
      submissionId
    );
    
    // Quest-Informationen abrufen für Belohnungen
    const submission: any = db.prepare(`
      SELECT cq.*, q.*, c.id as character_id, c.xp as current_xp, c.level as current_level, c.xp_to_next_level
      FROM character_quests cq
      JOIN quests q ON cq.quest_id = q.id
      JOIN characters c ON cq.character_id = c.id
      WHERE cq.id = ?
    `).get(submissionId);
    
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
      
      // Level-Up-Logik
      let newXp = submission.current_xp + finalXP;
      let newLevel = submission.current_level;
      let xpToNext = submission.xp_to_next_level;
      
      while (newXp >= xpToNext) {
        newXp -= xpToNext;
        newLevel += 1;
        xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
      }
      
      // Belohnungen vergeben mit Level-Up
      const rewardStmt = db.prepare(`
        UPDATE characters
        SET xp = ?,
            level = ?,
            xp_to_next_level = ?,
            programmierung = MIN(programmierung + ?, 100),
            netzwerke = MIN(netzwerke + ?, 100),
            datenbanken = MIN(datenbanken + ?, 100),
            hardware = MIN(hardware + ?, 100),
            sicherheit = MIN(sicherheit + ?, 100),
            projektmanagement = MIN(projektmanagement + ?, 100),
            updated_at = datetime('now')
        WHERE id = ?
      `);
      rewardStmt.run(
        newXp, newLevel, xpToNext,
        finalProg, finalNetz, finalDB, finalHW, finalSec, finalPM,
        submission.character_id
      );
      
      // Titel vergeben falls Titel-Quest
      if (submission.is_title_quest && submission.title_reward) {
        const titleStmt = db.prepare('UPDATE characters SET title = ? WHERE id = ?');
        titleStmt.run(submission.title_reward, submission.character_id);
      }
      
      // Equipment vergeben falls vorhanden
      if (submission.equipment_reward_id) {
        const equipStmt = db.prepare(`
          INSERT OR IGNORE INTO character_equipment (character_id, equipment_id, equipped)
          VALUES (?, ?, 0)
        `);
        equipStmt.run(submission.character_id, submission.equipment_reward_id);
      }
    }
    
    const gradedSubmission = db.prepare(`
      SELECT cq.*, c.name as character_name, u.username
      FROM character_quests cq
      JOIN characters c ON cq.character_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE cq.id = ?
    `).get(submissionId);
    
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
      query += ' WHERE q.created_by_user_id = ?';
      params.push(userId);
    }
    
    query += `
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `;
    
    const quests = params.length > 0 
      ? db.prepare(query).all(...params)
      : db.prepare(query).all();
    
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
    
    const quests = db.prepare(`
      SELECT q.*, 
             COUNT(DISTINCT qa.id) as assignment_count,
             COUNT(DISTINCT cq.id) as submission_count
      FROM quests q
      LEFT JOIN quest_assignments qa ON q.id = qa.quest_id
      LEFT JOIN character_quests cq ON q.id = cq.quest_id AND cq.submitted_at IS NOT NULL
      WHERE q.created_by_user_id = ?
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `).all(userId);
    
    res.json(quests);
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
    
    const stmt = db.prepare(`
      UPDATE quests
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category = COALESCE(?, category),
          difficulty = COALESCE(?, difficulty),
          xp_reward = COALESCE(?, xp_reward),
          programmierung_reward = COALESCE(?, programmierung_reward),
          netzwerke_reward = COALESCE(?, netzwerke_reward),
          datenbanken_reward = COALESCE(?, datenbanken_reward),
          hardware_reward = COALESCE(?, hardware_reward),
          sicherheit_reward = COALESCE(?, sicherheit_reward),
          projektmanagement_reward = COALESCE(?, projektmanagement_reward),
          is_title_quest = COALESCE(?, is_title_quest),
          title_reward = COALESCE(?, title_reward),
          equipment_reward_id = COALESCE(?, equipment_reward_id),
          required_equipment_id = COALESCE(?, required_equipment_id),
          min_level = COALESCE(?, min_level),
          prerequisite_quest_id = COALESCE(?, prerequisite_quest_id)
      WHERE id = ?
    `);
    
    stmt.run(
      title, description, category, difficulty, xp_reward,
      programmierung_reward, netzwerke_reward, datenbanken_reward,
      hardware_reward, sicherheit_reward, projektmanagement_reward,
      is_title_quest !== undefined ? (is_title_quest ? 1 : 0) : null,
      title_reward, equipment_reward_id, required_equipment_id, min_level, prerequisite_quest_id,
      questId
    );
    
    const updatedQuest = db.prepare('SELECT * FROM quests WHERE id = ?').get(questId);
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
    
    const stmt = db.prepare('DELETE FROM quests WHERE id = ?');
    const info = stmt.run(questId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Quest nicht gefunden' });
    }
    
    res.json({ message: 'Quest gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
