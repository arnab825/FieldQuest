/**
 * Utility to generate botanical specimen illustrations from written field descriptions.
 * Uses open historical naturalist specimen collections with vintage scientific prompt tuning,
 * converting results to local Base64 for permanent offline IndexedDB storage.
 * Automatically falls back to authentic curated scientific botanical field plates
 * if offline.
 */

export interface BotanicalPlateInfo {
  id: string;
  plateNumber: string;
  shortName: string;
  title: string;
  subtitle: string;
  src: string;
  keywords: string[];
  description: string;
  details: {
    title: string;
    description: string;
  }[];
}

export const BOTANICAL_FIELD_PLATES: BotanicalPlateInfo[] = [
  {
    id: 'plate-leaf-venation',
    plateNumber: 'Plate I',
    shortName: 'Venation',
    title: 'Leaf Venation Patterns & Bilateral Symmetry',
    subtitle: 'Botanical Morphology & Venation Architecture',
    src: '/leaf_venation_reference.jpg',
    keywords: [
      'leaf', 'leaves', 'vein', 'venation', 'midrib', 'pinnate', 'palmate', 'parallel',
      'reticulate', 'netted', 'symmetry', 'bilateral', 'petiole', 'stem', 'foliage', 'chlorophyll',
      'branching pattern'
    ],
    description: 'Pinnate, Palmate, and Parallel leaf venation structures with morphological symmetry diagrams.',
    details: [
      {
        title: '1. Pinnate (Feather-like)',
        description: 'A prominent central midrib with secondary veins branching laterally (e.g. Oak, Beech, Elm).'
      },
      {
        title: '2. Palmate (Hand-like)',
        description: 'Multiple primary veins radiating from the leaf base like fingers from a palm (e.g. Maple, Ivy).'
      },
      {
        title: '3. Parallel (Monocot)',
        description: 'Longitudinal veins running parallel along the leaf blade length (e.g. Grasses, Plantain, Irises).'
      }
    ]
  },
  {
    id: 'plate-bark-lichen',
    plateNumber: 'Plate II',
    shortName: 'Bark & Lichen',
    title: 'Tree Bark Textures & Lichen Growth Forms',
    subtitle: 'Symbiotic Bioindicators & Corticolous Microhabitats',
    src: '/bark_lichen_reference.jpg',
    keywords: [
      'bark', 'lichen', 'tree', 'trunk', 'foliose', 'crustose', 'fruticose', 'wood',
      'furrow', 'moss', 'symbiosis', 'fungus', 'algae', 'rhizine', 'cortex'
    ],
    description: 'Foliose and crustose growth forms on fissured and furrowed bark microhabitats.',
    details: [
      {
        title: 'Foliose Lichens',
        description: 'Leaf-like, loosely attached lobed structures with distinct upper and lower surfaces (e.g. Parmelia).'
      },
      {
        title: 'Crustose Lichens',
        description: 'Crust-like patches tightly adhered to rock or bark surfaces, inseparable without damaging substrate.'
      },
      {
        title: 'Furrowed Bark Microhabitats',
        description: 'Deep vertical fissures retain moisture and shelter microscopic invertebrates and moss cushions.'
      }
    ]
  },
  {
    id: 'plate-canopy-acoustic',
    plateNumber: 'Plate III',
    shortName: 'Canopy',
    title: 'Canopy Acoustic Layering & Avian Study',
    subtitle: 'Bioacoustics & Arboreal Stratification',
    src: '/canopy_acoustic.jpg',
    keywords: [
      'canopy', 'acoustic', 'sound', 'audio', 'bird', 'avian', 'song', 'call',
      'branch', 'foliage', 'singing', 'perch', 'strata', 'chirp', 'listen', 'vocal'
    ],
    description: 'Sound propagation across canopy tiers and bird perching strategies.',
    details: [
      {
        title: 'Emergent Tier Vocalization',
        description: 'High-frequency broadcast territorial calls penetrate through open air above the forest canopy.'
      },
      {
        title: 'Mid-Canopy Reverberation',
        description: 'Denser branch leaves attenuate directional acoustics, favoring whistle tones and rhythmic pulses.'
      },
      {
        title: 'Understory Micro-calls',
        description: 'Soft contact calls and ground-scratching acoustic signatures within low shrub layers.'
      }
    ]
  },
  {
    id: 'plate-urban-microhabitat',
    plateNumber: 'Plate IV',
    shortName: 'Urban Flora',
    title: 'Urban Microhabitat & Pavement Flora',
    subtitle: 'Pioneer Plants & Anthropogenic Micro-ecology',
    src: '/urban_microhabitat.jpg',
    keywords: [
      'urban', 'city', 'pavement', 'crack', 'wall', 'brick', 'sidewalk',
      'microhabitat', 'concrete', 'weed', 'succulent', 'crevice', 'asphalt', 'stone', 'masonry'
    ],
    description: 'Pavement crevices, mortar niches, and urban pioneer plant communities.',
    details: [
      {
        title: 'Pavement Crevice Colonizers',
        description: 'Tap-rooted ruderal plants (e.g. Dandelion, Plantain) anchor deeply into compacted gravel.'
      },
      {
        title: 'Mortar & Brick Bryophytes',
        description: 'Calciphilic mosses thrive on lime mortar moisture seepage along north-facing walls.'
      },
      {
        title: 'Urban Bio-reflectance',
        description: 'Thermal mass of concrete creates elevated microclimates supporting prolonged growth cycles.'
      }
    ]
  },
  {
    id: 'plate-botanical-herbarium',
    plateNumber: 'Plate V',
    shortName: 'Herbarium',
    title: 'Botanical Specimen & Herbarium Field Study',
    subtitle: 'Naturalist Herbarium & Floral Morphology',
    src: '/botanical_hero.jpg',
    keywords: [
      'flower', 'specimen', 'plant', 'botanical', 'herbarium', 'petal', 'flora',
      'root', 'garden', 'nature', 'blossom', 'sepal', 'stamen', 'pistil', 'stem', 'wildflower'
    ],
    description: 'Field herbarium specimen mounting and anatomical floral taxonomy study.',
    details: [
      {
        title: 'Floral Morphology Study',
        description: 'Sepals, petals, stamens, and pistil anatomical dissection for precise species classification.'
      },
      {
        title: 'Herbarium Pressing Standards',
        description: 'Specimens dried between absorbent sheets to preserve diagnostic venation and petal geometry.'
      },
      {
        title: 'Phenological Record-Keeping',
        description: 'Documenting seasonal bud burst, anthesis, seed formation, and pollinator interactions.'
      }
    ]
  },
  {
    id: 'plate-leaf-margins',
    plateNumber: 'Plate VI',
    shortName: 'Margins',
    title: 'Leaf Margin Architecture & Edge Morphology',
    subtitle: 'Margin Types & Blade Boundary Taxonomy',
    src: '/leaf_margins_reference.jpg',
    keywords: [
      'margin', 'margins', 'edge', 'edges', 'entire', 'smooth', 'serrated', 'serrate',
      'toothed', 'teeth', 'dentate', 'lobed', 'crenate', 'sinus', 'sinuses', 'boundary',
      'notches', 'saw-like', 'leaf margins'
    ],
    description: 'Entire (smooth), Serrate (saw-toothed), Dentate, Crenate, and Lobed blade boundaries with diagnostic edge anatomy.',
    details: [
      {
        title: '1. Smooth (Entire)',
        description: 'Smooth, uninterrupted outer perimeter without teeth, notches, or serration (e.g. Lilac, Dogwood, Magnolia).'
      },
      {
        title: '2. Serrated (Toothed & Dentate)',
        description: 'Saw-like sharp teeth pointing toward the apex or outward along the blade perimeter (e.g. Birch, Elm, Cherry).'
      },
      {
        title: '3. Lobed & Sinuate',
        description: 'Deep indentations or rounded lobes dividing the leaf blade lamina with pronounced sinuses (e.g. Oak, Maple).'
      }
    ]
  },
  {
    id: 'plate-leaf-surface',
    plateNumber: 'Plate VII',
    shortName: 'Surface',
    title: 'Leaf Surface Anatomy & Micro-Morphology',
    subtitle: 'Cuticular Wax, Trichomes & Stomatal Architecture',
    src: '/leaf_surface_reference.jpg',
    keywords: [
      'surface', 'cuticle', 'wax', 'waxiness', 'hydrophobic', 'trichome', 'trichomes',
      'hair', 'hairs', 'pubescence', 'pubescent', 'velvety', 'glabrous', 'stomata',
      'epidermis', 'guard cells', 'coating', 'surface properties'
    ],
    description: 'Microscopic and macro surface features including epicuticular wax layers, defensive trichomes, and stomatal complexes.',
    details: [
      {
        title: '1. Waxiness / Cuticle',
        description: 'Shiny, glossy hydrophobic coating on top vs. matte underside; lipid cuticle seals water and repels rain droplets.'
      },
      {
        title: '2. Trichomes (Foliar Hairs)',
        description: 'Fine hairs or velvety texture on leaf surfaces serving as a defense barrier against wind desiccation and insects.'
      },
      {
        title: '3. Stomatal Complexes & Pavement',
        description: 'Microscopic pores and guard cells regulating transpiration and gas exchange across the epidermal blade layer.'
      }
    ]
  }
];

