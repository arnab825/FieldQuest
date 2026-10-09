import React, { useEffect, useState, useRef } from 'react';
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
  Wand2,
  RotateCcw,
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
  generateCustomBotanicalIllustration,
} from '../../lib/sketch-generator.js';
import { FilterBar } from '../../components/common/FilterBar.js';
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

export interface ActivePlateData {
  id?: string;
  src: string;
  title: string;
  subtitle: string;
  description: string;
  shortName: string;
  plateNumber: string;
  details: { title: string; description: string }[];
  isCustomAI?: boolean;
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
  const [customPlate, setCustomPlate] = useState<ActivePlateData | null>(null);
  const [isIllustrating, setIsIllustrating] = useState(false);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [scaffoldModelUsed, setScaffoldModelUsed] = useState<string | null>(null);
  const [showCustomIllustrator, setShowCustomIllustrator] = useState(false);

  const applyCustomPlate = (
    imageUrl: string,
    title?: string,
    desc?: string,
    customDetails?: { title: string; description: string }[]
  ) => {
    const curMission = session?.missions[currentMissionIndex];
    const customTitle = title || curMission?.title || 'Botanical Specimen';
    const criteriaDetails = (curMission?.observationCriteria && curMission.observationCriteria.length > 0)
      ? curMission.observationCriteria.map((c, i) => ({
          title: `${i + 1}. ${c}`,
          description: `Observed diagnostic characteristic for ${c.toLowerCase()} (${session?.environment || 'field'}).`,
        }))
      : [
          { title: '1. Diagnostic Morphology', description: 'Real-time specimen structure and branch symmetry' },
          { title: '2. Boundary & Venation', description: 'Structural diagnostic vascular traits and margin contour' },
          { title: '3. Naturalist Reflection', description: curMission?.reflectionQuestion || 'Field audit observation' },
        ];

    setCustomPlate({
      id: 'custom-ai-plate',
      src: imageUrl,
      title: `${customTitle} (AI Field Study)`,
      subtitle: `Real-Time Naturalist Plate • ${(session?.environment || 'field').toUpperCase()}`,
      description: desc || `Custom AI-synthesized botanical morphology reference plate for ${customTitle}.`,
      shortName: 'Custom AI',
      plateNumber: 'Plate AI',
      details: customDetails && customDetails.length > 0 ? customDetails : criteriaDetails,
      isCustomAI: true,
    });
    setReferencePlateId('custom-ai-plate');
  };

  const lastSyncedMissionIdRef = useRef<string | null>(null);
  const [isUpdatingPlateImage, setIsUpdatingPlateImage] = useState(false);

