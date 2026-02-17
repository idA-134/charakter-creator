import { Router } from 'express';
import { db } from '../database/db';
import { createNotification } from './notification.routes';

export const adminRouter = Router();

const ADMIN_GROUP_NAME = 'Admins';

const getAdminsGroupId = async (createIfMissing: boolean, createdByUserId?: number): Promise<number | null> => {
  const existing: any = await db.get('SELECT id FROM groups WHERE name = $1', [ADMIN_GROUP_NAME]);
  if (existing?.id) {
    return existing.id;
  }

  if (!createIfMissing || !createdByUserId) {
    return null;
  }

  const created: any = await db.get(
    'INSERT INTO groups (name, description, created_by_user_id) VALUES ($1, $2, $3) RETURNING id',
    [ADMIN_GROUP_NAME, 'Systemgruppe fuer Admins', createdByUserId]
  );
  return created?.id ?? null;
};

const syncAdminGroupMembership = async (userId: number, shouldBeAdmin: boolean) => {
  const groupId = await getAdminsGroupId(shouldBeAdmin, userId);
  if (!groupId) {
    return;
  }

  if (shouldBeAdmin) {
    await db.run(
      `INSERT INTO group_members (group_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [groupId, userId]
    );
  } else {
    await db.run('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
  }
};

const getUserAccess = async (userId: number | null | undefined) => {
  if (!userId) {
    return null;
  }

  const user: any = await db.get(
    'SELECT id, role, is_admin, is_super_admin FROM users WHERE id = $1',
    [userId]
  );
  return user || null;
};

const isFullAdmin = (user: any) => {
  if (!user) return false;
  return user.is_super_admin === 1 || (user.role === 'admin' && user.is_admin === 1);
};

const canReviewQuests = (user: any) => {
  if (!user) return false;
  if (user.is_super_admin === 1) return true;
  return user.is_admin === 1 && (user.role === 'admin' || user.role === 'dozent');
};

// Middleware: Nur Admin/Super-Admin
const requireAdmin = (req: any, res: any, next: any) => {
  // In Produktion: JWT Token prüfen
  // Für jetzt: Überspringe Authentifizierung
  next();
};

// Alle User abrufen
adminRouter.get('/users', requireAdmin, async (req, res) => {
  try {
    const requester = await getUserAccess(Number(req.query.admin_user_id));
    if (!isFullAdmin(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const users = await db.all(`
      SELECT id, username, role, is_admin, is_super_admin, pending_approval, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der User:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle ausstehenden Dozenten-Genehmigungen abrufen
adminRouter.get('/pending-dozenten', requireAdmin, async (req, res) => {
  try {
    const requester = await getUserAccess(Number(req.query.admin_user_id));
    if (!isFullAdmin(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const dozenten = await db.all(`
      SELECT id, username, role, pending_approval, created_at 
      FROM users 
      WHERE role = 'dozent' AND pending_approval = 1
      ORDER BY created_at DESC
    `);
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
    const requester = await getUserAccess(Number(req.body.admin_user_id));
    if (!isFullAdmin(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    // Prüfe, ob User ein Dozent mit ausstehender Genehmigung ist
    const user: any = await db.get('SELECT * FROM users WHERE id = $1 AND role = $2 AND pending_approval = $3', [userId, 'dozent', 1]);
    
    if (!user) {
      return res.status(404).json({ error: 'Ausstehender Dozent nicht gefunden' });
    }
    
    // Aktualisiere den Status
    const updatedUser = await db.get(`
      UPDATE users
      SET pending_approval = 0
      WHERE id = $1
      RETURNING id, username, role, is_admin, is_super_admin, pending_approval, created_at
    `, [userId]);
    
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
    const requester = await getUserAccess(Number(req.body.admin_user_id));
    if (!isFullAdmin(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    // Prüfe, ob User ein Dozent mit ausstehender Genehmigung ist
    const user: any = await db.get('SELECT * FROM users WHERE id = $1 AND role = $2 AND pending_approval = $3', [userId, 'dozent', 1]);
    
    if (!user) {
      return res.status(404).json({ error: 'Ausstehender Dozent nicht gefunden' });
    }
    
    // Lösche den User
    await db.run('DELETE FROM users WHERE id = $1', [userId]);
    
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
    const { role, admin_user_id } = req.body;

    const requester = await getUserAccess(Number(admin_user_id));
    if (!isFullAdmin(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    if (!['nachwuchskraft', 'dozent', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }
    
    // Wenn zur Dozent-Rolle wechsel, setze pending_approval
    const pendingApproval = role === 'dozent' ? 1 : 0;
    
    const updatedUser = await db.get(
      'UPDATE users SET role = $1, pending_approval = $2 WHERE id = $3 RETURNING id, username, role, is_admin, is_super_admin, pending_approval, created_at',
      [role, pendingApproval, userId]
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }

    const shouldBeAdmin = updatedUser.role === 'admin' || updatedUser.is_admin === 1 || updatedUser.is_super_admin === 1;
    await syncAdminGroupMembership(Number(userId), shouldBeAdmin);
    
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
    const { is_admin, admin_user_id } = req.body;

    const requester = await getUserAccess(Number(admin_user_id));
    if (!isFullAdmin(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    // Super-Admin kann nicht geändert werden
    const user: any = await db.get('SELECT is_super_admin FROM users WHERE id = $1', [userId]);
    if (user && user.is_super_admin) {
      return res.status(403).json({ error: 'Super-Admin kann nicht geändert werden' });
    }
    
    const updatedUser = await db.get(
      'UPDATE users SET is_admin = $1 WHERE id = $2 RETURNING id, username, role, is_admin, is_super_admin, pending_approval, created_at',
      [is_admin ? 1 : 0, userId]
    );

    if (updatedUser) {
      const shouldBeAdmin = updatedUser.role === 'admin' || updatedUser.is_admin === 1 || updatedUser.is_super_admin === 1;
      await syncAdminGroupMembership(Number(userId), shouldBeAdmin);
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Fehler beim Ändern des Admin-Status:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quests zur Freigabe abrufen (nur Quests, die an Admins-Gruppe geteilt wurden)
adminRouter.get('/quests/pending-approval', requireAdmin, async (req, res) => {
  try {
    const requester = await getUserAccess(Number(req.query.admin_user_id));
    if (!canReviewQuests(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    const adminsGroupId = await getAdminsGroupId(false);
    if (!adminsGroupId) {
      return res.json([]);
    }

    const quests = await db.all(`
      SELECT q.*, u.username as created_by_username
      FROM quests q
      JOIN quest_assignments qa ON qa.quest_id = q.id
      LEFT JOIN users u ON q.created_by_user_id = u.id
      WHERE qa.group_id = $1 AND q.approval_status = 'pending'
      ORDER BY q.approval_requested_at DESC NULLS LAST, q.created_at DESC
    `, [adminsGroupId]);

    res.json(quests);
  } catch (error) {
    console.error('Fehler beim Abrufen der Quest-Freigaben:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest freigeben
adminRouter.post('/quests/:questId/approve', requireAdmin, async (req, res) => {
  try {
    const { questId } = req.params;
    const { admin_user_id } = req.body;

    if (!admin_user_id) {
      return res.status(400).json({ error: 'admin_user_id erforderlich' });
    }

    const requester = await getUserAccess(Number(admin_user_id));
    if (!canReviewQuests(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const adminsGroupId = await getAdminsGroupId(false);
    if (!adminsGroupId) {
      return res.status(400).json({ error: 'Admins-Gruppe nicht gefunden' });
    }

    const assignment = await db.get(
      'SELECT id FROM quest_assignments WHERE quest_id = $1 AND group_id = $2',
      [questId, adminsGroupId]
    );
    if (!assignment) {
      return res.status(400).json({ error: 'Quest wurde nicht an die Admins-Gruppe geteilt' });
    }

    const updatedQuest: any = await db.get(`
      UPDATE quests
      SET approval_status = 'approved',
          approved_at = (now()::text),
          approved_by_user_id = $1,
          approval_feedback = NULL
      WHERE id = $2
      RETURNING *
    `, [admin_user_id, questId]);

    if (updatedQuest?.created_by_user_id) {
      await createNotification(
        updatedQuest.created_by_user_id,
        'quest_approved',
        'Quest freigegeben',
        `Deine Quest "${updatedQuest.title}" wurde freigegeben.`
      );
    }

    res.json(updatedQuest);
  } catch (error) {
    console.error('Fehler beim Freigeben der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Quest ablehnen
adminRouter.post('/quests/:questId/reject', requireAdmin, async (req, res) => {
  try {
    const { questId } = req.params;
    const { admin_user_id, reason } = req.body;

    if (!admin_user_id) {
      return res.status(400).json({ error: 'admin_user_id erforderlich' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'reason erforderlich' });
    }

    const requester = await getUserAccess(Number(admin_user_id));
    if (!canReviewQuests(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    const adminsGroupId = await getAdminsGroupId(false);
    if (!adminsGroupId) {
      return res.status(400).json({ error: 'Admins-Gruppe nicht gefunden' });
    }

    const assignment = await db.get(
      'SELECT id FROM quest_assignments WHERE quest_id = $1 AND group_id = $2',
      [questId, adminsGroupId]
    );
    if (!assignment) {
      return res.status(400).json({ error: 'Quest wurde nicht an die Admins-Gruppe geteilt' });
    }

    const updatedQuest: any = await db.get(`
      UPDATE quests
      SET approval_status = 'rejected',
          approved_at = NULL,
          approved_by_user_id = $1,
          approval_feedback = $2
      WHERE id = $3
      RETURNING *
    `, [admin_user_id, reason, questId]);

    if (updatedQuest?.created_by_user_id) {
      await createNotification(
        updatedQuest.created_by_user_id,
        'quest_rejected',
        'Quest abgelehnt',
        `Deine Quest "${updatedQuest.title}" wurde abgelehnt: ${reason}`
      );
    }

    res.json(updatedQuest);
  } catch (error) {
    console.error('Fehler beim Ablehnen der Quest:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User löschen
adminRouter.delete('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const requester = await getUserAccess(Number(req.body.admin_user_id));
    if (!isFullAdmin(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }
    
    // Super-Admin kann nicht gelöscht werden
    const user: any = await db.get('SELECT is_super_admin FROM users WHERE id = $1', [userId]);
    if (user && user.is_super_admin) {
      return res.status(403).json({ error: 'Super-Admin kann nicht gelöscht werden' });
    }
    
    const result = await db.run('DELETE FROM users WHERE id = $1', [userId]);
    
    if (result.rowCount === 0) {
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
    const users = await db.all(`
      SELECT u.id, u.username, u.created_at,
             c.id as character_id, c.name as character_name, c.level, c.xp
      FROM users u
      LEFT JOIN characters c ON u.id = c.user_id
      WHERE u.role = 'nachwuchskraft' AND u.pending_approval = 0
      ORDER BY u.created_at DESC
    `);
    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der Nachwuchskräfte:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle Dozenten abrufen
adminRouter.get('/users/dozenten', requireAdmin, async (req, res) => {
  try {
    const dozenten = await db.all(`
      SELECT id, username, role, pending_approval, created_at 
      FROM users 
      WHERE (role = 'dozent' OR is_admin = 1) AND pending_approval = 0
      ORDER BY created_at DESC
    `);
    res.json(dozenten);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dozenten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle offenen Abgaben abrufen (Admin kann alle bewerten)
adminRouter.get('/submissions', requireAdmin, async (req, res) => {
  try {
    const submissions = await db.all(`
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
    `);
    
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

    const requester = await getUserAccess(Number(admin_user_id));
    if (!canReviewQuests(requester)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
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
    await db.run(`
      UPDATE character_quests
      SET grade = $1, feedback = $2, graded_at = (now()::text), 
          graded_by_user_id = $3, status = $4,
          completed_at = CASE WHEN $1 = 'approved' THEN (now()::text) ELSE NULL END
      WHERE id = $5
    `, [
      grade,
      feedback,
      admin_user_id,
      grade === 'approved' ? 'completed' : 'rejected',
      submissionId
    ]);
    
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
      await db.run(`
        UPDATE characters
        SET xp = $1,
            level = $2,
            xp_to_next_level = $3,
            programmierung = LEAST(programmierung + $4, 100),
            netzwerke = LEAST(netzwerke + $5, 100),
            datenbanken = LEAST(datenbanken + $6, 100),
            hardware = LEAST(hardware + $7, 100),
            sicherheit = LEAST(sicherheit + $8, 100),
            projektmanagement = LEAST(projektmanagement + $9, 100),
            updated_at = (now()::text)
        WHERE id = $10
      `, [
        newXp, newLevel, xpToNext,
        finalProg, finalNetz, finalDB, finalHW, finalSec, finalPM,
        submission.character_id
      ]);
      
      // Titel vergeben falls Titel-Quest
      if (submission.is_title_quest && submission.title_reward) {
        await db.run(
          `INSERT INTO character_titles (character_id, title, is_active)
           VALUES ($1, $2, 0)
           ON CONFLICT DO NOTHING`,
          [submission.character_id, submission.title_reward]
        );

        await db.run('UPDATE characters SET title = $1 WHERE id = $2', [submission.title_reward, submission.character_id]);

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
        finalXP,
        grade,
        feedback
      ]);
    }
    
    res.json({ message: 'Abgabe erfolgreich bewertet' });
  } catch (error) {
    console.error('Fehler beim Bewerten der Abgabe:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Passwort eines Benutzers ändern (nur Super-Admin)
adminRouter.put('/users/:userId/password', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword, adminUserId } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin User ID erforderlich' });
    }

    // Prüfe, ob der Admin ein Super-Admin ist
    const admin: any = await db.get('SELECT is_super_admin FROM users WHERE id = $1', [adminUserId]);
    if (!admin || !admin.is_super_admin) {
      return res.status(403).json({ error: 'Nur Super-Admins können Passwörter ändern' });
    }

    // Prüfe, ob User existiert
    const user: any = await db.get('SELECT id, username FROM users WHERE id = $1', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Passwort hashen
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Passwort aktualisieren
    await db.run(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    console.log(`✅ Super-Admin ${adminUserId} hat das Passwort für User ${userId} (${user.username}) geändert`);

    res.json({ 
      message: 'Passwort erfolgreich geändert',
      username: user.username
    });
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
