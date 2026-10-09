# FieldQuest - Local Development Guide

## 1. Prerequisites

- **Node.js:** Current LTS (>= 20.x, tested with Node 24.x)
- **npm:** Package manager (npm >= 10.x)
- **Ollama (Optional, for local AI model inference):** Download from [ollama.com](https://ollama.com)
  - Default model: `qwen3:4b`

> 💡 **No Ollama installed?** FieldQuest includes an immediate, zero-dependency **Demo Provider** so you can develop, test, and experience the application without running any local AI daemon!

---

## 2. Repository Structure

```
FieldQuest/
├── apps/
│   ├── web/                    # React 19 + Vite + Tailwind CSS v4 PWA
│   │   ├── src/
│   │   │   ├── app/            # App shell, routing & providers
│   │   │   ├── components/     # UI atoms & layout components
│   │   │   ├── features/       # Feature views (landing, setup, active, journal)
│   │   │   ├── hooks/          # React hooks & TanStack Query hooks
│   │   │   ├── lib/            # IndexedDB (Dexie), utilities, formatting
│   │   │   ├── store/          # Zustand ephemeral adventure session store
│   │   │   └── types/          # Shared domain schemas & TypeScript types
│   │   ├── public/             # PWA icons & manifest
│   │   └── vite.config.ts
│   └── api/                    # Node.js + Express 5 AI & Mission API
│       ├── src/
│       │   ├── config/         # Environment variable configuration
│       │   ├── middleware/     # Rate limiter, logger, error handlers
│       │   ├── prompts/        # Nature naturalist prompts for LLM
│       │   ├── providers/      # Ollama & Demo mission provider implementations
│       │   ├── routes/         # Express REST routes (/health, /ai, /missions)
│       │   ├── schemas/        # Zod validation schemas
│       │   ├── services/       # MissionGeneratorService orchestrator
│       │   └── app.ts          # Express application initialization
│       └── tsconfig.json
├── docs/                       # Architecture, PRD, TRD, Design System, etc.
├── .env.example                # Environment configuration template
├── package.json                # Root npm workspace configuration
└── README.md
```

---

## 3. Quick Start

### 3.1 Clone & Install Dependencies
```bash
git clone https://github.com/fieldquest/fieldquest.git
cd fieldquest
npm install
```

### 3.2 Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```
Default values work out-of-the-box in Demo Mode (`AI_PROVIDER=demo`).

### 3.3 Running Both Frontend & API in Development
To run both apps concurrently:
```bash
npm run dev
```
- Web Application: **http://localhost:5173**
- Backend API: **http://localhost:4000**

You can also run each individually:
```bash
# Frontend only
npm run dev:web

# Backend API only
npm run dev:api
```

---

## 4. Setting up Ollama for Real Local AI

If you want real local open-weight AI inference:

1. Install Ollama from [ollama.com](https://ollama.com).
2. Start the Ollama daemon:
   ```bash
   ollama serve
   ```
3. Pull the configured default model (`qwen3:4b`):
   ```bash
   ollama pull qwen3:4b
   ```
4. Update your `.env` or run the API with:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen3:4b
   ```
5. Restart `npm run dev:api`. The API health check at `http://localhost:4000/api/v1/ai/status` will report `"status": "available"`.

---

## 5. Adding a New AI Provider

The mission generation system uses a clean provider interface:

```typescript
// apps/api/src/providers/mission-provider.interface.ts
export interface AIMissionProvider {
  readonly providerId: string;
  readonly modelId: string;
  checkAvailability(): Promise<{ available: boolean; error?: string }>;
  generateMissions(preferences: AdventurePreferences): Promise<NatureMission[]>;
}
```

To add another provider (e.g. Google Gemma 2 / 3 or Hugging Face Local TGI):
1. Implement `AIMissionProvider` in `apps/api/src/providers/your-provider.ts`.
2. Register your provider in `apps/api/src/services/mission-generator.service.ts`.
3. Set `AI_PROVIDER=your_provider` in your `.env`.

---

## 6. Code Conventions & Quality

- **Linting:** Run `npm run lint` across all workspaces.
- **Type Checking:** Run `npm run typecheck` across all workspaces.
- **Automated Testing:** Run `npm run test` across all workspaces.
- Always validate all input payloads with Zod before processing.
