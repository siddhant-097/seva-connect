import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import connectDB from './config/db.js';
import env from './config/env.js';
import requestId from './middleware/requestId.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import schemeRoutes, { getSavedSchemes } from './routes/schemeRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { authenticate } from './middleware/auth.js';

dotenv.config();

const app = express();
const port = env.PORT;

// ── Security ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));

// ── Rate Limiting ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts.' } },
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'AI request limit reached. Please wait.' } },
});

// ── Middleware Pipeline ─────────────────────────────────────────
app.use(requestId);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('short'));
}

// ── Health Check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sevaconnect-api', timestamp: new Date().toISOString() });
});

// ── API Routes (v1) ─────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', profileRoutes);
app.get('/api/v1/users/me/saved-schemes', authenticate, getSavedSchemes);
app.use('/api/v1/schemes', schemeRoutes);
app.use('/api/v1/recommendations', eligibilityRoutes);
app.use('/api/v1/users/me/applications', applicationRoutes);
app.use('/api/v1/ai', aiLimiter, aiRoutes);

// ── 404 ─────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' },
  });
});

// ── Error Handler ───────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  app.listen(port, () => {
    logger.info(`SevaConnect API listening on http://localhost:${port}`);
  });
};

startServer();

export default app;