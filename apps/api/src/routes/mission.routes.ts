import { Router, Request, Response, NextFunction } from 'express';
import { missionGeneratorService } from '../services/mission-generator.service.js';

export const missionRouter = Router();

missionRouter.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forcedMode = (req.query.mode === 'demo' || req.body?.forcedMode === 'demo')
      ? 'demo'
      : (req.query.mode === 'ollama' || req.body?.forcedMode === 'ollama')
      ? 'ollama'
      : undefined;

    // Remove forcedMode from the preferences payload so it doesn't fail Zod parsing
    const { forcedMode: _, ...preferences } = req.body || {};

    const result = await missionGeneratorService.generateAdventureMissions(
      preferences,
      forcedMode
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
