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

### Scenario A: Production Cloud AI (Netlify + Render + GitHub) — *Recommended*
- **Frontend PWA:** Deployed on **Netlify** using [`netlify.toml`](file:///d:/hacktoberfest/FieldQuest/netlify.toml) and [`_redirects`](file:///d:/hacktoberfest/FieldQuest/apps/web/public/_redirects).
- **Backend API:** Deployed on **Render** (Free Tier Web Service) using [`render.yaml`](file:///d:/hacktoberfest/FieldQuest/render.yaml).
- **CI/CD:** Automated verification via **GitHub Actions** on push and pull request.
- **AI Engine:** Google Gemini (2.5/2.0/1.5 Flash) + Groq Cloud (Llama 3.3 70B) free-tier keys stored in Render environment variables.
- **Failover:** Automatic cascading failover to Curated Naturalist Catalog if quotas are reached. Zero GPU required, 100% uptime.

### Scenario B: Full Sovereign Self-Hosted Stack with Local AI
- **Frontend & Backend:** Deployed on a single machine or VPS (e.g. Ubuntu with 8GB RAM + NVIDIA GPU or modern multi-core CPU).
- **Ollama:** Installed via `curl -fsSL https://ollama.com/install.sh | sh` and running as a systemd service.
- **Reverse Proxy:** Nginx or Caddy terminating SSL (Let's Encrypt) and proxying `/api` to port 4000 and `/` to Vite static build.

### Scenario C: Static / Offline Demonstration Mode
- **Configuration:** Set `AI_PROVIDER=demo` in `.env`.
- **Advantage:** 100% offline, zero network or LLM dependencies, guaranteed instant responses.

---

## 3. Step-by-Step Production Deployments

### 3.1 Deploying Frontend to Netlify

FieldQuest comes pre-configured with [`netlify.toml`](file:///d:/hacktoberfest/FieldQuest/netlify.toml) and [`apps/web/public/_redirects`](file:///d:/hacktoberfest/FieldQuest/apps/web/public/_redirects) for clean client-side routing.

1. **Import Repository in Netlify**:
   - Go to [Netlify Dashboard](https://app.netlify.com) → **Add new site** → **Import an existing project** → Connect your GitHub repository.
2. **Configure Build Settings**:
   - **Base directory:** *(leave empty or `/`)*
   - **Build command:** `npm run build:web`
   - **Publish directory:** `apps/web/dist`
3. **Environment Variables**:
   - Set `VITE_API_BASE_URL` to your live Render backend URL (e.g., `https://fieldquest-api.onrender.com`).
4. **Deploy**:
   - Click **Deploy Site**. Netlify will build the PWA bundle, register service workers, and serve assets through their global edge CDN.

---

### 3.2 Deploying Backend API to Render

You can deploy using the automated Render Blueprint ([`render.yaml`](file:///d:/hacktoberfest/FieldQuest/render.yaml)) or manually:

#### Method A: Automated via Render Blueprint
1. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Blueprint**.
2. Select your `FieldQuest` repository. Render will automatically parse [`render.yaml`](file:///d:/hacktoberfest/FieldQuest/render.yaml).
3. Fill in secret variables:
   - `GEMINI_API_KEY`: *(your Google AI Studio key)*
   - `GROQ_API_KEY`: *(your Groq Cloud API key)*
   - `CLIENT_ORIGIN`: `https://your-site.netlify.app`
4. Click **Apply**.

#### Method B: Manual Web Service Setup
1. In Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository and set:
   - **Name:** `fieldquest-api`
   - **Runtime:** `Node`
   - **Build Command:** `npm ci --include=dev && npm run build:api`
   - **Start Command:** `node apps/api/dist/server.js`
   - **Health Check Path:** `/api/v1/health`
3. **Add Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` *(Render sets this automatically)*
   - `AI_PROVIDER`: `cloud`
   - `CLOUD_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: *(your key)*
   - `GROQ_API_KEY`: *(your key)*
   - `CLIENT_ORIGIN`: `https://your-site.netlify.app` *(or comma-separated URLs)*
4. Click **Create Web Service**. Once healthy, copy your service URL and add it as `VITE_API_BASE_URL` on Netlify.

---

### 3.3 GitHub Actions CI/CD

FieldQuest includes an automated CI workflow at [`.github/workflows/ci.yml`](file:///d:/hacktoberfest/FieldQuest/.github/workflows/ci.yml):
- Executes on every `push` and `pull_request` to `main` / `master`.
- Automatically validates:
  1. `npm run typecheck` (strict TypeScript validation across all workspaces)
  2. `npm test` (Vitest unit and provider failover suites)
  3. `npm run build` (production asset compilation check)

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
| `GEMINI_MODEL` | `gemini-3.8-flash` | Gemini model ID (or primary model) |
| `GEMINI_MODELS` | `gemini-3.8-flash,gemini-3.1-flash-lite,gemini-flash-latest,gemini-flash-lite-latest` | Comma-separated Gemini fallback model chain |
| `GROQ_API_KEY` | *(optional)* | Groq Cloud API key for ultra-fast Llama / GPT generation |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq model ID (or primary model) |
| `GROQ_MODELS` | `llama-3.3-70b-versatile,llama-3.1-8b-instant,openai/gpt-oss-120b` | Comma-separated Groq fallback model chain |
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

