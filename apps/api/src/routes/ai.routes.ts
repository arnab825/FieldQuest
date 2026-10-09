import { Router, Request, Response, NextFunction } from 'express';
import { missionGeneratorService } from '../services/mission-generator.service.js';

export const aiRouter = Router();

aiRouter.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forcedMode = (req.query.mode === 'demo' || req.query.mode === 'ollama' || req.query.mode === 'cloud')
      ? req.query.mode
      : undefined;
    const model = typeof req.query.model === 'string' ? req.query.model : undefined;
    const endpoint = typeof req.query.endpoint === 'string' ? req.query.endpoint : undefined;
    const cloudService = (req.query.cloudService === 'gemini' || req.query.cloudService === 'groq')
      ? req.query.cloudService
      : undefined;
    const apiKey = typeof req.query.apiKey === 'string' ? req.query.apiKey : undefined;

    const status = await missionGeneratorService.checkAIStatus(forcedMode, model, endpoint, {
      service: cloudService,
      apiKey,
      model,
    });
    res.json(status);
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/configure', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, model, mode, cloudService, apiKey } = req.body || {};
    if (mode === 'ollama') {
      missionGeneratorService.updateOllamaConfig(endpoint, model);
    } else if (mode === 'cloud') {
      missionGeneratorService.updateCloudConfig(cloudService, apiKey, model);
    }

    const status = await missionGeneratorService.checkAIStatus(mode || 'cloud', model, endpoint, {
      service: cloudService,
      apiKey,
      model,
    });
    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
});
