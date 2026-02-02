import { Router } from 'express';
import { db } from '../database/db';

export const groupRouter = Router();

// Middleware: Nur Dozenten/Admins
const requireDozent = (req: any, res: any, next: any) => {
  // In Produktion: JWT Token prüfen
  next();
};

// Alle Gruppen abrufen
groupRouter.get('/', requireDozent, async (req, res) => {
  try {
    const groups = await db.all(`
      SELECT g.*, u.username as created_by_username,
             COUNT(gm.id) as member_count
      FROM groups g
      LEFT JOIN users u ON g.created_by_user_id = u.id
      LEFT JOIN group_members gm ON g.id = gm.group_id
            GROUP BY g.id, u.username
      ORDER BY g.created_at DESC
    `);
    res.json(groups);
  } catch (error) {
    console.error('Fehler beim Abrufen der Gruppen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Gruppe erstellen
groupRouter.post('/', requireDozent, async (req, res) => {
  try {
    const { name, description, created_by_user_id } = req.body;
    
    if (!name || !created_by_user_id) {
      return res.status(400).json({ error: 'Name und created_by_user_id sind erforderlich' });
    }
    
    const newGroup = await db.get(`
      INSERT INTO groups (name, description, created_by_user_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description, created_by_user_id]);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Fehler beim Erstellen der Gruppe:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Gruppe abrufen mit Mitgliedern
groupRouter.get('/:groupId', requireDozent, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const group: any = await db.get('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (!group) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }
    
    const members = await db.all(`
      SELECT u.id, u.username, gm.joined_at,
             c.id as character_id, c.name as character_name, c.level
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN characters c ON u.id = c.user_id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
    `, [groupId]);
    
    res.json({ ...group, members });
  } catch (error) {
    console.error('Fehler beim Abrufen der Gruppe:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User zu Gruppe hinzufügen
groupRouter.post('/:groupId/members', requireDozent, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id erforderlich' });
    }
    
    try {
      await db.run(
        `INSERT INTO group_members (group_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [groupId, user_id]
      );
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(400).json({ error: 'User ist bereits Mitglied dieser Gruppe' });
      }
      throw err;
    }
    
    const member = await db.get(`
      SELECT u.id, u.username, gm.joined_at,
             c.id as character_id, c.name as character_name, c.level
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN characters c ON u.id = c.user_id
      WHERE gm.group_id = $1 AND gm.user_id = $2
    `, [groupId, user_id]);
    
    res.status(201).json(member);
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Mitglieds:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User aus Gruppe entfernen
groupRouter.delete('/:groupId/members/:userId', requireDozent, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    const result = await db.run('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Mitglied nicht in Gruppe gefunden' });
    }
    
    res.json({ message: 'Mitglied entfernt' });
  } catch (error) {
    console.error('Fehler beim Entfernen des Mitglieds:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Gruppe löschen
groupRouter.delete('/:groupId', requireDozent, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const result = await db.run('DELETE FROM groups WHERE id = $1', [groupId]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Gruppe nicht gefunden' });
    }
    
    res.json({ message: 'Gruppe gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Gruppe:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
