# FieldQuest - Deployment Guide

## 1. Production Architecture Overview

FieldQuest's architecture intentionally decouples the client PWA from the backend API and AI inference tier:

```
[ Explorer Browser / Mobile ]
         │
         │ (Static HTTPS Requests)
         ▼
[ Static Host / Edge CDN ]  --> (Vercel / Cloudflare Pages / Netlify)
   - Pre-rendered PWA Assets (HTML/CSS/JS)
   - Service Worker Cache
   - App Manifest
         │
         │ (API REST Calls: /api/v1/*)
         ▼
[ Dedicated Backend Node.js Host ] --> (VPS / Render / Railway / Fly.io)
   - Express 5 REST API
   - Safety checks & Rate limiting
         │
         │ (Local IPC / HTTP :11434)
         ▼
[ Inference Host ] --> (Ollama with GPU / CPU)
   - qwen3:4b (or fallback Demo Provider)
```

> **Crucial Deployment Note:** Deploying the web frontend alone **does not** automatically spin up Ollama or download the 4B parameter open-weight model. Serverless functions (such as AWS Lambda or Vercel Serverless) cannot run persistent 4B+ LLMs without prohibitive cold starts and memory limits.

---

## 2. Deployment Scenarios

### Scenario A: Production Cloud AI (Zero GPU Setup, Free Tier)
- **Frontend:** Hosted on Vercel, Cloudflare Pages, or Netlify.
- **Backend:** Hosted on Render, Railway, Fly.io, or VPS.
- **AI Engine:** Google Gemini (1.5 Flash / 2.0 Flash) or Groq Cloud (Llama 3.3 / Qwen 2.5) free-tier API keys stored safely in backend environment variables (`GEMINI_API_KEY` / `GROQ_API_KEY`).
- **Failover:** Automatic fallback to local Ollama (if active) and Curated Field Library if quotas are hit.
- **Advantage:** Production-ready real AI for all website visitors with zero GPU costs, zero local model downloads, and zero client setup.

### Scenario B: Full Sovereign Self-Hosted Stack with Local AI
- **Frontend & Backend:** Deployed on a single machine or VPS (e.g. Ubuntu with 8GB RAM + NVIDIA GPU or modern multi-core CPU).
- **Ollama:** Installed via `curl -fsSL https://ollama.com/install.sh | sh` and running as a systemd service.
- **Reverse Proxy:** Nginx or Caddy terminating SSL (Let's Encrypt) and proxying `/api` to port 4000 and `/` to Vite static build.

### Scenario C: Static / Offline Demonstration Mode
- **Configuration:** Set `AI_PROVIDER=demo` in `.env`.
- **Advantage:** 100% offline, zero network or LLM dependencies, guaranteed instant responses.

---

## 3. Environment Variables Reference

### Backend (`apps/api`)
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4000` | HTTP port for Express server |
| `NODE_ENV` | `production` | Node environment (`development` / `production`) |
| `CLIENT_ORIGIN` | `https://your-domain.com` | Allowed CORS origin (comma-separated or single) |
| `AI_PROVIDER` | `cloud` | Active mission generator provider (`cloud`, `ollama`, `demo`) |
| `GEMINI_API_KEY` | *(optional)* | Google Gemini API key for free-tier cloud generation |
| `GEMINI_MODEL` | `gemini-1.5-flash` | Gemini model ID (`gemini-1.5-flash`, `gemini-2.0-flash`) |
| `GROQ_API_KEY` | *(optional)* | Groq Cloud API key for ultra-fast Llama 3.3 generation |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model ID |
| `CLOUD_PROVIDER` | `gemini` | Primary cloud provider (`gemini` or `groq`) |
| `OLLAMA_BASE_URL`| `http://localhost:11434`| Address of Ollama daemon |
| `OLLAMA_MODEL` | `qwen2.5:3b` | Open-weight model tag |
| `OLLAMA_TIMEOUT_MS`| `45000` | Request timeout in milliseconds |
| `RATE_LIMIT_MAX` | `30` | Max requests per minute per IP |

### Frontend (`apps/web`)
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000` | URL of backend API in production |

---

## 4. Build Commands

```bash
# Clean install
npm ci

# Build both applications
npm run build

# Web build output: apps/web/dist
# API build output: apps/api/dist
```

To run the production API server:
```bash
node apps/api/dist/server.js
```

---

## 5. Health Checks & Monitoring
- **Liveness probe:** `GET /api/v1/health` (Returns HTTP 200 `{ status: "healthy" }`)
- **AI Readiness probe:** `GET /api/v1/ai/status` (Returns availability of Ollama backend without leaking secrets)

---

## 6. Container Deployment with Podman (Local & Production)

FieldQuest provides official multi-stage Containerfiles and a `podman-compose.yml` configuration. This lets you run the exact same stack on **Podman Desktop** locally and on any Linux cloud server.

### Quick Start with Podman Compose:

```bash
# 1. Build container images
npm run podman:build
# or: podman compose build

# 2. Start FieldQuest in the background
npm run podman:up
# or: podman compose up -d

# 3. View live logs
npm run podman:logs
# or: podman compose logs -f

# 4. Stop containers
npm run podman:down
# or: podman compose down
```

### Accessing the services:
- **Web App (PWA):** `http://localhost:5173`
- **Backend API:** `http://localhost:4000` (Health: `http://localhost:4000/api/v1/health`)

### Running with a Local AI Model Container (LocalAI):
To run a self-hosted CPU/GPU model engine container alongside FieldQuest:
```bash
podman compose --profile ai up -d
```
This boots `localai/localai:latest-cpu` at `http://localhost:8080`, providing a standard OpenAI-compatible inference endpoint for FieldQuest.

