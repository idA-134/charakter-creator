import { Router } from 'express';
import { db } from '../database/db';

export const achievementRouter = Router();

// Alle Achievements abrufen
achievementRouter.get('/', async (req, res) => {
  try {
    const result = await db.all('SELECT * FROM achievements ORDER BY category, requirement_value ASC');
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
    
     const result = await db.all(
      `SELECT 
         a.*,
         ca.unlocked_at,
         CASE WHEN ca.id IS NOT NULL THEN 1 ELSE 0 END as unlocked
       FROM achievements a
       LEFT JOIN character_achievements ca ON a.id = ca.achievement_id AND ca.character_id = $1
       ORDER BY unlocked DESC, a.category, a.requirement_value ASC`
     , [characterId]);
    
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
    await db.transaction(async (client) => {
      const characterResult = await client.query('SELECT * FROM characters WHERE id = $1', [characterId]);
      const character = characterResult.rows[0] as any;
      if (!character) {
        throw new Error('Character nicht gefunden');
      }

      const achievementsResult = await client.query(
        `SELECT a.* FROM achievements a
         WHERE NOT EXISTS (
           SELECT 1 FROM character_achievements ca
           WHERE ca.achievement_id = a.id AND ca.character_id = $1
         )`,
        [characterId]
      );
      const achievements = achievementsResult.rows as any[];

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
            const questResult = await client.query(
              'SELECT COUNT(*) as count FROM character_quests WHERE character_id = $1 AND status = $2',
              [characterId, 'completed']
            );
            unlocked = Number(questResult.rows[0]?.count ?? 0) >= achievement.requirement_value;
            break;
            
          case 'equipment_count':
            const equipResult = await client.query(
              'SELECT COUNT(*) as count FROM character_equipment WHERE character_id = $1',
              [characterId]
            );
            unlocked = Number(equipResult.rows[0]?.count ?? 0) >= achievement.requirement_value;
            break;
        }
        
        if (unlocked) {
          await client.query(
            `INSERT INTO character_achievements (character_id, achievement_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [characterId, achievement.id]
          );

          if (achievement.xp_reward > 0) {
            await client.query(
              `UPDATE characters SET xp = xp + $1, updated_at = (now()::text)
               WHERE id = $2`,
              [achievement.xp_reward, characterId]
            );
          }
          
          newAchievements.push(achievement);
        }
      }
    });
    
    res.json({
      message: newAchievements.length > 0 ? 'Neue Achievements freigeschaltet!' : 'Keine neuen Achievements',
      newAchievements
    });
  } catch (error) {
    console.error('Fehler beim Prüfen der Achievements:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Alle verfügbaren Titel eines Characters abrufen
achievementRouter.get('/character/:characterId/titles', async (req, res) => {
  try {
    const { characterId } = req.params;
    
     const titles = await db.all(
      `SELECT 
         id,
         title,
         unlocked_at,
         is_active
       FROM character_titles
       WHERE character_id = $1
       ORDER BY is_active DESC, unlocked_at DESC`
     , [characterId]);
    
    res.json(titles);
  } catch (error) {
    console.error('Fehler beim Abrufen der Titel:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Aktiven Titel setzen
achievementRouter.post('/character/:characterId/titles/set-active', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { titleId } = req.body;
    
    if (!titleId) {
      return res.status(400).json({ error: 'titleId erforderlich' });
    }
    
    // Prüfen ob Titel dem Character gehört
    const titleData: any = await db.get(
      'SELECT title FROM character_titles WHERE id = $1 AND character_id = $2',
      [titleId, characterId]
    );
    
    if (!titleData) {
      return res.status(404).json({ error: 'Titel nicht gefunden oder gehört nicht dem Character' });
    }
    
    // Transaction: Alle Titel deaktivieren, dann den gewählten aktivieren
    await db.transaction(async (client) => {
      await client.query('UPDATE character_titles SET is_active = 0 WHERE character_id = $1', [characterId]);
      await client.query('UPDATE character_titles SET is_active = 1 WHERE id = $1', [titleId]);
      await client.query('UPDATE characters SET title = $1, updated_at = (now()::text) WHERE id = $2', [titleData.title, characterId]);
    });
    
    res.json({ 
      message: 'Titel erfolgreich gesetzt',
      title: titleData.title 
    });
  } catch (error) {
    console.error('Fehler beim Setzen des Titels:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
