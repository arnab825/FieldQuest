import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Layers,
  BookOpen,
  Palette,
  Search,
  Compass,
} from 'lucide-react';
import {
  getJournalEntries,
  addJournalEntry,
  JournalEntry,
} from '../../lib/db.js';
import {
  BOTANICAL_FIELD_PLATES,
  BotanicalPlateInfo,
} from '../../lib/sketch-generator.js';
import { FilterBar } from '../../components/common/FilterBar.js';
import { CustomIllustratorModal } from '../adventure/CustomIllustratorModal.js';

export const BotanicalFolioView: React.FC = () => {
  const location = useLocation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedPlateId, setSelectedPlateId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'curated' | 'specimens'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isIllustratorOpen, setIsIllustratorOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const loadEntries = async () => {
      const allEntries = await getJournalEntries();
      setEntries(allEntries);
    };
    loadEntries();
  }, []);

  // Handle URL hash jumping (e.g. /plates#plate-1)
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      setSelectedPlateId(hash);
    }
  }, [location.hash]);

  // Dynamically include illustrated observation plates from the user's journal
  const customIllustratedPlates: BotanicalPlateInfo[] = entries
    .filter(e => e.photoUrl && !BOTANICAL_FIELD_PLATES.some(p => p.src === e.photoUrl))
    .map((e, idx) => ({
      id: `custom-plate-${e.id}`,
      plateNumber: `Field Specimen #${idx + 1}`,
      shortName: e.missionTitle ? e.missionTitle.split(/[:\s]/)[0] : `Specimen ${idx + 1}`,
      title: e.missionTitle || 'Naturalist Field Specimen Observation',
      subtitle: `Authentic Illustrated Field Specimen • ${e.environment ? e.environment.toUpperCase() : 'BOTANICAL STUDY'}`,
      src: e.photoUrl!,
      keywords: e.tags || [],
      description: e.notes ? (e.notes.length > 160 ? e.notes.slice(0, 160) + '...' : e.notes) : 'Scientific specimen plate generated from naturalist field observation.',
      details: [
        {
          title: 'Field Observation Notes',
          description: e.notes ? (e.notes.length > 140 ? e.notes.slice(0, 140) + '...' : e.notes) : 'Visual specimen record.',
        },
        {
          title: 'Exploration Habitat',
          description: e.environment ? `Recorded in local ${e.environment} environment.` : 'Local field exploration habitat.',
        },
        {
          title: 'Specimen Provenance',
          description: `Archived in local IndexedDB on ${new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}.`,
        },
      ],
    }));

  const allAvailablePlates: BotanicalPlateInfo[] = [
    ...customIllustratedPlates,
    ...BOTANICAL_FIELD_PLATES,
  ];

  // Filter plates by category and search
  const filteredPlates = allAvailablePlates.filter(plate => {
    const isCustom = plate.id.startsWith('custom-plate-');
    if (filterCategory === 'curated' && isCustom) return false;
    if (filterCategory === 'specimens' && !isCustom) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = plate.title.toLowerCase().includes(q);
      const matchPlateNum = plate.plateNumber.toLowerCase().includes(q);
      const matchDesc = plate.description.toLowerCase().includes(q);
      const matchKeywords = plate.keywords?.some(k => k.toLowerCase().includes(q));
      return matchTitle || matchPlateNum || matchDesc || matchKeywords;
    }
    return true;
  });

  const displayedPlates = selectedPlateId
    ? filteredPlates.filter(p => p.id === selectedPlateId)
    : filteredPlates;

  const handleSaveStudioIllustration = async (imageUrl: string, subject?: string) => {
    // Save to user journal entries as a standalone specimen plate
    const newEntry: JournalEntry = {
      id: `studio-specimen-${Date.now()}`,
      missionId: `mission-studio-${Date.now()}`,
      missionTitle: subject || 'Botanical Studio Specimen',
      timestamp: new Date().toISOString(),
      notes: `Illustrated in Botanical Field Studio. Subject: ${subject || 'Botanical specimen'}.`,
      photoUrl: imageUrl,
      tags: ['studio', 'botanical', 'illustration'],
      environment: 'park',
    };
    await addJournalEntry(newEntry);
    setEntries(prev => [newEntry, ...prev]);
    setIsIllustratorOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-in fade-in duration-200">
      {/* Folio Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b border-border-subtle/70">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-deep/10 text-forest-deep text-xs font-semibold">
            <Layers className="w-3.5 h-3.5 text-moss-green" />
            <span>Scientific Reference Archive & Herbarium</span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-forest-deep tracking-tight">
            Botanical Field Plates
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            High-resolution diagnostic folios, anatomical lithographs, and your archived specimen illustrations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 self-start lg:self-end">
          <button
            type="button"
            onClick={() => setIsIllustratorOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-forest-deep text-paper-white hover:bg-forest-dark text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Palette className="w-4 h-4 text-leaf-accent" />
            <span>Illustrate New Specimen</span>
          </button>

          <Link
            to="/journal"
            className="px-4 py-2.5 rounded-xl border border-border-subtle bg-paper-white hover:bg-parchment-warm text-xs font-semibold text-forest-deep flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-moss-green" />
            <span>View Field Journal</span>
          </Link>
        </div>
      </div>

      {/* Folio Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-paper-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-moss-green text-xs font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>Total Available Plates</span>
          </div>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            {allAvailablePlates.length}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            {BOTANICAL_FIELD_PLATES.length} scientific folios • {customIllustratedPlates.length} illustrated specimens
          </p>
        </div>

        <div className="bg-paper-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-moss-green text-xs font-semibold mb-1">
            <Palette className="w-4 h-4" />
            <span>Archived Field Sketches</span>
          </div>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            {customIllustratedPlates.length}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Generated from your personal field observations
          </p>
        </div>

        <div className="bg-paper-white rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-2 text-moss-green text-xs font-semibold mb-1">
            <Compass className="w-4 h-4" />
            <span>Diagnostic Keys</span>
          </div>
          <div className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
            {BOTANICAL_FIELD_PLATES.length * 3}
          </div>
          <p className="text-[11px] text-text-muted mt-0.5">
            Anatomical & morphological identification keys
          </p>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-paper-white/90 backdrop-blur-xs p-3 rounded-2xl border border-border-subtle shadow-xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-parchment-warm/80 rounded-xl border border-border-subtle/80">
            {[
              { id: 'all', label: `All Plates (${allAvailablePlates.length})` },
              { id: 'curated', label: `Curated Folios (${BOTANICAL_FIELD_PLATES.length})` },
              { id: 'specimens', label: `Field Sketches (${customIllustratedPlates.length})` },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setFilterCategory(cat.id as any);
                  setSelectedPlateId(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterCategory === cat.id
                    ? 'bg-forest-deep text-paper-white shadow-2xs font-bold'
                    : 'text-text-muted hover:text-forest-deep'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search venation, bark, lichen..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border-subtle bg-paper-white focus:outline-none focus:border-forest-deep"
            />
          </div>
        </div>

        {/* Quick Filter Bar across matching plates */}
        {filteredPlates.length > 0 && (
          <div className="pt-2 border-t border-border-subtle/60">
            <FilterBar
              label={
                <span className="text-[11px] font-bold text-forest-deep flex items-center gap-1.5 shrink-0 select-none">
                  <Layers className="w-3.5 h-3.5 text-moss-green" />
                  <span>Folio:</span>
                </span>
              }
              allOption={{
                id: 'all',
                label: 'Show All',
                count: filteredPlates.length,
              }}
              items={filteredPlates.map(plate => ({
                id: plate.id,
                label: `${plate.plateNumber}: ${plate.shortName}`,
              }))}
              selectedId={selectedPlateId || 'all'}
              onSelect={(id) => setSelectedPlateId(id === 'all' ? null : id)}
              variant="pills"
              size="md"
            />
          </div>
        )}
      </div>

      {/* Focus Reset Status */}
      {selectedPlateId && (
        <div className="flex items-center justify-between text-xs px-1 mb-4">
          <span className="text-text-muted">
            Viewing focused scientific plate: <strong>{displayedPlates[0]?.plateNumber}</strong>
          </span>
          <button
            type="button"
            onClick={() => setSelectedPlateId(null)}
            className="text-forest-deep hover:underline font-semibold cursor-pointer"
          >
            Show all {filteredPlates.length} matching plates →
          </button>
        </div>
      )}

      {/* Plates Grid */}
      {displayedPlates.length === 0 ? (
        <div className="bg-paper-white rounded-3xl border border-border-subtle p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-moss-green mx-auto opacity-50" />
          <h3 className="font-editorial text-lg font-bold text-forest-deep">
            No Plates Match Your Selection
          </h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Try resetting your search query or generate your first field sketch using the Botanical Illustrator.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterCategory('all');
              setSearchQuery('');
              setSelectedPlateId(null);
            }}
            className="px-4 py-2 rounded-xl bg-forest-deep text-paper-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedPlates.map((plate) => {
            const isSelected = selectedPlateId === plate.id;
            const isCustomFieldPlate = plate.id.startsWith('custom-plate-');

            return (
              <div
                key={plate.id}
                id={plate.id}
                className={`bg-paper-white rounded-3xl border p-6 sm:p-7 shadow-xs space-y-5 transition-all scroll-mt-6 ${
                  isSelected
                    ? 'border-moss-green ring-4 ring-moss-green/20 shadow-md'
                    : 'border-border-subtle hover:border-forest-deep/30'
                }`}
              >
                {/* Plate Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-moss-green block">
                        Scientific Folio • {plate.plateNumber}
                      </span>
                      {isCustomFieldPlate ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-paper-white flex items-center gap-1">
                          <Palette className="w-3 h-3 text-leaf-accent" />
                          <span>Archived Field Specimen</span>
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-forest-deep/10 text-forest-deep">
                          Curated Scientific Plate
                        </span>
                      )}
                    </div>
                    <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-forest-deep">
                      {plate.title}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-forest-deep/10 text-forest-deep self-start sm:self-auto shrink-0">
                    {plate.subtitle}
                  </span>
                </div>

                {/* High-Resolution Plate Image */}
                <div className="rounded-2xl overflow-hidden border border-border-subtle bg-parchment-warm relative group">
                  <img
                    src={plate.src}
                    alt={plate.title}
                    className="w-full h-auto object-cover max-h-[560px] transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-forest-dark/80 backdrop-blur-xs text-paper-white text-[10px] px-2.5 py-1 rounded-lg">
                    High-Resolution Folio Plate
                  </div>
                </div>

                {/* Morphological Diagnostic Keys */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forest-deep flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-moss-green" />
                    <span>Morphological Diagnostic Keys & Field Anatomy</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {plate.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-parchment-warm/60 border border-border-subtle space-y-1"
                      >
                        <span className="font-bold text-forest-deep block">
                          {detail.title}
                        </span>
                        <p className="text-text-muted leading-relaxed text-[11px]">
                          {detail.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plate Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-text-muted border-t border-border-subtle/60">
                  <p className="italic text-[11px] max-w-lg">
                    {plate.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/journal"
                      className="inline-flex items-center gap-1 font-semibold text-forest-deep hover:underline cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-moss-green" />
                      <span>View in Field Journal</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Botanical Illustrator Studio Modal */}
      {isIllustratorOpen && (
        <CustomIllustratorModal
          isOpen={isIllustratorOpen}
          onClose={() => setIsIllustratorOpen(false)}
          missionTitle="Botanical Studio Specimen"
          missionObjective="Create an authentic botanical field illustration"
          environment="park"
          onSelectIllustration={(imageUrl, subject) => handleSaveStudioIllustration(imageUrl, subject)}
        />
      )}
    </div>
  );
};
