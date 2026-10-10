---
title: "FieldQuest: Your Neighbourhood Is More Interesting Than Your Feed"
published: false
description: "An offline-first, screen-down nature exploration PWA powered by open-weight local AI (Ollama/Podman) and multi-cloud failover."
tags: "hacktoberfest, touchgrass, opensource, ai"
cover_image: "https://raw.githubusercontent.com/arnab825/FieldQuest/main/apps/web/public/screenshot/cover.jpg"
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

---

## What I Built

Most modern apps want more of your screen time. **FieldQuest** does the opposite: it gives you a reason to put your phone in your pocket, step outside, and pay attention to the living world around you.

FieldQuest is a Victorian-botany-inspired, **screen-down**, offline-first Progressive Web App (PWA) powered by hybrid open-weight AI (Ollama + Podman) and a 9-tier multi-cloud fallback matrix (Google Gemini + Groq LPU).

### How It Gets People Off Screens and Into Nature
1. **Screen-Down Mode:** Quests give you observation instructions (e.g., *“Find two distinct tree bark textures on north-facing trunks”*), then dim the screen to preserve phone battery and prevent walking while doomscrolling.
2. **Sensory & Ecological Observations:** Tasks are rooted in Attention Restoration Theory (ART), morphological bioindicators (lichens as air quality gauges), and acoustic canopy stratification (isolating foreground leaves from distant wind).
3. **The Victorian Field Studio:** Explorers record their field findings and convert them into 19th-century naturalist folio lithographs using a 2.8× hardware-accelerated loupe and an archival 1200×1580 PNG/PDF print engine.
4. **Zero Accounts & True Privacy:** No logins, no analytics, no cloud trackers. All field observations and photos remain safely on the user's device in IndexedDB.

---

## Demo

- 🌐 **Live Web App:** [https://fieldquest.netlify.app](https://fieldquest.netlify.app)
- 💻 **Local Air-Gapped Stack:** Clone and run locally at `http://localhost:5173` with Podman or Docker.

### Visual Walkthrough

<table width="100%">
<tr>
<td width="50%" valign="top" align="center">
<strong>Hero &amp; Ethos</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/FieldQuest/main/apps/web/public/screenshot/1.png" alt="Hero &amp; Ethos" width="100%" /><br/>
<em>Screen-down philosophy &amp; zero cloud tracking.</em>
</td>
<td width="50%" valign="top" align="center">
<strong>Adaptive Quest Planner</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/FieldQuest/main/apps/web/public/screenshot/2.png" alt="Adaptive Quest Planner" width="100%" /><br/>
<em>Tailored 15/30/60m missions, seated accessibility &amp; custom botanical focus.</em>
</td>
</tr>
</table>

<table width="100%">
<tr>
<td width="50%" valign="top" align="center">
<strong>Botanical Field Studio</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/FieldQuest/main/apps/web/public/screenshot/4.png" alt="Field Studio" width="100%" /><br/>
<em>Historical styles &amp; Classical Plates I–VII.</em>
</td>
<td width="50%" valign="top" align="center">
<strong>Acoustic Canopy Sound Mapping</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/FieldQuest/main/apps/web/public/screenshot/8.png" alt="Sound Mapping" width="100%" /><br/>
<em>Acoustic stratification &amp; lichen census.</em>
</td>
</tr>
</table>

<table width="100%">
<tr>
<td width="50%" valign="top" align="center">
<strong>Production Multi-Cloud Resilience</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/FieldQuest/main/apps/web/public/screenshot/6.png" alt="Cloud AI Settings" width="100%" /><br/>
<em>Gemini &amp; Groq cascading 9-tier auto-failover.</em>
</td>
<td width="50%" valign="top" align="center">
<strong>Air-Gapped Local AI Container</strong><br/><br/>
<img src="https://raw.githubusercontent.com/arnab825/FieldQuest/main/apps/web/public/screenshot/7.png" alt="Local AI Container" width="100%" /><br/>
<em>100% private Ollama (qwen2.5:3b, gemma2:2b).</em>
</td>
</tr>
</table>

---

## Code

The entire codebase is open source under the MIT License:

{% github arnab825/FieldQuest %}

### Technical Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Dexie.js (IndexedDB), Canvas 2D composite renderer, `vite-plugin-pwa`.
- **Backend:** Node.js LTS, Express 5, TypeScript, Zod schema validation.
- **Local AI:** Ollama running open-weight `qwen2.5:3b` and `gemma2:2b`.
- **Containerization:** Rootless multi-stage Podman & Docker compose (`web`, `api`, `ai`).

---

## How I Built It

### 1. Hybrid AI Architecture & 9-Tier Failover Matrix
FieldQuest was engineered to never crash on the trail. If one API hits rate limits or cellular service drops, it seamlessly cascades down:

```
[Tier 1-4] Google Gemini Cluster (gemini-3.8-flash → gemini-3.1-flash → flash-latest)
     │ (On 429 Quota or Error)
     ▼
[Tier 5-7] Groq Cloud LPU Cluster (llama-3.3-70b-versatile → llama-3.1-8b-instant)
     │ (On Network Deadzone)
     ▼
[Tier 8]   Local AI Container (Ollama qwen2.5:3b / gemma2:2b on port 11434)
     │ (On Air-Gapped Standalone)
     ▼
[Tier 9]   Deterministic Botanical Field Catalog (100% offline, zero-dependency)
```

### 2. Containerized Podman Orchestration
The entire stack runs with rootless Podman:
```bash
npm run podman:up
npm run podman:pull-gemma
```
Running 3 microservices:
1. `fieldquest-web` (React PWA, Port 5173)
2. `fieldquest-api` (Express 5 gateway, Port 4000)
3. `fieldquest-ai` (Ollama AI daemon, Port 11434 with persistent model volume)

---

## Why Does Open Innovation Matter?

1. **True Privacy in Nature:** When you are taking photos and writing reflections on a trail, your thoughts shouldn't be piped into a centralized cloud ad engine. Open-weight models running on-device (`qwen2.5:3b`, `gemma2:2b`) give users absolute data sovereignty.
2. **Offline Resilience Without Cell Towers:** Closed APIs require an active internet connection. Forests, parks, and mountains often have poor cell signal. Open models allow generative intelligence to run on edge laptops, Raspberry Pis, or air-gapped local devices.
3. **Freedom from Arbitrary Deprecations & Paywalls:** Proprietary APIs can change pricing, reduce context, or shut down overnight. Open innovation guarantees that nature explorers and educators can run FieldQuest forever with zero external dependencies.

---

## My Agent Session

This project was built with the assistance of the **Antigravity AI Agent** pair-programming workflow:
- Iterative multi-model fallback chain design across Gemini and Groq.
- Dexie IndexedDB client schema for zero-latency local observation storage.
- Museum-grade HTML5 Canvas 2D composite folio generator with ornamental Linnaean borders and single-page vector PDF printing.
- End-to-end containerization with rootless Podman compose and Vitest automated suites (27 tests passing).

---

## Prize Categories

- 🏆 **Hacktoberfest Week 1: Touch Grass (Main Challenge)**
- 🌿 **Open-Source AI & Open-Weight LLMs (Ollama / Qwen / Gemma)**
- 🔒 **Best Offline-First & Privacy-Preserving Architecture**

---
