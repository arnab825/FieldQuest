import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import {
  getAllAdventures,
  getJournalEntries,
  deleteAdventure,
  deleteJournalEntry,
  exportAllDataAsJSON,
  clearAllLocalData,
  JournalEntry,
} from '../../lib/db.js';
import { AdventureSessionRecord } from '../../types/index.js';

export const JournalView: React.FC = () => {
  const [adventures, setAdventures] = useState<AdventureSessionRecord[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'adventures' | 'entries'>('adventures');
  const [expandedAdventureId, setExpandedAdventureId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

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

  const handleDeleteAdventure = async (id: string) => {
    if (window.confirm('Delete this adventure from your local journal?')) {
      await deleteAdventure(id);
      await loadData();
    }
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
        <div className="flex items-center gap-2">
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

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setExpandedAdventureId(isExpanded ? null : adv.id)}
                        className="p-2 rounded-lg border border-border-subtle hover:bg-parchment-warm text-xs flex items-center gap-1 text-forest-deep cursor-pointer"
                      >
                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
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

                      <div className="space-y-2">
                        {adv.missions.map((m, idx) => (
                          <div
                            key={m.id || idx}
                            className="p-3 rounded-xl border border-border-subtle bg-paper-white text-xs flex items-start justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-forest-deep">
                                  {idx + 1}. {m.title}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                                    m.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {m.status}
                                </span>
                              </div>
                              <p className="text-forest-deep/80">{m.objective}</p>
                              {m.userNotes && (
                                <p className="mt-1 text-emerald-900 font-medium">
                                  📝 {m.userNotes}
                                </p>
                              )}
                            </div>
                            {m.userPhotoUrl && (
                              <img
                                src={m.userPhotoUrl}
                                alt="Observation"
                                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border-subtle"
                              />
                            )}
                          </div>
                        ))}
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
            entries.map(ent => (
              <div
                key={ent.id}
                className="bg-paper-white rounded-2xl border border-border-subtle p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {ent.missionTitle && (
                      <span className="text-xs font-semibold text-moss-green block mb-1">
                        {ent.missionTitle}
                      </span>
                    )}
                    <p className="text-sm text-forest-deep leading-relaxed">
                      {ent.notes}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteEntry(ent.id)}
                    className="text-text-muted hover:text-red-700 transition-colors p-1 cursor-pointer"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {ent.photoUrl && (
                  <div className="pt-2">
                    <img
                      src={ent.photoUrl}
                      alt="Observation photo"
                      className="max-h-60 rounded-xl object-cover border border-border-subtle shadow-xs"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ent.timestamp).toLocaleString()}
                  </span>
                  {ent.environment && (
                    <span className="px-2 py-0.5 rounded-full bg-parchment-warm text-forest-deep border border-border-subtle">
                      {ent.environment}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
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
