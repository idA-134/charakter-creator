import { Router } from 'express';
import { db } from '../database/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const authRouter = Router();

// Registrierung
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort sind erforderlich' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
    }
    
    // Passwort hashen
    const password_hash = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password_hash, is_admin, is_super_admin)
      VALUES (?, ?, 0, 0)
    `);
    
    const result = stmt.run(username, password_hash);
    
    const user = db.prepare('SELECT id, username, is_admin, is_super_admin, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Username bereits vergeben' });
    }
    console.error('Fehler bei der Registrierung:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username und Passwort erforderlich' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }
    
    // JWT Token erstellen
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role || 'nachwuchskraft',
        isAdmin: user.is_admin === 1,
        isSuperAdmin: user.is_super_admin === 1
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role || 'nachwuchskraft',
        isAdmin: user.is_admin === 1,
        isSuperAdmin: user.is_super_admin === 1
      }
    });
  } catch (error) {
    console.error('Fehler beim Login:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// User-Info abrufen
authRouter.get('/me/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = db.prepare('SELECT id, username, is_admin, is_super_admin, created_at FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User nicht gefunden' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Fehler beim Abrufen der User-Info:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});
