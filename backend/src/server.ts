import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
});

// Middleware
app.use(cors());

// Debug middleware vor JSON-Parser
app.use((req, res, next) => {
  console.log(`⚡ Request: ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

// Debug middleware nach JSON-Parser
app.use((req, res, next) => {
  console.log(`✓ JSON parsed, body:`, req.body);
  next();
});

// Statische Dateien für Uploads
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log(`📁 Serve static files from: ${uploadsPath}`);

app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/health', (req, res) => {
  console.log('📍 Health check');
  res.json({ status: 'OK' });
});

// Routes - NOW load auth routes
import { characterRouter } from './routes/character.routes';
import { questRouter } from './routes/quest.routes';
import { achievementRouter } from './routes/achievement.routes';
import { leaderboardRouter } from './routes/leaderboard.routes';
import { authRouter } from './routes/auth.routes';
import { adminRouter } from './routes/admin.routes';
import { groupRouter } from './routes/group.routes';
import { dozentRouter } from './routes/dozent.routes';
import { notificationRouter } from './routes/notification.routes';
import { equipmentRouter } from './routes/equipment.routes';
import journalRouter from './routes/journal.routes';

console.log('✓ All route modules imported');

app.use('/api/auth', authRouter);
app.use('/api/characters', characterRouter);
app.use('/api/quests', questRouter);
app.use('/api/achievements', achievementRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/groups', groupRouter);
app.use('/api/dozent', dozentRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/journal', journalRouter);

console.log('✓ All routes configured');

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
try {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
  
  server.on('error', (err: any) => {
    console.error('❌ Server Error:', err);
    process.exit(1);
  });
} catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
}
