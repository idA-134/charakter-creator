import { db, pool } from './db';

const addEquipmentType = async () => {
  try {
    console.log('🔧 Füge type-Spalte zu equipment-Tabelle hinzu...');
    
    // Prüfe ob Spalte bereits existiert
    const result = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'equipment' AND column_name = 'type'
    `);
    
    if (result.rows.length > 0) {
      console.log('ℹ️  type-Spalte existiert bereits');
      return;
    }
    
    // Füge type-Spalte hinzu
    await db.run(`ALTER TABLE equipment ADD COLUMN type TEXT DEFAULT 'misc'`);
    console.log('✅ type-Spalte erfolgreich hinzugefügt');
    
    // Setze type auf 'misc' für alle bestehenden Einträge (falls DEFAULT nicht griff)
    await db.run(`UPDATE equipment SET type = 'misc' WHERE type IS NULL`);
    console.log('✅ Bestehende Equipment auf Typ "misc" gesetzt');
    
    // Mache type-Spalte NOT NULL
    await db.run(`ALTER TABLE equipment ALTER COLUMN type SET NOT NULL`);
    console.log('✅ type-Spalte ist jetzt NOT NULL');
    
    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    
  } catch (error) {
    console.error('❌ Fehler bei Migration:', error);
    throw error;
  }
};

// Script ausführen
if (require.main === module) {
  addEquipmentType()
    .then(() => {
      console.log('Migration abgeschlossen');
      return pool.end();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration fehlgeschlagen:', error);
      pool.end().finally(() => process.exit(1));
    });
}

export { addEquipmentType };
