import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { missionRouter } from './routes/mission.routes.js';

export function createApp() {
  const app = express();

  // Basic security and parsing
  app.disable('x-powered-by');
  
  // CORS configuration
  const allowedOrigins = config.clientOrigin.split(',').map(s => s.trim());
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local development
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parser with tight limits
  app.use(express.json({ limit: '500kb' }));

  // Request logger
  app.use(requestLogger);

  // Rate Limiting on API endpoints
  app.use('/api', apiRateLimiter);

  // Root Route for friendly API documentation & status
  app.get('/', (_req, res) => {
    res.json({
      name: 'FieldQuest Backend API',
      status: 'online',
      version: '1.0.0',
      webAppUrl: 'http://localhost:5173',
      endpoints: {
        health: '/api/v1/health',
        aiStatus: '/api/v1/ai/status',
        generateMissions: '/api/v1/missions/generate',
      },
      message: 'To explore FieldQuest, open the web app at http://localhost:5173 in your browser.',
    });
  });

  // Routes
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/missions', missionRouter);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
