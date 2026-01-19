import { db } from './db';

console.log('🔍 Prüfe Equipment-Tabelle...');

try {
  // Prüfe ob Tabelle existiert
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='equipment'
  `).get();
  
  if (tableExists) {
    console.log('✅ Equipment-Tabelle existiert');
    
    // Zeige Spalten
    const columns = db.prepare('PRAGMA table_info(equipment)').all();
    console.log('Spalten:', columns.map((c: any) => c.name).join(', '));
    
    // Zeige Equipment
    const equipment = db.prepare('SELECT * FROM equipment').all();
    console.log(`📦 ${equipment.length} Equipment gefunden`);
    equipment.forEach((e: any) => {
      console.log(`  - ${e.name} (${e.rarity})`);
    });
  } else {
    console.log('❌ Equipment-Tabelle existiert nicht!');
    console.log('Führe setup-equipment.ts aus: npx tsx src/database/setup-equipment.ts');
  }
} catch (error) {
  console.error('❌ Fehler:', error);
}
