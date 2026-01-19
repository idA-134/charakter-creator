import { Router } from 'express';
import { db } from '../database/db';

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
      SELECT id, username, role, is_admin, is_super_admin, created_at 
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

// User-Rolle ändern
adminRouter.put('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['nachwuchskraft', 'dozent', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Ungültige Rolle' });
    }
    
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    const info = stmt.run(role, userId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }
    
    const updatedUser = db.prepare(`
      SELECT id, username, role, is_admin, is_super_admin, created_at 
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
      SELECT id, username, role, is_admin, is_super_admin, created_at 
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
      WHERE u.role = 'nachwuchskraft'
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
      SELECT id, username, role, created_at 
      FROM users 
      WHERE role = 'dozent' OR is_admin = 1
      ORDER BY created_at DESC
    `);
    const dozenten = stmt.all();
    res.json(dozenten);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dozenten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
