import { db, pool } from './db';

const seedData = async () => {
  try {
    console.log('🌱 Beginne mit Seed-Daten...');

    // Beispiel-Ausrüstung (Programmierung)
    const insertEquipment = async (name: string, description: string, rarity: string) => {
      await db.run(
        `INSERT INTO equipment (name, description, rarity)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [name, description, rarity]
      );
    };
    
    const programmingEquipment = [
      ['ThinkPad X1', 'Zuverlässiger Business-Laptop', 'common'],
      ['MacBook Pro', 'Premium Developer-Laptop', 'rare'],
      ['Visual Studio Code', 'Moderner Code-Editor', 'common'],
      ['IntelliJ IDEA Ultimate', 'Professionelle IDE', 'epic'],
      ['Docker Desktop', 'Container-Virtualisierung', 'uncommon'],
      ['AWS Zertifikat', 'Cloud Practitioner', 'rare']
    ];

    for (const item of programmingEquipment) {
      await insertEquipment(item[0], item[1], item[2]);
    }

    // Netzwerk-Equipment
    const networkEquipment = [
      ['Cisco Switch', 'Managed Network Switch', 'uncommon'],
      ['Wireshark', 'Netzwerk-Analyse-Tool', 'common'],
      ['CCNA Zertifikat', 'Cisco Network Zertifikat', 'epic']
    ];

    for (const item of networkEquipment) {
      await insertEquipment(item[0], item[1], item[2]);
    }

    // Datenbank-Equipment
    const dbEquipment = [
      ['PostgreSQL Pro', 'Relationale Datenbank', 'uncommon'],
      ['MongoDB Atlas', 'NoSQL Cloud-Datenbank', 'rare'],
      ['DBeaver', 'Universal DB-Tool', 'common']
    ];

    for (const item of dbEquipment) {
      await insertEquipment(item[0], item[1], item[2]);
    }

    console.log('✅ Equipment erfolgreich angelegt!');

    // Beispiel-Achievements
    const insertAchievement = async (
      name: string,
      description: string,
      icon: string,
      category: string,
      xp_reward: number,
      requirement_type: string,
      requirement_value: number
    ) => {
      await db.run(
        `INSERT INTO achievements (name, description, icon, category, xp_reward, requirement_type, requirement_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [name, description, icon, category, xp_reward, requirement_type, requirement_value]
      );
    };

    const achievements: Array<[string, string, string, string, number, string, number]> = [
      ['Erste Schritte', 'Erstelle deinen ersten Charakter', '🎯', 'special', 50, 'level', 1],
      ['Code Novize', 'Erreiche Programmierung Level 25', '💻', 'skill', 100, 'stat', 25],
      ['Netzwerk-Guru', 'Erreiche Netzwerke Level 50', '🌐', 'skill', 200, 'stat', 50],
      ['Level 10', 'Erreiche Charakter Level 10', '⭐', 'level', 150, 'level', 10],
      ['Quest-Jäger', 'Schließe 10 Quests ab', '🏆', 'quest', 100, 'quest_count', 10],
      ['Ausrüstungs-Sammler', 'Sammle 5 verschiedene Items', '🎒', 'special', 75, 'equipment_count', 5],
      ['Senior Developer', 'Erreiche Level 20', '👨‍💻', 'level', 300, 'level', 20]
    ];

    for (const achievement of achievements) {
      await insertAchievement(
        achievement[0],
        achievement[1],
        achievement[2],
        achievement[3],
        achievement[4],
        achievement[5],
        achievement[6]
      );
    }

    console.log('✅ Achievements erfolgreich angelegt!');

    // Beispiel-Quests
    const programmingQuests = [
      ['Hello World', 'Schreibe dein erstes Programm in einer beliebigen Sprache', 'programmierung', 'beginner', 50, 5, 1],
      ['Variablen & Datentypen', 'Lerne die Grundlagen von Variablen und Datentypen', 'programmierung', 'beginner', 75, 8, 1],
      ['Kontrollstrukturen', 'Implementiere if-else und Schleifen', 'programmierung', 'beginner', 100, 10, 2],
      ['Funktionen & Methoden', 'Erstelle wiederverwendbare Funktionen', 'programmierung', 'intermediate', 150, 15, 5],
      ['OOP Grundlagen', 'Lerne Objektorientierte Programmierung', 'programmierung', 'intermediate', 200, 20, 8],
      ['API erstellen', 'Baue eine REST-API mit Express', 'programmierung', 'advanced', 300, 30, 12]
    ];

    for (const quest of programmingQuests) {
      await db.run(
        `INSERT INTO quests (title, description, category, difficulty, xp_reward, programmierung_reward, min_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        quest
      );
    }

    // Netzwerk-Quests

    const networkQuests = [
      ['OSI-Modell', 'Verstehe die 7 Schichten des OSI-Modells', 'netzwerke', 'beginner', 75, 8, 1],
      ['IP-Adressen', 'Lerne IPv4 und Subnetting', 'netzwerke', 'intermediate', 150, 15, 3],
      ['Router konfigurieren', 'Konfiguriere einen Cisco Router', 'netzwerke', 'advanced', 250, 25, 10]
    ];

    for (const quest of networkQuests) {
      await db.run(
        `INSERT INTO quests (title, description, category, difficulty, xp_reward, netzwerke_reward, min_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        quest
      );
    }

    // Datenbank-Quests

    const dbQuests = [
      ['SQL Basics', 'Lerne SELECT, INSERT, UPDATE, DELETE', 'datenbanken', 'beginner', 100, 10, 1],
      ['Datenbank Design', 'Erstelle ein normalisiertes Datenbankschema', 'datenbanken', 'intermediate', 200, 20, 5],
      ['Query Optimierung', 'Optimiere langsame Datenbankabfragen', 'datenbanken', 'advanced', 300, 30, 12]
    ];

    for (const quest of dbQuests) {
      await db.run(
        `INSERT INTO quests (title, description, category, difficulty, xp_reward, datenbanken_reward, min_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        quest
      );
    }

    // Sicherheits-Quests

    const securityQuests = [
      ['Passwort-Sicherheit', 'Lerne Best Practices für sichere Passwörter', 'sicherheit', 'beginner', 75, 8, 1],
      ['HTTPS & SSL', 'Verstehe Verschlüsselung im Web', 'sicherheit', 'intermediate', 150, 15, 5],
      ['Penetration Testing', 'Führe einen Sicherheitstest durch', 'sicherheit', 'expert', 400, 40, 18]
    ];

    for (const quest of securityQuests) {
      await db.run(
        `INSERT INTO quests (title, description, category, difficulty, xp_reward, sicherheit_reward, min_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        quest
      );
    }

    // Wiederholbare Quests (z.B. wöchentliche Aufgaben)

    const repeatableQuests = [
      ['Berichtsheft', 'Fülle das wöchentliche Berichtsheft aus und dokumentiere deine Lernfortschritte', 'dokumentation', 'beginner', 500, 1, 1, 'weekly']
    ];

    for (const quest of repeatableQuests) {
      await db.run(
        `INSERT INTO quests (title, description, category, difficulty, xp_reward, min_level, is_repeatable, repeat_interval)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        quest
      );
    }

    console.log('✅ Quests erfolgreich angelegt!');
    console.log('✅ Alle Beispieldaten erfolgreich eingefügt!');
  } catch (error) {
    console.error('❌ Fehler beim Einfügen der Daten:', error);
    throw error;
  }
};

// Script ausführen
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Seed abgeschlossen');
      return pool.end();
    })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seed fehlgeschlagen:', error);
      pool.end().finally(() => process.exit(1));
    });
}

export { seedData };
