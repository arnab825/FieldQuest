import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Award, Clock, BookOpen, Compass, ArrowRight } from 'lucide-react';
import { AdventureSessionRecord } from '../../types/index.js';
import { addJournalEntry } from '../../lib/db.js';

interface SessionSummaryModalProps {
  session: AdventureSessionRecord;
  onClose: () => void;
}

export const SessionSummaryModal: React.FC<SessionSummaryModalProps> = ({
  session,
  onClose,
}) => {
  const navigate = useNavigate();

  const completedMissions = session.missions.filter(m => m.status === 'completed');
  const [reflection, setReflection] = useState(session.overallReflection || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveToJournal = async () => {
    await addJournalEntry({
      id: `entry-summary-${session.id}`,
      adventureId: session.id,
      timestamp: new Date().toISOString(),
      notes: reflection || 'Adventure completed successfully.',
      tags: [session.environment, ...session.interests],
      environment: session.environment,
    });
    setIsSaved(true);
  };

  const handleGoToJournal = () => {
    onClose();
    navigate('/journal');
  };

  const handleNewAdventure = () => {
    onClose();
    navigate('/setup');
  };

  return (
    <div className="fixed inset-0 z-50 bg-forest-dark/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
        {/* Header Celebration */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-forest-deep text-leaf-accent flex items-center justify-center mx-auto mb-4 shadow-md">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            Adventure Complete!
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            You spent meaningful moments engaging with the living biodiversity of your neighbourhood.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-parchment-warm/60 border border-border-subtle text-center">
            <div className="flex items-center justify-center gap-1.5 text-moss-green text-xs font-semibold mb-1">
              <Clock className="w-4 h-4" />
              <span>Time Outside</span>
            </div>
            <div className="font-editorial text-2xl font-bold text-forest-deep">
              {session.totalMinutesSpent} <span className="text-sm font-sans font-normal">min</span>
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">
              Self-reported outdoor observation
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-parchment-warm/60 border border-border-subtle text-center">
            <div className="flex items-center justify-center gap-1.5 text-moss-green text-xs font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Missions</span>
            </div>
            <div className="font-editorial text-2xl font-bold text-forest-deep">
              {completedMissions.length} / {session.missions.length}
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">
              Sensory objectives met
            </p>
          </div>
        </div>

        {/* Overall Reflection Prompt */}
        <div className="mb-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-forest-deep">
              Capture an overall thought or sensory discovery:
            </label>
            <span className="text-[11px] text-text-muted">
              {reflection.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            placeholder="What was your favorite observation today? Notice any unexpected insects, lichens, foliage colors, or quiet sounds?"
            className="w-full min-h-[100px] p-3.5 rounded-xl border border-border-subtle bg-parchment-warm/40 focus:bg-paper-white text-xs sm:text-sm text-forest-deep leading-relaxed focus:outline-none focus:border-forest-deep focus:ring-2 focus:ring-forest-deep/10 resize-y transition-all placeholder:text-text-muted/70"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {!isSaved ? (
            <button
              onClick={handleSaveToJournal}
              className="w-full py-3.5 rounded-xl bg-forest-deep text-paper-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-forest-dark transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-leaf-accent" />
              <span>Save Reflection to Journal</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-center font-medium">
              ✓ Saved to your offline nature journal!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleGoToJournal}
              className="py-2.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-forest-deep font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View Journal</span>
            </button>

            <button
              onClick={handleNewAdventure}
              className="py-2.5 rounded-xl bg-forest-deep/10 hover:bg-forest-deep/20 text-forest-deep font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-moss-green" />
              <span>New Adventure</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
