import { Router } from 'express';
import { db } from '../database/db';

export const notificationRouter = Router();

// Notifications für einen User abrufen
notificationRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(userId);
    
    res.json(notifications);
  } catch (error) {
    console.error('Fehler beim Abrufen der Notifications:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Ungelesene Notifications zählen
notificationRouter.get('/user/:userId/unread', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId) as any;
    
    res.json({ count: result.count });
  } catch (error) {
    console.error('Fehler beim Zählen:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Notification als gelesen markieren
notificationRouter.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stmt = db.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(id);
    
    res.json({ message: 'Als gelesen markiert' });
  } catch (error) {
    console.error('Fehler beim Markieren:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle Notifications als gelesen markieren
notificationRouter.put('/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stmt = db.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = datetime('now')
      WHERE user_id = ? AND is_read = 0
    `);
    const info = stmt.run(userId);
    
    res.json({ message: `${info.changes} Notifications als gelesen markiert` });
  } catch (error) {
    console.error('Fehler beim Markieren:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Notification erstellen (Helper-Funktion)
export function createNotification(userId: number, type: string, title: string, message: string) {
  try {
    const stmt = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(userId, type, title, message);
  } catch (error) {
    console.error('Fehler beim Erstellen der Notification:', error);
  }
}
