import { Router } from 'express';
import { db } from '../database/db';

export const equipmentRouter = Router();

// Alle Equipment abrufen
equipmentRouter.get('/', async (req, res) => {
  try {
    const equipment = await db.all('SELECT * FROM equipment ORDER BY rarity, name');
    res.json(equipment);
  } catch (error) {
    console.error('Fehler beim Abrufen der Equipment:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Equipment erstellen (Dozent/Admin)
equipmentRouter.post('/', async (req, res) => {
  try {
    const { name, description, rarity, type } = req.body;
    
    console.log('📦 Equipment POST request:', { name, description, rarity, type });
    
    if (!name) {
      return res.status(400).json({ error: 'Name ist erforderlich' });
    }
    
    const query = `
      INSERT INTO equipment (name, description, rarity, type, programmierung_bonus, netzwerke_bonus, datenbanken_bonus, hardware_bonus, sicherheit_bonus, projektmanagement_bonus, min_level)
      VALUES ($1, $2, $3, $4, 0, 0, 0, 0, 0, 0, 1)
      RETURNING *
    `;
    
    console.log('🔍 SQL Query:', query);
    console.log('📊 Params:', [name, description, rarity || 'common', type || 'misc']);
    
    const newEquipment = await db.get(query, [name, description, rarity || 'common', type || 'misc']);
    
    console.log('✅ Equipment erstellt:', newEquipment);
    res.status(201).json(newEquipment);
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Equipment:', error);
    const errorMsg = (error as any)?.message || 'Unbekannter Fehler';
    const details = (error as any)?.detail || '';
    console.error('📋 Details:', details);
    res.status(500).json({ 
      error: `Interner Serverfehler: ${errorMsg}`,
      details: details
    });
  }
});

// Equipment eines Characters abrufen
equipmentRouter.get('/character/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    
    const equipment = await db.all(`
      SELECT e.*, ce.equipped, ce.acquired_at
      FROM equipment e
      JOIN character_equipment ce ON e.id = ce.equipment_id
      WHERE ce.character_id = $1
      ORDER BY ce.acquired_at DESC
    `, [characterId]);
    
    res.json(equipment);
  } catch (error) {
    console.error('Fehler beim Abrufen des Character-Equipment:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Prüfen ob Character Equipment besitzt
equipmentRouter.get('/character/:characterId/has/:equipmentId', async (req, res) => {
  try {
    const { characterId, equipmentId } = req.params;
    
    const result: any = await db.get(`
      SELECT COUNT(*) as count
      FROM character_equipment
      WHERE character_id = $1 AND equipment_id = $2
    `, [characterId, equipmentId]);
    
    res.json({ has: result.count > 0 });
  } catch (error) {
    console.error('Fehler beim Prüfen des Equipment:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Equipment löschen (Admin/Dozent)
equipmentRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.run('DELETE FROM equipment WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Equipment nicht gefunden' });
    }
    
    res.json({ message: 'Equipment gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Equipment:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
