# FieldQuest - Architecture & System Design

## 1. System Context Diagram

```mermaid
graph TD
    User["🌿 Explorer / User"]
    
    subgraph Client["FieldQuest PWA (Browser Client)"]
        UI["React 19 UI / Router"]
        SW["Service Worker (Cache-First)"]
        IDB[("IndexedDB (Dexie)<br/>Local Adventures & Journal")]
        State["Zustand Session Store"]
        Query["TanStack Query Client"]
    end
    
    subgraph Server["FieldQuest API (Express 5)"]
        API["REST Endpoints (/api/v1)"]
        Service["MissionGeneratorService"]
        Safety["Safety Validator"]
        OllamaP["OllamaMissionProvider"]
        DemoP["DemoMissionProvider"]
    end
    
    subgraph AI["Local AI Engine"]
        OllamaServer["Ollama Daemon (:11434)"]
        Model["qwen3:4b (Open-Weight LLM)"]
    end
    
    User <-->|Touch / Screen-down mode| UI
    UI <--> IDB
    UI <--> State
    UI <--> Query
    Query <-->|HTTP / REST| API
    SW -.->|Pre-caches static assets| UI
    
    API --> Service
    Service --> Safety
    Service -->|AI_PROVIDER=ollama| OllamaP
    Service -->|AI_PROVIDER=demo| DemoP
    OllamaP <-->|HTTP POST /api/generate| OllamaServer
    OllamaServer --> Model
```

---

## 2. Component Architecture Diagram

```mermaid
graph LR
    subgraph Frontend_Components["Frontend Components (apps/web)"]
        Landing["LandingPage (Ethos Hero)"]
        Setup["AdventureSetupForm"]
        Active["ActiveAdventureScreen"]
        ScreenDown["ScreenDownMode (Sensory Walk)"]
        Journal["JournalView (Adventures & Notes)"]
        Studio["FieldStudioView (Specimen Art & Folios)"]
        PlateDrawer["InlineReferenceDrawer (Card Accordion)"]
        Philosophy["ObjectiveBasisModal (Philosophy & Science)"]
        Settings["AISettingsModal"]
    end
    
    subgraph State_Management["State & Data Layers"]
        ZustandSession["useAdventureSessionStore"]
        DexieDB["db (FieldQuestDB / IndexedDB)"]
        SketchGen["sketch-generator (Procedural Art & Plates)"]
        QueryHooks["useMissionsMutation / useAIStatus"]
    end
    
    Landing --> Setup
    Landing --> Philosophy
    Setup --> QueryHooks
    QueryHooks --> ZustandSession
    ZustandSession --> Active
    Active --> ScreenDown
    Active --> DexieDB
    DexieDB --> Journal
    Journal --> PlateDrawer
    Journal -.->|Illustrate in Studio| Studio
    Studio <--> DexieDB
    Studio <--> SketchGen
```

---

## 3. Mission Generation Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Explorer
    participant UI as Web PWA (React)
    participant API as Express API
    participant Gen as MissionGeneratorService
    participant Provider as OllamaMissionProvider
    participant Ollama as Ollama (:11434)
    participant IDB as IndexedDB (Dexie)

    User->>UI: Selects 30 mins, Park, Plants & Birds, English
    UI->>API: POST /api/v1/missions/generate {durationMinutes: 30, ...}
    
    alt Provider is Ollama & Healthy
        API->>Gen: generate(preferences)
        Gen->>Provider: generateMissions(preferences)
        Provider->>Ollama: POST /api/generate (System prompt + Strict JSON schema)
        Ollama-->>Provider: Raw LLM JSON response
        Provider->>Gen: Zod validate & normalize
        Gen-->>API: Validated NatureMission[]
        API-->>UI: 200 OK { sessionId, missions, provider: 'ollama' }
    else Ollama Unreachable / Error
        API->>Gen: Check provider health
        Gen-->>API: Provider unreachable
        API-->>UI: 503 AI_PROVIDER_UNAVAILABLE
        UI->>User: Displays alert with "Switch to Demo Mode" option
        User->>UI: Clicks "Continue in Demo Mode"
        UI->>API: POST /api/v1/missions/generate (with fallback or mode=demo)
        API->>Gen: DemoMissionProvider.generateMissions()
        Gen-->>API: Instant Curated Missions
        API-->>UI: 200 OK { sessionId, missions, provider: 'demo' }
    end

    UI->>IDB: Save initial adventure session
    UI->>User: Renders Mission 1 with Timer & Screen-Down toggle
