import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please take a mindful breath and try again shortly.',
    },
  },
});
