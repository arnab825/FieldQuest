import { Router, Request, Response, NextFunction } from 'express';
import { missionGeneratorService } from '../services/mission-generator.service.js';

export const aiRouter = Router();

aiRouter.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forcedMode = (req.query.mode === 'demo' || req.query.mode === 'ollama')
      ? req.query.mode
      : undefined;

    const status = await missionGeneratorService.checkAIStatus(forcedMode);
    res.json(status);
  } catch (err) {
    next(err);
  }
});
