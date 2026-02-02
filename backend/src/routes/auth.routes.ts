import { Router } from 'express';
import { db } from '../database/db';

let bcrypt: any;
let jwt: any;

// Lazy load modules
try {
  bcrypt = require('bcrypt');
  jwt = require('jsonwebtoken');
  console.log('✓ Auth modules loaded: bcrypt, jsonwebtoken');
} catch (error) {
  console.error('❌ Failed to load auth modules:', error);
}

export const authRouter = Router();

// Registrierung
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort sind erforderlich' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }
    
    // Rolle validieren (nur nachwuchskraft oder dozent erlaubt)
    const userRole = role && ['nachwuchskraft', 'dozent'].includes(role) ? role : 'nachwuchskraft';
    
    // Passwort hashen
    const password_hash = await bcrypt.hash(password, 10);
    
    // Dozenten benötigen Bestätigung, NWK nicht
    const pendingApproval = userRole === 'dozent' ? 1 : 0;

    const user = await db.get(
      `
      INSERT INTO users (username, password_hash, role, is_admin, is_super_admin, pending_approval)
      VALUES ($1, $2, $3, 0, 0, $4)
      RETURNING id, username, role, is_admin, is_super_admin, pending_approval, created_at
      `,
      [username, password_hash, userRole, pendingApproval]
    );

    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username bereits vergeben' });
    }
    console.error('Fehler bei der Registrierung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login-Anfrage empfangen');
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }
    
    console.log(`  Suche Benutzer: ${username}`);
    const user = await db.get('SELECT * FROM users WHERE username = $1', [username]) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    console.log(`  Benutzer gefunden, prüfe Passwort...`);
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const actualRole = (user.role === 'dozent' && user.pending_approval === 1) 
      ? 'nachwuchskraft' 
      : (user.role || 'nachwuchskraft');
    
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: actualRole,
        isAdmin: user.is_admin === 1,
        isSuperAdmin: user.is_super_admin === 1
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    console.log(`  ✓ Login erfolgreich`);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: actualRole,
        isAdmin: user.is_admin === 1,
        isSuperAdmin: user.is_super_admin === 1
      }
    });
  } catch (error: any) {
    console.error('❌ Fehler beim Login:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User-Info abrufen
authRouter.get('/me/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await db.get('SELECT id, username, is_admin, is_super_admin, created_at FROM users WHERE id = $1', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Fehler beim Abrufen der User-Info:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
