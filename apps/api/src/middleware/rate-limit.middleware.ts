import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

/**
 * General API rate limiter for lightweight metadata/health endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests on API endpoints. Please take a mindful breath and try again shortly.',
    },
  },
});

/**
 * Dedicated production rate limiter for expensive AI mission generation & scaffolding.
 * Protects cloud free-tier API quotas and prevents LLM compute exhaustion.
 * Suggests running Local AI (Ollama) when rate limit is approached or exceeded.
 */
export const missionRateLimiter = rateLimit({
  windowMs: config.rateLimitMissionWindowMs,
  max: config.rateLimitMissionMax,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Production AI mission generation rate limit reached for this window. To avoid rate limits and enjoy instant, unlimited generations with 100% privacy, consider running Local AI (Ollama).',
      suggestion: 'Run Local AI with Ollama (ollama run qwen2.5:3b) on port 11434 for unlimited generation without rate limits or cloud dependencies.',
      rateLimit: {
        windowMs: config.rateLimitMissionWindowMs,
        maxMissions: config.rateLimitMissionMax,
      },
    },
  },
});
