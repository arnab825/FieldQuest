import Dexie, { type Table } from 'dexie';
import { AdventureSessionRecord, NatureMission } from '../types/index.js';

export interface JournalEntry {
  id: string;
  adventureId?: string;
  missionId?: string;
  missionTitle?: string;
  timestamp: string;
  notes: string;
  photoUrl?: string; // Base64 data URL
  tags: string[];
  environment?: string;
  weatherObservation?: string;
  audioNoteText?: string;
}

export interface StoredPreference {
  key: string;
  value: any;
}

export class FieldQuestDatabase extends Dexie {
  adventures!: Table<AdventureSessionRecord, string>;
  journalEntries!: Table<JournalEntry, string>;
  preferences!: Table<StoredPreference, string>;

  constructor() {
    super('FieldQuestDB');
    this.version(1).stores({
      adventures: 'id, createdAt, status, durationMinutes, environment',
      journalEntries: 'id, adventureId, missionId, timestamp',
      preferences: 'key',
    });
  }
}

export const db = new FieldQuestDatabase();

// Helper database functions
export async function saveAdventureSession(session: AdventureSessionRecord): Promise<void> {
  await db.adventures.put(session);
}

export async function getAdventureById(id: string): Promise<AdventureSessionRecord | undefined> {
  return await db.adventures.get(id);
}

export async function getAllAdventures(): Promise<AdventureSessionRecord[]> {
  return await db.adventures.orderBy('createdAt').reverse().toArray();
}

export async function updateMissionInSession(
  adventureId: string,
  updatedMission: NatureMission
): Promise<void> {
  const session = await db.adventures.get(adventureId);
  if (!session) return;

  const missionIndex = session.missions.findIndex(m => m.id === updatedMission.id);
  if (missionIndex >= 0) {
    session.missions[missionIndex] = updatedMission;
    await db.adventures.put(session);
  }
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journalEntries.put(entry);
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  return await db.journalEntries.orderBy('timestamp').reverse().toArray();
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await db.journalEntries.delete(id);
}

export async function deleteAdventure(id: string): Promise<void> {
  await db.transaction('rw', db.adventures, db.journalEntries, async () => {
    await db.adventures.delete(id);
    await db.journalEntries.where('adventureId').equals(id).delete();
  });
}

export async function clearAllLocalData(): Promise<void> {
  await db.transaction('rw', db.adventures, db.journalEntries, db.preferences, async () => {
    await db.adventures.clear();
    await db.journalEntries.clear();
    await db.preferences.clear();
  });
}

export async function exportAllDataAsJSON(): Promise<string> {
  const adventures = await db.adventures.toArray();
  const journalEntries = await db.journalEntries.toArray();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    totalAdventures: adventures.length,
    totalJournalEntries: journalEntries.length,
    adventures,
    journalEntries,
  };
  return JSON.stringify(exportPayload, null, 2);
}
