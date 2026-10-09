import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  db,
  saveAdventureSession,
  getAllAdventures,
  addJournalEntry,
  getJournalEntries,
  exportAllDataAsJSON,
  clearAllLocalData,
} from '../src/lib/db.js';
import { AdventureSessionRecord } from '../src/types/index.js';

describe('FieldQuest IndexedDB (Dexie)', () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  it('saves and retrieves adventures', async () => {
    const adv: AdventureSessionRecord = {
      id: 'adv-dexie-1',
      createdAt: new Date().toISOString(),
      durationMinutes: 30,
      environment: 'garden',
      difficulty: 'easy',
      language: 'en',
      interests: ['plants', 'insects'],
      accessibleMobility: false,
      missions: [],
      status: 'completed',
      totalMinutesSpent: 28,
      providerUsed: 'demo',
    };

    await saveAdventureSession(adv);
    const all = await getAllAdventures();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe('adv-dexie-1');
    expect(all[0].environment).toBe('garden');
  });

  it('adds and retrieves journal entries', async () => {
    await addJournalEntry({
      id: 'entry-1',
      timestamp: new Date().toISOString(),
      notes: 'Noticed a green caterpillar under an oak leaf.',
      tags: ['garden', 'insects'],
      environment: 'garden',
    });

    const entries = await getJournalEntries();
    expect(entries.length).toBe(1);
    expect(entries[0].notes).toContain('caterpillar');
  });

  it('exports all stored data as JSON', async () => {
    await addJournalEntry({
      id: 'entry-2',
      timestamp: new Date().toISOString(),
      notes: 'Recorded robin song near fountain.',
      tags: ['birds'],
    });

    const json = await exportAllDataAsJSON();
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.totalJournalEntries).toBe(1);
  });
});
