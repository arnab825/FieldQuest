# FieldQuest - Technical Requirements Document (TRD)

## 1. System Overview & Technology Stack

FieldQuest is architected as a modular monorepo consisting of:
- **Client Application (`apps/web`):** Offline-first Progressive Web App built with React 19, TypeScript, Vite, Tailwind CSS v4, Dexie (IndexedDB), TanStack Query, Zustand, and `vite-plugin-pwa`.
- **API Server (`apps/api`):** Lightweight Node.js / Express 5 REST API handling AI orchestration, safety validation, and local LLM inference bridging.

### Technology Matrix

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Runtime | React / ReactDOM | 19.x | UI rendering with strict mode |
| Language | TypeScript | 5.x | Strict type-safety across client and API |
| Build Tool | Vite | 6.x | Fast ESM bundler & dev server |
| Styling | Tailwind CSS v4 | 4.x | CSS-first utility framework with custom tokens |
| Client Routing | React Router | 7.x / 6.x | Client-side view routing |
| Server State | TanStack Query | 5.x | Queries, mutations, retry logic, AI status |
| Client State | Zustand | 5.x | Ephemeral active adventure session state |
| Local Storage | Dexie.js | 4.x | IndexedDB wrapper for durable offline storage |
| Animations | Framer Motion | 12.x | Subdued transitions and screen-down fades |
| Icons | Lucide React | Latest | Crisp SVG iconography |
| PWA Service Worker | vite-plugin-pwa | 1.x | Service worker asset caching and web app manifest |
| Backend Runtime | Node.js | LTS (>= 20.x) | Server execution environment |
| Web Framework | Express | 5.x | HTTP REST API endpoints |
| Validation | Zod | 3.x | End-to-end runtime contract validation |
| Production Cloud AI | Google Gemini / Groq Cloud | Free Tier | Real-time cloud naturalist missions via server API keys |
| Local AI Inference | Ollama REST API | >= 0.3.x | Sovereign open-weight LLM execution (`qwen2.5:3b`, `qwen3:4b`, Gemma) |
| Curated Fallback | In-Memory Catalog | Native TS | Deterministic zero-dependency offline mission catalog |
| Testing | Vitest + RTL | Latest | Unit, integration, and component tests |

---

## 2. System Responsibilities & Boundaries

```
[ Browser / PWA ]
  ├── IndexedDB (Dexie)  --> Durable local storage (Adventures, Observations, Notes)
  ├── Zustand Store      --> Session state (Active timer, Current mission index)
  ├── TanStack Query     --> Remote API queries & mutations with cache policies
  └── Service Worker     --> Cache-first for static application bundle
        │
     HTTP/REST
        │
[ Express 5 API ]
  ├── Middleware         --> CORS, Rate Limiting, Request Logger, Error Handler
  ├── Services           --> MissionGeneratorService, SafetyValidator
  └── 3-Tier Provider Abstraction
        ├── [Tier 1] CloudMissionProvider  --> Google Gemini (1.5 Flash) / Groq Cloud (Llama 3.3)
        │        └── (Auto-failover on quota limit / 429)
        ├── [Tier 2] OllamaMissionProvider --> Local Ollama (qwen2.5:3b) on port 11434
        │        └── (Auto-failover if Ollama is unreachable)
        └── [Tier 3] DemoMissionProvider   --> Deterministic curated naturalist library (100% offline)
```

---

## 3. Data Models & Zod Schemas

### 3.1 Adventure Preferences Schema
```typescript
import { z } from 'zod';

export const EnvironmentTypeSchema = z.enum([
  'park',
  'garden',
  'urban',
  'trail',
  'balcony'
]);

export const InterestTypeSchema = z.enum([
  'plants',
  'birds',
  'insects',
  'trees',
  'sounds',
  'patterns',
  'biodiversity'
]);

export const DifficultySchema = z.enum(['easy', 'exploratory']);
export const LanguageSchema = z.enum(['en', 'bn']);

export const AdventurePreferencesSchema = z.object({
  durationMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  environment: EnvironmentTypeSchema,
  interests: z.array(InterestTypeSchema).min(1).max(5),
  difficulty: DifficultySchema,
  language: LanguageSchema.default('en'),
  accessibleMobility: z.boolean().default(false),
  customFocus: z.string().max(120).optional(),
});

export type AdventurePreferences = z.infer<typeof AdventurePreferencesSchema>;
```

