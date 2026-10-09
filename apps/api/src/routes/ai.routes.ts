import { Router, Request, Response, NextFunction } from 'express';
import { missionGeneratorService } from '../services/mission-generator.service.js';

export const aiRouter = Router();

aiRouter.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forcedMode = (req.query.mode === 'demo' || req.query.mode === 'ollama')
      ? req.query.mode
      : undefined;
    const model = typeof req.query.model === 'string' ? req.query.model : undefined;
    const endpoint = typeof req.query.endpoint === 'string' ? req.query.endpoint : undefined;

    const status = await missionGeneratorService.checkAIStatus(forcedMode, model, endpoint);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

aiRouter.post('/configure', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { endpoint, model, mode } = req.body || {};
    missionGeneratorService.updateOllamaConfig(endpoint, model);
    const status = await missionGeneratorService.checkAIStatus(mode || 'ollama', model, endpoint);
    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
});
