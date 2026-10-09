import { create } from 'zustand';
import { AdventureSessionRecord, NatureMission } from '../types/index.js';
import { saveAdventureSession, updateMissionInSession } from '../lib/db.js';

interface AdventureSessionState {
  session: AdventureSessionRecord | null;
  currentMissionIndex: number;
  elapsedSeconds: number;
  isPaused: boolean;
  isScreenDown: boolean;

  // Actions
  startSession: (session: AdventureSessionRecord) => Promise<void>;
  tickSecond: () => void;
  togglePause: () => void;
  setScreenDown: (enabled: boolean) => void;
  goToMission: (index: number) => void;
  completeCurrentMission: (notes?: string, photoUrl?: string) => Promise<void>;
  skipCurrentMission: () => Promise<void>;
  abandonSession: () => Promise<void>;
  finishSession: (overallReflection?: string) => Promise<void>;
  restoreSession: (session: AdventureSessionRecord) => void;
}

export const useAdventureSessionStore = create<AdventureSessionState>((set, get) => ({
  session: null,
  currentMissionIndex: 0,
  elapsedSeconds: 0,
  isPaused: false,
  isScreenDown: false,

  startSession: async (session: AdventureSessionRecord) => {
    // Mark first mission as active
    const updatedMissions = session.missions.map((m, idx) => ({
      ...m,
      status: (idx === 0 ? 'active' : 'pending') as NatureMission['status'],
    }));

    const initializedSession: AdventureSessionRecord = {
      ...session,
      missions: updatedMissions,
      status: 'in_progress',
    };

    set({
      session: initializedSession,
      currentMissionIndex: 0,
      elapsedSeconds: 0,
      isPaused: false,
      isScreenDown: false,
    });

    await saveAdventureSession(initializedSession);
  },

  tickSecond: () => {
    const { session, isPaused } = get();
    if (!session || session.status !== 'in_progress' || isPaused) return;

    set(state => ({
      elapsedSeconds: state.elapsedSeconds + 1,
    }));
  },

  togglePause: () => {
    set(state => ({ isPaused: !state.isPaused }));
  },

  setScreenDown: (enabled: boolean) => {
    set({ isScreenDown: enabled });
  },

  goToMission: (index: number) => {
    const { session } = get();
    if (!session || index < 0 || index >= session.missions.length) return;
    set({ currentMissionIndex: index });
  },

  completeCurrentMission: async (notes?: string, photoUrl?: string) => {
    const { session, currentMissionIndex, elapsedSeconds } = get();
    if (!session) return;

    const currentMission = session.missions[currentMissionIndex];
    if (!currentMission) return;

    const completedMission: NatureMission = {
      ...currentMission,
      status: 'completed',
      userNotes: notes || currentMission.userNotes,
      userPhotoUrl: photoUrl || currentMission.userPhotoUrl,
      completedAt: new Date().toISOString(),
    };

    const newMissions = [...session.missions];
    newMissions[currentMissionIndex] = completedMission;

    // Advance to next mission if available
    const nextIndex = currentMissionIndex + 1;
    const hasNext = nextIndex < newMissions.length;

    if (hasNext && newMissions[nextIndex].status === 'pending') {
      newMissions[nextIndex].status = 'active';
    }

    const updatedSession: AdventureSessionRecord = {
      ...session,
      missions: newMissions,
      totalMinutesSpent: Math.ceil(elapsedSeconds / 60),
    };

    set({
      session: updatedSession,
      currentMissionIndex: hasNext ? nextIndex : currentMissionIndex,
    });

    await updateMissionInSession(session.id, completedMission);
    await saveAdventureSession(updatedSession);
  },

  skipCurrentMission: async () => {
    const { session, currentMissionIndex } = get();
    if (!session) return;

    const currentMission = session.missions[currentMissionIndex];
    if (!currentMission) return;

    const skippedMission: NatureMission = {
      ...currentMission,
      status: 'skipped',
    };

    const newMissions = [...session.missions];
    newMissions[currentMissionIndex] = skippedMission;

    const nextIndex = currentMissionIndex + 1;
    const hasNext = nextIndex < newMissions.length;

    if (hasNext && newMissions[nextIndex].status === 'pending') {
      newMissions[nextIndex].status = 'active';
    }

    const updatedSession: AdventureSessionRecord = {
      ...session,
      missions: newMissions,
    };

    set({
      session: updatedSession,
      currentMissionIndex: hasNext ? nextIndex : currentMissionIndex,
    });

    await updateMissionInSession(session.id, skippedMission);
    await saveAdventureSession(updatedSession);
  },

  abandonSession: async () => {
    const { session, elapsedSeconds } = get();
    if (!session) return;

    const abandonedSession: AdventureSessionRecord = {
      ...session,
      status: 'abandoned',
      totalMinutesSpent: Math.ceil(elapsedSeconds / 60),
      completedAt: new Date().toISOString(),
    };

    set({ session: null, isScreenDown: false });
    await saveAdventureSession(abandonedSession);
  },

  finishSession: async (overallReflection?: string) => {
    const { session, elapsedSeconds } = get();
    if (!session) return;

    const finishedSession: AdventureSessionRecord = {
      ...session,
      status: 'completed',
      totalMinutesSpent: Math.ceil(elapsedSeconds / 60),
      completedAt: new Date().toISOString(),
      overallReflection,
    };

    set({ session: finishedSession, isScreenDown: false });
    await saveAdventureSession(finishedSession);
  },

  restoreSession: (session: AdventureSessionRecord) => {
    set({
      session,
      currentMissionIndex: 0,
      elapsedSeconds: session.totalMinutesSpent * 60,
      isPaused: true,
      isScreenDown: false,
    });
  },
}));
