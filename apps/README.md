# FieldQuest Applications (`apps/`)

> Comprehensive developer guide and use-case reference for the `@fieldquest/web` and `@fieldquest/api` workspaces.

---

## 🏛️ Workspace Architecture Overview

FieldQuest is organized as an npm monorepo containing two decoupled, focused applications under `apps/`:

```
apps/
├── web/     # @fieldquest/web: Client-side Offline-First Progressive Web App (PWA)
└── api/     # @fieldquest/api: Stateless Multi-Tier AI Orchestration & Generation Backend
```

### Core Design Philosophy & Boundary Rules

1. **Strict Data Sovereignty (Zero User Data on the Backend)**:
   - All personal notes, nature observations, acoustic soundscape records, photos, and botanical drawings stay **100% inside the client browser's IndexedDB**.
   - The backend (`apps/api`) does **not** possess a database, does **not** store user sessions, and receives **zero** personal identifiable information (PII).
2. **Stateless AI Brokerage**:
   - `apps/api` serves purely as an intelligent inference broker and safety layer between the web client and AI providers (Google Gemini cluster, Groq LPU, or local Ollama).
3. **Graceful Degradation & Full Offline Operation**:
   - If `apps/api` is stopped, rate-limited, or cellular signal is lost in the wilderness, `apps/web` seamlessly falls back to its built-in client-side naturalist library (`client-mission-generator.ts`). The user experience never crashes.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER CLIENT: apps/web                           │
