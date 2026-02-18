import { Router } from 'express';
import { db } from '../database/db';

export const notificationRouter = Router();

// Notifications für einen User abrufen
notificationRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notifications = await db.all(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);
    
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
    
    const result = await db.get(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = $1 AND is_read = 0
    `, [userId]) as any;
    
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
    
    await db.run(`
      UPDATE notifications
      SET is_read = 1, read_at = (now()::text)
      WHERE id = $1
    `, [id]);
    
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
    
    const result = await db.run(`
      UPDATE notifications
      SET is_read = 1, read_at = (now()::text)
      WHERE user_id = $1 AND is_read = 0
    `, [userId]);
    
    res.json({ message: `${result.rowCount} Notifications als gelesen markiert` });
  } catch (error) {
    console.error('Fehler beim Markieren:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Notification erstellen (Helper-Funktion)
export async function createNotification(userId: number, type: string, title: string, message: string) {
  try {
    await db.run(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
    `, [userId, type, title, message]);
  } catch (error) {
    console.error('Fehler beim Erstellen der Notification:', error);
  }
}
