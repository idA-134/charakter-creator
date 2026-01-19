import { db } from './db';

/**
 * Aktualisiert XP-Werte aller bestehenden Quests basierend auf ihrem Mindestlevel
 * Dieses Script sollte einmalig ausgeführt werden, um bestehende Quests anzupassen
 */

function calculateScaledXP(baseXP: number, minLevel: number): number {
  const scalingFactor = 1 + (minLevel - 1) * 0.25;
  return Math.floor(baseXP * scalingFactor);
}

async function updateQuestXP() {
  console.log('🔄 Aktualisiere Quest XP-Werte basierend auf Mindestlevel...\n');

  try {
    // Hole alle Quests
    const quests: any[] = db.prepare('SELECT id, title, difficulty, min_level, xp_reward FROM quests').all();
    
    console.log(`📊 Gefunden: ${quests.length} Quests\n`);
    
    let updatedCount = 0;
    
    for (const quest of quests) {
      // Bestimme Basis-XP anhand der Schwierigkeit
      let baseXP = 50;
      if (quest.difficulty === 'easy') baseXP = 50;
      else if (quest.difficulty === 'medium') baseXP = 100;
      else if (quest.difficulty === 'hard') baseXP = 200;
      
      // Berechne neue skalierte XP
      const minLevel = quest.min_level || 1;
      const newXP = calculateScaledXP(baseXP, minLevel);
      
      // Update nur wenn sich der Wert ändert
      if (newXP !== quest.xp_reward) {
        db.prepare('UPDATE quests SET xp_reward = ? WHERE id = ?').run(newXP, quest.id);
        console.log(`✅ "${quest.title}"`);
        console.log(`   Mindestlevel: ${minLevel} | Schwierigkeit: ${quest.difficulty}`);
        console.log(`   Alt: ${quest.xp_reward} XP → Neu: ${newXP} XP\n`);
        updatedCount++;
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✨ Fertig! ${updatedCount} Quests aktualisiert.`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Zeige Beispiel-Tabelle
    console.log('📋 XP-Skalierung pro Level (Basis 100 XP):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (let level = 1; level <= 20; level += 2) {
      const xp = calculateScaledXP(100, level);
      console.log(`   Level ${level.toString().padStart(2)}: ${xp.toString().padStart(4)} XP`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Fehler beim Update:', error);
    throw error;
  }
}

// Script ausführen
if (require.main === module) {
  updateQuestXP()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { updateQuestXP };
