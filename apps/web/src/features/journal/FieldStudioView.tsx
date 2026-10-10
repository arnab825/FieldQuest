import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Palette,
  Sparkles,
  Download,
  BookOpen,
  Check,
  RefreshCw,
  Layers,
  Wand2,
  Image as ImageIcon,
  Scroll,
  Microscope,
  Leaf,
  PenTool,
  Feather,
  RectangleHorizontal,
  Square,
  Compass,
  Printer,
} from 'lucide-react';
import {
  BOTANICAL_STYLE_PRESETS,
  BotanicalStyleKey,
  generateCustomBotanicalIllustration,
  CustomIllustrationResult,
  BOTANICAL_FIELD_PLATES,
} from '../../lib/sketch-generator.js';
import { exportCompositeSpecimenFolio } from '../../lib/folio-exporter.js';
import {
  getJournalEntries,
  addJournalEntry,
  JournalEntry,
} from '../../lib/db.js';

const STYLE_ICONS: Record<BotanicalStyleKey, React.ReactNode> = {
  vintage_plate: <Scroll className="w-4 h-4 text-amber-600 shrink-0" />,
  microscopic: <Microscope className="w-4 h-4 text-emerald-600 shrink-0" />,
  herbarium: <Leaf className="w-4 h-4 text-moss-green shrink-0" />,
  journal_sketch: <PenTool className="w-4 h-4 text-teal-600 shrink-0" />,
  copperplate: <Feather className="w-4 h-4 text-stone-600 shrink-0" />,
  custom: <Wand2 className="w-4 h-4 text-indigo-600 shrink-0" />,
};

const QUICK_SUGGESTIONS = [
  { label: 'Bilateral Oak Venation', icon: Leaf },
  { label: 'Sycamore Bark Lichen', icon: Compass },
  { label: 'Dandelion Pappus Seed', icon: Sparkles },
  { label: 'Pitcher Plant Lithograph', icon: Scroll },
  { label: 'Pine Cone Fibonacci Spiral', icon: Layers },
];

