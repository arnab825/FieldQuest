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
  Palette,
} from 'lucide-react';
import { useAdventureSessionStore } from '../../store/adventure-session.store.js';
import { ScreenDownOverlay } from './ScreenDownOverlay.js';
import { SessionSummaryModal } from './SessionSummaryModal.js';
import { CustomIllustratorModal } from './CustomIllustratorModal.js';
import { addJournalEntry } from '../../lib/db.js';
import { playSensoryChime } from '../../lib/audio.js';
import {
  generateBotanicalSketch,
  getMatchingBotanicalPlate,
  BOTANICAL_FIELD_PLATES,
} from '../../lib/sketch-generator.js';
import { requestMissionScaffold } from '../../services/api.js';
import { NatureMission } from '../../types/index.js';

interface MissionPromptChip {
  label: string;
  icon: string;
  template: string;
}

function getMissionPromptTemplates(
  missionTitle: string,
  missionObjective: string,
  criteria: string[] = []
): MissionPromptChip[] {
  const combined = `${missionTitle} ${missionObjective} ${criteria.join(' ')}`.toLowerCase();
  const chips: MissionPromptChip[] = [];

  // 1. Acoustic & Bioacoustic Soundscapes
  if (
    combined.includes('sound') ||
    combined.includes('listen') ||
    combined.includes('audio') ||
    combined.includes('acoustic') ||
    combined.includes('bird') ||
    combined.includes('call')
  ) {
    chips.push({
      label: '3-Layer Soundscape',
      icon: '👂',
      template: `[Soundscape Stratification]\n• Foreground Sound (close): \n• Midground Sound (ambient): \n• Background Sound (distant): \n• Acoustic Rhythm: (steady / rhythmic pulse / intermittent)`,
    });
    chips.push({
      label: 'Avian Vocalization',
      icon: '🐦',
      template: `[Avian Vocalization Study]\n• Call Type: (territorial song / alarm chirp / whistle)\n• Direction & Height: (upper canopy / roof eave / ground shrub)\n• Calling Species: (passerine / pigeon / crow / unknown songbird)`,
    });
    chips.push({
      label: 'Wind in Foliage',
      icon: '🍃',
      template: `[Wind & Foliage Acoustics]\n• Wind Velocity: (calm thermal / gentle breeze / sustained gust)\n• Foliage Sound: (dry papery rustle / soft whispering leaves / branch friction)\n• Air Temperature on Skin: `,
    });
  }

  // 2. Plants, Leaves & Floral Botany
  if (
    combined.includes('plant') ||
    combined.includes('leaf') ||
    combined.includes('leaves') ||
    combined.includes('botan') ||
    combined.includes('vein') ||
    combined.includes('margin') ||
    combined.includes('symmetry') ||
    combined.includes('flora')
  ) {
    chips.push({
      label: 'Vein Architecture',
      icon: '🌿',
      template: `[Vein Architecture & Symmetry]\n• Midrib Pattern: (pinnate feather / palmate hand / parallel monocot)\n• Secondary Veins: (reticulate net / lateral pairs)\n• Blade Symmetry: (bilateral symmetrical / asymmetrical base)`,
    });
    chips.push({
      label: 'Leaf Margins',
      icon: '🍃',
      template: `[Leaf Margin & Edge Morphology]\n• Boundary Type: (smooth entire / serrated saw-tooth / dentate / lobed)\n• Sinuses & Notches: (shallow fine teeth / deep sinuses)\n• Apex & Base: (acute pointed / rounded obtuse)`,
    });
    chips.push({
      label: 'Surface & Cuticle',
      icon: '✨',
      template: `[Leaf Surface Properties]\n• Epicuticular Wax: (glossy hydrophobic sheen / matte glaucous)\n• Trichomes: (velvety fine hairs present / glabrous completely smooth)\n• Underside Stomata: (paler green / visible stomatal texture)`,
    });
  }

  // 3. Tree Bark, Trunk & Lichen Census
  if (
    combined.includes('bark') ||
    combined.includes('tree') ||
    combined.includes('lichen') ||
    combined.includes('trunk') ||
    combined.includes('wood')
  ) {
    chips.push({
      label: 'Bark Furrows',
      icon: '🌲',
      template: `[Tree Bark Texture & Fissures]\n• Furrow Texture: (deep vertical ridges / peeling papery plates / smooth)\n• Trunk Circumference & Habit: (mature broadleaf / young sapling / conifer)\n• Surface Moisture: (dry crust / damp sheltered bark)`,
    });
    chips.push({
      label: 'Lichen Census',
      icon: '🍄',
      template: `[Lichen & Bryophyte Bioindicators]\n• Growth Form: (crustose tight crust / foliose leafy lobes / fruticose shrubby)\n• Trunk Orientation: (north-facing damp side / south-facing dry side)\n• Microhabitat Invertebrates: (none visible / ants / small spiders)`,
    });
  }

  // 4. Urban Pavement, Cracks & Microhabitats
  if (
    combined.includes('urban') ||
    combined.includes('crack') ||
    combined.includes('wall') ||
    combined.includes('pavement') ||
    combined.includes('concrete') ||
    combined.includes('crevice') ||
    combined.includes('mortar')
  ) {
    chips.push({
      label: 'Crevice Flora',
      icon: '🧱',
      template: `[Pioneer Crevice Microhabitat]\n• Substrate: (pavement seam / lime mortar crack / asphalt edge)\n• Root Anchoring: (deep taproot / spreading basal rosette)\n• Urban Stress Resistance: (heat reflectance / foot trampling tolerance)`,
    });
    chips.push({
      label: 'Micro-Habitats',
      icon: '🐜',
      template: `[Micro-Terrain & Invertebrate Survey]\n• Moisture Pocket: (sheltered damp corner / dry mineral dust)\n• Resident Fauna: (ants / ground beetles / spiders / none visible)\n• Organic Material: (accumulated leaf litter / fine soil deposit)`,
    });
  }

  // Default fallbacks if mission has few matches
  if (chips.length < 3) {
    chips.push({
      label: 'Sensory Detail',
      icon: '🔍',
      template: `[Sensory Naturalist Detail]\n• Visual Observation: \n• Tactile Texture: \n• Scent / Environmental Fragrance: `,
    });
    chips.push({
      label: 'Specimen Compare',
      icon: '⚖️',
      template: `[Comparative Naturalist Study]\n• Specimen A: \n• Specimen B: \n• Key Diagnostic Distinction: `,
    });
  }

  return chips;
}

