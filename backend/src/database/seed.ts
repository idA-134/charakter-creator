import { pool } from './db';

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Beispiel-Ausrüstung
    await client.query(`
      INSERT INTO equipment (name, description, type, rarity, programmierung_bonus, min_level)
      VALUES 
        ('ThinkPad X1', 'Zuverlässiger Business-Laptop', 'laptop', 'common', 5, 1),
        ('MacBook Pro', 'Premium Developer-Laptop', 'laptop', 'rare', 15, 5),
        ('Visual Studio Code', 'Moderner Code-Editor', 'software', 'common', 8, 1),
        ('IntelliJ IDEA Ultimate', 'Professionelle IDE', 'software', 'epic', 20, 8),
        ('Docker Desktop', 'Container-Virtualisierung', 'software', 'uncommon', 5, 3),
        ('AWS Zertifikat', 'Cloud Practitioner', 'certification', 'rare', 10, 10)
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO equipment (name, description, type, rarity, netzwerke_bonus, min_level)
      VALUES 
        ('Cisco Switch', 'Managed Network Switch', 'tool', 'uncommon', 12, 3),
        ('Wireshark', 'Netzwerk-Analyse-Tool', 'software', 'common', 8, 1),
        ('CCNA Zertifikat', 'Cisco Network Zertifikat', 'certification', 'epic', 25, 15)
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO equipment (name, description, type, rarity, datenbanken_bonus, min_level)
      VALUES 
        ('PostgreSQL Pro', 'Relationale Datenbank', 'software', 'uncommon', 10, 2),
        ('MongoDB Atlas', 'NoSQL Cloud-Datenbank', 'software', 'rare', 15, 5),
        ('DBeaver', 'Universal DB-Tool', 'software', 'common', 7, 1)
      ON CONFLICT DO NOTHING
    `);

    // Beispiel-Achievements
    await client.query(`
      INSERT INTO achievements (name, description, icon, category, xp_reward, requirement_type, requirement_value)
      VALUES 
        ('Erste Schritte', 'Erstelle deinen ersten Charakter', '🎯', 'special', 50, 'level', 1),
        ('Code Novize', 'Erreiche Programmierung Level 25', '💻', 'skill', 100, 'stat', 25),
        ('Netzwerk-Guru', 'Erreiche Netzwerke Level 50', '🌐', 'skill', 200, 'stat', 50),
        ('Level 10', 'Erreiche Charakter Level 10', '⭐', 'level', 150, 'level', 10),
        ('Quest-Jäger', 'Schließe 10 Quests ab', '🏆', 'quest', 100, 'quest_count', 10),
        ('Ausrüstungs-Sammler', 'Sammle 5 verschiedene Items', '🎒', 'special', 75, 'equipment_count', 5),
        ('Senior Developer', 'Erreiche Level 20', '👨‍💻', 'level', 300, 'level', 20)
      ON CONFLICT DO NOTHING
    `);

    // Beispiel-Quests
    await client.query(`
      INSERT INTO quests (title, description, category, difficulty, xp_reward, programmierung_reward, min_level)
      VALUES 
        ('Hello World', 'Schreibe dein erstes Programm in einer beliebigen Sprache', 'programmierung', 'beginner', 50, 5, 1),
        ('Variablen & Datentypen', 'Lerne die Grundlagen von Variablen und Datentypen', 'programmierung', 'beginner', 75, 8, 1),
        ('Kontrollstrukturen', 'Implementiere if-else und Schleifen', 'programmierung', 'beginner', 100, 10, 2),
        ('Funktionen & Methoden', 'Erstelle wiederverwendbare Funktionen', 'programmierung', 'intermediate', 150, 15, 5),
        ('OOP Grundlagen', 'Lerne Objektorientierte Programmierung', 'programmierung', 'intermediate', 200, 20, 8),
        ('API erstellen', 'Baue eine REST-API mit Express', 'programmierung', 'advanced', 300, 30, 12)
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO quests (title, description, category, difficulty, xp_reward, netzwerke_reward, min_level)
      VALUES 
        ('OSI-Modell', 'Verstehe die 7 Schichten des OSI-Modells', 'netzwerke', 'beginner', 75, 8, 1),
        ('IP-Adressen', 'Lerne IPv4 und Subnetting', 'netzwerke', 'intermediate', 150, 15, 3),
        ('Router konfigurieren', 'Konfiguriere einen Cisco Router', 'netzwerke', 'advanced', 250, 25, 10)
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO quests (title, description, category, difficulty, xp_reward, datenbanken_reward, min_level)
      VALUES 
        ('SQL Basics', 'Lerne SELECT, INSERT, UPDATE, DELETE', 'datenbanken', 'beginner', 100, 10, 1),
        ('Datenbank Design', 'Erstelle ein normalisiertes Datenbankschema', 'datenbanken', 'intermediate', 200, 20, 5),
        ('Query Optimierung', 'Optimiere langsame Datenbankabfragen', 'datenbanken', 'advanced', 300, 30, 12)
      ON CONFLICT DO NOTHING
    `);

    await client.query(`
      INSERT INTO quests (title, description, category, difficulty, xp_reward, sicherheit_reward, min_level)
      VALUES 
        ('Passwort-Sicherheit', 'Lerne Best Practices für sichere Passwörter', 'sicherheit', 'beginner', 75, 8, 1),
        ('HTTPS & SSL', 'Verstehe Verschlüsselung im Web', 'sicherheit', 'intermediate', 150, 15, 5),
        ('Penetration Testing', 'Führe einen Sicherheitstest durch', 'sicherheit', 'expert', 400, 40, 18)
      ON CONFLICT DO NOTHING
    `);

    await client.query('COMMIT');
    console.log('✅ Beispieldaten erfolgreich eingefügt!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Fehler beim Einfügen der Daten:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Script ausführen
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Seed abgeschlossen');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed fehlgeschlagen:', error);
      process.exit(1);
    });
}

export { seedData };
