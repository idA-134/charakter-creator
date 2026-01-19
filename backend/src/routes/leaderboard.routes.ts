import { Router } from 'express';
import { db } from '../database/db';

export const leaderboardRouter = Router();

// Leaderboard nach Level
leaderboardRouter.get('/level', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const stmt = db.prepare(
      `SELECT 
         c.id,
         c.name,
         c.title,
         c.level,
         c.xp,
         u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       ORDER BY c.level DESC, c.xp DESC
       LIMIT ?`
    );
    const result = stmt.all(limit);
    
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen des Level-Leaderboards:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Leaderboard nach Gesamt-Stats
leaderboardRouter.get('/stats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const stmt = db.prepare(
      `SELECT 
         c.id,
         c.name,
         c.title,
         c.level,
         (c.programmierung + c.netzwerke + c.datenbanken + c.hardware + c.sicherheit + c.projektmanagement) as total_stats,
         c.programmierung,
         c.netzwerke,
         c.datenbanken,
         c.hardware,
         c.sicherheit,
         c.projektmanagement,
         u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       ORDER BY total_stats DESC
       LIMIT ?`
    );
    const result = stmt.all(limit);
    
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen des Stats-Leaderboards:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Leaderboard nach Achievements
leaderboardRouter.get('/achievements', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const stmt = db.prepare(
      `SELECT 
         c.id,
         c.name,
         c.title,
         c.level,
         COUNT(ca.id) as achievement_count,
         u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN character_achievements ca ON c.id = ca.character_id
       GROUP BY c.id, u.username
       ORDER BY achievement_count DESC
       LIMIT ?`
    );
    const result = stmt.all(limit);
    
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen des Achievement-Leaderboards:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Leaderboard nach abgeschlossenen Quests
leaderboardRouter.get('/quests', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const stmt = db.prepare(
      `SELECT 
         c.id,
         c.name,
         c.title,
         c.level,
         COUNT(cq.id) as completed_quests,
         u.username
       FROM characters c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN character_quests cq ON c.id = cq.character_id AND cq.status = 'completed'
       GROUP BY c.id, u.username
       ORDER BY completed_quests DESC
       LIMIT ?`
    );
    const result = stmt.all(limit);
    
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen des Quest-Leaderboards:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
