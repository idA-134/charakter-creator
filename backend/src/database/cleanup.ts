import { db, pool } from './db';

const cleanup = async () => {
  try {
    console.log('🧹 Bereinige Datenbank...');
    
    // Behalte Super Admin (id = 1) und löschen alles andere
    const superAdminId = 1;
    
    // Löschen alles in Abhängigkeit von der Reihenfolge (Foreign Keys beachten)
    console.log('Lösche character-related Daten...');
    await db.run(`DELETE FROM character_titles`);
    await db.run(`DELETE FROM character_achievements`);
    await db.run(`DELETE FROM character_equipment`);
    await db.run(`DELETE FROM character_quests`);
    await db.run(`DELETE FROM characters`);
    
    console.log('Lösche quest-related Daten...');
    await db.run(`DELETE FROM quest_assignments`);
    await db.run(`DELETE FROM quests`);
    
    console.log('Lösche group-related Daten...');
    await db.run(`DELETE FROM group_members`);
    await db.run(`DELETE FROM groups`);
    
    console.log('Lösche Equipment...');
    await db.run(`DELETE FROM equipment`);
    
    console.log('Lösche Achievements...');
    await db.run(`DELETE FROM achievements`);
    
    console.log('Lösche Notifications...');
    await db.run(`DELETE FROM notifications`);
    
    console.log('Lösche alle Users außer Super Admin...');
    await db.run(`DELETE FROM users WHERE id != $1`, [superAdminId]);
    
    console.log('Setze Auto-Increment Sequences zurück...');
    // Setze alle Sequences so, dass der nächste ID-Wert 2 ist (nach dem Super Admin mit ID 1)
    await db.run(`SELECT setval('users_id_seq', 2, false)`);
    await db.run(`SELECT setval('characters_id_seq', 1, false)`);
    await db.run(`SELECT setval('quests_id_seq', 1, false)`);
    await db.run(`SELECT setval('groups_id_seq', 1, false)`);
    await db.run(`SELECT setval('equipment_id_seq', 1, false)`);
    await db.run(`SELECT setval('achievements_id_seq', 1, false)`);
    await db.run(`SELECT setval('notifications_id_seq', 1, false)`);
    
    console.log('\n✅ Datenbank erfolgreich bereinigt!');
    console.log(`✅ Super Admin (ID: ${superAdminId}) bleibt erhalten`);
    console.log(`✅ Nächster User startet mit ID: 2`);
    
  } catch (error) {
    console.error('❌ Fehler beim Bereinigen:', error);
    throw error;
  }
};

// Script ausführen
if (require.main === module) {
  cleanup()
    .then(() => {
      console.log('Cleanup abgeschlossen');
      return pool.end();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Cleanup fehlgeschlagen:', error);
      pool.end().finally(() => process.exit(1));
    });
}

export { cleanup };
