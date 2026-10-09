# FieldQuest 🌿

> **Your neighbourhood is more interesting than your feed.**

FieldQuest is a polished, open-source, AI-powered, offline-first nature exploration Progressive Web App (PWA). It inspires people to spend less time glued to screens and more time exploring the living biodiversity right outside their door—in city parks, balcony pots, quiet suburban streets, or forest trails.

---

## Objective Basis & Purpose (For Judges & Evaluators)

FieldQuest is not another superficial chatbot wrapper; it is an **anti-chatbot nature observation tool** engineered with explicit scientific and educational rationale:

1. **Cognitive Science & Attention Restoration Theory (ART):** Rooted in Kaplan & Kaplan's cognitive psychology, prolonged screen interaction depletes direct executive attention. Involuntary natural sensory immersion ("soft fascination") restores focus. FieldQuest actively uses a **Screen-Down Mode** so explorers keep phones in pockets rather than staring at glass while walking.
2. **Botanical Functional Morphology:** Observational quests train participants in fundamental ecological principles: leaf venation architecture, bark moisture gradients, and lichen as symbiotic bioindicators of urban air quality.
3. **Open-Weight AI Sovereignty:** Prompts are processed locally via Ollama with open-weight models (`qwen3:4b` or Google Gemma) or an instant deterministic fallback engine. Zero telemetry, zero accounts, and zero remote cloud surveillance.
4. **Offline-First Resilience:** In nature trails with zero cellular connectivity, FieldQuest functions completely offline via PWA Service Workers and persists all personal field notes, observations, and photos in IndexedDB (Dexie).

---

## Key Features

- 🍃 **Context-Aware Nature Missions:** Generates tailored 15, 30, or 60-minute observational quests based on your environment, interests, difficulty, and time.
- 🧠 **Open-Weight AI Integration:** Powered by local open-weight models via **Ollama** (defaulting to `qwen3:4b` or Gemma), keeping prompts and insights private and sovereign.
- ⚡ **Zero-Config Demo Mode:** High-fidelity deterministic mission generator for immediate exploration without needing a local AI GPU or daemon.
- 📴 **True Offline-First Architecture:** Uses IndexedDB (Dexie) for durable local storage of all adventures, field notes, and reflections. The PWA shell caches assets for seamless offline operation.
- 📵 **Screen-Down Mode:** Put your phone in your pocket and explore with your senses; screen dims to save battery and reduce distraction.
- 📖 **Local Nature Journal:** Capture observational notes, photographs, and mindful reflections. Search, edit, filter, and export full journal archives as JSON.
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

## Running with Podman (Containerized Setup)

FieldQuest provides first-class support for **[Podman](https://podman.io/)** and **[Podman Desktop](https://podman-desktop.io/)** for both local development and production deployments.

### Why We Choose Podman
- **Rootless & Secure by Default:** Podman containers run without root privileges, protecting your host machine.
- **Daemonless:** Unlike Docker, Podman does not require a heavy background daemon constantly running or consuming background RAM.
- **100% Open Source (Apache 2.0):** Completely free with zero commercial licensing costs or enterprise restrictions.
- **OCI & Compose Compatible:** Drop-in compatibility with standard multi-stage Containerfiles and Compose specifications (`podman-compose.yml` / `docker-compose.yml`).
- **Kubernetes-Ready:** Native support for generating and running Kubernetes Pod manifests and integrating with Podman Desktop's built-in Kind cluster.

### Setup & Prerequisites Links
- 📦 **Download Podman Desktop:** [https://podman-desktop.io/](https://podman-desktop.io/)
- 📖 **Podman Official Documentation:** [https://podman.io/docs](https://podman.io/docs)
- ⚙️ **Installation Guide (Windows / macOS / Linux):** [https://podman.io/docs/installation](https://podman.io/docs/installation)

### Option 1: Using the Terminal
From your project directory:

```bash
# 1. Build the container images
npm run podman:build

# 2. Start the containers in the background
npm run podman:up

# 3. View live streaming logs
npm run podman:logs

# 4. Stop when done
npm run podman:down
```

### Option 2: Directly in Podman Desktop UI
1. Open **[Podman Desktop](https://podman-desktop.io/)**.
2. Go to the **Containers** or **Pods** view in the sidebar.
3. Once you launch the stack (`npm run podman:up`), both `fieldquest-web` and `fieldquest-api` will be visible in your Podman Desktop dashboard.
4. You can inspect live CPU/RAM resource usage, click into real-time container logs, and pause or stop containers with one click.

### Application Endpoints
- 🌿 **Web PWA:** [http://localhost:5173](http://localhost:5173/)
- ⚙️ **API Status:** [http://localhost:4000](http://localhost:4000/)
- 🩺 **API Health Check:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

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
