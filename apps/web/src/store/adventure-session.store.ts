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
  updateCurrentMissionDraft: (notes?: string, photoUrl?: string) => void;
  goToMission: (index: number, currentDraftNotes?: string, currentDraftPhoto?: string) => void;
  completeCurrentMission: (notes?: string, photoUrl?: string) => Promise<void>;
  skipCurrentMission: () => Promise<void>;
  abandonSession: () => Promise<void>;
  finishSession: (overallReflection?: string) => Promise<void>;
  restoreSession: (session: AdventureSessionRecord) => Promise<void>;
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

  updateCurrentMissionDraft: (notes?: string, photoUrl?: string) => {
    const { session, currentMissionIndex } = get();
    if (!session || !session.missions[currentMissionIndex]) return;
    const newMissions = [...session.missions];
    newMissions[currentMissionIndex] = {
      ...newMissions[currentMissionIndex],
      userNotes: notes !== undefined ? notes : newMissions[currentMissionIndex].userNotes,
      userPhotoUrl: photoUrl !== undefined ? photoUrl : newMissions[currentMissionIndex].userPhotoUrl,
    };
    set({ session: { ...session, missions: newMissions } });
  },

  goToMission: (index: number, currentDraftNotes?: string, currentDraftPhoto?: string) => {
    const { session, currentMissionIndex } = get();
    if (!session || index < 0 || index >= session.missions.length) return;
    const newMissions = [...session.missions];
    if (newMissions[currentMissionIndex]) {
      newMissions[currentMissionIndex] = {
        ...newMissions[currentMissionIndex],
        userNotes: currentDraftNotes !== undefined ? currentDraftNotes : newMissions[currentMissionIndex].userNotes,
        userPhotoUrl: currentDraftPhoto !== undefined ? currentDraftPhoto : newMissions[currentMissionIndex].userPhotoUrl,
      };
    }
    set({ session: { ...session, missions: newMissions }, currentMissionIndex: index });
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

  restoreSession: async (session: AdventureSessionRecord) => {
    // Find the first active or pending mission to resume smoothly
    const activeIdx = session.missions.findIndex(m => m.status === 'active');
    const pendingIdx = session.missions.findIndex(m => m.status === 'pending');
    const targetIdx = activeIdx >= 0 ? activeIdx : (pendingIdx >= 0 ? pendingIdx : 0);

    const updatedMissions = session.missions.map((m, idx) => ({
      ...m,
      status: idx === targetIdx && m.status !== 'completed' ? ('active' as const) : m.status,
    }));

    const resumedSession: AdventureSessionRecord = {
      ...session,
      missions: updatedMissions,
      status: 'in_progress',
    };

    set({
      session: resumedSession,
      currentMissionIndex: targetIdx,
      elapsedSeconds: (session.totalMinutesSpent || 0) * 60,
      isPaused: false,
      isScreenDown: false,
    });

    await saveAdventureSession(resumedSession);
  },
}));