  // Timer interval
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    const interval = setInterval(() => {
      tickSecond();
    }, 1000);
    return () => clearInterval(interval);
  }, [session, isPaused, tickSecond]);

  // Sync state ONLY when changing mission index or session id
  useEffect(() => {
    if (session && session.missions[currentMissionIndex]) {
      const mission = session.missions[currentMissionIndex];
      if (lastSyncedMissionIdRef.current !== mission.id) {
        lastSyncedMissionIdRef.current = mission.id;
        setNotes(mission.userNotes || '');
        setPhotoUrl(mission.userPhotoUrl || undefined);
        if (mission.userPhotoUrl) {
          applyCustomPlate(mission.userPhotoUrl, mission.title, mission.userNotes);
        } else {
          setCustomPlate(null);
          // Auto-suggest plate based on title and mission objective
          const matched = getMatchingBotanicalPlate(
            mission.objective,
            mission.title,
            session.environment
          );
          setReferencePlateId(matched.id);
        }
      }
    }
  }, [currentMissionIndex, session?.id]);

  const handleUpdateCurrentPlateWithAI = async () => {
    const curMission = session?.missions[currentMissionIndex];
    if (!curMission) return;
    setIsUpdatingPlateImage(true);
    try {
      const subject = activePlate.title || curMission.title;
      const newSeed = Math.floor(Math.random() * 899999) + 100000;
      const res = await generateCustomBotanicalIllustration({
        subject,
        styleKey: 'vintage_plate',
        seed: newSeed,
        customPrompt: `${curMission.objective} ${curMission.observationCriteria?.join(' ') || ''}`,
        engine: 'auto',
      });
      applyCustomPlate(res.url, subject, res.promptUsed);
      setPhotoUrl(res.url);
      updateCurrentMissionDraft(notes, res.url);
    } catch (err) {
      console.error('Failed to update plate image with AI:', err);
      const available = BOTANICAL_FIELD_PLATES.filter(p => p.src !== activePlate.src);
      const chosen = available[Math.floor(Math.random() * available.length)] || BOTANICAL_FIELD_PLATES[0];
      applyCustomPlate(chosen.src, chosen.title, chosen.description, chosen.details);
      setPhotoUrl(chosen.src);
      updateCurrentMissionDraft(notes, chosen.src);
    } finally {
      setIsUpdatingPlateImage(false);
    }
  };

  const handleUploadPlateImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const curMission = session?.missions[currentMissionIndex];
    const file = e.target.files?.[0];
    if (file && curMission) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        applyCustomPlate(base64, `${curMission.title} (Naturalist Photo)`, 'Custom uploaded specimen photo.');
        setPhotoUrl(base64);
        updateCurrentMissionDraft(notes, base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCyclePlateVariant = () => {
    const available = BOTANICAL_FIELD_PLATES.filter(p => p.src !== activePlate.src);
    const chosen = available[Math.floor(Math.random() * available.length)] || BOTANICAL_FIELD_PLATES[0];
    applyCustomPlate(chosen.src, chosen.title, chosen.description, chosen.details);
    setPhotoUrl(chosen.src);
    updateCurrentMissionDraft(notes, chosen.src);
  };

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
      applyCustomPlate(sketchUrl, currentMission.title, notes);
      updateCurrentMissionDraft(notes, sketchUrl);
    } catch {
      const fallback = getMatchingBotanicalPlate(
        notes,
        currentMission.title,
        session?.environment
      );
      setPhotoUrl(fallback.src);
      applyCustomPlate(fallback.src, currentMission.title, notes);
      updateCurrentMissionDraft(notes, fallback.src);
    } finally {
      setIsIllustrating(false);
    }
  };

  const handleInsertScaffold = async () => {
    if (!session || !currentMission) return;
    setIsScaffolding(true);
    setScaffoldModelUsed(null);
    try {
      const mode = (localStorage.getItem('fieldquest_ai_mode') as 'cloud' | 'ollama' | 'demo') || 'cloud';
      const cloudService = (localStorage.getItem('fieldquest_cloud_service') as 'gemini' | 'groq') || 'gemini';
      const cloudApiKey = cloudService === 'groq'
        ? localStorage.getItem('fieldquest_groq_api_key') || undefined
        : localStorage.getItem('fieldquest_gemini_api_key') || undefined;
      const cloudModel = cloudService === 'groq'
        ? (localStorage.getItem('fieldquest_groq_model') || 'llama-3.3-70b-versatile')
        : (localStorage.getItem('fieldquest_gemini_model') || 'gemini-1.5-flash');
      const model = mode === 'cloud' ? cloudModel : (localStorage.getItem('fieldquest_ollama_model') || undefined);
      const endpoint = localStorage.getItem('fieldquest_ollama_endpoint') || undefined;

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
        endpoint,
        cloudService,
        cloudApiKey
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

  const standardPlate =
    BOTANICAL_FIELD_PLATES.find(p => p.id === referencePlateId) ||
    BOTANICAL_FIELD_PLATES[0];

  const activePlate: ActivePlateData =
    referencePlateId === 'custom-ai-plate' && customPlate
      ? customPlate
      : referencePlateId !== 'custom-ai-plate'
      ? standardPlate
      : customPlate || standardPlate;

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
          <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-7 max-w-2xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto scrollbar-none">
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

            {/* Toggle Between Plates with Reusable FilterBar */}
            <div className="mb-4">
              <FilterBar
                items={[
                  ...(customPlate
                    ? [
                        {
                          id: 'custom-ai-plate',
                          label: '✨ Custom AI Plate',
                        },
                      ]
                    : []),
                  ...BOTANICAL_FIELD_PLATES.map(plate => ({
                    id: plate.id,
                    label: `${plate.plateNumber}: ${plate.shortName || plate.title.split(' ')[0]}`,
                  })),
                ]}
                selectedId={referencePlateId}
                onSelect={(id) => setReferencePlateId(id)}
                variant="pills"
                size="md"
              />
            </div>

            {/* Direct In-Place Plate Image Updater Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-2.5 rounded-2xl bg-forest-deep/5 border border-forest-deep/15">
              <div className="flex items-center gap-1.5 text-xs font-bold text-forest-deep">
                <Sparkles className="w-4 h-4 text-moss-green" />
                <span>Plate Specimen Image:</span>
                {activePlate.isCustomAI && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700 text-white font-bold shadow-2xs">
                    Custom AI Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isUpdatingPlateImage}
                  onClick={handleUpdateCurrentPlateWithAI}
                  className="px-3.5 py-1.5 rounded-xl bg-forest-deep hover:bg-forest-dark text-paper-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Generate a fresh botanical illustration for this plate with AI"
                >
                  <Wand2 className={`w-3.5 h-3.5 text-leaf-accent ${isUpdatingPlateImage ? 'animate-spin' : ''}`} />
                  <span>{isUpdatingPlateImage ? 'Synthesizing...' : '✨ Update Image with AI'}</span>
                </button>

                <label className="px-3 py-1.5 rounded-xl border border-border-subtle bg-white hover:bg-parchment-warm text-forest-deep text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                  <Camera className="w-3.5 h-3.5 text-moss-green" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPlateImage}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCyclePlateVariant}
                  className="px-3 py-1.5 rounded-xl border border-border-subtle bg-white hover:bg-parchment-warm text-forest-deep text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="Cycle between alternative historical specimens"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
                  <span>Cycle Variant</span>
                </button>
              </div>
            </div>

            {/* Reference Image View */}
            <div className="rounded-2xl overflow-hidden border border-border-subtle mb-4 bg-parchment-warm relative group">
              <img
                src={activePlate.src}
                alt={activePlate.title}
                onError={(e) => {
                  e.currentTarget.src = standardPlate.src;
                }}
                className="w-full h-auto object-cover max-h-[460px]"
              />
              {isUpdatingPlateImage && (
                <div className="absolute inset-0 bg-forest-dark/60 backdrop-blur-xs flex flex-col items-center justify-center text-paper-white gap-2 z-10">
                  <Wand2 className="w-8 h-8 animate-spin text-leaf-accent" />
                  <span className="text-xs font-semibold">Synthesizing authentic botanical plate...</span>
                </div>
              )}
            </div>

            {/* Real-Time Diagnostic Details Breakdown */}
            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green block mb-2">
                {activePlate.isCustomAI ? '🎯 Real-Time Diagnostic Criteria (Active Specimen):' : '🔍 Diagnostic Morphology Points:'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
                {activePlate.details.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl bg-parchment-warm/80 border border-border-subtle space-y-1">
                    <span className="font-bold text-forest-deep flex items-center gap-1">
                      <span className="text-emerald-700">✓</span>
                      <span>{d.title}</span>
                    </span>
                    <p className="text-text-muted leading-relaxed text-[11px]">{d.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoUrl(activePlate.src);
                    updateCurrentMissionDraft(notes, activePlate.src);
                    setShowReferencePlate(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-forest-deep/10 hover:bg-forest-deep/20 text-forest-deep text-xs font-semibold transition-colors cursor-pointer"
                >
                  🌿 Attach This Plate to Mission Notes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReferencePlate(false);
                    setShowCustomIllustrator(true);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-forest-deep text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Palette className="w-3.5 h-3.5 text-moss-green" />
                  <span>Customize Plate</span>
                </button>
              </div>

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
          onSelectIllustration={(imageUrl, subject, prompt) => {
            setPhotoUrl(imageUrl);
            applyCustomPlate(imageUrl, subject || currentMission.title, prompt || notes);
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
          onSetAsReferencePlate={(plateUrl, plateTitle, prompt) => {
            applyCustomPlate(plateUrl, plateTitle || currentMission.title, prompt || notes);
            setPhotoUrl(plateUrl);
            updateCurrentMissionDraft(notes, plateUrl);
          }}
        />
      )}

      {/* Top Session Status Bar */}
      <div className="bg-paper-white rounded-2xl border border-border-subtle p-3 sm:p-4 mb-4 sm:mb-6 shadow-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
        {/* Left: Mission Indicator */}
        <div className="flex items-center gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-moss-green block">
              Active Quest
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-base sm:text-lg font-bold text-forest-deep">
                Mission {currentMissionIndex + 1}
              </span>
              <span className="text-[11px] sm:text-xs text-text-muted">
                / {session.missions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Right Group: Live Timer & Screen Down */}
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          {/* Live Timer & Pause */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-parchment-warm px-2.5 sm:px-3 py-1.5 rounded-xl border border-border-subtle">
            <Clock className="w-3.5 h-3.5 text-forest-deep" />
            <span className="font-mono text-xs sm:text-sm font-bold text-forest-deep">
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

          {/* Screen-Down Toggle Button */}
          <button
            onClick={() => setScreenDown(true)}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-forest-dark text-paper-white text-xs font-semibold flex items-center gap-1.5 hover:bg-forest-deep transition-colors shadow-xs cursor-pointer"
            title="Dim screen and explore with your senses"
          >
            <Moon className="w-3.5 h-3.5 text-leaf-accent" />
            <span className="hidden xs:inline">Screen Down</span>
            <span className="xs:hidden">Dim</span>
          </button>
        </div>
      </div>

      {/* Mission Stepper Dots */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 px-1">
        {session.missions.map((m, idx) => {
          const isCurrent = idx === currentMissionIndex;
          const isCompleted = m.status === 'completed';
          const isSkipped = m.status === 'skipped';
          return (
            <button
              key={m.id}
              onClick={() => goToMission(idx, notes, photoUrl)}
              className={`h-2.5 sm:h-3 rounded-full transition-all flex-1 cursor-pointer py-1 ${
                isCompleted
                  ? 'bg-emerald-600'
                  : isSkipped
                  ? 'bg-bark-brown/40'
                  : isCurrent
                  ? 'bg-forest-deep ring-2 ring-forest-deep/20'
                  : 'bg-border-subtle hover:bg-forest-deep/30'
              }`}
              title={`Mission ${idx + 1}: ${m.title}`}
            />
          );
        })}
      </div>

      {/* Main Mission Focus Card */}
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
        {/* Card Header */}
        <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-forest-deep/5 text-forest-deep mb-2">
              ⏱️ {currentMission.estimatedMinutes} mins • {session.environment}
            </span>
            <h1 className="font-editorial text-xl sm:text-3xl font-bold text-forest-deep">
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
          <p className="text-sm sm:text-base text-forest-deep/95 leading-relaxed font-medium">
            {currentMission.objective}
          </p>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-moss-green mb-2">
            Instructions
          </h2>
          <ol className="space-y-2 text-xs sm:text-sm text-forest-deep/90">
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
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
            {currentMission.observationCriteria.map((item, idx) => (
              <span
                key={idx}
                className="px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-medium bg-parchment-warm border border-border-subtle text-forest-deep"
              >
                🔍 {item}
              </span>
            ))}
          </div>

          {/* Dynamic Scientific Reference Plate for this specific Mission */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-parchment-warm/85 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div
                onClick={() => setShowReferencePlate(true)}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-border-subtle bg-white shrink-0 block shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
                title="Click to view full reference plate"
              >
                <img
                  src={activePlate.src}
                  alt={activePlate.title}
                  onError={(e) => {
                    e.currentTarget.src = standardPlate.src;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-moss-green shrink-0" />
                    <span>Scientific Guide • {activePlate.plateNumber}</span>
                  </span>
                  {activePlate.isCustomAI ? (
                    <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-emerald-700 text-white font-bold shadow-2xs">
                      Custom AI
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep font-semibold">
                      {activePlate.shortName}
                    </span>
                  )}
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-forest-deep truncate">
                  {activePlate.title}
                </h3>
                <p className="text-[11px] text-text-muted leading-tight line-clamp-2 sm:line-clamp-none">
                  {activePlate.subtitle}
                </p>

                {/* Real-Time Diagnostic Criteria details */}
                <div className="pt-1.5">
                  <div className="flex flex-wrap gap-1 text-[10px] sm:text-[11px] text-forest-deep font-medium">
                    {activePlate.details.slice(0, 3).map((d, idx) => (
                      <span
                        key={idx}
                        title={d.description}
                        className={`px-2 py-0.5 rounded-lg border text-forest-deep shadow-2xs flex items-center gap-1 font-semibold ${
                          activePlate.isCustomAI
                            ? 'bg-emerald-50/90 border-emerald-300/80 text-emerald-950'
                            : 'bg-paper-white/90 border-border-subtle/70'
                        }`}
                      >
                        <span className="text-emerald-700">✓</span>
                        <span className="truncate max-w-[140px] sm:max-w-none">{d.title}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle/60">
              <button
                type="button"
                disabled={isUpdatingPlateImage}
                onClick={handleUpdateCurrentPlateWithAI}
                className="px-3 py-2 rounded-xl bg-forest-deep text-paper-white hover:bg-forest-dark text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Instantly generate and update current image with AI"
              >
                <Wand2 className={`w-3.5 h-3.5 text-leaf-accent shrink-0 ${isUpdatingPlateImage ? 'animate-spin' : ''}`} />
                <span>{isUpdatingPlateImage ? 'Updating...' : '✨ Update'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomIllustrator(true)}
                className="px-3 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-forest-deep hover:text-paper-white text-forest-deep text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Customize and synthesize botanical plates with AI"
              >
                <Palette className="w-3.5 h-3.5 text-moss-green shrink-0" />
                <span>Custom AI</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReferencePlate(true)}
                className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 rounded-xl border border-border-subtle bg-parchment-warm text-forest-deep text-[11px] sm:text-xs font-semibold hover:bg-paper-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Image className="w-3.5 h-3.5 text-moss-green shrink-0" />
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
