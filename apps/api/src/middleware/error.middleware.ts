import { Request, Response, NextFunction } from 'express';
import { AIProviderError } from '../providers/ollama.provider.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Structured logging
  console.error('[API Error]', {
    name: err.name,
    code: err.code || 'INTERNAL_ERROR',
    message: err.message,
    details: err.details,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  if (err instanceof AIProviderError) {
    if (err.code === 'INVALID_PREFERENCES') {
      res.status(400).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
      return;
    }

    if (err.code === 'AI_PROVIDER_UNAVAILABLE' || err.code === 'AI_GENERATION_TIMEOUT') {
      res.status(503).json({
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
      });
      return;
    }

    res.status(502).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // Catch-all
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
}
