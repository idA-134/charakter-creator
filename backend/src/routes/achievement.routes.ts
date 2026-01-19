import { Router } from 'express';
import { db } from '../database/db';

export const achievementRouter = Router();

// Alle Achievements abrufen
achievementRouter.get('/', async (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM achievements ORDER BY category, requirement_value ASC');
    const result = stmt.all();
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen der Achievements:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Achievements eines Characters abrufen
achievementRouter.get('/character/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    
    const stmt = db.prepare(
      `SELECT 
         a.*,
         ca.unlocked_at,
         CASE WHEN ca.id IS NOT NULL THEN 1 ELSE 0 END as unlocked
       FROM achievements a
       LEFT JOIN character_achievements ca ON a.id = ca.achievement_id AND ca.character_id = ?
       ORDER BY unlocked DESC, a.category, a.requirement_value ASC`
    );
    const result = stmt.all(characterId);
    
    res.json(result);
  } catch (error) {
    console.error('Fehler beim Abrufen der Character-Achievements:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Prüfen und freischalten von neuen Achievements
achievementRouter.post('/character/:characterId/check', async (req, res) => {
  try {
    const { characterId } = req.params;
    const newAchievements: any[] = [];
    
    // SQLite Transaction
    const transaction = db.transaction(() => {
      // Character-Daten abrufen
      const charStmt = db.prepare('SELECT * FROM characters WHERE id = ?');
      const character = charStmt.get(characterId) as any;
      if (!character) {
        throw new Error('Character nicht gefunden');
      }
      
      // Alle noch nicht freigeschalteten Achievements prüfen
      const achievementsStmt = db.prepare(
        `SELECT a.* FROM achievements a
         WHERE NOT EXISTS (
           SELECT 1 FROM character_achievements ca
           WHERE ca.achievement_id = a.id AND ca.character_id = ?
         )`
      );
      const achievements = achievementsStmt.all(characterId) as any[];
      
      for (const achievement of achievements) {
        let unlocked = false;
        
        switch (achievement.requirement_type) {
          case 'level':
            unlocked = character.level >= achievement.requirement_value;
            break;
            
          case 'stat':
            // Prüfe höchstes Attribut
            const maxStat = Math.max(
              character.programmierung,
              character.netzwerke,
              character.datenbanken,
              character.hardware,
              character.sicherheit,
              character.projektmanagement
            );
            unlocked = maxStat >= achievement.requirement_value;
            break;
            
          case 'quest_count':
            const questStmt = db.prepare(
              'SELECT COUNT(*) as count FROM character_quests WHERE character_id = ? AND status = ?'
            );
            const questResult = questStmt.get(characterId, 'completed') as any;
            unlocked = questResult.count >= achievement.requirement_value;
            break;
            
          case 'equipment_count':
            const equipStmt = db.prepare(
              'SELECT COUNT(*) as count FROM character_equipment WHERE character_id = ?'
            );
            const equipResult = equipStmt.get(characterId) as any;
            unlocked = equipResult.count >= achievement.requirement_value;
            break;
        }
        
        if (unlocked) {
          // Achievement freischalten
          const insertStmt = db.prepare(
            `INSERT INTO character_achievements (character_id, achievement_id)
             VALUES (?, ?)`
          );
          insertStmt.run(characterId, achievement.id);
          
          // XP-Belohnung vergeben
          if (achievement.xp_reward > 0) {
            const updateStmt = db.prepare(
              `UPDATE characters SET xp = xp + ?, updated_at = datetime('now')
               WHERE id = ?`
            );
            updateStmt.run(achievement.xp_reward, characterId);
          }
          
          newAchievements.push(achievement);
        }
      }
    });
    
    transaction();
    
    res.json({
      message: newAchievements.length > 0 ? 'Neue Achievements freigeschaltet!' : 'Keine neuen Achievements',
      newAchievements
    });
  } catch (error) {
    console.error('Fehler beim Prüfen der Achievements:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