export const FieldStudioView: React.FC = () => {
  const [subject, setSubject] = useState('Bilateral oak leaf with pinnate venation');
  const [styleKey, setStyleKey] = useState<BotanicalStyleKey>('vintage_plate');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aspect, setAspect] = useState<'landscape' | 'square'>('landscape');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 899999) + 100000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CustomIllustrationResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loupeActive, setLoupeActive] = useState(true);
  const [isHoveringPlate, setIsHoveringPlate] = useState(false);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, percentX: 50, percentY: 50 });
  const plateContainerRef = React.useRef<HTMLDivElement>(null);

  const handlePlateMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!plateContainerRef.current) return;
    const rect = plateContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (y / rect.height) * 100));
    setLoupePos({ x, y, percentX, percentY });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const loadEntries = async () => {
      const data = await getJournalEntries();
      setEntries(data);
    };
    loadEntries();
  }, []);

  const width = aspect === 'landscape' ? 800 : 768;
  const height = aspect === 'landscape' ? 600 : 768;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSavedSuccess(false);
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
        engine: 'auto',
      });
      setResult(generated);
    } catch (err: any) {
      console.error('Illustration generation failed:', err);
      const fallback = BOTANICAL_FIELD_PLATES[newSeed % BOTANICAL_FIELD_PLATES.length];
      setResult({
        url: fallback.src,
        promptUsed: fallback.description,
        seed: newSeed,
        model: `Curated Field Folio (${fallback.plateNumber})`,
        isBase64: false,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToJournal = async () => {
    if (!result) return;
    const selectedPreset = BOTANICAL_STYLE_PRESETS.find(p => p.key === styleKey);
    const newEntry: JournalEntry = {
      id: `studio-art-${Date.now()}`,
      missionId: `mission-studio-${Date.now()}`,
      missionTitle: subject || 'Botanical Studio Study',
      timestamp: new Date().toISOString(),
      notes: `Studio specimen illustration created in ${selectedPreset?.label || 'Naturalist'} style. Prompt: "${result.promptUsed}".`,
      photoUrl: result.url,
      tags: ['studio', 'illustration', styleKey],
      environment: 'park',
    };
    await addJournalEntry(newEntry);
    setEntries(prev => [newEntry, ...prev]);
    setSavedSuccess(true);
  };

  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `fieldquest-specimen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFolio = async () => {
    if (!result) return;
    const selectedPreset = BOTANICAL_STYLE_PRESETS.find(p => p.key === styleKey);
    await exportCompositeSpecimenFolio({
      id: `studio-${seed}`,
      plateNumber: `Studio Plate #${seed.toString().slice(-4)}`,
      title: subject || 'Botanical Specimen Study',
      subtitle: `${selectedPreset?.label || 'Naturalist Lithograph'} · Seed #${seed}`,
      imageSrc: result.url,
      description:
        result.promptUsed ||
        `Botanical specimen illustration rendered in ${selectedPreset?.label || 'Naturalist'} style.`,
      details: [
        {
          title: 'Morphological Key',
          description: `Observed ${subject.toLowerCase()} structural venation & diagnostic biological adaptations.`,
        },
        {
          title: 'Historical Medium',
          description: `${selectedPreset?.label || 'Naturalist Lithograph'}: scientific lithography & morphological pigments.`,
        },
        {
          title: 'Archival Specimen',
          description: `${aspect === 'landscape' ? '800 × 600' : '768 × 768'} specimen render verified client-side.`,
        },
      ],
    });
  };

  // Collect existing custom sketches from journal
  const archivedSketches = entries.filter(
    e => e.photoUrl && !BOTANICAL_FIELD_PLATES.some(p => p.src === e.photoUrl)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in duration-200">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-border-subtle/70">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-deep/10 text-forest-deep text-xs font-semibold">
            <Palette className="w-3.5 h-3.5 text-moss-green" />
            <span>Creative Botanical Studio</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-forest-deep tracking-tight">
            Field Illustrator Studio
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            Generate authentic scientific lithographs, vintage herbarium studies, and pencil field sketches for any wild specimen.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/journal"
            className="px-4 py-2.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-semibold text-forest-deep flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-moss-green" />
            <span>View Field Journal</span>
          </Link>
        </div>
      </div>

      {/* Main Studio Grid: Left Studio Controls, Right Live Artboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10 items-start">
        {/* Left Column: Studio Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-editorial text-lg font-bold text-forest-deep flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-moss-green" />
              <span>Specimen Art Director</span>
            </h3>

            {/* Specimen Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-forest-deep">
                Specimen Subject / Organism:
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Bilateral ginkgo leaf, crustose bark lichen, pitcher plant"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border-subtle bg-paper-white focus:outline-none focus:border-forest-deep font-medium"
              />
              {/* Quick Subject Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_SUGGESTIONS.map(({ label, icon: SugIcon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSubject(label)}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-parchment-warm hover:bg-forest-deep/10 text-forest-deep transition-all cursor-pointer border border-border-subtle/80 shadow-2xs hover:scale-[1.02]"
                  >
                    <SugIcon className="w-3 h-3 text-moss-green shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Art Style Presets - Fully Responsive with Icons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-forest-deep">
                Historical Art Style:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                {BOTANICAL_STYLE_PRESETS.map((preset) => {
                  const isSelected = styleKey === preset.key;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setStyleKey(preset.key)}
                      className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-forest-deep bg-forest-deep text-paper-white shadow-sm ring-2 ring-forest-deep/20'
                          : 'border-border-subtle bg-paper-white text-forest-deep hover:bg-parchment-warm hover:border-forest-deep/30'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-xl shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-paper-white/20 text-paper-white'
                            : 'bg-forest-deep/5 text-forest-deep'
                        }`}
                      >
                        {STYLE_ICONS[preset.key] || <Palette className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm leading-snug">
                          {preset.label}
                        </div>
                        <div
                          className={`text-[10px] sm:text-[11px] mt-0.5 leading-tight ${
                            isSelected ? 'text-leaf-accent' : 'text-text-muted'
                          }`}
                        >
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio & Seed - Responsive with Icons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-forest-deep mb-1">
                  Format:
                </label>
                <div className="flex gap-1.5">
                  {[
                    { key: 'landscape', label: 'Landscape', icon: RectangleHorizontal },
                    { key: 'square', label: 'Square', icon: Square },
                  ].map(({ key, label, icon: AspIcon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAspect(key as any)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        aspect === key
                          ? 'bg-forest-deep text-paper-white shadow-xs'
                          : 'bg-paper-white text-forest-deep border border-border-subtle hover:bg-parchment-warm'
                      }`}
                    >
                      <AspIcon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-forest-deep mb-1">
                  Random Seed:
                </label>
                <button
                  type="button"
                  onClick={() => setSeed(Math.floor(Math.random() * 899999) + 100000)}
                  className="w-full py-2 px-3 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-bold text-forest-deep flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-moss-green shrink-0" />
                  <span>Seed #{seed}</span>
                </button>
              </div>
            </div>

            {/* Optional Custom Modifier Prompt */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-forest-deep">
                Additional Artistic Details (Optional):
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="e.g. aged yellowish parchment paper, latin taxonomic script"
                className="w-full px-3 py-2 text-xs rounded-xl border border-border-subtle bg-paper-white focus:outline-none focus:border-forest-deep font-medium"
              />
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              disabled={isGenerating || !subject.trim()}
              onClick={handleGenerate}
              className="w-full py-3.5 rounded-xl bg-forest-deep text-paper-white hover:bg-forest-dark text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-leaf-accent ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Rendering Specimen...' : 'Illustrate Specimen Now'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Artboard / Studio Canvas (7 cols, sticky on desktop to prevent awkward empty gap) */}
        <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24">
          <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-moss-green" />
                  <span className="font-editorial text-sm font-bold text-forest-deep">
                    Studio Artboard Canvas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {result && (
                    <button
                      type="button"
                      onClick={() => setLoupeActive(!loupeActive)}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                        loupeActive
                          ? 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-2xs'
                          : 'bg-paper-white text-text-muted border-border-subtle hover:bg-parchment-warm'
                      }`}
                      title="Toggle interactive Victorian magnifying loupe"
                    >
                      <Microscope className="w-3 h-3 text-amber-700" />
                      <span>{loupeActive ? '2.5× Loupe Active' : 'Enable Loupe'}</span>
                    </button>
                  )}
                  {result && (
                    <span className="text-[11px] font-semibold text-moss-green bg-forest-deep/10 px-2.5 py-0.5 rounded-full">
                      {BOTANICAL_STYLE_PRESETS.find(p => p.key === styleKey)?.label || 'Naturalist Lithograph'}
                    </span>
                  )}
                </div>
              </div>

              {/* Artwork Display */}
              <div
                ref={plateContainerRef}
                onMouseMove={handlePlateMouseMove}
                onMouseEnter={() => setIsHoveringPlate(true)}
                onMouseLeave={() => setIsHoveringPlate(false)}
                className={`rounded-2xl overflow-hidden border border-border-subtle bg-parchment-warm/80 min-h-[300px] flex items-center justify-center relative shadow-inner select-none ${
                  result && loupeActive ? 'cursor-crosshair' : ''
                }`}
              >
                {isGenerating ? (
                  <div className="text-center p-8 space-y-3">
                    <Sparkles className="w-10 h-10 text-moss-green animate-spin mx-auto" />
                    <p className="font-editorial text-base font-bold text-forest-deep">
                      Painting Botanical Specimen...
                    </p>
                    <p className="text-xs text-text-muted max-w-xs mx-auto">
                      Applying historical scientific lithography, sepia ink hatching, and morphological pigments.
                    </p>
                  </div>
                ) : result ? (
                  <>
                    <img
                      src={result.url}
                      alt={subject}
                      className="w-full h-auto max-h-[520px] object-contain transition-transform duration-300 pointer-events-none"
                    />

                    {/* Interactive Victorian Naturalist Loupe (Magnifying Glass) */}
                    {loupeActive && isHoveringPlate && (
                      <div
                        className="pointer-events-none absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border-[3.5px] border-amber-700/90 shadow-2xl overflow-hidden z-30 -translate-x-1/2 -translate-y-1/2 ring-2 ring-amber-900/40 bg-parchment-warm"
                        style={{
                          left: `${loupePos.x}px`,
                          top: `${loupePos.y}px`,
                          backgroundImage: `url(${result.url})`,
                          backgroundPosition: `${loupePos.percentX}% ${loupePos.percentY}%`,
                          backgroundSize: '280%',
                          backgroundRepeat: 'no-repeat',
                          boxShadow: 'inset 0 0 16px rgba(45,25,10,0.5), 0 16px 32px rgba(0,0,0,0.35)',
                        }}
                      >
                        {/* Lens specular glare reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/30" />
                        {/* Brass reticle center pip */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-800/60 shadow-xs" />
                        </div>
                      </div>
                    )}

                    {/* Subtle helper hint */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-forest-deep/60 backdrop-blur-xs text-[10px] text-paper-white/90 pointer-events-none hidden sm:block">
                      Hover to magnify specimen (2.5×)
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 space-y-3 max-w-sm">
                    <Palette className="w-12 h-12 text-moss-green/60 mx-auto" />
                    <h4 className="font-editorial text-base font-bold text-forest-deep">
                      Your Canvas is Ready
                    </h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      Type any plant, leaf, seed, or mushroom on the left and click <strong>"Illustrate Specimen Now"</strong> to generate your custom scientific plate.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Artboard Controls (when result is present) */}
            {result && !isGenerating && (
              <div className="pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-text-muted line-clamp-1 max-w-xs">
                  Prompt: <span className="font-medium text-forest-deep">"{result.promptUsed}"</span>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDownloadFolio}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-forest-deep text-paper-white hover:bg-forest-dark text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98] whitespace-nowrap"
                    title="Download complete high-res specimen card with title, description, and diagnostic keys"
                  >
                    <Download className="w-3.5 h-3.5 text-leaf-accent" />
                    <span>Download Folio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-semibold text-forest-deep flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    title="Print archival field plate card or Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-moss-green" />
                    <span>PDF / Print</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex-1 sm:flex-initial px-2.5 py-2 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-medium text-text-muted hover:text-forest-deep flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    title="Download raw image without plate details"
                  >
                    <span>Raw PNG</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToJournal}
                    disabled={savedSuccess}
                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                      savedSuccess
                        ? 'bg-moss-green text-paper-white'
                        : 'bg-forest-deep text-paper-white hover:bg-forest-dark'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-leaf-accent" />
                    <span>{savedSuccess ? 'Saved to Journal!' : 'Save to Journal'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Specimen Field Diagnostics & Study Sheet (Fills layout gap with valuable scientific analysis) */}
          <div className="bg-paper-white rounded-3xl border border-border-subtle p-5 sm:p-6 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-moss-green shrink-0" />
                <span className="font-editorial text-sm font-bold text-forest-deep">
                  Morphological & Diagnostic Identification Keys
                </span>
              </div>
              <span className="text-[10px] font-bold text-moss-green bg-forest-deep/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto">
                Folio #{seed.toString().slice(-4)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-parchment-warm/70 border border-border-subtle/80 space-y-1">
                <span className="font-bold text-forest-deep block text-[11px] flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-moss-green shrink-0" />
                  <span>Morphological Key</span>
                </span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  {result
                    ? `Observed ${subject.toLowerCase()} structural venation & adaptations.`
                    : 'Select any plant or specimen to view diagnostic anatomical criteria.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-parchment-warm/70 border border-border-subtle/80 space-y-1">
                <span className="font-bold text-forest-deep block text-[11px] flex items-center gap-1.5">
                  <Scroll className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Historical Medium</span>
                </span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  {BOTANICAL_STYLE_PRESETS.find(p => p.key === styleKey)?.label || 'Naturalist Lithograph'}: {BOTANICAL_STYLE_PRESETS.find(p => p.key === styleKey)?.description.slice(0, 65) || 'scientific lithography'}...
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-parchment-warm/70 border border-border-subtle/80 space-y-1">
                <span className="font-bold text-forest-deep block text-[11px] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-leaf-accent shrink-0" />
                  <span>Specimen Archival</span>
                </span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  {aspect === 'landscape' ? '800 × 600' : '768 × 768'} resolution study saved locally to IndexedDB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery of Archived Studio Sketches */}
      {archivedSketches.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-border-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-moss-green shrink-0" />
              <h3 className="font-editorial text-lg sm:text-xl font-bold text-forest-deep">
                Archived Specimen Studies ({archivedSketches.length})
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs text-text-muted">
              Artwork stored securely in your browser's IndexedDB
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {archivedSketches.map(item => (
              <div
                key={item.id}
                className="bg-paper-white rounded-2xl border border-border-subtle p-3 shadow-xs space-y-2 hover:border-forest-deep/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="h-44 rounded-xl overflow-hidden bg-parchment-warm border border-border-subtle/60">
                    <img
                      src={item.photoUrl}
                      alt={item.missionTitle || 'Specimen'}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-moss-green uppercase">
                      Field Specimen
                    </span>
                    <h5 className="font-editorial text-sm font-bold text-forest-deep line-clamp-1">
                      {item.missionTitle || 'Botanical Study'}
                    </h5>
                    <p className="text-[11px] text-text-muted line-clamp-2 mt-0.5">
                      {item.notes}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between text-[11px]">
                  <span className="text-text-muted">
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <Link
                    to="/journal"
                    className="text-forest-deep font-semibold hover:underline"
                  >
                    View in Journal →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classical Herbarium Reference Folios Archive */}
      <div className="space-y-6 pt-6 border-t border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-moss-green" />
            <h3 className="font-editorial text-xl font-bold text-forest-deep">
              Classical Herbarium Reference Folios ({BOTANICAL_FIELD_PLATES.length})
            </h3>
          </div>
          <span className="text-xs text-text-muted">
            High-resolution morphological keys & historical scientific lithographs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BOTANICAL_FIELD_PLATES.map(plate => (
            <div
              key={plate.id}
              id={plate.id}
              className="bg-paper-white rounded-3xl border border-border-subtle p-5 shadow-xs space-y-3 hover:border-moss-green/40 transition-all scroll-mt-20"
            >
              <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
                <div>
                  <span className="text-[10px] font-bold text-moss-green uppercase tracking-wider">
                    {plate.plateNumber}
                  </span>
                  <h4 className="font-editorial text-lg font-bold text-forest-deep">
                    {plate.title}
                  </h4>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep">
                  {plate.shortName}
                </span>
              </div>

              <div className="h-56 rounded-2xl overflow-hidden bg-parchment-warm border border-border-subtle relative group">
                <img
                  src={plate.src}
                  alt={plate.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                {plate.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                {plate.details.map((d, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-parchment-warm/60 border border-border-subtle/80 space-y-0.5">
                    <span className="font-bold text-forest-deep block">{d.title}</span>
                    <p className="text-text-muted line-clamp-3 leading-tight">{d.description}</p>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-border-subtle/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSubject(plate.title);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-deep hover:text-moss-green transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-moss-green group-hover:rotate-12 transition-transform" />
                  <span>Use as Inspiration ↑</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() =>
                      exportCompositeSpecimenFolio({
                        id: plate.id,
                        plateNumber: plate.plateNumber,
                        title: plate.title,
                        subtitle: plate.subtitle,
                        imageSrc: plate.src,
                        description: plate.description,
                        details: plate.details,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold hover:bg-forest-dark transition-all cursor-pointer shadow-xs active:scale-[0.98] whitespace-nowrap"
                    title="Download complete high-res specimen card with title, description, and diagnostic keys"
                  >
                    <Download className="w-3.5 h-3.5 text-leaf-accent" />
                    <span>Download Folio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-medium text-forest-deep transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                    title="Print archival field plate or Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-moss-green" />
                    <span>PDF / Print</span>
                  </button>

                  <a
                    href={plate.src}
                    download={`fieldquest-${plate.id}.jpg`}
                    className="p-1.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-text-muted hover:text-forest-deep transition-colors shadow-2xs inline-flex items-center justify-center"
                    title="Download raw original JPG"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-moss-green" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
