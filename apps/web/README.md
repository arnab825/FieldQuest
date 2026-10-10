# `@fieldquest/web`

> Offline-First Progressive Web App (PWA) for Mindful Nature Exploration.

For the full architectural guide and cross-app use cases, see the **[apps/README.md](../README.md)** workspace reference.

---

## 🍃 What this frontend does

1. **Screen-Down Exploration**: Dims phone screen to reduce distraction; uses Web Audio harmonic chimes to signal observational milestones.
2. **100% Data Sovereignty**: All field notes, observations, photos, and folios are persisted strictly in the browser's IndexedDB (Dexie.js). No user data leaves the device.
3. **Field Illustrator Studio**: Interactive 19th-century scientific sketching workshop with 6 historical lithography styles, 2.8× Victorian Loupe, composite 1200×1580 PNG export, and 1-page museum print.
4. **Resilient AI & Offline Fallback**: Queries `@fieldquest/api` for missions, but automatically falls back to an offline client-side naturalist library if disconnected.

---

## 🚀 Key User Flows & Routes

| Route | Feature Component | Description |
|:---|:---|:---|
| `/` | `LandingPage.tsx` | Ethos, Attention Restoration Theory, cognitive science, and project introduction. |
| `/setup` | `AdventureSetupForm.tsx` | 15/30/60m quest setup, environment picker, accessibility, and sensory focus. |
| `/adventure` | `ActiveAdventureScreen.tsx` | Active 3-phase exploration, timer, checklist, and Screen-Down Mode. |
| `/journal` | `JournalView.tsx` | Local-first field notes, observation history, soundscape mapping, and JSON backup/restore. |
| `/studio` & `/plates` | `FieldStudioView.tsx` | Specimen Art Director, 2.8× loupe, 7 reference folios, archival composite PNG, and print engine. |

---

## 🛠️ Developer Scripts

Run from `apps/web` (or via `npm run <script> --workspace=apps/web` from the repo root):

```bash
# Start Vite development server (port 5173)
npm run dev

# Typecheck and build production bundle (dist/)
npm run build

# Preview production build locally
npm run preview

# Run tests (Vitest)
npm run test

# Typecheck TypeScript files
npm run typecheck
```

---

## 📁 Directory Structure

```
apps/web/
├── src/
│   ├── app/            # App shell, routing (React Router 7), query provider
│   ├── components/     # Reusable UI primitives, navbar, footer, layout
│   ├── features/
│   │   ├── about/      # Educational philosophy & science modals
│   │   ├── adventure/  # Quest planner, active quest, screen-down mode
│   │   ├── journal/    # Field notes, observation log, Studio & Plates
│   │   ├── landing/    # Landing hero & Victorian desk ethos
│   │   └── settings/   # AI engine status & configuration modal
│   ├── lib/
│   │   ├── audio.ts                   # Web Audio API harmonic chime generator
│   │   ├── client-mission-generator.ts# Zero-network client-side naturalist engine
│   │   ├── db.ts                      # Dexie IndexedDB client database
│   │   ├── folio-exporter.ts          # Canvas 2D 1200x1580 composite exporter
│   │   └── sketch-generator.ts        # Procedural botanical specimen renderer
│   ├── services/       # Typed REST client for apps/api
│   ├── store/          # Zustand state stores
│   └── types/          # Shared TypeScript interfaces
├── vite.config.ts      # Vite configuration & PWA Service Worker setup
└── package.json
```
