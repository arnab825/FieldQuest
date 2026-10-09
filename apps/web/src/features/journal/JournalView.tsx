import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  Compass,
  Download,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Upload,
  Image,
  Feather,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowLeft,
  Check,
  Play,
  RotateCcw,
  Edit3,
  Save,
} from 'lucide-react';
import {
  getAllAdventures,
  getJournalEntries,
  deleteAdventure,
  deleteJournalEntry,
  updateJournalEntryPhoto,
  exportAllDataAsJSON,
  importDataFromJSON,
  clearAllLocalData,
  saveAdventureSession,
  addJournalEntry,
  JournalEntry,
} from '../../lib/db.js';
import { AdventureSessionRecord, NatureMission } from '../../types/index.js';
import { NaturalistNoteView } from '../../components/NaturalistNoteView.js';
import { useAdventureSessionStore } from '../../store/adventure-session.store.js';
import {
  generateBotanicalSketch,
  getMatchingBotanicalPlate,
  BOTANICAL_FIELD_PLATES,
} from '../../lib/sketch-generator.js';

export const JournalView: React.FC = () => {
  const navigate = useNavigate();
  const restoreSession = useAdventureSessionStore(s => s.restoreSession);
  const startSession = useAdventureSessionStore(s => s.startSession);

  const [adventures, setAdventures] = useState<AdventureSessionRecord[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'adventures' | 'entries' | 'plates'>('adventures');
  const [expandedAdventureId, setExpandedAdventureId] = useState<string | null>(null);
  const [editingMissionKey, setEditingMissionKey] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState<string>('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [platePickerEntryId, setPlatePickerEntryId] = useState<string | null>(null);
  const [generatingSketchId, setGeneratingSketchId] = useState<string | null>(null);

  const loadData = async () => {
    const advList = await getAllAdventures();
    const entList = await getJournalEntries();
    setAdventures(advList);
    setEntries(entList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalOutdoorMinutes = adventures.reduce(
    (sum, a) => sum + (a.totalMinutesSpent || 0),
    0
  );

  const totalCompletedMissions = adventures.reduce(
    (sum, a) => sum + a.missions.filter(m => m.status === 'completed').length,
    0
  );

  const handleExport = async () => {
    const jsonStr = await exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fieldquest-journal-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await importDataFromJSON(text);
      alert(`Successfully restored ${res.adventuresCount} adventures and ${res.entriesCount} observations into your local journal!`);
      await loadData();
    } catch {
      alert('Failed to parse backup JSON file. Please ensure it is a valid FieldQuest export.');
    }
  };

  const handleDeleteAdventure = async (id: string) => {
    if (window.confirm('Delete this adventure from your local journal?')) {
      await deleteAdventure(id);
      await loadData();
    }
  };

  const handleGenerateSketchForEntry = async (entry: JournalEntry) => {
    try {
      setGeneratingSketchId(entry.id);
      const photoDataUrl = await generateBotanicalSketch(
        entry.notes,
        entry.missionTitle,
        entry.environment,
        entry.photoUrl
      );
      await updateJournalEntryPhoto(entry.id, photoDataUrl);
      await loadData();
    } catch (err: any) {
      console.warn('Fallback to matched plate on error:', err);
      const fallbackPlate = getMatchingBotanicalPlate(entry.notes, entry.missionTitle, entry.environment);
      await updateJournalEntryPhoto(entry.id, fallbackPlate.src);
      await loadData();
    } finally {
      setGeneratingSketchId(null);
    }
  };

  const handleAttachPlate = async (entryId: string, plateSrc: string) => {
    await updateJournalEntryPhoto(entryId, plateSrc);
    setPlatePickerEntryId(null);
    await loadData();
  };

  const handleResumeAdventure = async (adv: AdventureSessionRecord) => {
    await restoreSession(adv);
    navigate('/adventure');
  };

  const handleDoItAgain = async (adv: AdventureSessionRecord) => {
    const resetMissions = adv.missions.map((m, idx) => ({
      ...m,
      status: (idx === 0 ? 'active' : 'pending') as NatureMission['status'],
      userNotes: undefined,
      userPhotoUrl: undefined,
      completedAt: undefined,
    }));

    await startSession({
      id: `adv-${Date.now()}`,
      createdAt: new Date().toISOString(),
      durationMinutes: adv.durationMinutes,
      environment: adv.environment,
      difficulty: adv.difficulty,
      language: adv.language || 'en',
      interests: adv.interests,
      accessibleMobility: adv.accessibleMobility || false,
      missions: resetMissions,
      status: 'in_progress',
      totalMinutesSpent: 0,
      providerUsed: adv.providerUsed,
      modelUsed: adv.modelUsed,
    });

    navigate('/adventure');
  };

  const handleStartEditMission = (advId: string, missionId: string, initialNotes: string = '') => {
    setEditingMissionKey(`${advId}-${missionId}`);
    setEditingNotesText(initialNotes);
  };

  const handleCancelEditMission = () => {
    setEditingMissionKey(null);
    setEditingNotesText('');
  };

  const handleSaveMissionNotes = async (adv: AdventureSessionRecord, missionId: string) => {
    const updatedMissions = adv.missions.map(m => {
      if (m.id === missionId) {
        return {
          ...m,
          userNotes: editingNotesText,
          status: m.status === 'pending' ? ('completed' as const) : m.status,
          completedAt: m.completedAt || new Date().toISOString(),
        };
      }
      return m;
    });

    const updatedAdv: AdventureSessionRecord = {
      ...adv,
      missions: updatedMissions,
    };

    await saveAdventureSession(updatedAdv);

    // Also persist to individual journal entry so it appears in Field Notes & Observations tab immediately
    const targetMission = updatedMissions.find(m => m.id === missionId);
    if (targetMission) {
      await addJournalEntry({
        id: `journal-obs-${targetMission.id}`,
        adventureId: adv.id,
        missionId: targetMission.id,
        missionTitle: targetMission.title,
        timestamp: new Date().toISOString(),
        notes: editingNotesText,
        photoUrl: targetMission.userPhotoUrl,
        tags: [adv.environment, ...adv.interests],
        environment: adv.environment,
      });
    }

    setEditingMissionKey(null);
    setEditingNotesText('');
    await loadData();
  };

  const handleViewInBotanicalPlates = (entry: JournalEntry) => {
    const plateByUrl = BOTANICAL_FIELD_PLATES.find(p => p.src === entry.photoUrl);
    const targetPlate = plateByUrl || getMatchingBotanicalPlate(entry.notes, entry.missionTitle, entry.environment);
    setActiveTab('plates');
    setSelectedPlateId(targetPlate.id);
    setTimeout(() => {
      const el = document.getElementById(targetPlate.id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  const handleRemovePhoto = async (id: string) => {
    await updateJournalEntryPhoto(id, undefined);
    await loadData();
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Delete this observation note?')) {
      await deleteJournalEntry(id);
      await loadData();
    }
  };

  const handleClearAll = async () => {
    await clearAllLocalData();
    setConfirmClear(false);
    await loadData();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-deep/10 text-forest-deep text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-moss-green" />
            <span>Local Nature Journal</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-forest-deep">
            Exploration History & Field Notes
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            All adventures, observations, and photos are stored securely inside your browser's IndexedDB.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="px-3.5 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-semibold text-forest-deep flex items-center gap-2 transition-colors cursor-pointer shadow-xs">
            <Upload className="w-4 h-4 text-moss-green" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-semibold text-forest-deep flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            title="Export all data to a local JSON file"
          >
            <Download className="w-4 h-4 text-moss-green" />
            <span>Export JSON</span>
          </button>

          <Link
            to="/setup"
            className="px-3.5 py-2 rounded-xl bg-forest-deep text-paper-white hover:bg-forest-dark text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Compass className="w-4 h-4 text-leaf-accent" />
            <span>New Adventure</span>
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-paper-white rounded-2xl border border-border-subtle p-5 shadow-xs">
          <div className="flex items-center gap-2 text-moss-green text-xs font-semibold mb-1">
            <Compass className="w-4 h-4" />
            <span>Total Adventures</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-forest-deep">
            {adventures.length}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Stored locally in IndexedDB
          </p>
        </div>

        <div className="bg-paper-white rounded-2xl border border-border-subtle p-5 shadow-xs">
          <div className="flex items-center gap-2 text-moss-green text-xs font-semibold mb-1">
            <Clock className="w-4 h-4" />
            <span>Outdoor Observation</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-forest-deep">
            {totalOutdoorMinutes} <span className="text-sm font-sans font-normal">mins</span>
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Self-reported outdoor tracking
          </p>
        </div>

        <div className="bg-paper-white rounded-2xl border border-border-subtle p-5 shadow-xs">
          <div className="flex items-center gap-2 text-moss-green text-xs font-semibold mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed Quests</span>
          </div>
          <div className="font-editorial text-3xl font-bold text-forest-deep">
            {totalCompletedMissions}
          </div>
          <p className="text-[11px] text-text-muted mt-1">
            Individual observational missions
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border-subtle mb-6">
        <button
          onClick={() => setActiveTab('adventures')}
          className={`py-3 px-4 font-editorial text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'adventures'
              ? 'border-forest-deep text-forest-deep'
              : 'border-transparent text-text-muted hover:text-forest-deep'
          }`}
        >
          Adventures ({adventures.length})
        </button>

        <button
          onClick={() => setActiveTab('entries')}
          className={`py-3 px-4 font-editorial text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'entries'
              ? 'border-forest-deep text-forest-deep'
              : 'border-transparent text-text-muted hover:text-forest-deep'
          }`}
        >
          Field Notes & Observations ({entries.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('plates');
            setSelectedPlateId(null);
          }}
          className={`py-3 px-4 font-editorial text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'plates'
              ? 'border-forest-deep text-forest-deep'
              : 'border-transparent text-text-muted hover:text-forest-deep'
          }`}
        >
          <Layers className="w-4 h-4 text-moss-green" />
          <span>Botanical Field Plates ({BOTANICAL_FIELD_PLATES.length})</span>
        </button>
      </div>

      {/* Content for Adventures */}
      {activeTab === 'adventures' && (
        <div className="space-y-4">
          {adventures.length === 0 ? (
            <div className="bg-paper-white rounded-2xl border border-border-subtle p-8 text-center">
              <Compass className="w-10 h-10 text-moss-green mx-auto mb-3" />
              <h3 className="font-editorial text-lg font-bold text-forest-deep mb-1">
                No Adventures Recorded Yet
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Start your first outdoor exploration to populate your nature journal.
              </p>
              <Link
                to="/setup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold cursor-pointer"
              >
                Begin First Adventure
              </Link>
            </div>
          ) : (
            adventures.map(adv => {
              const isExpanded = expandedAdventureId === adv.id;
              const dateStr = new Date(adv.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={adv.id}
                  className="bg-paper-white rounded-2xl border border-border-subtle p-5 shadow-xs transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-editorial text-lg font-bold text-forest-deep">
                          {adv.environment.toUpperCase()} • {adv.durationMinutes}m
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            adv.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {adv.status === 'completed' ? 'Completed' : 'Incomplete'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep">
                          {adv.providerUsed === 'ollama' ? 'Ollama AI' : 'Demo Engine'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {dateStr}
                        </span>
                        <span>•</span>
                        <span>
                          {adv.missions.filter(m => m.status === 'completed').length} / {adv.missions.length} missions
                        </span>
                        <span>•</span>
                        <span>{adv.totalMinutesSpent} min spent</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      {adv.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => handleResumeAdventure(adv)}
                          className="px-3.5 py-1.5 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                          title="Resume this adventure and continue incomplete missions"
                        >
                          <Play className="w-3.5 h-3.5 text-leaf-accent fill-leaf-accent" />
                          <span>Resume Adventure</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDoItAgain(adv)}
                        className="px-3 py-1.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-forest-deep text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Start this adventure again from the beginning"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-moss-green" />
                        <span>Do It Again</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedAdventureId(isExpanded ? null : adv.id)}
                        className="p-2 rounded-lg border border-border-subtle hover:bg-parchment-warm text-xs flex items-center gap-1 text-forest-deep cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAdventure(adv.id)}
                        className="p-2 rounded-lg text-text-muted hover:text-red-700 transition-colors cursor-pointer"
                        title="Delete adventure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Mission Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border-subtle space-y-3">
                      {adv.overallReflection && (
                        <div className="p-3 rounded-xl bg-parchment-warm text-xs text-forest-deep border border-border-subtle">
                          <span className="font-semibold block mb-0.5">
                            Overall Reflection:
                          </span>
                          <p className="italic">{adv.overallReflection}</p>
                        </div>
                      )}

                      <h4 className="text-xs font-semibold text-moss-green uppercase tracking-wider">
                        Missions Included
                      </h4>

                      <div className="space-y-2.5">
                        {adv.missions.map((m, idx) => {
                          const isEditingThis = editingMissionKey === `${adv.id}-${m.id}`;

                          return (
                            <div
                              key={m.id || idx}
                              className="p-3.5 rounded-xl border border-border-subtle bg-paper-white text-xs space-y-2 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-forest-deep text-sm">
                                      {idx + 1}. {m.title}
                                    </span>
                                    <span
                                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                                        m.status === 'completed'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : m.status === 'active'
                                          ? 'bg-forest-deep/15 text-forest-deep font-bold'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}
                                    >
                                      {m.status}
                                    </span>
                                  </div>
                                  <p className="text-forest-deep/80 text-xs">{m.objective}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {!isEditingThis && (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditMission(adv.id, m.id, m.userNotes || '')}
                                      className="px-2.5 py-1 rounded-lg border border-border-subtle hover:bg-parchment-warm text-[11px] font-semibold text-forest-deep flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Edit or add notes for this mission"
                                    >
                                      <Edit3 className="w-3 h-3 text-moss-green" />
                                      <span>{m.userNotes ? 'Edit Notes' : '+ Add Notes'}</span>
                                    </button>
                                  )}
                                  {m.userPhotoUrl && (
                                    <img
                                      src={m.userPhotoUrl}
                                      alt="Observation"
                                      onError={(e) => {
                                        const fallback = getMatchingBotanicalPlate(m.userNotes, m.title, adv.environment);
                                        e.currentTarget.src = fallback.src;
                                      }}
                                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border-subtle shadow-2xs"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Inline Notes Editor */}
                              {isEditingThis ? (
                                <div className="p-3 rounded-xl bg-parchment-warm/70 border border-forest-deep/30 space-y-2 animate-in fade-in duration-150">
                                  <label className="text-[11px] font-bold text-forest-deep block">
                                    Edit Field Notes for {m.title}:
                                  </label>
                                  <textarea
                                    value={editingNotesText}
                                    onChange={(e) => setEditingNotesText(e.target.value)}
                                    placeholder="Write your observation details, leaf venation, margins, or acoustic findings..."
                                    className="w-full min-h-[90px] p-2.5 text-xs rounded-lg border border-border-subtle bg-paper-white text-forest-deep focus:outline-none focus:border-forest-deep focus:ring-1 focus:ring-forest-deep"
                                  />
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={handleCancelEditMission}
                                      className="px-3 py-1 rounded-lg border border-border-subtle bg-paper-white text-xs font-semibold text-text-muted hover:text-forest-deep cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveMissionNotes(adv, m.id)}
                                      className="px-3.5 py-1 rounded-lg bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      <Save className="w-3.5 h-3.5 text-leaf-accent" />
                                      <span>Save Notes</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                m.userNotes && (
                                  <div className="pt-1">
                                    <NaturalistNoteView
                                      content={m.userNotes}
                                      variant="inline"
                                      maxInitialLength={180}
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content for Field Notes & Observations */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <div className="bg-paper-white rounded-2xl border border-border-subtle p-8 text-center">
              <BookOpen className="w-10 h-10 text-moss-green mx-auto mb-3" />
              <h3 className="font-editorial text-lg font-bold text-forest-deep mb-1">
                No Observations Recorded
              </h3>
              <p className="text-xs text-text-muted">
                Capture notes and photographs during your adventures to see them logged here.
              </p>
            </div>
          ) : (
            entries.map(ent => {
              const matchedPlate = getMatchingBotanicalPlate(ent.notes, ent.missionTitle, ent.environment);
              const plateByUrl = BOTANICAL_FIELD_PLATES.find(p => p.src === ent.photoUrl);
              const activeRefPlate = plateByUrl || matchedPlate;
              const isPickingPlate = platePickerEntryId === ent.id;

              return (
                <div
                  key={ent.id}
                  className="bg-paper-white rounded-2xl border border-border-subtle p-6 shadow-xs hover:shadow-md transition-shadow space-y-4 border-l-4 border-l-forest-deep relative overflow-hidden"
                >
                  {/* Header with Title & Action */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-subtle/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-forest-deep/10 text-forest-deep flex items-center justify-center shrink-0">
                        <Feather className="w-4 h-4 text-moss-green" />
                      </div>
                      <div>
                        <h4 className="font-editorial text-base sm:text-lg font-bold text-forest-deep">
                          {ent.missionTitle || 'Field Observation'}
                        </h4>
                        <span className="text-[11px] font-medium text-text-muted">
                          Botanical Specimen & Sensory Field Log
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteEntry(ent.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Formatted Naturalist Note */}
                  <div className="py-1">
                    <NaturalistNoteView
                      content={ent.notes}
                      variant="card"
                      maxInitialLength={320}
                    />
                  </div>

                  {/* Specimen Photo or Generate Sketch Option */}
                  {ent.photoUrl ? (
                    <div className="pt-2">
                      <div className="rounded-xl overflow-hidden border border-border-subtle max-w-lg bg-parchment-warm shadow-xs">
                        <img
                          src={ent.photoUrl}
                          alt="Observation specimen illustration or photo"
                          onError={(e) => {
                            // Seamless automatic recovery from broken URLs to authentic botanical plate
                            const fallback = getMatchingBotanicalPlate(ent.notes, ent.missionTitle, ent.environment);
                            e.currentTarget.src = fallback.src;
                            updateJournalEntryPhoto(ent.id, fallback.src);
                          }}
                          className="max-h-80 w-full object-cover"
                        />
                        <div className="p-2.5 bg-parchment-warm/95 text-[11px] text-text-muted flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle/60">
                          <div className="flex items-center gap-1.5 font-medium text-forest-deep">
                            <Image className="w-3.5 h-3.5 text-moss-green" />
                            <span>Botanical specimen plate / sketch</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewInBotanicalPlates(ent)}
                              className="text-forest-deep hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-forest-deep/5 hover:bg-forest-deep/10 px-2 py-0.5 rounded-md"
                              title="Jump directly to Botanical Field Plates"
                            >
                              <BookOpen className="w-3 h-3 text-moss-green" />
                              <span>View in Plates</span>
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setPlatePickerEntryId(isPickingPlate ? null : ent.id)}
                              className="text-forest-deep hover:underline font-semibold cursor-pointer"
                            >
                              {isPickingPlate ? 'Close Picker' : 'Change Plate'}
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              disabled={generatingSketchId === ent.id}
                              onClick={() => handleGenerateSketchForEntry(ent)}
                              className="text-forest-deep hover:underline font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {generatingSketchId === ent.id ? 'Re-illustrating...' : 'Re-illustrate'}
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(ent.id)}
                              className="text-red-700 hover:underline font-semibold cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={generatingSketchId === ent.id}
                        onClick={() => handleGenerateSketchForEntry(ent)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-forest-deep text-paper-white hover:bg-forest-dark text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-leaf-accent ${generatingSketchId === ent.id ? 'animate-spin' : ''}`} />
                        <span>
                          {generatingSketchId === ent.id
                            ? 'Illustrating observation...'
                            : '🎨 Illustrate Observation'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlatePickerEntryId(isPickingPlate ? null : ent.id)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-forest-deep/5 hover:bg-forest-deep/10 text-forest-deep border border-border-subtle text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Image className="w-3.5 h-3.5 text-moss-green" />
                        <span>🌿 Attach Reference Plate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewInBotanicalPlates(ent)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-muted hover:text-forest-deep hover:bg-parchment-warm transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-moss-green" />
                        <span>Compare with {matchedPlate.plateNumber} →</span>
                      </button>
                    </div>
                  )}

                  {/* Inline Reference Plate Selector */}
                  {isPickingPlate && (
                    <div className="p-4 rounded-2xl bg-parchment-warm/90 border border-border-subtle space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-moss-green" />
                          <span className="font-editorial text-sm font-bold text-forest-deep">
                            Attach Authentic Botanical Reference Plate
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPlatePickerEntryId(null)}
                          className="text-xs text-text-muted hover:text-forest-deep cursor-pointer font-semibold"
                        >
                          Cancel
                        </button>
                      </div>

                      <p className="text-[11px] text-text-muted">
                        Select a curated high-resolution scientific plate to anchor this field observation:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {BOTANICAL_FIELD_PLATES.map(plate => {
                          const isMatched = matchedPlate.id === plate.id;
                          const isCurrent = ent.photoUrl === plate.src;

                          return (
                            <div
                              key={plate.id}
                              className={`p-3 rounded-xl border bg-paper-white flex flex-col justify-between gap-2.5 transition-all shadow-xs ${
                                isCurrent
                                  ? 'border-moss-green ring-2 ring-moss-green/40'
                                  : isMatched
                                  ? 'border-leaf-accent/80 ring-1 ring-leaf-accent/30'
                                  : 'border-border-subtle hover:border-forest-deep/30'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="h-28 w-full rounded-lg overflow-hidden bg-parchment-warm border border-border-subtle/50">
                                  <img
                                    src={plate.src}
                                    alt={plate.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-moss-green uppercase">
                                    {plate.plateNumber}
                                  </span>
                                  {isMatched && (
                                    <span className="text-[9px] bg-forest-deep/10 text-forest-deep font-semibold px-1.5 py-0.5 rounded-full">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-editorial text-xs font-bold text-forest-deep line-clamp-1">
                                  {plate.title}
                                </h5>
                                <p className="text-[10px] text-text-muted line-clamp-2">
                                  {plate.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAttachPlate(ent.id, plate.src)}
                                  className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer text-center flex items-center justify-center gap-1 ${
                                    isCurrent
                                      ? 'bg-moss-green text-paper-white'
                                      : 'bg-forest-deep text-paper-white hover:bg-forest-dark'
                                  }`}
                                >
                                  {isCurrent && <Check className="w-3 h-3" />}
                                  <span>{isCurrent ? 'Attached' : 'Attach Plate'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('plates');
                                    setSelectedPlateId(plate.id);
                                    setTimeout(() => {
                                      const el = document.getElementById(plate.id);
                                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 120);
                                  }}
                                  className="p-1.5 rounded-lg border border-border-subtle hover:bg-parchment-warm text-text-muted hover:text-forest-deep cursor-pointer"
                                  title="View Full Plate in Plates tab"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border-subtle text-xs text-text-muted">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-moss-green" />
                        {new Date(ent.timestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {ent.environment && (
                        <span className="px-2.5 py-0.5 rounded-full bg-parchment-warm text-forest-deep font-medium border border-border-subtle text-[11px] capitalize">
                          🌿 {ent.environment}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleViewInBotanicalPlates(ent)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-forest-deep/5 hover:bg-forest-deep/10 text-forest-deep font-semibold text-[11px] border border-border-subtle transition-colors cursor-pointer"
                        title={`Jump to botanical reference ${activeRefPlate.plateNumber}`}
                      >
                        <BookOpen className="w-3 h-3 text-moss-green" />
                        <span>Reference: {activeRefPlate.plateNumber} ({activeRefPlate.shortName}) →</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-text-muted">
                      {ent.notes.split(/\s+/).filter(Boolean).length} words recorded
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content for Botanical Field Plates */}
      {activeTab === 'plates' && (
        <div className="space-y-6">
          {/* Active Navigation / Focus Bar */}
          {selectedPlateId && (
            <div className="p-3.5 rounded-2xl bg-forest-deep text-paper-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-leaf-accent shrink-0" />
                <span className="text-xs">
                  Viewing focused scientific reference plate for your observation note.
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPlateId(null);
                  setActiveTab('entries');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-paper-white text-forest-deep text-xs font-semibold hover:bg-parchment-warm transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-moss-green" />
                <span>Return to Field Notes</span>
              </button>
            </div>
          )}

          {/* Quick Jump Bar across all plates */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[11px] font-semibold text-text-muted shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-moss-green" />
              <span>Plates:</span>
            </span>
            {BOTANICAL_FIELD_PLATES.map(plate => {
              const isSelected = selectedPlateId === plate.id;
              return (
                <button
                  key={plate.id}
                  onClick={() => {
                    setSelectedPlateId(plate.id);
                    const el = document.getElementById(plate.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-forest-deep text-paper-white shadow-xs'
                      : 'bg-paper-white text-forest-deep border border-border-subtle hover:bg-parchment-warm'
                  }`}
                >
                  {plate.plateNumber}: {plate.shortName}
                </button>
              );
            })}
          </div>

          {/* Render All 5 Botanical Field Plates */}
          <div className="space-y-8">
            {BOTANICAL_FIELD_PLATES.map((plate) => {
              const isSelected = selectedPlateId === plate.id;

              return (
                <div
                  key={plate.id}
                  id={plate.id}
                  className={`bg-paper-white rounded-3xl border p-6 shadow-xs space-y-4 transition-all scroll-mt-6 ${
                    isSelected
                      ? 'border-moss-green ring-4 ring-moss-green/20 shadow-md'
                      : 'border-border-subtle'
                  }`}
                >
                  {/* Plate Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green block">
                          Field Identification {plate.plateNumber}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-forest-deep text-paper-white">
                            Active Reference
                          </span>
                        )}
                      </div>
                      <h3 className="font-editorial text-2xl font-bold text-forest-deep">
                        {plate.title}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-forest-deep/10 text-forest-deep self-start sm:self-auto">
                      {plate.subtitle}
                    </span>
                  </div>

                  {/* Plate Image */}
                  <div className="rounded-2xl overflow-hidden border border-border-subtle bg-parchment-warm relative group">
                    <img
                      src={plate.src}
                      alt={plate.title}
                      className="w-full h-auto object-cover max-h-[520px] transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                  </div>

                  {/* Scientific Morphological Diagnostic Points */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {plate.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-parchment-warm/60 border border-border-subtle space-y-1"
                      >
                        <span className="font-bold text-forest-deep block">
                          {detail.title}
                        </span>
                        <p className="text-text-muted leading-relaxed">
                          {detail.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Plate Footer / Jump back */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-text-muted border-t border-border-subtle/50">
                    <p className="italic text-[11px]">
                      {plate.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('entries')}
                      className="inline-flex items-center gap-1.5 font-semibold text-forest-deep hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-moss-green" />
                      <span>Back to Observation Notes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Storage and Data Wipe Safety Section */}
      <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-text-muted">
        <div>
          <span className="font-semibold text-forest-deep">
            Local Storage Notice:
          </span>{' '}
          Data is strictly stored on this device. Use "Export JSON" to back up your journal.
        </div>

        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="text-xs text-red-700 hover:underline cursor-pointer"
          >
            Wipe All Local Data
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-red-700 font-semibold">
              Clear all data?
            </span>
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded bg-red-800 text-white font-medium hover:bg-red-900 cursor-pointer"
            >
              Confirm Wipe
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="px-2 py-1 text-text-muted underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