### 3.2 Nature Mission Schema
```typescript
export const NatureMissionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(100),
  objective: z.string().min(10).max(300),
  instructions: z.array(z.string().min(5)).min(2).max(6),
  estimatedMinutes: z.number().int().positive().max(60),
  observationCriteria: z.array(z.string()).min(1),
  completionCriteria: z.string().min(5),
  safetyGuidance: z.string().min(10),
  reflectionQuestion: z.string().min(10),
  status: z.enum(['pending', 'active', 'completed', 'skipped']).default('pending'),
  userNotes: z.string().optional(),
  userPhotoUrl: z.string().optional(),
  completedAt: z.string().datetime().optional(),
});

export type NatureMission = z.infer<typeof NatureMissionSchema>;

export const AdventureSessionSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  preferences: AdventurePreferencesSchema,
  missions: z.array(NatureMissionSchema).min(1).max(6),
  status: z.enum(['in_progress', 'completed', 'abandoned']),
  totalMinutesSpent: z.number().nonnegative().default(0),
  providerUsed: z.enum(['cloud', 'ollama', 'demo']),
  modelUsed: z.string().optional(),
});

export type AdventureSession = z.infer<typeof AdventureSessionSchema>;
```

---

## 4. API Endpoints Contract

### 4.1 Health Check
- **Endpoint:** `GET /api/v1/health`
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-10-09T12:00:00.000Z"
}
```

### 4.2 AI Status Check
- **Endpoint:** `GET /api/v1/ai/status`
- **Response (200 OK - Cloud Engine Active with Failover Pipeline):**
```json
{
  "provider": "cloud",
  "status": "available",
  "model": "gemini-1.5-flash",
  "endpoint": "https://generativelanguage.googleapis.com",
  "message": "Production Cloud AI (Google Gemini 1.5 Flash) is ready with automatic Ollama/Curated failover.",
  "cloudAvailable": true,
  "ollamaAvailable": false,
  "failoverChain": ["cloud", "ollama", "demo"]
}
```
- **Response (200 OK - Local Ollama Dedicated Mode):**
```json
{
  "provider": "ollama",
  "status": "available",
  "model": "qwen2.5:3b",
  "endpoint": "http://localhost:11434",
  "message": "Local open-weight AI (Ollama) is ready for nature mission generation.",
  "cloudAvailable": false,
  "ollamaAvailable": true,
  "failoverChain": ["ollama", "demo"]
}
```

### 4.3 Mission Generation
- **Endpoint:** `POST /api/v1/missions/generate`
- **Headers:** `Content-Type: application/json`
- **Request Body:** `AdventurePreferences`
- **Response (200 OK):**
```json
{
  "sessionId": "a5d09b67-62a2-4a0b-93bf-4d515a6bfaef",
  "provider": "cloud",
  "model": "gemini-1.5-flash",
  "generatedAt": "2026-10-09T12:01:00.000Z",
  "missions": [
    {
      "id": "m1",
      "title": "Bilateral Leaf Symmetry Audit",
      "objective": "Identify two distinct leaf shapes and compare leaf venation.",
      "instructions": [
        "Locate two different plant species without picking leaves.",
        "Observe if vein structures are parallel or branching.",
        "Notice the margins (smooth, serrated, or lobed)."
      ],
      "estimatedMinutes": 8,
      "observationCriteria": ["Leaf margin", "Vein architecture", "Surface texture"],
      "completionCriteria": "Observe and mentally contrast at least two leaf types.",
      "safetyGuidance": "Do not touch stinging nettles or ingest wild plant material.",
      "reflectionQuestion": "How does leaf shape relate to how this plant collects sunlight or sheds rainwater?"
    }
  ]
}
```
- **Automatic Failover Behavior:** If cloud API quotas are exhausted (HTTP 429) or remote network requests fail, the API automatically executes through Tier 2 (Ollama) or Tier 3 (Curated Field Library). A 200 OK is returned with `provider: "demo"` or `provider: "ollama"`, ensuring end users never experience a blocked mission.

---

## 5. AI Provider Interface & Implementations

```typescript
export interface AIMissionProvider {
  readonly providerId: string;
  readonly modelId: string;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
  generateMissions(preferences: AdventurePreferences): Promise<NatureMission[]>;
}
```

### 5.1 Cloud Provider (`CloudMissionProvider`)
- High-efficiency production provider connecting to:
  - **Google Gemini API:** `gemini-3.8-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, or `gemini-flash-lite-latest` free tier via `GEMINI_API_KEY` (with multi-model fallback chains).
  - **Groq Cloud API:** OpenAI-compatible `/chat/completions` endpoint for `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, or `openai/gpt-oss-120b` via `GROQ_API_KEY`.
- Zero client key entry required: keys remain secured on the backend in `.env`.
- System prompts enforce strict JSON formatting and rigorous ecological safety guardrails.
- Quota exhaustion (HTTP 429 / quota limit) and network errors trigger immediate fallback to Tier 2 (Ollama) and Tier 3 (Demo).

### 5.2 Ollama Provider (`OllamaMissionProvider`)
- Connects to local `OLLAMA_BASE_URL/api/generate` or `/api/chat`.
- System prompt instructs model to act as a nature naturalist with strict adherence to safety rules and structured JSON output.
- Temperature: `0.5` for balanced ecological creativity and strict schema adherence.
- Response is sanitized and parsed with `z.array(NatureMissionSchema)`.

### 5.3 Demo Provider (`DemoMissionProvider`)
- Deterministic, zero-dependency provider.
- Filters curated mission templates by requested environment, interests, and duration.
- Guaranteed sub-5ms response time with 100% schema validity. Serves as the ultimate offline and failover safety net.

### 5.4 Procedural Botanical Sketch & Specimen Engine (`sketch-generator.ts`)
- Client-side procedural illustration pipeline that synthesizes morphological specimen plates based on field notes and biological taxonomic rules.
- **Historical Style Presets:**
  - `vintage_plate`: 18th-century antique copperplate lithograph with sepia ink hatching and Linnaean taxonomic labels.
  - `microscopic`: Botanical micro-anatomy slide with cross-sections, stoma, and cellular vascular bundles.
  - `herbarium`: Pressed dried botanical specimen mounted with aged cotton rag paper and mounting tape.
  - `sketch`: Naturalist graphite field study with proportional measurement axes.
- **Curated Classical Herbarium Folios (`BOTANICAL_FIELD_PLATES`):** 7 high-resolution diagnostic plates (Venation, Bark & Lichens, Margins, Conifers, Ferns, Lichens, Seeds) embedded offline for zero-latency anatomical identification.
- **Offline Base64 Transcoding:** Dynamic illustrations generated client-side are converted to Base64 Data URLs and persisted directly in `journalEntries.photoUrl` inside IndexedDB.

---

## 6. Offline Storage & IndexedDB (Dexie)

Database Name: `FieldQuestDB`
Version: `1`

Stores:
- `adventures`: Primary store for completed and active adventures (`id`, `createdAt`, `status`, `durationMinutes`, `environment`).
- `journalEntries`: Individual observations, reflections, photos, and mission notes linked to adventure IDs.
- `preferences`: User interface preferences, selected language, sit-down accessibility mode.

### 6.1 Data Portability & JSON Backup Specification
- **Export Schema:**
  ```typescript
  interface FieldQuestExportPayload {
    version: '1.0';
    exportedAt: string; // ISO 8601
    adventures: AdventureSessionRecord[];
    entries: JournalEntry[];
  }
  ```
- **Import / Restore Safeguards:** Transactional atomic write across `db.adventures` and `db.journalEntries` using Dexie `bulkPut`, preventing partial corruption on malformed backups.

## 7. Security, Privacy & Reliability

1. **CORS:** Restrict allowed origins to `CLIENT_ORIGIN` (default `http://localhost:5173`).
2. **Rate Limiting:** Express rate limiter caps generation requests to 30 per minute per IP.
3. **Timeouts:** Model requests enforce a configurable 45-second timeout to avoid hung processes.
4. **Input Sanitization:** User strings are bounded and escaped. No `dangerouslySetInnerHTML` is used in React.
5. **Zero Cloud Leaks:** Images captured locally remain inside IndexedDB as Data URLs or Blobs; they are never uploaded to any remote server.
6. **Server-Side API Key Isolation:** Cloud API keys (`GEMINI_API_KEY`, `GROQ_API_KEY`) are read strictly from backend `.env` configuration and are never exposed or transmitted to the client browser. Client requests invoke server endpoints without needing personal credentials.