│                                                                                │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────┐  │
│  │    Adventure Setup    │  │   Active Adventure    │  │   Field Studio     │  │
│  │   & Screen-Down Mode  │  │ & Acoustic Soundscape │  │  (Loupe & Folios)  │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └─────────┬──────────┘  │
│              │                          │                        │             │
│              ▼                          ▼                        ▼             │
│      TanStack Query / API Client   Dexie IndexedDB         HTML5 Canvas 2D     │
│       (apps/web/src/services)   (Local Data Sovereignty) (1200x1580 Composite) │
└──────────────────────┬─────────────────────────────────────────────────────────┘
                       │
                       │ HTTP / REST (/api/v1/*)
                       │ (Fails over to client-side engine if offline)
                       ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND SERVICE: apps/api                            │
│                                                                                │
│       Express 5 + Zod Validation + Rate Limiters + CORS + Request Logger       │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │             MissionGeneratorService (9-Tier Cascading Failover)          │  │
│  └──────┬───────────────────────┬────────────────────────────┬──────────────┘  │
│         │                       │                            │                 │
│         ▼                       ▼                            ▼                 │
│   Google Gemini           Groq Cloud LPU               Local Ollama            │
│  (Multi-Model Cluster)   (Ultra-Fast Llama 3.3)    (qwen2.5:3b Container)      │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 `@fieldquest/web` Use Cases & Developer Guide

`apps/web` is an offline-first Progressive Web App built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, **Dexie.js (IndexedDB)**, and **TanStack Query**.

### Primary Use Cases

#### Use Case W1: Nature Immersion & Educational Orientation (`/`)
- **Developer Intent**: Introduce participants to Kaplan & Kaplan's Attention Restoration Theory (ART), botanical morphology principles, and open-weight AI sovereignty.
- **Key Modules**:
  - `apps/web/src/features/landing/LandingPage.tsx`
  - `apps/web/src/features/about/ObjectiveBasisModal.tsx`
- **Developer Flow**:
  - Educational chapters explain sensory observation techniques (leaf venation, bark moisture, soundscapes).
  - Provides a direct link to launch an adventure or inspect reference folios.

#### Use Case W2: Sensory Quest Configuration (`/setup`)
- **Developer Intent**: Collect user adventure parameters without requiring accounts or logins, then request AI mission generation.
- **Key Modules**:
  - `apps/web/src/features/adventure/AdventureSetupForm.tsx`
  - `apps/web/src/services/api.ts` (`requestGenerateMissions`)
  - `apps/web/src/lib/client-mission-generator.ts` (Client fallback)
- **User Parameters Captured**:
  - **Duration**: 15 min (Quick Sensory Walk), 30 min (Field Study), 60 min (Deep Expedition).
  - **Environment**: Urban Park, Potted Balcony, Sidewalk Weeds, Botanical Garden, Trail.
  - **Accessibility**: Seated/wheelchair-friendly sensory mode.
  - **Focus Area**: Leaf venation, bark/lichen bioindicators, canopy acoustic stratification, textures.

#### Use Case W3: Live Nature Observation & Screen-Down Mode (`/adventure`)
- **Developer Intent**: Encourage explorers to look at the living world rather than their mobile screen.
- **Key Modules**:
  - `apps/web/src/features/adventure/ActiveAdventureScreen.tsx`
  - `apps/web/src/lib/audio.ts` (Web Audio API sensory chime alerts)
- **Runtime Flow**:
  - **Screen-Down Mode**: explorer taps "Screen-Down Mode" to darken the display, minimizing battery drain and visual distraction while walking.
  - **Audio Chimes**: Subtle harmonic frequencies generated via Web Audio API chime at phase milestones.
  - **Phased Guidance**:
    1. *Phase 1: Sensory Calibration* (breathing, ambient auditory isolation).
    2. *Phase 2: Morphological Observation* (guided inspection of leaf venation, lichens, bark).
    3. *Phase 3: Reflection & Synthesis* (recording notes into the journal).

#### Use Case W4: Botanical Field Illustrator Studio (`/studio` & `/plates`)
- **Developer Intent**: An interactive 19th-century scientific illustration workshop for rendering specimen studies directly on an HTML5 canvas.
- **Key Modules**:
  - `apps/web/src/features/journal/FieldStudioView.tsx`
  - `apps/web/src/lib/sketch-generator.ts` (Procedural botanical vector rendering)
  - `apps/web/src/lib/folio-exporter.ts` (Canvas 2D composite image exporter)
- **Capabilities**:
  - **6 Historical Illustration Styles**: Vintage Naturalist Lithograph, Microscopic Venation, Pressed Herbarium, Fine Copperplate Engraving, Field Graphite Pencil, Classical Linnaean Watercolor.
  - **Interactive 2.8× Victorian Loupe**: Real-time canvas magnifying glass for inspecting micro-morphology and ink hatching.
  - **1200 × 1580 Archival Folio PNG Export**: Generates museum-grade plates with Linnaean ornamental borders, scientific diagnostic keys, and plate numbers.
  - **Single-Card Dedicated PDF & Print**: Dedicated print layout (`printSingleSpecimenFolio`) to create physical field cards without browser UI chrome.
  - **Plates I–VII Reference Guides**: Morphological guides for leaf margins, venation types, bark textures, and air-quality bioindicator lichens.

#### Use Case W5: Local-First Field Journal & Data Sovereignty (`/journal`)
- **Developer Intent**: Private, distraction-free explorer notebook persisted on-device.
- **Key Modules**:
  - `apps/web/src/features/journal/JournalView.tsx`
  - `apps/web/src/lib/db.ts` (Dexie.js IndexedDB schema & helpers)
- **Persisted Collections**:
  - `adventures`: Saved quest logs, durations, habitat types, and timestamps.
  - `notes`: Detailed field observations linked to Plates I–VII, locations, and specimen tags.
  - `photos`: Base64 field captures stored locally without external server upload.
  - `preferences`: User settings, chosen AI providers, and local overrides.
- **JSON Backup & Restore**: Explorers can export their entire IndexedDB database to a local `.json` file and restore it on any device.

#### Use Case W6: Multi-Tier AI Provider Selection & Diagnostics Modal
- **Developer Intent**: Inspect live AI health, configure custom endpoints, or test failovers.
- **Key Modules**:
  - `apps/web/src/features/settings/AISettingsModal.tsx`
  - `apps/web/src/services/api.ts` (`fetchAIStatus`, `saveAIConfig`)
- **Capabilities**:
  - Switch between **Multi-Cloud Engine** (Gemini / Groq), **Local Ollama** (Air-gapped on port 11434), and **Curated Offline Engine**.
  - Direct browser-to-Ollama probing (`http://localhost:11434/api/tags`) when running local containers without proxying through the backend.

#### Use Case W7: Progressive Web App (PWA) Offline Service Worker
- **Developer Intent**: Enable uninterrupted usage in remote nature reserves with zero mobile network reception.
- **Key Modules**:
  - `apps/web/vite.config.ts` (`vite-plugin-pwa` configuration)
  - Pre-caches core app shell, fonts, illustrations, and classical plate assets.

---

## ⚡ `@fieldquest/api` Use Cases & Developer Guide

`apps/api` is an Express 5 TypeScript microservice providing resilient, privacy-preserving AI orchestration and validation.

### Primary Use Cases

#### Use Case A1: Multi-Tier AI Provider Orchestration & Automatic Cascading Failover
- **Developer Intent**: Deliver 100% mission generation uptime by automatically failing over across multiple cloud and local inference providers without crashing or returning errors to the user.
- **Key Modules**:
  - `apps/api/src/services/mission-generator.service.ts`
  - `apps/api/src/providers/cloud.provider.ts`
  - `apps/api/src/providers/ollama.provider.ts`
  - `apps/api/src/providers/demo.provider.ts`
- **Failover Hierarchy**:
  1. **Google Gemini Cluster**: Primary model (`gemini-3.8-flash` or `gemini-2.5-flash`), cascading to fallback models (`gemini-3.1-flash-lite`, `gemini-flash-latest`, `gemini-1.5-flash`) on quota limits (HTTP 429).
  2. **Groq Cloud LPU Cluster**: Cascades to `llama-3.3-70b-versatile` or `llama-3.1-8b-instant`.
  3. **Local Ollama Container**: Air-gapped fallback to `qwen2.5:3b` or `gemma2:2b` on `http://localhost:11434`.
  4. **Deterministic Naturalist Engine**: Zero-dependency curated biological catalog that guarantees valid JSON responses even in a total network outage.

#### Use Case A2: Structured Nature Mission Generation (`POST /api/v1/missions/generate`)
- **Developer Intent**: Convert high-level user exploration preferences into structured, scientifically grounded sensory missions with strict Zod schema guarantees.
- **Route & Controller**: `apps/api/src/routes/mission.routes.ts`
- **Validation Schema**: `apps/api/src/schemas/adventure.schema.ts`
- **Request Payload Example**:
  ```json
  {
    "durationMinutes": 30,
    "environment": "urban_park",
    "mobilityAccessible": false,
    "sensoryFocus": ["botanical_morphology", "acoustic_ecology"],
    "forcedMode": "cloud"
  }
  ```
- **Response Structure**:
  ```json
  {
    "sessionId": "fq_1741598400000_abc123",
    "provider": "cloud",
    "model": "gemini-3.8-flash",
    "generatedAt": "2026-10-10T09:50:00.000Z",
    "preferences": { ... },
    "missions": [
      {
        "id": "mission-1",
        "title": "Deciduous Venation & Bark Fissure Audit",
        "objective": "Identify parallel vs. reticulate leaf venation patterns...",
        "durationMinutes": 30,
        "environment": "urban_park",
        "phases": [
          { "phaseNumber": 1, "name": "Sensory Calibration", "durationMinutes": 5, "instruction": "..." },
          { "phaseNumber": 2, "name": "Morphological Audit", "durationMinutes": 20, "instruction": "..." },
          { "phaseNumber": 3, "name": "Field Sketch & Notes", "durationMinutes": 5, "instruction": "..." }
        ],
        "observationCriteria": [
          "Examine underside of mature deciduous leaves for secondary vein bifurcation",
          "Touch northern bark face to assess moisture and crustose lichen presence"
        ],
        "sensoryPrompts": {
          "visual": "Notice angle of vein departure from central midrib.",
          "tactile": "Compare rough furrowed bark vs smooth young branches.",
          "auditory": "Isolate rustling canopy geophony from street anthrophony."
        },
        "safetyGuideline": "Avoid handling wild specimens with sap or toxic alkaloids."
      }
    ]
  }
  ```

#### Use Case A3: Scientific Field Note & Scaffold Generation (`POST /api/v1/missions/scaffold`)
- **Developer Intent**: Generate taxonomic observation templates and diagnostic writing scaffolds based on an explorer's field discovery.
- **Route**: `apps/api/src/routes/mission.routes.ts`
- **Request Payload**:
  ```json
  {
    "missionTitle": "Deciduous Venation Audit",
    "objective": "Document leaf architecture on oak specimen",
    "environment": "urban_park",
    "observationCriteria": ["Reticulate venation", "Crustose lichen on trunk"]
  }
  ```
- **Output**: Returns a structured Markdown scaffolding template to guide the explorer's note writing.

#### Use Case A4: Real-Time AI Diagnostics & Health Probing (`GET /api/v1/ai/status`)
- **Developer Intent**: Enable client applications to query AI engine availability, current provider, active model, and status messages.
- **Route**: `apps/api/src/routes/ai.routes.ts`
- **Query Parameters**: `?mode=cloud&model=gemini-3.8-flash` or `?mode=ollama&endpoint=http://localhost:11434`
- **Response**:
  ```json
  {
    "available": true,
    "status": "available",
    "provider": "cloud",
    "model": "gemini-3.8-flash",
    "cloudService": "gemini",
    "message": "Connected to Google Gemini Cluster (Primary model: gemini-3.8-flash)"
  }
  ```

#### Use Case A5: Dynamic Runtime Reconfiguration (`POST /api/v1/ai/configure`)
- **Developer Intent**: Allow developers or admins to update the running backend's active provider, API key, model, or Ollama URL without restarting the Node.js server.
- **Route**: `apps/api/src/routes/ai.routes.ts`

#### Use Case A6: Health Probing & Container Liveness (`GET /api/v1/health`)
- **Developer Intent**: Standard container orchestration health check endpoint for Podman, Docker, Render, Railway, or Kubernetes probes.
- **Route**: `apps/api/src/routes/health.routes.ts`
- **Response**: `HTTP 200 { "status": "ok", "service": "fieldquest-api", "timestamp": "..." }`

#### Use Case A7: Security, CORS, Proxy Trust & Rate Limiting
- **Developer Intent**: Protect public API deployments from abuse and unauthorized origins while remaining seamless for local developers.
- **Key Modules**:
  - `apps/api/src/middleware/rate-limit.middleware.js`:
    - `/api`: Standard rate limit (60 requests / minute).
    - `/api/v1/missions`: Strict rate limit (30 generation requests / minute).
  - `apps/api/src/app.ts`: Trust first proxy when `NODE_ENV=production`, disable `x-powered-by`, 500kb JSON body cap.

---

## 🔄 Cross-App Interaction & Communication Lifecycle

Below is the sequence diagram illustrating how `@fieldquest/web` interacts with `@fieldquest/api`:

```
User (Browser)            apps/web (Frontend)              apps/api (Backend)           AI Provider (Gemini/Groq/Ollama)
     │                           │                                │                                │
     │── Open /setup ───────────►│                                │                                │
     │                           │── GET /api/v1/ai/status ──────►│── Health probe ───────────────►│
     │                           │◄── { available: true } ────────│◄── OK ─────────────────────────│
     │                           │                                │                                │
     │── Click "Generate" ──────►│                                │                                │
     │                           │── POST /api/v1/missions/gen ──►│── Prompt with Zod schema ─────►│
     │                           │                                │◄── Structured JSON ────────────│
     │                           │◄── 200 OK (3 Missions) ────────│                                │
     │◄── Show Missions ─────────│                                │                                │
     │                           │                                │                                │
     │── Start Adventure ───────►│                                │                                │
     │   (Screen-Down Mode)      │ [Dexie: Save active quest]     │ (No backend involvement)       │
     │                           │ [Web Audio: Periodic chimes]   │                                │
     │                           │                                │                                │
     │── Add Observation Note ──►│                                │                                │
     │                           │ [Dexie: Save note & photo]     │ (Zero PII leaves browser)      │
     │                           │                                │                                │
     │── Download Folio PNG ────►│                                │                                │
     │                           │ [Canvas 2D: Render 1200x1580]  │ (Zero backend rendering load)  │
     │◄── Save composite PNG ────│                                │                                │
```

### Fallback Matrix (What happens during failures?)

| Scenario | What happens in `apps/api` | What happens in `apps/web` |
|:---|:---|:---|
| **Google Gemini Quota Exhaustion (429)** | Auto-fails over to secondary Gemini model, then Groq, then local Ollama. | Uninterrupted; receives valid mission transparently. |
| **All Cloud APIs Offline / No Keys** | Returns deterministic missions from `demo.provider.ts`. | User receives complete sensory quest without errors. |
| **Backend API Unreachable / Offline** | N/A (Server is stopped or unreachable). | `apps/web/src/services/api.ts` catches network failure and runs `client-mission-generator.ts` locally. |
| **No Cellular / Offline in Nature** | N/A (Device has no internet). | PWA Service Worker serves all app assets; Dexie saves all data locally; client mission generator creates quests. |

---

## 🛠️ Developer Commands Cheat Sheet

Run these commands from the repository root:

### Running Locally
```bash
# Start both Web (port 5173) and API (port 4000) concurrently
npm run dev

# Run only the frontend
npm run dev:web

# Run only the backend API
npm run dev:api
```

### Building & Validating
```bash
# Build both workspaces
npm run build

# Run typechecks across all apps
npm run typecheck

# Run test suites (Vitest)
npm run test
```

### Running with Podman / Docker
```bash
# Start entire containerized pod (Web + API + Ollama)
npm run podman:up

# View live container logs
npm run podman:logs

# Pull open-weight model into local Ollama volume
npm run podman:pull-model

# Stop container pod
npm run podman:down
```

---

## 📂 Source Code Map

| Feature | Primary Frontend Source (`apps/web`) | Primary Backend Source (`apps/api`) |
|:---|:---|:---|
| **Mission Generation** | [`features/adventure/AdventureSetupForm.tsx`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/features/adventure/AdventureSetupForm.tsx) | [`routes/mission.routes.ts`](file:///d:/hacktoberfest/FieldQuest/apps/api/src/routes/mission.routes.ts) |
| **Mission Schemas** | [`types/index.ts`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/types/index.ts) | [`schemas/mission.schema.ts`](file:///d:/hacktoberfest/FieldQuest/apps/api/src/schemas/mission.schema.ts) |
| **AI Status & Diagnostics**| [`features/settings/AISettingsModal.tsx`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/features/settings/AISettingsModal.tsx) | [`routes/ai.routes.ts`](file:///d:/hacktoberfest/FieldQuest/apps/api/src/routes/ai.routes.ts) |
| **AI Providers** | [`services/api.ts`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/services/api.ts) | [`services/mission-generator.service.ts`](file:///d:/hacktoberfest/FieldQuest/apps/api/src/services/mission-generator.service.ts) |
| **Local Persistence** | [`lib/db.ts`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/lib/db.ts) (Dexie) | *None (Stateless by design)* |
| **Sensory Audio & Bells** | [`lib/audio.ts`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/lib/audio.ts) | *None* |
| **Botanical Field Studio** | [`features/journal/FieldStudioView.tsx`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/features/journal/FieldStudioView.tsx) | *None* |
| **Museum Folio Exporter** | [`lib/folio-exporter.ts`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/lib/folio-exporter.ts) | *None* |
| **Procedural Sketching** | [`lib/sketch-generator.ts`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/lib/sketch-generator.ts) | *None* |
| **Health Checks** | [`services/api.ts`](file:///d:/hacktoberfest/FieldQuest/apps/web/src/services/api.ts) (`fetchHealth`) | [`routes/health.routes.ts`](file:///d:/hacktoberfest/FieldQuest/apps/api/src/routes/health.routes.ts) |
