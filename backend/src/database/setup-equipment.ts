import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new Database(dbPath);

console.log('🔄 Erstelle Equipment-System...');

try {
  // Alte Equipment-Tabelle löschen falls vorhanden
  db.exec('DROP TABLE IF EXISTS equipment');
  console.log('🗑️ Alte Equipment-Tabelle gelöscht');

  // Equipment-Tabelle neu erstellen
  db.exec(`
    CREATE TABLE equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      rarity TEXT DEFAULT 'common',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✅ Equipment-Tabelle erstellt');
  
  // Spalte required_equipment_id zu quests hinzufügen
  // Spalte required_equipment_id zu quests hinzufügen
  try {
    db.exec('ALTER TABLE quests ADD COLUMN required_equipment_id INTEGER REFERENCES equipment(id)');
    console.log('✅ required_equipment_id zu quests hinzugefügt');
  } catch (error: any) {
    if (error.message.includes('duplicate column')) {
      console.log('ℹ️  required_equipment_id existiert bereits');
    } else {
      throw error;
    }
  }
  
  // Standard-Equipment erstellen
  const equipmentStmt = db.prepare(`
    INSERT INTO equipment (name, description, rarity) VALUES (?, ?, ?)
  `);
  
  const defaultEquipment = [
    ['Laptop', 'Ein leistungsstarker Laptop für Entwicklung und Administration', 'common'],
    ['Netzwerkkabel', 'CAT6 Kabel für Netzwerkverbindungen', 'common'],
    ['Server-Zugang', 'SSH-Zugang zum Entwicklungsserver', 'uncommon'],
    ['Datenbank-Lizenz', 'Lizenz für professionelle Datenbank-Tools', 'uncommon'],
    ['Admin-Rechte', 'Erweiterte Systemrechte für kritische Aufgaben', 'rare'],
    ['Zertifikat', 'Offizielles IT-Fachzertifikat', 'rare']
  ];
  
  for (const [name, desc, rarity] of defaultEquipment) {
    try {
      equipmentStmt.run(name, desc, rarity);
    } catch (e) {
      // Ignoriere Duplikate
    }
  }
  console.log('✅ Standard-Equipment erstellt');
  
  console.log('✅ Equipment-System bereit!');
  
} catch (error: any) {
  console.error('❌ Fehler:', error);
  process.exit(1);
}

db.close();
console.log('✅ Equipment-System bereit!');
