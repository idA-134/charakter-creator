import { db } from './db';

const cleanup = () => {
  try {
    console.log('🧹 Bereinige Datenbank...');
    
    // Behalte Super Admin (id = 1) und löschen alles andere
    const superAdminId = 1;
    
    // Löschen alles in Abhängigkeit von der Reihenfolge (Foreign Keys beachten)
    console.log('Lösche character-related Daten...');
    db.exec(`DELETE FROM character_titles`);
    db.exec(`DELETE FROM character_achievements`);
    db.exec(`DELETE FROM character_equipment`);
    db.exec(`DELETE FROM character_quests`);
    db.exec(`DELETE FROM characters`);
    
    console.log('Lösche quest-related Daten...');
    db.exec(`DELETE FROM quest_assignments`);
    db.exec(`DELETE FROM quests`);
    
    console.log('Lösche group-related Daten...');
    db.exec(`DELETE FROM group_members`);
    db.exec(`DELETE FROM groups`);
    
    console.log('Lösche Equipment...');
    db.exec(`DELETE FROM equipment`);
    
    console.log('Lösche Achievements...');
    db.exec(`DELETE FROM achievements`);
    
    console.log('Lösche Notifications...');
    db.exec(`DELETE FROM notifications`);
    
    console.log('Lösche alle Users außer Super Admin...');
    db.exec(`DELETE FROM users WHERE id != ${superAdminId}`);
    
    console.log('\n✅ Datenbank erfolgreich bereinigt!');
    console.log(`✅ Super Admin (ID: ${superAdminId}) bleibt erhalten`);
    
  } catch (error) {
    console.error('❌ Fehler beim Bereinigen:', error);
    throw error;
  }
};

// Script ausführen
if (require.main === module) {
  try {
    cleanup();
    console.log('Cleanup abgeschlossen');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup fehlgeschlagen:', error);
    process.exit(1);
  }
}

export { cleanup };
