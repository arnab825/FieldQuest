import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Pause,
  Play,
  Moon,
  CheckCircle2,
  SkipForward,
  LogOut,
  Camera,
  Shield,
  HelpCircle,
  Sparkles,
  AlertTriangle,
  Image,
  BookOpen,
  Feather,
} from 'lucide-react';
import { useAdventureSessionStore } from '../../store/adventure-session.store.js';
import { ScreenDownOverlay } from './ScreenDownOverlay.js';
import { SessionSummaryModal } from './SessionSummaryModal.js';
import { addJournalEntry } from '../../lib/db.js';
import { playSensoryChime } from '../../lib/audio.js';
import { generateBotanicalSketch } from '../../lib/sketch-generator.js';

export const ActiveAdventureScreen: React.FC = () => {
  const navigate = useNavigate();

  const {
    session,
    currentMissionIndex,
    elapsedSeconds,
    isPaused,
    isScreenDown,
    tickSecond,
    togglePause,
    setScreenDown,
    goToMission,
    completeCurrentMission,
    skipCurrentMission,
    abandonSession,
    finishSession,
  } = useAdventureSessionStore();

  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [showSummary, setShowSummary] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [showReferencePlate, setShowReferencePlate] = useState(false);
  const [referencePlateType, setReferencePlateType] = useState<'venation' | 'bark'>('venation');
  const [isIllustrating, setIsIllustrating] = useState(false);

  // Timer interval
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    const interval = setInterval(() => {
      tickSecond();
    }, 1000);
    return () => clearInterval(interval);
  }, [session, isPaused, tickSecond]);

  // Sync state when mission changes
  useEffect(() => {
    if (session && session.missions[currentMissionIndex]) {
      const mission = session.missions[currentMissionIndex];
      setNotes(mission.userNotes || '');
      setPhotoUrl(mission.userPhotoUrl || undefined);
      // Auto-suggest plate based on title
      if (mission.title.toLowerCase().includes('bark') || mission.title.toLowerCase().includes('lichen')) {
        setReferencePlateType('bark');
      } else {
        setReferencePlateType('venation');
      }
    }
  }, [session, currentMissionIndex]);

  // Check if all missions are done
  useEffect(() => {
    if (session && session.missions.length > 0) {
      const allDone = session.missions.every(m => m.status === 'completed' || m.status === 'skipped');
      if (allDone && session.status === 'in_progress') {
        finishSession();
        setShowSummary(true);
      }
    }
  }, [session, finishSession]);

  if (!session) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-forest-deep/10 text-forest-deep flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-moss-green" />
        </div>
        <h2 className="font-editorial text-2xl font-bold text-forest-deep mb-2">
          No Active Adventure
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Configure your environment and duration to begin a new outdoor quest.
        </p>
        <Link
          to="/setup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-deep text-paper-white font-medium text-sm hover:bg-forest-dark cursor-pointer"
        >
          Start An Adventure
        </Link>
      </div>
    );
  }

  const currentMission = session.missions[currentMissionIndex] || session.missions[0];
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteMission = async () => {
    playSensoryChime();
    await completeCurrentMission(notes, photoUrl);

    // Save individual observation entry to IndexedDB journal
    if (notes || photoUrl) {
      await addJournalEntry({
        id: `journal-obs-${currentMission.id}`,
        adventureId: session.id,
        missionId: currentMission.id,
        missionTitle: currentMission.title,
        timestamp: new Date().toISOString(),
        notes: notes || '',
        photoUrl,
        tags: [session.environment, ...session.interests],
        environment: session.environment,
      });
    }

    if (currentMissionIndex === session.missions.length - 1) {
      await finishSession();
      setShowSummary(true);
    }
  };

  const handleAbandon = async () => {
    await abandonSession();
    navigate('/journal');
  };

  const handleGenerateSketch = async () => {
    if (!notes || notes.trim().length === 0) return;
    try {
      setIsIllustrating(true);
      const sketchUrl = await generateBotanicalSketch(
        notes,
        currentMission.title,
        session?.environment
      );
      setPhotoUrl(sketchUrl);
    } catch (err: any) {
      alert('Could not generate sketch: ' + (err.message || 'Please check your internet connection'));
    } finally {
      setIsIllustrating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Screen Down Overlay */}
      {isScreenDown && (
        <ScreenDownOverlay
          elapsedSeconds={elapsedSeconds}
          onWake={() => setScreenDown(false)}
        />
      )}

      {/* Session Summary Modal */}
      {showSummary && (
        <SessionSummaryModal
          session={session}
          onClose={() => setShowSummary(false)}
        />
      )}

      {/* Visual Reference Plate Modal */}
      {showReferencePlate && (
        <div className="fixed inset-0 z-50 bg-forest-dark/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-7 max-w-2xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowReferencePlate(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-forest-deep transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green block mb-1">
                Botanical Field Study Reference
              </span>
              <h3 className="font-editorial text-2xl font-bold text-forest-deep">
                {referencePlateType === 'venation'
                  ? 'Leaf Venation Patterns (Pinnate, Palmate, Parallel)'
                  : 'Bark Textures & Lichen Growth Forms'}
              </h3>
            </div>

            {/* Toggle Between Plates */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setReferencePlateType('venation')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  referencePlateType === 'venation'
                    ? 'bg-forest-deep text-paper-white border-forest-deep'
                    : 'bg-paper-white text-forest-deep border-border-subtle hover:bg-parchment-warm'
                }`}
              >
                🌿 Leaf Venation Plate
              </button>

              <button
                type="button"
                onClick={() => setReferencePlateType('bark')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  referencePlateType === 'bark'
                    ? 'bg-forest-deep text-paper-white border-forest-deep'
                    : 'bg-paper-white text-forest-deep border-border-subtle hover:bg-parchment-warm'
                }`}
              >
                🌲 Bark & Lichen Plate
              </button>
            </div>

            {/* Reference Image View */}
            <div className="rounded-2xl overflow-hidden border border-border-subtle mb-4 bg-parchment-warm">
              <img
                src={
                  referencePlateType === 'venation'
                    ? '/leaf_venation_reference.jpg'
                    : '/bark_lichen_reference.jpg'
                }
                alt="Botanical naturalist identification chart"
                className="w-full h-auto object-cover max-h-[460px]"
              />
            </div>

            <div className="p-3 rounded-xl bg-parchment-warm/70 border border-border-subtle text-xs text-forest-deep/80 space-y-1">
              <p className="font-semibold text-forest-deep">
                Naturalist Field Note:
              </p>
              <p>
                {referencePlateType === 'venation'
                  ? 'Observe living plants without plucking foliage. Compare the central midrib and radiating branching veins. Notice if leaves are monocots (parallel veins) or dicots (branching veins).'
                  : 'Inspect tree trunk microclimates without peeling bark. Identify foliose (leafy gray-green) or crustose (crust-like) lichens as natural air-quality bioindicators.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex justify-end">
              <button
                type="button"
                onClick={() => setShowReferencePlate(false)}
                className="px-5 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors cursor-pointer"
              >
                Return to Observation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Session Status Bar */}
      <div className="bg-paper-white rounded-2xl border border-border-subtle p-4 mb-6 shadow-xs flex items-center justify-between gap-3">
        {/* Left: Mission Indicator */}
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-moss-green block">
            Active Adventure
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-editorial text-lg font-bold text-forest-deep">
              Mission {currentMissionIndex + 1}
            </span>
            <span className="text-xs text-text-muted">
              of {session.missions.length}
            </span>
          </div>
        </div>

        {/* Center: Live Timer & Pause */}
        <div className="flex items-center gap-2 bg-parchment-warm px-3 py-1.5 rounded-xl border border-border-subtle">
          <Clock className="w-4 h-4 text-forest-deep" />
          <span className="font-mono text-sm font-bold text-forest-deep">
            {timeFormatted}
          </span>
          <button
            onClick={togglePause}
            className="p-1 text-forest-deep hover:text-forest-dark transition-colors cursor-pointer"
            title={isPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-700" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Screen-Down Toggle Button */}
        <button
          onClick={() => setScreenDown(true)}
          className="px-3.5 py-2 rounded-xl bg-forest-dark text-paper-white text-xs font-semibold flex items-center gap-1.5 hover:bg-forest-deep transition-colors shadow-xs cursor-pointer"
          title="Dim screen and explore with your senses"
        >
          <Moon className="w-3.5 h-3.5 text-leaf-accent" />
          <span>Screen Down</span>
        </button>
      </div>

      {/* Mission Stepper Dots */}
      <div className="flex items-center gap-2 mb-6 px-1">
        {session.missions.map((m, idx) => {
          const isCurrent = idx === currentMissionIndex;
          const isCompleted = m.status === 'completed';
          const isSkipped = m.status === 'skipped';
          return (
            <button
              key={m.id}
              onClick={() => goToMission(idx)}
              className={`h-2.5 rounded-full transition-all flex-1 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-600'
                  : isSkipped
                  ? 'bg-bark-brown/40'
                  : isCurrent
                  ? 'bg-forest-deep'
                  : 'bg-border-subtle'
              }`}
              title={`Mission ${idx + 1}: ${m.title}`}
            />
          );
        })}
      </div>

      {/* Main Mission Focus Card */}
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-sm space-y-6">
        {/* Card Header */}
        <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-forest-deep/5 text-forest-deep mb-2">
              ⏱️ {currentMission.estimatedMinutes} mins • {session.environment}
            </span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
              {currentMission.title}
            </h1>
          </div>

          {currentMission.status === 'completed' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full self-start">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
        </div>

        {/* Objective */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-moss-green mb-1.5">
            Objective
          </h2>
          <p className="text-base text-forest-deep/95 leading-relaxed font-medium">
            {currentMission.objective}
          </p>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-moss-green mb-2">
            Instructions
          </h2>
          <ol className="space-y-2 text-sm text-forest-deep/90">
            {currentMission.instructions.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-parchment-warm border border-border-subtle text-forest-deep font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Observation Criteria Pills */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-moss-green mb-2">
            What To Look / Listen For
          </h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {currentMission.observationCriteria.map((item, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl text-xs font-medium bg-parchment-warm border border-border-subtle text-forest-deep"
              >
                🔍 {item}
              </span>
            ))}
          </div>

          {/* Naturalist Identification Reference Plate Trigger */}
          <div className="p-3.5 rounded-2xl bg-parchment-warm/80 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-moss-green shrink-0" />
              <div>
                <span className="text-xs font-bold text-forest-deep block">Naturalist Visual Identification Plate</span>
                <span className="text-[11px] text-text-muted">Study botanical diagrams for leaf venation patterns and bark lichens</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReferencePlate(true)}
              className="px-3.5 py-1.5 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              <Image className="w-3.5 h-3.5 text-leaf-accent" />
              <span>Study Reference Plate</span>
            </button>
          </div>
        </div>

        {/* Safety Guidance Callout */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-amber-950">
              Naturalist Safety:
            </span>
            <p className="text-amber-900 leading-relaxed">
              {currentMission.safetyGuidance}
            </p>
          </div>
        </div>

        {/* Reflection Question */}
        <div className="p-4 rounded-2xl bg-forest-deep/5 border border-forest-deep/15 text-xs text-forest-deep flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-moss-green shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-forest-deep">
              Contemplative Reflection:
            </span>
            <p className="italic text-forest-deep/85 leading-relaxed">
              "{currentMission.reflectionQuestion}"
            </p>
          </div>
        </div>

        {/* Observation Log Form */}
        <div className="pt-4 border-t border-border-subtle space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest-deep flex items-center gap-1.5">
              <Feather className="w-4 h-4 text-moss-green" />
              <span>Naturalist Field Log & Observation Notes</span>
            </h2>
            <span className="text-[11px] text-text-muted">
              {notes.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Log specific details: what did you notice about vein symmetry, leaf margins, bark lichen textures, or sensory sound layers?"
            className="w-full min-h-[110px] p-3.5 rounded-xl border border-border-subtle bg-parchment-warm/40 focus:bg-paper-white text-xs sm:text-sm text-forest-deep leading-relaxed focus:outline-none focus:border-forest-deep focus:ring-2 focus:ring-forest-deep/10 resize-y transition-all placeholder:text-text-muted/70"
          />

          {/* Quick Naturalist Observation Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] font-medium text-text-muted mr-1">Quick prompts:</span>
            {[
              { label: '🌿 Vein Symmetry', text: 'Vein Symmetry: ' },
              { label: '🔬 Leaf Margins', text: 'Leaf Margins: ' },
              { label: '🌲 Lichen Growth', text: 'Lichen Growth: ' },
              { label: '👂 Sound Layer', text: 'Sound Layer: ' },
              { label: '✨ Cuticle / Surface', text: 'Surface Properties: ' },
            ].map(chip => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setNotes(prev => prev ? `${prev}\n${chip.text}` : chip.text)}
                className="text-[11px] px-2 py-0.5 rounded-md bg-parchment-warm hover:bg-forest-deep/10 text-forest-deep border border-border-subtle transition-colors cursor-pointer"
              >
                + {chip.label}
              </button>
            ))}
          </div>

          {/* Photo Capture / Select & Botanical Sketch Generator */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="px-3.5 py-2 rounded-xl border border-border-subtle bg-parchment-warm hover:bg-paper-white text-forest-deep text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors">
              <Camera className="w-4 h-4 text-moss-green" />
              <span>Select Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>

            {!photoUrl && (
              <button
                type="button"
                disabled={isIllustrating || notes.trim().length === 0}
                onClick={handleGenerateSketch}
                className="px-3.5 py-2 rounded-xl border border-border-subtle bg-parchment-warm hover:bg-paper-white text-forest-deep text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={notes.trim().length === 0 ? "Type some observation notes first to generate a botanical sketch" : "Illustrate a botanical field sketch from your description"}
              >
                <Sparkles className={`w-4 h-4 text-moss-green ${isIllustrating ? 'animate-spin' : ''}`} />
                <span>{isIllustrating ? 'Illustrating specimen...' : '🎨 Illustrate from Notes'}</span>
              </button>
            )}

            {photoUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={photoUrl}
                  alt="Observation thumbnail"
                  className="w-10 h-10 rounded-lg object-cover border border-border-subtle shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="text-xs text-red-700 underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mission Actions */}
        <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={skipCurrentMission}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border-subtle hover:bg-parchment-warm text-xs font-semibold text-text-muted flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            <span>Skip Mission</span>
          </button>

          <button
            type="button"
            onClick={handleCompleteMission}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-forest-deep hover:bg-forest-dark text-paper-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5 text-leaf-accent" />
            <span>
              {currentMissionIndex === session.missions.length - 1
                ? 'Complete & Finish Adventure'
                : 'Complete Mission'}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Abandon Control */}
      <div className="mt-8 text-center">
        {!confirmAbandon ? (
          <button
            onClick={() => setConfirmAbandon(true)}
            className="text-xs text-text-muted hover:text-red-700 flex items-center gap-1 mx-auto transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Need to abandon adventure early?</span>
          </button>
        ) : (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 inline-flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>Save progress and abandon session?</span>
            <button
              onClick={handleAbandon}
              className="px-2.5 py-1 rounded-md bg-red-800 text-white font-medium hover:bg-red-900 cursor-pointer"
            >
              Yes, Abandon
            </button>
            <button
              onClick={() => setConfirmAbandon(false)}
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
