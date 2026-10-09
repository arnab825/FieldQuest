# FieldQuest 🌿

> **Your neighbourhood is more interesting than your feed.**

FieldQuest is a polished, open-source, AI-powered, offline-first nature exploration Progressive Web App (PWA). It inspires people to spend less time glued to screens and more time exploring the living biodiversity right outside their door—in city parks, balcony pots, quiet suburban streets, or forest trails.

---

## Key Features

- 🍃 **Context-Aware Nature Missions:** Generates tailored 15, 30, or 60-minute observational quests based on your environment, interests, difficulty, and language.
- 🧠 **Open-Weight AI Integration:** Powered by local open-weight models via **Ollama** (defaulting to `qwen3:4b`), keeping your prompts and insights private and sovereign.
- ⚡ **Zero-Config Demo Mode:** High-fidelity deterministic mission generator for immediate exploration without needing a local AI GPU or daemon.
- 📴 **True Offline-First Architecture:** Uses IndexedDB (Dexie) for durable local storage of all adventures, field notes, and reflections. The PWA shell caches assets for seamless offline operation.
- 📵 **Screen-Down Mode:** Put your phone in your pocket and explore with your senses; screen dims to save battery and reduce distraction.
- 📖 **Local Nature Journal:** Capture observational notes, photographs, and mindful reflections. Search, edit, filter, and export full journal archives as JSON.
- 🌐 **Multilingual Exploration:** Full mission generation and interface support for English and Bengali (`bn`).
- 🎨 **Forest Atelier Visual Aesthetic:** Designed with a botanical, editorial aesthetic inspired by vintage field notebooks, natural wood tones, and modern editorial typography.
- 🔒 **Absolute Privacy:** No mandatory accounts, no cloud sync, no tracking, and no invasive background GPS logging.

---

## Screenshots

> *Placeholder: Screenshots of the Forest Atelier landing page, adventure configuration, active mission view, and offline nature journal.*

```
+-------------------------------------------------------------+
|  [🌿 FieldQuest]             [Journal] [Settings] [New Adventure]|
|                                                             |
|         Your neighbourhood is more interesting than your feed|
|                                                             |
|   [ 15 min ]  [ City Park ]  [ Plants & Birds ]  [ English ]|
|                                                             |
|   +-----------------------------------------------------+   |
|   | MISSION 1: Bilateral Leaf Symmetry Audit             |   |
|   | Compare leaf venation between two distinct plants.  |   |
|   | [ Complete Mission ]    [ Put Screen Down 🌙 ]      |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

---

## Architecture Overview

```
Browser PWA (React 19 + Tailwind v4 + Dexie IndexedDB)
   │
   ▼ (REST API: /api/v1/*)
Express 5 API Service (Node.js LTS)
   │
   ├─► DemoMissionProvider (Deterministic curated engine)
   └─► OllamaMissionProvider ──► Ollama (:11434) ──► qwen3:4b
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full system diagrams and data flow specifications.

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Zustand, Dexie.js (IndexedDB), `vite-plugin-pwa`, Framer Motion, Lucide React, Zod.
- **Backend:** Node.js (LTS), Express 5, TypeScript, Zod, CORS, Express Rate Limit.
- **AI Inference:** Ollama REST API running open-weight `qwen3:4b` (compatible with Google Gemma 2 / 3 and other open models).
- **Testing:** Vitest, Supertest, React Testing Library.

---

## Prerequisites

- **Node.js:** Current LTS (>= 20.x, tested with Node 24.x)
- **npm:** >= 10.x
- *(Optional for real local AI)* **Ollama:** [ollama.com](https://ollama.com)

---

## Installation & Local Setup

```bash
# 1. Clone repository
git clone https://github.com/fieldquest/fieldquest.git
cd fieldquest

# 2. Install workspace dependencies
npm install

# 3. Create environment file from template
cp .env.example .env
```

---

## Running the Application

### Option A: Standard Mode (Frontend + API in Demo Mode)
FieldQuest defaults to Demo Mode, which works instantly without needing Ollama:

```bash
# Starts both frontend (port 5173) and API (port 4000)
npm run dev
```

- Open your browser to **http://localhost:5173**
- The backend will run on **http://localhost:4000**

You can also run them in separate terminal tabs:
```bash
# Web frontend
npm run dev:web

# Backend API
npm run dev:api
```

---

## Setting Up Real Local AI with Ollama

To use live open-weight model generation:

1. **Install and start Ollama:**
   ```bash
   ollama serve
   ```

2. **Pull the default model (`qwen3:4b`):**
   ```bash
   ollama pull qwen3:4b
   ```

3. **Configure your `.env`:**
   ```env
   AI_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen3:4b
   ```

4. **Restart the API:**
   ```bash
   npm run dev:api
   ```
   Check `http://localhost:4000/api/v1/ai/status` to confirm `"status": "available"`.

---

## Testing & Production Builds

```bash
# Run all tests across workspaces
npm test

# Run TypeScript checks
npm run typecheck

# Build both applications for production
npm run build
```

---

## Offline Limitations & Behavior

1. **Cached Application Shell:** The PWA Service Worker automatically caches core scripts, styles, and assets so the app loads when offline.
2. **Local Persistence:** All adventures, notes, photos, and journal entries are saved directly inside your browser's IndexedDB. They remain accessible offline across restarts.
3. **AI Generation when Offline:** If you are outside cell coverage and not running a local on-device LLM, new AI mission generation is paused; however, previously saved adventures and offline demo quests remain fully playable.

---

## Security & Privacy Guarantees

- **No Remote Tracking:** FieldQuest collects zero telemetry.
- **Local Data Ownership:** Your journal reflections and photos never leave your device.
- **Ecological Safety:** Generated missions strictly prohibit ingesting unknown flora, disturbing wild animal habitats, or trespassing.

---

## Documentation Index

- [Product Requirements Document (PRD)](docs/PRD.md)
- [Technical Requirements Document (TRD)](docs/TRD.md)
- [System Architecture & Diagrams](docs/ARCHITECTURE.md)
- [Forest Atelier Design System](docs/DESIGN_SYSTEM.md)
- [Local Development Guide](docs/DEVELOPMENT.md)
- [Testing & Quality Assurance](docs/TESTING.md)
- [Production Deployment Guide](docs/DEPLOYMENT.md)
- [Contribution Guidelines](CONTRIBUTING.md)

---

## License

This project is licensed under the [MIT License](LICENSE).
