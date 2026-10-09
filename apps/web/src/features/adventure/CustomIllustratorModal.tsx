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
} from 'lucide-react';
import {
  BOTANICAL_STYLE_PRESETS,
  BotanicalStyleKey,
  buildCustomPrompt,
  generateCustomBotanicalIllustration,
  CustomIllustrationResult,
  BOTANICAL_FIELD_PLATES,
} from '../../lib/sketch-generator.js';

interface CustomIllustratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  missionTitle: string;
  missionObjective: string;
  currentNotes?: string;
  environment?: string;
  onSelectIllustration: (imageUrl: string) => void;
  onSetAsReferencePlate?: (plateUrl: string, plateTitle: string) => void;
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
  const [model, setModel] = useState<'flux' | 'turbo'>('flux');
  const [aspect, setAspect] = useState<'landscape' | 'square'>('landscape');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 899999) + 100000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CustomIllustrationResult | null>(null);
  const [applied, setApplied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const width = aspect === 'landscape' ? 800 : 768;
  const height = aspect === 'landscape' ? 600 : 768;

  const activePromptPreview = buildCustomPrompt(subject, styleKey, customPrompt);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setApplied(false);

    try {
      const generated = await generateCustomBotanicalIllustration({
        subject,
        styleKey,
        customPrompt,
        seed,
        width,
        height,
        model,
      });
      setResult(generated);
    } catch (err: any) {
      console.error('Illustration generation failed:', err);
      setErrorMsg('Could not reach Pollinations AI. You can pick an authentic curated botanical plate below.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomizeSeed = () => {
    setSeed(Math.floor(Math.random() * 899999) + 100000);
  };

  const handleApplyToMission = () => {
    if (!result) return;
    onSelectIllustration(result.url);
    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const handleUseCuratedFallback = (plateSrc: string) => {
    onSelectIllustration(plateSrc);
    onClose();
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
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Pollinations Flux
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
        <div className="overflow-y-auto py-4 space-y-5 pr-1 text-xs sm:text-sm">
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

          {/* Custom Prompt Override if "custom" is selected or explorer wants to edit */}
          {styleKey === 'custom' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="font-bold text-forest-deep uppercase tracking-wider text-[11px] block">
                Custom Naturalist AI Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Type your exact customized prompt for Pollinations AI..."
                rows={3}
                className="w-full p-3 rounded-xl border border-border-subtle bg-parchment-warm/30 focus:bg-paper-white text-forest-deep text-xs font-mono focus:outline-none focus:border-forest-deep focus:ring-2 focus:ring-forest-deep/10"
              />
            </div>
          )}

          {/* Live Full Prompt Preview */}
          <div className="p-3 rounded-xl bg-forest-deep/5 border border-forest-deep/15 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-moss-green uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>Synthesized AI Prompt Pipeline</span>
            </div>
            <p className="text-[11px] text-forest-deep/85 italic leading-relaxed">
              "{activePromptPreview}"
            </p>
          </div>

          {/* Parameters Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-parchment-warm/50 border border-border-subtle text-xs">
            {/* Model Selection */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-forest-deep">Model:</span>
              <div className="inline-flex rounded-lg border border-border-subtle bg-paper-white p-0.5">
                <button
                  type="button"
                  onClick={() => setModel('flux')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    model === 'flux'
                      ? 'bg-forest-deep text-paper-white shadow-2xs'
                      : 'text-text-muted hover:text-forest-deep'
                  }`}
                >
                  Flux (High-Fi)
                </button>
                <button
                  type="button"
                  onClick={() => setModel('turbo')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    model === 'turbo'
                      ? 'bg-forest-deep text-paper-white shadow-2xs'
                      : 'text-text-muted hover:text-forest-deep'
                  }`}
                >
                  Turbo (Fast)
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

          {/* Error / Fallback Card */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-3">
              <p className="font-medium text-xs">{errorMsg}</p>
              <div>
                <span className="text-[11px] font-bold text-amber-900 block mb-2">
                  Select from Authentic Curated Botanical Plates:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BOTANICAL_FIELD_PLATES.slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleUseCuratedFallback(p.src)}
                      className="p-1.5 rounded-xl border border-amber-300/80 bg-white hover:bg-amber-100/60 text-left transition-all cursor-pointer group"
                    >
                      <img
                        src={p.src}
                        alt={p.title}
                        className="w-full h-16 object-cover rounded-lg mb-1"
                      />
                      <span className="text-[10px] font-bold text-forest-deep block truncate">
                        {p.shortName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generated Result Preview Card */}
          {result && (
            <div className="p-4 sm:p-5 rounded-3xl bg-parchment-warm/80 border border-border-subtle space-y-4 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-forest-deep uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-moss-green" />
                    <span>Generated Botanical Specimen Plate</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                    {result.model} • #{result.seed}
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
              <div className="p-3 sm:p-4 rounded-2xl bg-white border border-border-subtle shadow-md flex items-center justify-center">
                <img
                  src={result.url}
                  alt="AI Illustrated Botanical Specimen"
                  className="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-2xs border border-border-subtle/60"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
                {onSetAsReferencePlate && (
                  <button
                    type="button"
                    onClick={() => {
                      onSetAsReferencePlate(result.url, subject);
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
