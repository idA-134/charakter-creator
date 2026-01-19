import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
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

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Etwas ist schiefgelaufen!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
