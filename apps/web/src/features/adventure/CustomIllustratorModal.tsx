import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Palette,
  Wand2,
  Download,
  Check,
  RotateCcw,
  BookOpen,
  Info,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import {
  BOTANICAL_STYLE_PRESETS,
  BotanicalStyleKey,
  buildCustomPrompt,
  generateCustomBotanicalIllustration,
  CustomIllustrationResult,
  BOTANICAL_FIELD_PLATES,
  getMatchingBotanicalPlate,
} from '../../lib/sketch-generator.js';

interface CustomIllustratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionTitle: string;
  missionObjective: string;
  currentNotes?: string;
  environment?: string;
  onSelectIllustration: (imageUrl: string, subject?: string, prompt?: string) => void;
  onSetAsReferencePlate?: (plateUrl: string, plateTitle?: string, prompt?: string) => void;
}

export const CustomIllustratorModal: React.FC<CustomIllustratorModalProps> = ({
  isOpen,
  onClose,
  missionTitle,
  missionObjective,
  currentNotes,
  environment,
  onSelectIllustration,
  onSetAsReferencePlate,
}) => {
  const initialSubject =
    currentNotes && currentNotes.trim().length > 10
      ? currentNotes.replace(/[•\n]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140)
      : `${missionTitle} specimen`;

  const [subject, setSubject] = useState(initialSubject);
  const [styleKey, setStyleKey] = useState<BotanicalStyleKey>('vintage_plate');
  const [customPrompt, setCustomPrompt] = useState('');
  const [engine, setEngine] = useState<'auto' | 'archive' | 'plates'>('auto');
  const [aspect, setAspect] = useState<'landscape' | 'square'>('landscape');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 899999) + 100000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CustomIllustrationResult | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const width = aspect === 'landscape' ? 800 : 768;
  const height = aspect === 'landscape' ? 600 : 768;

  const activePromptPreview = buildCustomPrompt(subject, styleKey, customPrompt);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setApplied(false);

    // Fresh seed on every generate click so each generation produces a distinct specimen
    const newSeed = Math.floor(Math.random() * 899999) + 100000;
    setSeed(newSeed);

    try {
      const generated = await generateCustomBotanicalIllustration({
        subject,
        styleKey,
        customPrompt,
        seed: newSeed,
        width,
        height,
        engine,
      });
      setResult(generated);
      if (onSetAsReferencePlate) {
        onSetAsReferencePlate(generated.url, subject, generated.promptUsed);
      }
    } catch (err: any) {
      console.error('Illustration generation failed:', err);
      const fallback = BOTANICAL_FIELD_PLATES[newSeed % BOTANICAL_FIELD_PLATES.length];
      const fallbackRes = {
        url: fallback.src,
        promptUsed: fallback.description,
        seed: newSeed,
        model: `Curated Field Plate (${fallback.plateNumber})`,
        isBase64: false,
      };
      setResult(fallbackRes);
      if (onSetAsReferencePlate) {
        onSetAsReferencePlate(fallback.src, subject, fallback.description);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 899999) + 100000);
  };

  const handleApplyToMission = () => {
    if (!result) return;
    onSelectIllustration(result.url, subject, result.promptUsed);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleSelectCuratedPlate = (plateSrc: string, plateTitle: string, plateDesc?: string) => {
    setResult({
      url: plateSrc,
      promptUsed: plateDesc || plateTitle,
      seed,
      model: plateTitle,
      isBase64: false,
    });
    if (onSetAsReferencePlate) {
      onSetAsReferencePlate(plateSrc, plateTitle, plateDesc);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-forest-dark/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-7 max-w-3xl w-full shadow-2xl relative my-auto max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-deep/10 text-forest-deep flex items-center justify-center">
              <Palette className="w-5 h-5 text-moss-green" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-editorial text-xl sm:text-2xl font-bold text-forest-deep">
                  AI Botanical Illustrator
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  AI & Botanical Archive
                </span>
              </div>
              <p className="text-xs text-text-muted">
                Synthesize custom antique naturalist field plates & specimen studies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-forest-deep hover:bg-parchment-warm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1 text-xs sm:text-sm scrollbar-none">
          {/* Mission Context Pill */}
          <div className="p-3 rounded-2xl bg-parchment-warm/70 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green">
                Active Field Mission Reference
              </span>
              <p className="font-semibold text-forest-deep text-xs">
                {missionTitle} • <span className="text-text-muted font-normal">{missionObjective}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSubject(`${missionTitle} (${environment || 'nature'} specimen)`)}
              className="text-[11px] font-semibold text-forest-deep bg-paper-white hover:bg-forest-deep hover:text-paper-white px-2.5 py-1.5 rounded-xl border border-border-subtle transition-all cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Reset to Mission
            </button>
          </div>

          {/* Subject Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-forest-deep uppercase tracking-wider text-[11px]">
                Specimen Subject & Visual Focus
              </label>
              <span className="text-text-muted text-[10px]">
                Describe features like leaf veins, margins, bark, or flora
              </span>
            </div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Bilateral leaf symmetry with pinnate veins and serrated margins"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border-subtle bg-parchment-warm/30 focus:bg-paper-white text-forest-deep focus:outline-none focus:border-forest-deep focus:ring-2 focus:ring-forest-deep/10 font-medium"
            />
          </div>

          {/* Style Presets Grid */}
          <div className="space-y-2">
            <label className="font-bold text-forest-deep uppercase tracking-wider text-[11px] block">
              Naturalist Botanical Style Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {BOTANICAL_STYLE_PRESETS.map((preset) => {
                const isSelected = styleKey === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setStyleKey(preset.key)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-forest-deep bg-forest-deep/5 ring-1 ring-forest-deep shadow-xs'
                        : 'border-border-subtle hover:border-forest-deep/40 bg-paper-white hover:bg-parchment-warm/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{preset.icon}</span>
                      <span className="font-bold text-forest-deep text-xs">
                        {preset.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-tight">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Prompt Override */}
          {styleKey === 'custom' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="font-bold text-forest-deep uppercase tracking-wider text-[11px] block">
                Custom Naturalist AI Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Type your exact customized prompt..."
                rows={3}
                className="w-full p-3 rounded-xl border border-border-subtle bg-parchment-warm/30 focus:bg-paper-white text-forest-deep text-xs font-mono focus:outline-none focus:border-forest-deep focus:ring-2 focus:ring-forest-deep/10"
              />
            </div>
          )}

          {/* Live Full Prompt Preview */}
          <div className="p-3 rounded-xl bg-forest-deep/5 border border-forest-deep/15 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-moss-green uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>Synthesized Naturalist Prompt Pipeline</span>
            </div>
            <p className="text-[11px] text-forest-deep/85 italic leading-relaxed">
              "{activePromptPreview}"
            </p>
          </div>

          {/* Engine & Generation Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-parchment-warm/50 border border-border-subtle text-xs">
            {/* Engine Selection */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-forest-deep">Generator:</span>
              <div className="inline-flex rounded-lg border border-border-subtle bg-paper-white p-0.5">
                <button
                  type="button"
                  onClick={() => setEngine('auto')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    engine === 'auto'
                      ? 'bg-forest-deep text-paper-white shadow-2xs'
                      : 'text-text-muted hover:text-forest-deep'
                  }`}
                  title="AI Synthesis with automatic Naturalist Archive fallback"
                >
                  Auto (AI/Archive)
                </button>
                <button
                  type="button"
                  onClick={() => setEngine('archive')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    engine === 'archive'
                      ? 'bg-forest-deep text-paper-white shadow-2xs'
                      : 'text-text-muted hover:text-forest-deep'
                  }`}
                  title="Query historical Smithsonian & European botanical archives"
                >
                  Museum Archive
                </button>
                <button
                  type="button"
                  onClick={() => setEngine('plates')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    engine === 'plates'
                      ? 'bg-forest-deep text-paper-white shadow-2xs'
                      : 'text-text-muted hover:text-forest-deep'
                  }`}
                  title="Use authenticated Linnaean botanical field plates"
                >
                  Field Plates
                </button>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-forest-deep">Ratio:</span>
              <div className="inline-flex rounded-lg border border-border-subtle bg-paper-white p-0.5">
                <button
                  type="button"
                  onClick={() => setAspect('landscape')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    aspect === 'landscape'
                      ? 'bg-forest-deep text-paper-white shadow-2xs'
                      : 'text-text-muted hover:text-forest-deep'
                  }`}
                >
                  Plate (4:3)
                </button>
                <button
                  type="button"
                  onClick={() => setAspect('square')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    aspect === 'square'
                      ? 'bg-forest-deep text-paper-white shadow-2xs'
                      : 'text-text-muted hover:text-forest-deep'
                  }`}
                >
                  Square (1:1)
                </button>
              </div>
            </div>

            {/* Seed Control */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-forest-deep">Seed:</span>
              <span className="font-mono text-[11px] text-text-muted">#{seed}</span>
              <button
                type="button"
                onClick={handleRandomizeSeed}
                className="p-1 rounded-lg hover:bg-paper-white border border-transparent hover:border-border-subtle text-forest-deep transition-all cursor-pointer"
                title="Randomize seed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            disabled={isGenerating || subject.trim().length === 0}
            onClick={handleGenerate}
            className="w-full py-3.5 rounded-2xl bg-forest-deep hover:bg-forest-dark text-paper-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Wand2 className="w-4 h-4 animate-spin text-leaf-accent" />
                <span>Synthesizing Botanical Plate on Aged Parchment...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-leaf-accent" />
                <span>Generate Botanical Specimen Plate</span>
              </>
            )}
          </button>

          {/* Generated Result Preview Card */}
          {result && (
            <div className="p-4 sm:p-5 rounded-3xl bg-parchment-warm/80 border border-border-subtle space-y-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-forest-deep uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-moss-green" />
                    <span>Botanical Specimen Plate</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {result.model} • #{result.seed}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700 text-white font-bold flex items-center gap-1 shadow-2xs">
                    ✓ Synced to Field Plate
                  </span>
                </div>
                <a
                  href={result.url}
                  download={`botanical-specimen-${result.seed}.jpg`}
                  className="text-[11px] text-forest-deep hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>

              {/* Museum Mount Plate Container */}
              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-border-subtle shadow-md flex items-center justify-center min-h-[220px]">
                <img
                  src={result.url}
                  alt="Botanical Specimen Plate"
                  onError={(e) => {
                    const fallback = getMatchingBotanicalPlate(subject, missionTitle, environment);
                    e.currentTarget.src = fallback.src;
                  }}
                  className="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-2xs border border-border-subtle/60"
                />
              </div>

              {/* 1-Click Curated Botanical Plate Switcher */}
              <div className="pt-2 border-t border-border-subtle/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-forest-deep uppercase tracking-wider flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-moss-green" />
                    <span>Curated Museum Study Plates (1-Click Switch):</span>
                  </span>
                  <span className="text-[10px] text-text-muted">
                    Click to instantly select plate
                  </span>
                </div>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                  {BOTANICAL_FIELD_PLATES.map((p) => {
                    const isSelected = result.url === p.src;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectCuratedPlate(p.src, p.title, p.description)}
                        className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-forest-deep bg-forest-deep/10 ring-1 ring-forest-deep shadow-2xs'
                            : 'border-border-subtle bg-white hover:bg-parchment-warm/60'
                        }`}
                      >
                        <img
                          src={p.src}
                          alt={p.title}
                          className="w-full h-11 object-cover rounded-lg mb-1"
                        />
                        <span className="text-[10px] font-bold text-forest-deep block truncate">
                          {p.shortName}
                        </span>
                        <span className="text-[9px] text-text-muted block truncate">
                          {p.plateNumber}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                {onSetAsReferencePlate && (
                  <button
                    type="button"
                    onClick={() => {
                      onSetAsReferencePlate(result.url, subject, result.promptUsed);
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-forest-deep text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-moss-green" />
                    <span>Set as Reference Guide</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleApplyToMission}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-forest-deep hover:bg-forest-dark text-paper-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
                >
                  {applied ? (
                    <>
                      <Check className="w-4 h-4 text-leaf-accent" />
                      <span>Attached to Mission!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-leaf-accent" />
                      <span>🌿 Attach to Observation Log</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
