import { Router } from 'express';
import { db } from '../database/db';
import { createNotification } from './notification.routes';

export const adminRouter = Router();

// Middleware: Nur Admin/Super-Admin
const requireAdmin = (req: any, res: any, next: any) => {
  // In Produktion: JWT Token prüfen
  // Für jetzt: Überspringe Authentifizierung
  next();
};

// Alle User abrufen
adminRouter.get('/users', requireAdmin, async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, username, role, is_admin, is_super_admin, pending_approval, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    const users = stmt.all();
    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der User:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle ausstehenden Dozenten-Genehmigungen abrufen
adminRouter.get('/pending-dozenten', requireAdmin, async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, username, role, pending_approval, created_at 
      FROM users 
      WHERE role = 'dozent' AND pending_approval = 1
      ORDER BY created_at DESC
    `);
    const dozenten = stmt.all();
    res.json(dozenten);
  } catch (error) {
    console.error('Fehler beim Abrufen der ausstehenden Dozenten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Dozent genehmigen
adminRouter.post('/approve-dozent/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prüfe, ob User ein Dozent mit ausstehender Genehmigung ist
    const user: any = db.prepare('SELECT * FROM users WHERE id = ? AND role = ? AND pending_approval = ?').get(userId, 'dozent', 1);
    
    if (!user) {
      return res.status(404).json({ error: 'Ausstehender Dozent nicht gefunden' });
    }
    
    // Aktualisiere den Status
    const stmt = db.prepare('UPDATE users SET pending_approval = 0 WHERE id = ?');
    stmt.run(userId);
    
    const updatedUser = db.prepare(`
      SELECT id, username, role, is_admin, is_super_admin, pending_approval, created_at 
      FROM users WHERE id = ?
    `).get(userId);
    
    // Erstelle eine Benachrichtigung für den Dozent
    try {
      createNotification(parseInt(userId), 'success', 'Dozent-Zugang genehmigt', 'Dein Dozent-Zugang wurde vom Admin genehmigt.');
    } catch (e) {
      console.error('Fehler beim Erstellen der Benachrichtigung:', e);
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Fehler beim Genehmigen des Dozenten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Dozent ablehnen
adminRouter.post('/reject-dozent/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prüfe, ob User ein Dozent mit ausstehender Genehmigung ist
    const user: any = db.prepare('SELECT * FROM users WHERE id = ? AND role = ? AND pending_approval = ?').get(userId, 'dozent', 1);
    
    if (!user) {
      return res.status(404).json({ error: 'Ausstehender Dozent nicht gefunden' });
    }
    
    // Lösche den User
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);
    
    res.json({ message: 'Dozent-Anfrage abgelehnt und Benutzer gelöscht', id: userId });
  } catch (error) {
    console.error('Fehler beim Ablehnen des Dozenten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User-Rolle ändern
adminRouter.put('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['nachwuchskraft', 'dozent', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }
    
    // Wenn zur Dozent-Rolle wechsel, setze pending_approval
    const pendingApproval = role === 'dozent' ? 1 : 0;
    
    const stmt = db.prepare('UPDATE users SET role = ?, pending_approval = ? WHERE id = ?');
    const info = stmt.run(role, pendingApproval, userId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }
    
    const updatedUser = db.prepare(`
      SELECT id, username, role, is_admin, is_super_admin, pending_approval, created_at 
      FROM users WHERE id = ?
    `).get(userId);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Fehler beim Ändern der Rolle:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Admin-Status ändern
adminRouter.put('/users/:userId/admin', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_admin } = req.body;
    
    // Super-Admin kann nicht geändert werden
    const user: any = db.prepare('SELECT is_super_admin FROM users WHERE id = ?').get(userId);
    if (user && user.is_super_admin) {
      return res.status(403).json({ error: 'Super-Admin kann nicht geändert werden' });
    }
    
    const stmt = db.prepare('UPDATE users SET is_admin = ? WHERE id = ?');
    stmt.run(is_admin ? 1 : 0, userId);
    
    const updatedUser = db.prepare(`
      SELECT id, username, role, is_admin, is_super_admin, pending_approval, created_at 
      FROM users WHERE id = ?
    `).get(userId);
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Fehler beim Ändern des Admin-Status:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User löschen
adminRouter.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Super-Admin kann nicht gelöscht werden
    const user: any = db.prepare('SELECT is_super_admin FROM users WHERE id = ?').get(userId);
    if (user && user.is_super_admin) {
      return res.status(403).json({ error: 'Super-Admin kann nicht gelöscht werden' });
    }
    
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(userId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }
    
    res.json({ message: 'User gelöscht', id: userId });
  } catch (error) {
    console.error('Fehler beim Löschen des Users:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle Nachwuchskräfte abrufen
adminRouter.get('/users/nachwuchskraefte', requireAdmin, async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT u.id, u.username, u.created_at,
             c.id as character_id, c.name as character_name, c.level, c.xp
      FROM users u
      LEFT JOIN characters c ON u.id = c.user_id
      WHERE u.role = 'nachwuchskraft' AND u.pending_approval = 0
      ORDER BY u.created_at DESC
    `);
    const users = stmt.all();
    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der Nachwuchskräfte:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle Dozenten abrufen
adminRouter.get('/users/dozenten', requireAdmin, async (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, username, role, pending_approval, created_at 
      FROM users 
      WHERE (role = 'dozent' OR is_admin = 1) AND pending_approval = 0
      ORDER BY created_at DESC
    `);
    const dozenten = stmt.all();
    res.json(dozenten);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dozenten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle offenen Abgaben abrufen (Admin kann alle bewerten)
adminRouter.get('/submissions', requireAdmin, async (req, res) => {
  try {
    const submissions = db.prepare(`
      SELECT cq.*, c.name as character_name, c.level,
             u.id as user_id, u.username,
             q.title as quest_title, q.created_by_user_id,
             du.username as created_by_username
      FROM character_quests cq
      JOIN characters c ON cq.character_id = c.id
      JOIN users u ON c.user_id = u.id
      JOIN quests q ON cq.quest_id = q.id
      LEFT JOIN users du ON q.created_by_user_id = du.id
      WHERE cq.submitted_at IS NOT NULL AND cq.grade IS NULL
      ORDER BY cq.submitted_at DESC
    `).all();
    
    res.json(submissions);
  } catch (error) {
    console.error('Fehler beim Abrufen der Abgaben:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Abgabe bewerten (Admin kann alle bewerten)
adminRouter.post('/submissions/:submissionId/grade', requireAdmin, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, admin_user_id } = req.body;
    
    if (!grade || !admin_user_id) {
      return res.status(400).json({ error: 'Grade und admin_user_id erforderlich' });
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
      admin_user_id, 
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
    }
    
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
        
        if (newLevel >= 10) {
          xpToNext = 4000;
        } else {
          xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
        }
      }
      
      if (newLevel >= 50) {
        newXp = Math.min(newXp, xpToNext - 1);
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
        const addTitleStmt = db.prepare(`
          INSERT OR IGNORE INTO character_titles (character_id, title, is_active)
          VALUES (?, ?, 0)
        `);
        addTitleStmt.run(submission.character_id, submission.title_reward);
        
        const titleStmt = db.prepare('UPDATE characters SET title = ? WHERE id = ?');
        titleStmt.run(submission.title_reward, submission.character_id);
        
        const activateTitleStmt = db.prepare(`
          UPDATE character_titles 
          SET is_active = 1 
          WHERE character_id = ? AND title = ?
        `);
        activateTitleStmt.run(submission.character_id, submission.title_reward);
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
    
    res.json({ message: 'Abgabe erfolgreich bewertet' });
  } catch (error) {
    console.error('Fehler beim Bewerten der Abgabe:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
