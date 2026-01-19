import { db } from './db';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

const setupAdmin = async () => {
  console.log('\n================================================');
  console.log('🔐 Super-Admin Setup');
  console.log('================================================\n');

  // Prüfe ob bereits ein Super-Admin existiert
  const existingSuperAdmin = db.prepare('SELECT id FROM users WHERE is_super_admin = 1').get();
  
  if (existingSuperAdmin) {
    console.log('✅ Ein Super-Admin existiert bereits!');
    rl.close();
    return;
  }

  console.log('Es wurde noch kein Super-Admin angelegt.');
  console.log('Bitte legen Sie jetzt den ersten Super-Admin an.\n');

  let username = '';
  let password = '';
  let passwordConfirm = '';

  // Username eingeben
  while (!username || username.length < 8) {
    username = await question('Benutzername (min. 8 Zeichen): ');
    if (username.length < 8) {
      console.log('❌ Benutzername muss mindestens 8 Zeichen lang sein!\n');
    }
  }

  // Prüfe ob Username bereits existiert
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existingUser) {
    console.log('❌ Dieser Benutzername existiert bereits!');
    rl.close();
    process.exit(1);
  }

  // Passwort eingeben
  while (!password || password.length < 12) {
    password = await question('Passwort (min. 12 Zeichen): ');
    if (password.length < 12) {
      console.log('❌ Passwort muss mindestens 12 Zeichen lang sein!\n');
    }
  }

  // Passwort bestätigen
  while (password !== passwordConfirm) {
    passwordConfirm = await question('Passwort wiederholen: ');
    if (password !== passwordConfirm) {
      console.log('❌ Passwörter stimmen nicht überein!\n');
    }
  }

  try {
    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 10);

    // Super-Admin erstellen
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, is_admin, is_super_admin)
      VALUES (?, ?, 1, 1)
    `).run(username, passwordHash);

    console.log('\n✅ Super-Admin erfolgreich erstellt!');
    console.log(`   User-ID: ${result.lastInsertRowid}`);
    console.log(`   Username: ${username}`);
    console.log('\n⚠️  Dieser Account kann nicht gelöscht werden.');
    console.log('================================================\n');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Super-Admins:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
};

// Script ausführen
if (require.main === module) {
  setupAdmin()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fehler:', error);
      process.exit(1);
    });
}

export { setupAdmin };