function buildMissionScaffold(mission: NatureMission): string {
  const criteriaLines = (mission.observationCriteria || [])
    .map(c => `• ${c}: `)
    .join('\n');

  return `[Field Observation Log • ${mission.title}]\n${criteriaLines}\n• Micro-habitat & Setting: \n• Naturalist Sensory Notes: \n• Contemplative Reflection: ${mission.reflectionQuestion || ''}`;
}

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
    updateCurrentMissionDraft,
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
  const [referencePlateId, setReferencePlateId] = useState<string>(BOTANICAL_FIELD_PLATES[0].id);
  const [isIllustrating, setIsIllustrating] = useState(false);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldModelUsed, setScaffoldModelUsed] = useState<string | null>(null);
  const [showCustomIllustrator, setShowCustomIllustrator] = useState(false);

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
      // Auto-suggest plate based on title and mission objective
      const matched = getMatchingBotanicalPlate(
        mission.objective,
        mission.title,
        session.environment
      );
      setReferencePlateId(matched.id);
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
        session?.environment,
        photoUrl
      );
      setPhotoUrl(sketchUrl);
    } catch {
      const fallback = getMatchingBotanicalPlate(
        notes,
        currentMission.title,
        session?.environment
      );
      setPhotoUrl(fallback.src);
    } finally {
      setIsIllustrating(false);
    }
  };

  const handleInsertScaffold = async () => {
    if (!session || !currentMission) return;
    setIsScaffolding(true);
    setScaffoldModelUsed(null);
    try {
      const mode = (localStorage.getItem('fieldquest_ai_mode') as 'demo' | 'ollama') || 'ollama';
      const endpoint = localStorage.getItem('fieldquest_ollama_endpoint') || undefined;
      const model = localStorage.getItem('fieldquest_ollama_model') || undefined;

      const result = await requestMissionScaffold(
        {
          missionTitle: currentMission.title,
          objective: currentMission.objective,
          environment: session.environment,
          observationCriteria: currentMission.observationCriteria,
          customNotes: notes,
        },
        mode,
        model,
        endpoint
      );

      if (result?.scaffold) {
        setScaffoldModelUsed(result.model);
        setNotes((prev) => {
          const trimmed = prev.trim();
          const updated = trimmed ? `${trimmed}\n\n${result.scaffold}` : result.scaffold;
          updateCurrentMissionDraft(updated, photoUrl);
          return updated;
        });
      }
    } catch (err) {
      console.warn('AI scaffold request failed, using structured template fallback:', err);
      const fallback = buildMissionScaffold(currentMission);
      setScaffoldModelUsed('curated-naturalist-engine');
      setNotes((prev) => {
        const trimmed = prev.trim();
        const updated = trimmed ? `${trimmed}\n\n${fallback}` : fallback;
        updateCurrentMissionDraft(updated, photoUrl);
        return updated;
      });
    } finally {
      setIsScaffolding(false);
    }
  };

  const activePlate =
    BOTANICAL_FIELD_PLATES.find(p => p.id === referencePlateId) ||
    BOTANICAL_FIELD_PLATES[0];

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
                Botanical Field Study Reference • {activePlate.plateNumber}
              </span>
              <h3 className="font-editorial text-2xl font-bold text-forest-deep">
                {activePlate.title}
              </h3>
            </div>

            {/* Toggle Between All 5 Plates */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
              {BOTANICAL_FIELD_PLATES.map(plate => (
                <button
                  key={plate.id}
                  type="button"
                  onClick={() => setReferencePlateId(plate.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                    referencePlateId === plate.id
                      ? 'bg-forest-deep text-paper-white border-forest-deep'
                      : 'bg-paper-white text-forest-deep border-border-subtle hover:bg-parchment-warm'
                  }`}
                >
                  {plate.plateNumber}: {plate.shortName || plate.title.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Reference Image View */}
            <div className="rounded-2xl overflow-hidden border border-border-subtle mb-4 bg-parchment-warm">
              <img
                src={activePlate.src}
                alt={activePlate.title}
                className="w-full h-auto object-cover max-h-[460px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4 text-xs">
              {activePlate.details.map((d, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-parchment-warm/70 border border-border-subtle space-y-0.5">
                  <span className="font-bold text-forest-deep block">{d.title}</span>
                  <p className="text-text-muted leading-relaxed">{d.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setPhotoUrl(activePlate.src);
                  setShowReferencePlate(false);
                }}
                className="px-4 py-2 rounded-xl bg-forest-deep/10 hover:bg-forest-deep/20 text-forest-deep text-xs font-semibold transition-colors cursor-pointer"
              >
                🌿 Attach This Plate to Mission Notes
              </button>

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

      {/* Custom AI Botanical Illustrator Modal */}
      {showCustomIllustrator && currentMission && (
        <CustomIllustratorModal
          isOpen={showCustomIllustrator}
          onClose={() => setShowCustomIllustrator(false)}
          missionTitle={currentMission.title}
          missionObjective={currentMission.objective}
          currentNotes={notes}
          environment={session.environment}
          onSelectIllustration={(imageUrl) => {
            setPhotoUrl(imageUrl);
            updateCurrentMissionDraft(notes, imageUrl);
            if (session) {
              addJournalEntry({
                id: `journal-obs-${currentMission.id}`,
                adventureId: session.id,
                missionId: currentMission.id,
                missionTitle: currentMission.title,
                timestamp: new Date().toISOString(),
                notes: notes || '',
                photoUrl: imageUrl,
                tags: [session.environment, ...session.interests],
                environment: session.environment,
              });
            }
          }}
          onSetAsReferencePlate={(plateUrl) => {
            setPhotoUrl(plateUrl);
            updateCurrentMissionDraft(notes, plateUrl);
          }}
        />
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
                  onClick={() => goToMission(idx, notes, photoUrl)}
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

              {/* Dynamic Scientific Reference Plate for this specific Mission */}
              <div className="p-4 rounded-2xl bg-parchment-warm/85 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-border-subtle bg-white shrink-0 hidden sm:block shadow-2xs">
                    <img
                      src={activePlate.src}
                      alt={activePlate.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-moss-green" />
                        Scientific Reference Guide • {activePlate.plateNumber}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep font-semibold">
                        {activePlate.shortName}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-forest-deep">
                      {activePlate.title}
                    </h3>
                    <p className="text-[11px] text-text-muted leading-relaxed">
                      {activePlate.subtitle} — {activePlate.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-forest-deep font-medium">
                      {activePlate.details.map((d, idx) => (
                        <span key={idx} className="bg-paper-white/90 px-2 py-0.5 rounded-md border border-border-subtle/60">
                          ✓ {d.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowCustomIllustrator(true)}
                        className="px-3 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-forest-deep hover:text-paper-white text-forest-deep text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                        title="Customize and synthesize botanical plates with Pollinations Flux AI"
                      >
                        <Palette className="w-3.5 h-3.5 text-moss-green" />
                        <span>🎨 Custom AI Plate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReferencePlateId(activePlate.id);
                          setShowReferencePlate(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        <Image className="w-3.5 h-3.5 text-leaf-accent" />
                        <span>Study {activePlate.plateNumber}</span>
                      </button>
                    </div>
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-forest-deep flex items-center gap-1.5">
                  <Feather className="w-4 h-4 text-moss-green" />
                  <span>Naturalist Field Log & Observation Notes</span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {scaffoldModelUsed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
                      <span>✓ AI Scaffold:</span>
                      <span className="font-mono">{scaffoldModelUsed}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isScaffolding}
                    onClick={handleInsertScaffold}
                    className="text-[11px] font-semibold text-forest-deep bg-forest-deep/10 hover:bg-forest-deep/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    title="Generate tailored observation criteria using the current AI model"
                  >
                    <Sparkles className={`w-3 h-3 text-moss-green ${isScaffolding ? 'animate-spin' : ''}`} />
                    <span>{isScaffolding ? 'Generating AI Scaffold...' : '🪄 Insert Mission Scaffold'}</span>
                  </button>
                  <span className="text-[11px] text-text-muted">
                    {notes.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={e => {
                  const val = e.target.value;
                  setNotes(val);
                  updateCurrentMissionDraft(val, photoUrl);
                }}
                placeholder="Log specific details: what did you notice about vein patterns, leaf margins, acoustic layers, or sensory textures?"
                className="w-full min-h-[120px] p-3.5 rounded-xl border border-border-subtle bg-parchment-warm/40 focus:bg-paper-white text-xs sm:text-sm text-forest-deep leading-relaxed focus:outline-none focus:border-forest-deep focus:ring-2 focus:ring-forest-deep/10 resize-y transition-all placeholder:text-text-muted/70 font-mono sm:font-sans"
              />

              {/* Dynamic Mission-Specific Quick Prompts */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-text-muted">
                    Quick observational prompts:
                  </span>
                  <span className="text-text-muted text-[10px]">
                    Click to insert structured field questions
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {getMissionPromptTemplates(
                    currentMission.title,
                    currentMission.objective,
                    currentMission.observationCriteria
                  ).map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setNotes(prev => {
                          const trimmed = prev.trim();
                          const updated = trimmed ? `${trimmed}\n\n${chip.template}` : chip.template;
                          updateCurrentMissionDraft(updated, photoUrl);
                          return updated;
                        });
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-parchment-warm hover:bg-forest-deep hover:text-paper-white text-forest-deep border border-border-subtle transition-all cursor-pointer font-medium shadow-2xs flex items-center gap-1"
                    >
                      <span>{chip.icon}</span>
                      <span>+ {chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

          {/* Photo Capture / Select & Botanical Sketch Generator */}
          <div className="flex flex-wrap items-center gap-2.5">
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

            <button
              type="button"
              onClick={() => setShowCustomIllustrator(true)}
              className="px-3.5 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-forest-deep hover:text-paper-white text-forest-deep text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
              title="Open AI Botanical Illustrator to customize specimen prompt & styles"
            >
              <Palette className="w-4 h-4 text-moss-green" />
              <span>🎨 Custom AI Illustrator</span>
            </button>

            {!photoUrl && (
              <button
                type="button"
                disabled={isIllustrating || notes.trim().length === 0}
                onClick={handleGenerateSketch}
                className="px-3.5 py-2 rounded-xl border border-border-subtle bg-parchment-warm hover:bg-paper-white text-forest-deep text-xs font-medium flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={notes.trim().length === 0 ? "Type some observation notes first to generate a botanical sketch" : "Illustrate a botanical field sketch from your description"}
              >
                <Sparkles className={`w-4 h-4 text-moss-green ${isIllustrating ? 'animate-spin' : ''}`} />
                <span>{isIllustrating ? 'Illustrating specimen...' : '✨ Quick Sketch'}</span>
              </button>
            )}

            {photoUrl && (
              <div className="flex items-center gap-2">
                <img
                  src={photoUrl}
                  alt="Observation thumbnail"
                  onError={(e) => {
                    const fallback = getMatchingBotanicalPlate(
                      notes,
                      currentMission.title,
                      session?.environment
                    );
                    e.currentTarget.src = fallback.src;
                    setPhotoUrl(fallback.src);
                  }}
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
