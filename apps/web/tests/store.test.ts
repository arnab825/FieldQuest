import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useAdventureSessionStore } from '../src/store/adventure-session.store.js';
import { AdventureSessionRecord } from '../src/types/index.js';

describe('useAdventureSessionStore', () => {
  const sampleSession: AdventureSessionRecord = {
    id: 'test-session-1',
    createdAt: new Date().toISOString(),
    durationMinutes: 15,
    environment: 'park',
    difficulty: 'easy',
    language: 'en',
    interests: ['plants'],
    accessibleMobility: false,
    missions: [
      {
        id: 'm1',
        title: 'Mission 1',
        objective: 'Objective 1',
        instructions: ['Step 1', 'Step 2'],
        estimatedMinutes: 5,
        observationCriteria: ['Criteria 1'],
        completionCriteria: 'Complete 1',
        safetyGuidance: 'Safe 1',
        reflectionQuestion: 'Question 1',
        status: 'pending',
      },
      {
        id: 'm2',
        title: 'Mission 2',
        objective: 'Objective 2',
        instructions: ['Step 1', 'Step 2'],
        estimatedMinutes: 5,
        observationCriteria: ['Criteria 2'],
        completionCriteria: 'Complete 2',
        safetyGuidance: 'Safe 2',
        reflectionQuestion: 'Question 2',
        status: 'pending',
      },
    ],
    status: 'in_progress',
    totalMinutesSpent: 0,
    providerUsed: 'demo',
  };

  beforeEach(() => {
    useAdventureSessionStore.setState({
      session: null,
      currentMissionIndex: 0,
      elapsedSeconds: 0,
      isPaused: false,
      isScreenDown: false,
    });
  });

  it('starts a session and marks first mission active', async () => {
    await useAdventureSessionStore.getState().startSession(sampleSession);
    const state = useAdventureSessionStore.getState();
    expect(state.session).not.toBeNull();
    expect(state.session?.missions[0].status).toBe('active');
    expect(state.session?.missions[1].status).toBe('pending');
  });

  it('increments elapsedSeconds when ticking', async () => {
    await useAdventureSessionStore.getState().startSession(sampleSession);
    useAdventureSessionStore.getState().tickSecond();
    useAdventureSessionStore.getState().tickSecond();
    expect(useAdventureSessionStore.getState().elapsedSeconds).toBe(2);
  });

  it('toggles pause and screen down states', () => {
    useAdventureSessionStore.getState().togglePause();
    expect(useAdventureSessionStore.getState().isPaused).toBe(true);

    useAdventureSessionStore.getState().setScreenDown(true);
    expect(useAdventureSessionStore.getState().isScreenDown).toBe(true);
  });

  it('completes current mission and advances to next mission', async () => {
    await useAdventureSessionStore.getState().startSession(sampleSession);
    await useAdventureSessionStore.getState().completeCurrentMission('Observed nice green leaves');

    const state = useAdventureSessionStore.getState();
    expect(state.session?.missions[0].status).toBe('completed');
    expect(state.session?.missions[0].userNotes).toBe('Observed nice green leaves');
    expect(state.currentMissionIndex).toBe(1);
    expect(state.session?.missions[1].status).toBe('active');
  });
});
