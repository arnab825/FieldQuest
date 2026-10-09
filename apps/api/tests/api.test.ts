import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('FieldQuest API Endpoints', () => {
  const app = createApp();

  it('GET /api/v1/health returns healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('FieldQuest');
  });

  it('GET /api/v1/ai/status?mode=demo returns demo status with suggestion and rateLimit', async () => {
    const res = await request(app).get('/api/v1/ai/status?mode=demo');
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('demo');
    expect(res.body.available).toBe(true);
    expect(res.body.suggestion).toBeDefined();
    expect(res.body.rateLimit).toBeDefined();
    expect(res.body.rateLimit.missionsPerMinute).toBeGreaterThan(0);
  });

  it('POST /api/v1/missions/generate with valid body creates missions', async () => {
    const payload = {
      durationMinutes: 30,
      environment: 'park',
      interests: ['plants', 'trees'],
      difficulty: 'easy',
      language: 'en',
      accessibleMobility: false,
      forcedMode: 'demo',
    };

    const res = await request(app)
      .post('/api/v1/missions/generate')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.missions).toBeInstanceOf(Array);
    expect(res.body.missions.length).toBeGreaterThanOrEqual(3);
    expect(res.body.missions[0].title).toBeDefined();
    expect(res.body.missions[0].safetyGuidance).toBeDefined();
  });

  it('POST /api/v1/missions/generate rejects invalid duration', async () => {
    const invalidPayload = {
      durationMinutes: 99,
      environment: 'park',
      interests: ['plants'],
      difficulty: 'easy',
      forcedMode: 'demo',
    };

    const res = await request(app)
      .post('/api/v1/missions/generate')
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_PREFERENCES');
  });

  it('POST /api/v1/missions/generate returns rate-limit headers', async () => {
    const payload = {
      durationMinutes: 15,
      environment: 'garden',
      interests: ['plants'],
      difficulty: 'easy',
      language: 'en',
      accessibleMobility: false,
      forcedMode: 'demo',
    };

    const res = await request(app)
      .post('/api/v1/missions/generate')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-limit']).toBeDefined();
  });
});

