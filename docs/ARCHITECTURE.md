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
        Service["MissionGeneratorService (3-Tier Failover Engine)"]
        Safety["Safety Validator"]
        CloudP["[Tier 1] CloudMissionProvider"]
        OllamaP["[Tier 2] OllamaMissionProvider"]
        DemoP["[Tier 3] DemoMissionProvider"]
    end
    
    subgraph CloudAI["Production Cloud AI (Free Tier)"]
        Gemini["Google Gemini API (1.5 Flash / 2.0 Flash)"]
        Groq["Groq Cloud API (Llama 3.3 / Qwen 2.5)"]
    end

    subgraph LocalAI["Local AI Engine (Optional / Self-Hosted)"]
        OllamaServer["Ollama Daemon (:11434)"]
        Model["qwen2.5:3b / Gemma (Open-Weight LLM)"]
    end
    
    User <-->|Touch / Screen-down mode| UI
    UI <--> IDB
    UI <--> State
    UI <--> Query
    Query <-->|HTTP / REST| API
    SW -.->|Pre-caches static assets| UI
    
    API --> Service
    Service --> Safety
    Service -->|Tiers 1-5: Gemini Cluster| CloudP
    Service -->|Tiers 6-7: Groq LPU Cluster| CloudP
    Service -.->|Tier 8: Failover to Local AI| OllamaP
    Service -.->|Tier 9: 100% Offline fallback| DemoP
    CloudP <-->|HTTPS REST| Gemini
    CloudP <-->|HTTPS REST| Groq
    OllamaP <-->|HTTP POST /api/generate| OllamaServer
    OllamaServer --> Model
```

---

## 2. Component Architecture Diagram

```mermaid
graph LR
    subgraph Frontend_Components["Frontend Components (apps/web)"]
        Landing["LandingPage (Ethos Hero & Atelier Cards)"]
        Setup["AdventureSetupForm"]
        Active["ActiveAdventureScreen"]
        ScreenDown["ScreenDownMode (Sensory Walk)"]
        Journal["JournalView (Adventures & Notes)"]
        Studio["FieldStudioView (Specimen Art & Folios)"]
        Loupe["VictorianLoupe (2.8x Optical Lens)"]
        FolioExport["folio-exporter (1200x1580 Canvas & 1-Page PDF)"]
        PlateDrawer["InlineReferenceDrawer (7 Folios I-VII)"]
        Philosophy["ObjectiveBasisModal (Philosophy & Science)"]
        Settings["AISettingsModal (Dual Cloud & Local Status)"]
    end
    
    subgraph State_Management["State & Data Layers"]
        ZustandSession["useAdventureSessionStore"]
        DexieDB["db (FieldQuestDB / IndexedDB)"]
        SketchGen["sketch-generator (7 Plates & Presets)"]
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
    Studio --> Loupe
    Studio --> FolioExport
    Studio <--> DexieDB
    Studio <--> SketchGen
```

---

## 3. Mission Generation & Failover Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Explorer
    participant UI as Web PWA (React)
    participant API as Express API
    participant Gen as MissionGeneratorService
    participant Cloud as CloudMissionProvider
    participant Ollama as OllamaMissionProvider
    participant Demo as DemoMissionProvider
    participant IDB as IndexedDB (Dexie)

    User->>UI: Selects 30 mins, Park, Plants & Birds
    UI->>API: POST /api/v1/missions/generate {durationMinutes: 30, ...}
    API->>Gen: generate(preferences)

    alt Tier 1: Cloud AI Available & Has Quota
        Gen->>Cloud: generateMissions(preferences)
        Cloud-->>Gen: Validated NatureMission[]
        Gen-->>API: Missions (provider: 'cloud', model: 'gemini-1.5-flash')
        API-->>UI: 200 OK { sessionId, missions, provider: 'cloud' }
    else Tier 1 Exhausted (HTTP 429) & Local Ollama Online
        Gen->>Cloud: generateMissions(preferences)
        Cloud-->>Gen: Error 429 (Quota limit reached)
        Note over Gen: Automatic failover to Tier 2
        Gen->>Ollama: generateMissions(preferences)
        Ollama-->>Gen: Validated NatureMission[]
        Gen-->>API: Missions (provider: 'ollama', model: 'qwen2.5:3b')
        API-->>UI: 200 OK { sessionId, missions, provider: 'ollama' }
    else Cloud & Ollama Offline / Unreachable
        Note over Gen: Automatic failover to Tier 3
        Gen->>Demo: generateMissions(preferences)
        Demo-->>Gen: Curated Naturalist Missions
        Gen-->>API: Missions (provider: 'demo')
        API-->>UI: 200 OK { sessionId, missions, provider: 'demo' }
    end

    UI->>IDB: Save adventure session locally
    UI->>User: Renders Mission 1 with Timer & Screen-Down toggle
```