/**
 * Intelligently match an observation note or mission to the most relevant
 * authentic scientific botanical field plate.
 */
export function getMatchingBotanicalPlate(
  description?: string,
  title?: string,
  environment?: string
): BotanicalPlateInfo {
  const noteText = (description || '').toLowerCase();
  const titleText = (title || '').toLowerCase();
  const envText = (environment || '').toLowerCase();

  // 1. Direct decisive keyword routing based on the naturalist's actual written field notes
  if (
    noteText.includes('margin') ||
    noteText.includes('serrate') ||
    noteText.includes('dentate') ||
    noteText.includes('lobed') ||
    noteText.includes('crenate') ||
    noteText.includes('sinus')
  ) {
    return BOTANICAL_FIELD_PLATES[5]; // Plate VI: Margins
  }
  if (
    noteText.includes('surface') ||
    noteText.includes('cuticle') ||
    noteText.includes('wax') ||
    noteText.includes('trichome') ||
    noteText.includes('pubescen') ||
    noteText.includes('stomata')
  ) {
    return BOTANICAL_FIELD_PLATES[6]; // Plate VII: Surface
  }
  if (
    noteText.includes('vein') ||
    noteText.includes('venation') ||
    noteText.includes('symmetry') ||
    noteText.includes('pinnate') ||
    noteText.includes('palmate') ||
    noteText.includes('parallel') ||
    noteText.includes('midrib')
  ) {
    return BOTANICAL_FIELD_PLATES[0]; // Plate I: Venation
  }
  if (
    noteText.includes('bark') ||
    noteText.includes('lichen') ||
    noteText.includes('trunk') ||
    noteText.includes('furrow') ||
    noteText.includes('foliose') ||
    noteText.includes('crustose')
  ) {
    return BOTANICAL_FIELD_PLATES[1]; // Plate II: Bark & Lichen
  }
  if (
    noteText.includes('sound') ||
    noteText.includes('acoustic') ||
    noteText.includes('listen') ||
    noteText.includes('avian') ||
    noteText.includes('bird') ||
    noteText.includes('canopy') ||
    noteText.includes('vocal')
  ) {
    return BOTANICAL_FIELD_PLATES[2]; // Plate III: Canopy Bioacoustics
  }
  if (
    noteText.includes('pavement') ||
    noteText.includes('crack') ||
    noteText.includes('crevice') ||
    noteText.includes('mortar') ||
    noteText.includes('sidewalk') ||
    noteText.includes('brick') ||
    noteText.includes('concrete')
  ) {
    return BOTANICAL_FIELD_PLATES[3]; // Plate IV: Urban Microhabitat
  }
  if (
    noteText.includes('flower') ||
    noteText.includes('petal') ||
    noteText.includes('herbarium') ||
    noteText.includes('sepal') ||
    noteText.includes('stamen')
  ) {
    return BOTANICAL_FIELD_PLATES[4]; // Plate V: Herbarium
  }

  // 2. High-precision scored matching weighting noteText 5x higher than title and environment
  let bestMatch = BOTANICAL_FIELD_PLATES[0];
  let highestScore = -1;

  for (const plate of BOTANICAL_FIELD_PLATES) {
    let score = 0;
    for (const kw of plate.keywords) {
      if (noteText.includes(kw)) {
        score += (kw.length > 5 ? 4 : 2) * 5; // 5x weight for field notes!
      }
      if (titleText.includes(kw)) {
        score += kw.length > 5 ? 3 : 1;
      }
      if (envText.includes(kw)) {
        score += 1;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = plate;
    }
  }

  if (highestScore > 0) {
    return bestMatch;
  }

  // 3. Title-based Fallbacks
  const combinedText = `${titleText} ${envText}`.toLowerCase();
  if (combinedText.includes('bark') || combinedText.includes('tree') || combinedText.includes('lichen')) {
    return BOTANICAL_FIELD_PLATES[1];
  }
  if (combinedText.includes('sound') || combinedText.includes('bird') || combinedText.includes('canopy')) {
    return BOTANICAL_FIELD_PLATES[2];
  }
  if (combinedText.includes('urban') || combinedText.includes('city') || combinedText.includes('wall')) {
    return BOTANICAL_FIELD_PLATES[3];
  }
  if (combinedText.includes('margin') || combinedText.includes('serrate') || combinedText.includes('toothed') || combinedText.includes('lobed') || combinedText.includes('edge')) {
    return BOTANICAL_FIELD_PLATES[5];
  }
  if (combinedText.includes('surface') || combinedText.includes('cuticle') || combinedText.includes('wax') || combinedText.includes('trichome') || combinedText.includes('hair')) {
    return BOTANICAL_FIELD_PLATES[6];
  }
  if (combinedText.includes('leaf') || combinedText.includes('symmetry') || combinedText.includes('vein')) {
    return BOTANICAL_FIELD_PLATES[0];
  }

  return BOTANICAL_FIELD_PLATES[4]; // Botanical Specimen Study default
}

/**
 * Generate or re-illustrate a vintage naturalist botanical illustration.
 * Attempts Pollinations AI with vintage naturalist prompt tuning first,
 * seamlessly falls back to open historical naturalist archives and authentic field plates.
 * Converts resulting images to Base64 for permanent offline IndexedDB storage.
 */
export async function generateBotanicalSketch(
  description: string,
  title?: string,
  environment?: string,
  currentPhotoUrl?: string
): Promise<string> {
  const matchedPlate = getMatchingBotanicalPlate(description, title, environment);

  const cleanText = (description || '')
    .replace(/[A-Z][A-Za-z0-9\s()/-]{2,25}:/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

  const combined = `${title || ''} ${environment || ''} ${cleanText}`.toLowerCase();

  // 1. Try Pollinations AI (clean URL without paywalled params)
  try {
    const subject = cleanText || title || matchedPlate.title;
    const cleanPrompt = `vintage botanical watercolor specimen of ${subject}, antique naturalist scientific plate on aged parchment, botanical morphology study, elegant flora art, detailed biological illustration`;
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt.slice(0, 160))}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(pollUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
      const blob = await res.blob();
      if (blob.size > 2000) {
        return await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string) || pollUrl);
          reader.onerror = () => resolve(pollUrl);
          reader.readAsDataURL(blob);
        });
      }
    }
  } catch {
    // Pollinations AI unavailable or paywalled; proceed to open historical botanical archive
  }

  // 2. Query open naturalist botanical archive (Wikimedia Commons)
  let queryKeyword = 'botanical illustration plate';
  if (combined.includes('margin') || combined.includes('serrate') || combined.includes('dentate') || combined.includes('lobed')) {
    queryKeyword = 'leaf margin botanical';
  } else if (combined.includes('cuticle') || combined.includes('wax') || combined.includes('trichome') || combined.includes('stomata')) {
    queryKeyword = 'leaf anatomy';
  } else if (combined.includes('leaf') || combined.includes('symmetry') || combined.includes('vein')) {
    queryKeyword = 'leaf venation';
  } else if (combined.includes('bark') || combined.includes('tree') || combined.includes('lichen')) {
    queryKeyword = 'tree bark';
  } else if (combined.includes('canopy') || combined.includes('bird') || combined.includes('sound') || combined.includes('acoustic')) {
    queryKeyword = 'natural history bird illustration';
  } else if (combined.includes('flower') || combined.includes('petal') || combined.includes('herbarium')) {
    queryKeyword = 'herbarium specimen plant';
  }

  try {
    const wmUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      queryKeyword
    )}&gsrnamespace=6&gsrlimit=20&prop=pageimages&pithumbsize=960&format=json&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(wmUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {});
      const candidates = pages
        .map((p: any) => p.thumbnail?.source)
        .filter(
          (src: string) =>
            src &&
            !src.includes('.pdf') &&
            !src.includes('.djvu') &&
            !src.includes('.gif') &&
            src !== currentPhotoUrl
        );

      if (candidates.length > 0) {
        const chosenUrl = candidates[Math.floor(Math.random() * candidates.length)];
        try {
          const imgRes = await fetch(chosenUrl);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            if (blob.size > 2000 && blob.type.startsWith('image/')) {
              return await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string) || chosenUrl);
                reader.onerror = () => resolve(chosenUrl);
                reader.readAsDataURL(blob);
              });
            }
          }
        } catch {
          return chosenUrl;
        }
      }
    }
  } catch (err) {
    console.warn('Archive illustration search error or timeout:', err);
  }

  // 3. Guaranteed Fallback: Authentically matched botanical field plate
  const alternativePlates = BOTANICAL_FIELD_PLATES.filter((p) => p.src !== currentPhotoUrl);
  if (alternativePlates.length > 0 && currentPhotoUrl === matchedPlate.src) {
    const nextPlate = alternativePlates[Math.floor(Math.random() * alternativePlates.length)];
    return nextPlate.src;
  }

  return matchedPlate.src;
}

