import { Router } from 'express';
import { db } from '../database/db';
import { Character } from '../types';

export const characterRouter = Router();

// Alle Characters eines Users abrufen
characterRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stmt = db.prepare('SELECT * FROM characters WHERE user_id = ? ORDER BY created_at DESC');
    const characters = stmt.all(userId);
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
    const stmt = db.prepare('SELECT * FROM characters WHERE id = ?');
    const character = stmt.get(id);
    
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
    const { user_id, name } = req.body;
    
    if (!user_id || !name) {
      return res.status(400).json({ error: 'user_id und name sind erforderlich' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO characters (user_id, name) 
      VALUES (?, ?) 
    `);
    const info = stmt.run(user_id, name);
    
    const newCharacter = db.prepare('SELECT * FROM characters WHERE id = ?').get(info.lastInsertRowid);
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
    const { name, title } = req.body;
    
    const stmt = db.prepare(`
      UPDATE characters 
      SET name = COALESCE(?, name),
          title = COALESCE(?, title),
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(name, title, id);
    
    const updatedCharacter = db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
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
    const charStmt = db.prepare('SELECT * FROM characters WHERE id = ?');
    const character: any = charStmt.get(id);
    
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
    const updateStmt = db.prepare(`
      UPDATE characters 
      SET xp = ?, level = ?, xp_to_next_level = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    updateStmt.run(newXp, newLevel, xpToNext, id);
    
    const updatedCharacter = db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
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
    
    const stmt = db.prepare(`
      UPDATE characters 
      SET ${attribute} = MIN(${attribute} + ?, 100),
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(amount, id);
    
    const updatedCharacter = db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
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
    const stmt = db.prepare(`
      SELECT e.*, ce.equipped, ce.acquired_at
      FROM equipment e
      JOIN character_equipment ce ON e.id = ce.equipment_id
      WHERE ce.character_id = ?
      ORDER BY ce.equipped DESC, e.rarity DESC
    `);
    const equipment = stmt.all(id);
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
    
    const stmt = db.prepare(`
      UPDATE character_equipment
      SET equipped = NOT equipped
      WHERE character_id = ? AND equipment_id = ?
    `);
    const info = stmt.run(id, equipmentId);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Equipment nicht im Inventar' });
    }
    
    const updatedEquipment = db.prepare(`
      SELECT * FROM character_equipment
      WHERE character_id = ? AND equipment_id = ?
    `).get(id, equipmentId);
    
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
    const stmt = db.prepare('DELETE FROM characters WHERE id = ?');
    const info = stmt.run(id);
    
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Character nicht gefunden' });
    }
    
    res.json({ message: 'Character gelöscht', id });
  } catch (error) {
    console.error('Fehler beim Löschen des Characters:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
