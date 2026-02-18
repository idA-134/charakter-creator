import { Router } from 'express';
import { db } from '../database/db';
import { Character } from '../types';

export const characterRouter = Router();

// Alle Characters eines Users abrufen
characterRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const characters = await db.all('SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(characters);
  } catch (error) {
    console.error('Fehler beim Abrufen der Characters:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Einzelnen Character abrufen
characterRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const character = await db.get('SELECT * FROM characters WHERE id = $1', [id]);
    
    if (!character) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    res.json(character);
  } catch (error) {
    console.error('Fehler beim Abrufen des Characters:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Neuen Character erstellen
characterRouter.post('/', async (req, res) => {
  try {
    const {
      user_id,
      name,
      backstory,
      group_id,
      programmierung,
      netzwerke,
      datenbanken,
      hardware,
      sicherheit,
      projektmanagement
    } = req.body;
    
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id und name sind erforderlich' });
    }

    let groupId: number | null = null;
    if (group_id !== undefined && group_id !== null && group_id !== '') {
      groupId = Number(group_id);
      if (Number.isNaN(groupId)) {
        return res.status(400).json({ error: 'group_id muss eine Zahl sein' });
      }

      const group = await db.get('SELECT id FROM groups WHERE id = $1', [groupId]);
      if (!group) {
        return res.status(400).json({ error: 'Gruppe nicht gefunden' });
      }
    }
    
    const trimmedBackstory = typeof backstory === 'string' ? backstory.trim() : null;
    if (trimmedBackstory && trimmedBackstory.length > 1000) {
      return res.status(400).json({ error: 'Geschichte darf maximal 1000 Zeichen lang sein' });
    }

    const defaultAttributes = {
      programmierung: 10,
      netzwerke: 10,
      datenbanken: 10,
      hardware: 10,
      sicherheit: 10,
      projektmanagement: 10
    };

    const providedAttributes = [programmierung, netzwerke, datenbanken, hardware, sicherheit, projektmanagement]
      .some((val) => val !== undefined && val !== null);

    const attributes = providedAttributes
      ? {
          programmierung: Number(programmierung),
          netzwerke: Number(netzwerke),
          datenbanken: Number(datenbanken),
          hardware: Number(hardware),
          sicherheit: Number(sicherheit),
          projektmanagement: Number(projektmanagement)
        }
      : defaultAttributes;

    if (providedAttributes) {
      const values = Object.values(attributes);
      const invalidNumber = values.some((val) => Number.isNaN(val));
      if (invalidNumber) {
        return res.status(400).json({ error: 'Attribute müssen Zahlen sein' });
      }

      const outOfRange = values.some((val) => val < 0 || val > 20);
      if (outOfRange) {
        return res.status(400).json({ error: 'Attribute müssen zwischen 0 und 20 liegen' });
      }

      const total = values.reduce((sum, val) => sum + val, 0);
      if (total !== 60) {
        return res.status(400).json({ error: 'Du musst genau 60 Attributpunkte vergeben' });
      }
    }

    const newCharacter = await db.get(`
      INSERT INTO characters (
        user_id, name, backstory,
        programmierung, netzwerke, datenbanken, hardware, sicherheit, projektmanagement
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      user_id,
      name,
      trimmedBackstory,
      attributes.programmierung,
      attributes.netzwerke,
      attributes.datenbanken,
      attributes.hardware,
      attributes.sicherheit,
      attributes.projektmanagement
    ]);

    if (groupId) {
      await db.run(
        `INSERT INTO group_members (group_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [groupId, user_id]
      );
    }
    res.status(201).json(newCharacter);
  } catch (error) {
    console.error('Fehler beim Erstellen des Characters:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Character aktualisieren
characterRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, backstory } = req.body;
    
    const updatedCharacter = await db.get(`
      UPDATE characters 
      SET name = COALESCE($1, name),
          title = COALESCE($2, title),
          backstory = COALESCE($3, backstory),
          updated_at = (now()::text)
      WHERE id = $4
      RETURNING *
    `, [name, title, backstory, id]);
    if (!updatedCharacter) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    res.json(updatedCharacter);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Characters:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// XP hinzufügen und Level-Up prüfen
characterRouter.post('/:id/xp', async (req, res) => {
  try {
    const { id } = req.params;
    const { xp } = req.body;
    
    if (!xp || xp <= 0) {
      return res.status(400).json({ error: 'Gültige XP-Menge erforderlich' });
    }
    
    // Character abrufen
    const character: any = await db.get('SELECT * FROM characters WHERE id = $1', [id]);
    
    if (!character) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    let newXp = character.xp + xp;
    let newLevel = character.level;
    let xpToNext = character.xp_to_next_level;
    
    // Level-Up-Logik
    while (newXp >= xpToNext) {
      newXp -= xpToNext;
      newLevel += 1;
      
      // Ab Level 10: Feste 4000 XP pro Level
      // Davor: Exponentielles Wachstum
      if (newLevel >= 10) {
        xpToNext = 4000;
      } else {
        xpToNext = Math.floor(100 * Math.pow(1.5, newLevel - 1));
      }
    }
    
    // Character aktualisieren
    const updatedCharacter = await db.get(`
      UPDATE characters 
      SET xp = $1, level = $2, xp_to_next_level = $3, updated_at = (now()::text)
      WHERE id = $4
      RETURNING *
    `, [newXp, newLevel, xpToNext, id]);
    res.json(updatedCharacter);
  } catch (error) {
    console.error('Fehler beim Hinzufügen von XP:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Attribut erhöhen
characterRouter.post('/:id/attribute', async (req, res) => {
  try {
    const { id } = req.params;
    const { attribute, amount } = req.body;
    
    const validAttributes = ['programmierung', 'netzwerke', 'datenbanken', 'hardware', 'sicherheit', 'projektmanagement'];
    
    if (!validAttributes.includes(attribute)) {
      return res.status(400).json({ error: 'Ungültiges Attribut' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Gültige Menge erforderlich' });
    }
    
    const updatedCharacter = await db.get(`
      UPDATE characters 
      SET ${attribute} = LEAST(${attribute} + $1, 100),
          updated_at = (now()::text)
      WHERE id = $2
      RETURNING *
    `, [amount, id]);
    if (!updatedCharacter) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    res.json(updatedCharacter);
  } catch (error) {
    console.error('Fehler beim Erhöhen des Attributs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Character Inventar abrufen
characterRouter.get('/:id/equipment', async (req, res) => {
  try {
    const { id } = req.params;
    const equipment = await db.all(`
      SELECT e.*, ce.equipped, ce.acquired_at
      FROM equipment e
      JOIN character_equipment ce ON e.id = ce.equipment_id
      WHERE ce.character_id = $1
      ORDER BY ce.equipped DESC, e.rarity DESC
    `, [id]);
    res.json(equipment);
  } catch (error) {
    console.error('Fehler beim Abrufen des Inventars:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Equipment ausrüsten/entfernen
characterRouter.post('/:id/equipment/:equipmentId/toggle', async (req, res) => {
  try {
    const { id, equipmentId } = req.params;
    
    const updatedEquipment = await db.get(`
      UPDATE character_equipment
      SET equipped = CASE WHEN equipped = 1 THEN 0 ELSE 1 END
      WHERE character_id = $1 AND equipment_id = $2
      RETURNING *
    `, [id, equipmentId]);
    
    if (!updatedEquipment) {
      return res.status(404).json({ error: 'Equipment nicht im Inventar' });
    }
    
    res.json(updatedEquipment);
  } catch (error) {
    console.error('Fehler beim Ausrüsten:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Character löschen
characterRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.run('DELETE FROM characters WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    res.json({ message: 'Character gelöscht', id });
  } catch (error) {
    console.error('Fehler beim Löschen des Characters:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