---

## 4. Offline Data-Flow Diagram

```mermaid
graph TD
    subgraph Online_State["Online Mode"]
        NetReq["Fetch Model Status / Generate Missions"] --> ExpressAPI["Express API"]
        ExpressAPI --> Engine["3-Tier Engine (Cloud -> Ollama -> Demo)"]
        Engine --> ResponseData["Mission JSON"]
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
        DetectOffline --> OfflineBanner["Display Curated Field Library Missions"]
    end
```

---

## 5. Deployment Architecture Diagram

```mermaid
graph TD
    subgraph Client_Hosting["Client Hosting (Vercel / Cloudflare Pages / Static CDN)"]
        CDN["Global Edge CDN"]
        PWA_Assets["PWA Bundle (HTML, CSS, JS, Service Worker, Manifest)"]
        CDN --- PWA_Assets
    end

    subgraph User_Device["User Device (Smartphone / Laptop)"]
        Browser["Mobile / Desktop Browser"]
        LocalIDB[("IndexedDB Local Store")]
        Browser --- LocalIDB
    end

    subgraph Backend_Hosting["Production Backend (Render / Railway / Fly.io / VPS / Podman)"]
        NodeAPI["Node.js Express 5 API"]
        EnvConfig["Server .env Secrets (GEMINI_API_KEY, GROQ_API_KEY)"]
        NodeAPI --- EnvConfig
    end

    subgraph Cloud_Providers["External AI Free Tier"]
        GeminiAPI["Google Gemini 1.5/2.0 Flash"]
        GroqAPI["Groq Cloud Llama 3.3"]
    end

    subgraph Optional_Self_Host["Optional Self-Hosted Host"]
        LocalOllama["Ollama Daemon (:11434)"]
    end

    Browser <-->|HTTPS (Get Assets)| CDN
    Browser <-->|HTTPS REST (Zero Client Keys)| NodeAPI
    NodeAPI <-->|HTTPS API Calls| GeminiAPI
    NodeAPI <-->|HTTPS API Calls| GroqAPI
    NodeAPI -.->|Optional Local Host| LocalOllama
```

---

## 6. Key Architectural Decisions & Trade-Offs

| Decision | Rationale | Trade-Off Considered |
|---|---|---|
| **Zero-Client-Key Cloud Architecture** | Keys (`GEMINI_API_KEY`, `GROQ_API_KEY`) stay strictly on the server in `.env`. Regular explorers get instant production AI with zero signup friction. | Host maintains server `.env` keys. |
| **Automatic 3-Tier Failover Pipeline** | Cloud (Tier 1) -> Ollama (Tier 2) -> Curated Library (Tier 3) guarantees missions never fail even when free-tier quotas expire. | Generation may fall back to curated templates without error popups. |
| **Dexie / IndexedDB over Remote DB** | Absolute zero friction, zero signups, true local-first privacy, zero server maintenance costs for personal field notes. | Data is device-bound unless user explicitly exports JSON backup. |
| **Monorepo (apps/web + apps/api)** | Single cohesive repository for shared schemas, synchronized types, and single command startup. | Requires npm workspace configuration. |
| **Ollama Open-Weight Sovereignty** | Local open-weight models (`qwen2.5:3b`, Gemma) preserve full user privacy for developers and offline self-hosters. | Requires running local Ollama daemon or container. |
| **Tailwind CSS v4 with Forest Atelier tokens** | Extremely high aesthetic quality with CSS variables, high rendering performance, zero external CSS runtime overhead. | Custom configuration required for Fraunces and DM Sans typography. |