```

---

## 4. Offline Data-Flow Diagram

```mermaid
graph TD
    subgraph Online_State["Online Mode"]
        NetReq["Fetch Model Status / Generate Missions"] --> ExpressAPI["Express API"]
        ExpressAPI --> LLM["Ollama / Demo Engine"]
        LLM --> ResponseData["Mission JSON"]
        ResponseData --> SaveLocal[("Write to IndexedDB")]
    end

    subgraph Offline_State["Offline Mode (No Network)"]
        AppLoad["User opens FieldQuest PWA"] --> CacheCheck{"Service Worker Cache"}
        CacheCheck -->|Cache Match| RenderUI["Render Cached App Shell"]
        RenderUI --> ReadIDB[("Read IndexedDB")]
        ReadIDB --> ViewSaved["Read Saved Adventures & History"]
        ViewSaved --> WriteJournal["Add Observations, Photos & Notes"]
        WriteJournal --> ReadIDB
        AttemptGen["User attempts new AI generation"] --> DetectOffline["Detect Network Disconnect"]
        DetectOffline --> OfflineBanner["Display Offline Notice + Preloaded Offline Missions"]
    end
```

---

## 5. Deployment Architecture Diagram

```mermaid
graph TD
    subgraph Client_Hosting["Option A: Static PWA Hosting (e.g. Vercel, Cloudflare Pages)"]
        CDN["Global Edge CDN"]
        PWA_Assets["PWA Bundle (HTML, CSS, JS, Service Worker, Manifest)"]
        CDN --- PWA_Assets
    end

    subgraph User_Device["User Device (Smartphone / Laptop)"]
        Browser["Mobile / Desktop Browser"]
        LocalIDB[("IndexedDB Local Store")]
        Browser --- LocalIDB
    end

    subgraph Backend_Host["Dedicated Node.js & Inference Host (e.g. VPS or Local Machine)"]
        Proxy["Reverse Proxy (Nginx / Caddy with HTTPS)"]
        NodeAPI["Node.js Express 5 API"]
        OllamaDaemon["Ollama Daemon"]
        GPU["GPU / CPU Inference (qwen3:4b)"]
        
        Proxy --> NodeAPI
        NodeAPI --> OllamaDaemon
        OllamaDaemon --> GPU
    end

    Browser <-->|HTTPS (Get Assets)| CDN
    Browser <-->|HTTPS REST (API Calls)| Proxy
```

---

## 6. Key Architectural Decisions & Trade-Offs

| Decision | Rationale | Trade-Off Considered |
|---|---|---|
| **Dexie / IndexedDB over PostgreSQL / SQLite** | Absolute zero friction, zero signups, true local-first privacy, zero server maintenance costs for personal data. | Data is device-bound unless user explicitly exports JSON. |
| **Monorepo (apps/web + apps/api)** | Single cohesive repository for shared schemas, synchronized types, and single command startup. | Requires workspace tooling configuration. |
| **Ollama with `qwen3:4b` default** | High reasoning capability for botanical/ecological tasks with low VRAM footprint (~3GB) suitable for local workstations. | Users without Ollama need a graceful fallback, provided by `DemoMissionProvider`. |
| **Zustand for Session, TanStack Query for Network** | Prevents state duplication. TanStack Query manages query caching, loading, errors; Zustand manages transient UI active timer & screen-down toggle. | Requires clear boundaries so components don't misplace state. |
| **Tailwind CSS v4 with Forest Atelier tokens** | Extremely high aesthetic quality with CSS variables, high rendering performance, zero external CSS runtime overhead. | Custom configuration required for Fraunces and DM Sans typography. |
