import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root if present, or cwd
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientOrigin: string;
  aiProvider: 'ollama' | 'demo';
  ollamaBaseUrl: string;
  ollamaModel: string;
  ollamaTimeoutMs: number;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  aiProvider: (process.env.AI_PROVIDER as 'ollama' | 'demo') || 'demo',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3:4b',
  ollamaTimeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '45000', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
};
