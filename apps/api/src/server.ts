import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`
🌿 FieldQuest API Server Running
─────────────────────────────────────────────
URL:         http://localhost:${config.port}
Environment: ${config.nodeEnv}
AI Provider: ${config.aiProvider}
Model:       ${config.ollamaModel} (Ollama URL: ${config.ollamaBaseUrl})
CORS Client: ${config.clientOrigin}
─────────────────────────────────────────────
Ready for nature exploration missions.
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
