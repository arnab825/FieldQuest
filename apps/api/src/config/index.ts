import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root if present, or cwd
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  clientOrigin: string;
  aiProvider: 'ollama' | 'demo' | 'cloud';
  ollamaBaseUrl: string;
  ollamaModel: string;
  ollamaTimeoutMs: number;
  cloudProvider: 'gemini' | 'groq';
  geminiApiKey?: string;
  geminiModel: string;
  groqApiKey?: string;
  groqModel: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  aiProvider: (process.env.AI_PROVIDER as 'ollama' | 'demo' | 'cloud') || 'cloud',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
  ollamaTimeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '45000', 10),
  cloudProvider: (process.env.CLOUD_AI_PROVIDER as 'gemini' | 'groq') || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
};
