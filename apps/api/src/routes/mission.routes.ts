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

    // Remove non-preference fields from payload so they don't fail Zod parsing
    const { forcedMode: _, model, endpoint, ...preferences } = req.body || {};

    const result = await missionGeneratorService.generateAdventureMissions(
      preferences,
      forcedMode,
      model,
      endpoint
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

missionRouter.post('/scaffold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forcedMode = (req.query.mode === 'demo' || req.body?.forcedMode === 'demo')
      ? 'demo'
      : (req.query.mode === 'ollama' || req.body?.forcedMode === 'ollama')
      ? 'ollama'
      : undefined;

    const { forcedMode: _, model, endpoint, ...missionData } = req.body || {};

    const result = await missionGeneratorService.generateMissionScaffold(
      missionData,
      forcedMode,
      model,
      endpoint
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