export type BotanicalStyleKey =
  | 'vintage_plate'
  | 'microscopic'
  | 'herbarium'
  | 'journal_sketch'
  | 'copperplate'
  | 'custom';

export interface BotanicalStyleOption {
  key: BotanicalStyleKey;
  label: string;
  icon: string;
  description: string;
  promptSuffix: string;
}

export const BOTANICAL_STYLE_PRESETS: BotanicalStyleOption[] = [
  {
    key: 'vintage_plate',
    label: 'Vintage Naturalist Plate',
    icon: '📜',
    description: 'Aged parchment, Linnaean Latin taxonomy, copperplate watercolor engraving',
    promptSuffix:
      'vintage botanical watercolor specimen, antique naturalist scientific plate on aged parchment, botanical morphology study, elegant flora art, detailed biological illustration, scientific plate taxonomy labels',
  },
  {
    key: 'microscopic',
    label: 'Microscopic & Venation Anatomy',
    icon: '🔬',
    description: 'Vascular bundles, cellular stomata, translucent venation, botanical slide',
    promptSuffix:
      'botanical microscopic cellular anatomy illustration, high detail botanical cross section, translucent plant cells, leaf stomata and vascular bundles, illuminated science microscopy plate',
  },
  {
    key: 'herbarium',
    label: 'Pressed Herbarium Specimen',
    icon: '🌿',
    description: 'Dried mounted plant specimen on archival paper with museum catalog tag',
    promptSuffix:
      'pressed botanical herbarium specimen study, mounted on archival cream herbarium paper, dried plant taxonomy sheet, Linnaean specimen label, botanical museum archive',
  },
  {
    key: 'journal_sketch',
    label: 'Naturalist Journal Sketch',
    icon: '🎨',
    description: 'Field notes in ink, delicate sepia and moss green watercolor wash',
    promptSuffix:
      'field naturalist journal entry sketch, handwritten field observation notes, delicate sepia and moss green watercolor wash, authentic pen and ink naturalist field study',
  },
  {
    key: 'copperplate',
    label: 'Fine Copperplate Engraving',
    icon: '🖋️',
    description: 'Intricate monochrome lithograph, fine crosshatching on vintage paper',
    promptSuffix:
      'antique copperplate line engraving, monochrome fine crosshatching, botanical lithograph, aged vintage paper, classical 18th-century naturalist folio',
  },
  {
    key: 'custom',
    label: 'Custom Explorer Prompt',
    icon: '✨',
    description: 'Your own crafted AI prompt for full creative naturalist freedom',
    promptSuffix: '',
  },
];

export interface CustomIllustrationRequest {
  subject: string;
  styleKey: BotanicalStyleKey;
  customPrompt?: string;
  seed?: number;
  width?: number;
  height?: number;
  engine?: 'auto' | 'archive' | 'plates';
}

export interface CustomIllustrationResult {
  url: string;
  promptUsed: string;
  seed: number;
  model: string;
  isBase64: boolean;
}

export function buildCustomPrompt(
  subject: string,
  styleKey: BotanicalStyleKey,
  customPrompt?: string
): string {
  if (styleKey === 'custom' && customPrompt && customPrompt.trim().length > 0) {
    return customPrompt.trim();
  }
  const preset = BOTANICAL_STYLE_PRESETS.find((p) => p.key === styleKey) || BOTANICAL_STYLE_PRESETS[0];
  const cleanSubj = subject.trim() || 'botanical specimen';
  return `${cleanSubj}, ${preset.promptSuffix}`;
}

export async function generateCustomBotanicalIllustration(
  request: CustomIllustrationRequest
): Promise<CustomIllustrationResult> {
  const seed = request.seed || Math.floor(Math.random() * 899999) + 100000;
  const prompt = buildCustomPrompt(request.subject, request.styleKey, request.customPrompt);
  const matchedPlate = getMatchingBotanicalPlate(request.subject, '', '');

  // If user explicitly requested curated museum plates:
  if (request.engine === 'plates') {
    // Pick from curated plates using seed for variety
    const chosenCurated = BOTANICAL_FIELD_PLATES[seed % BOTANICAL_FIELD_PLATES.length];
    return {
      url: chosenCurated.src,
      promptUsed: prompt,
      seed,
      model: `Curated Field Plate (${chosenCurated.plateNumber})`,
      isBase64: false,
    };
  }

  // Determine targeted keyword for archive search based on style preset and subject
  let archiveKeyword = 'botanical illustration plate leaf';
  if (request.styleKey === 'microscopic') {
    archiveKeyword = 'leaf anatomy';
  } else if (request.styleKey === 'herbarium') {
    archiveKeyword = 'herbarium specimen plant';
  } else if (request.styleKey === 'journal_sketch') {
    archiveKeyword = 'botanical watercolor';
  } else if (request.styleKey === 'copperplate') {
    archiveKeyword = 'botanical engraving';
  } else {
    // Check subject features
    const combined = `${request.subject} ${request.customPrompt || ''}`.toLowerCase();
    if (combined.includes('margin') || combined.includes('serrate') || combined.includes('dentate') || combined.includes('lobed')) {
      archiveKeyword = 'leaf margin botanical';
    } else if (combined.includes('cuticle') || combined.includes('wax') || combined.includes('trichome') || combined.includes('stomata')) {
      archiveKeyword = 'leaf anatomy';
    } else if (combined.includes('bark') || combined.includes('tree') || combined.includes('lichen')) {
      archiveKeyword = 'tree bark';
    } else if (combined.includes('canopy') || combined.includes('bird') || combined.includes('sound')) {
      archiveKeyword = 'natural history bird illustration';
    } else if (combined.includes('flower') || combined.includes('petal') || combined.includes('herbarium')) {
      archiveKeyword = 'herbarium specimen plant';
    } else if (combined.includes('leaf') || combined.includes('symmetry') || combined.includes('vein')) {
      archiveKeyword = 'leaf venation';
    }
  }

  // 1. Try Pollinations AI (clean URL, no paywalled parameters) if engine is 'auto'
  if (request.engine !== 'archive') {
    try {
      const cleanPrompt = encodeURIComponent(prompt.slice(0, 160));
      const pollUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(pollUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
        const blob = await res.blob();
        if (blob.size > 2000) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string) || pollUrl);
            reader.onerror = () => resolve(pollUrl);
            reader.readAsDataURL(blob);
          });
          return {
            url: base64,
            promptUsed: prompt,
            seed,
            model: 'Pollinations AI (Flux)',
            isBase64: true,
          };
        }
      }
    } catch {
      // Pollinations AI unavailable or paywalled; proceed to archive
    }
  }

  // 2. Query open naturalist botanical archive (Wikimedia Commons) with 20 results
  try {
    const wmUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      archiveKeyword
    )}&gsrnamespace=6&gsrlimit=20&prop=pageimages&pithumbsize=960&format=json&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(wmUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const pages = Object.values(data?.query?.pages || {});
      const candidates = pages
        .map((p: any) => p.thumbnail?.source)
        .filter(
          (src: string) =>
            src &&
            !src.includes('.pdf') &&
            !src.includes('.djvu') &&
            !src.includes('.gif')
        );

      if (candidates.length > 0) {
        // Use seed to deterministically and diversely select among all 20 candidates
        const chosenUrl = candidates[seed % candidates.length];
        try {
          const imgRes = await fetch(chosenUrl);
          if (imgRes.ok) {
            const blob = await imgRes.blob();
            if (blob.size > 2000 && blob.type.startsWith('image/')) {
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string) || chosenUrl);
                reader.onerror = () => resolve(chosenUrl);
                reader.readAsDataURL(blob);
              });
              return {
                url: base64,
                promptUsed: prompt,
                seed,
                model: `Naturalist Archive #${(seed % candidates.length) + 1}`,
                isBase64: true,
              };
            }
          }
        } catch {
          return {
            url: chosenUrl,
            promptUsed: prompt,
            seed,
            model: `Naturalist Archive #${(seed % candidates.length) + 1}`,
            isBase64: false,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[FieldQuest AI] Archive fetch error:', err);
  }

  // 3. Guaranteed Infallible Fallback: Authentic Curated Botanical Field Plate
  const fallbackPlate = BOTANICAL_FIELD_PLATES[seed % BOTANICAL_FIELD_PLATES.length] || matchedPlate;
  return {
    url: fallbackPlate.src,
    promptUsed: prompt,
    seed,
    model: `Botanical Field Plate (${fallbackPlate.plateNumber})`,
    isBase64: false,
  };
}
