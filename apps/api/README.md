# `@fieldquest/api`

> Stateless Multi-Tier AI Inference Broker & Nature Mission Orchestration Microservice.

For the full architectural guide and cross-app use cases, see the **[apps/README.md](../README.md)** workspace reference.

---

## ⚡ What this service does

1. **Stateless AI Orchestration**: Converts user nature exploration parameters into structured scientific quests without storing user records or PII.
2. **9-Tier Cascading Failover**:
   - Google Gemini Cluster (`gemini-3.8-flash` down to `gemini-1.5-flash-8b`)
   - Groq Cloud LPU Cluster (`llama-3.3-70b-versatile` down to `llama-3.1-8b-instant`)
   - Local Ollama Engine (`qwen2.5:3b` on port 11434)
   - Deterministic Curated Naturalist Library
3. **Zod Validation & Schema Enforcing**: Guarantees type-safe responses for mission generation and scaffolding.
4. **Rate Limiting & Proxy Trust**: Built-in 2-tier rate limiting for DDoS protection in production.

---

## 🚀 Key Use Cases & Endpoints

| HTTP Method & Path | Controller / Route | Description |
|:---|:---|:---|
| `GET /` | `app.ts` | Friendly API root with documentation and online status. |
| `GET /api/v1/health` | `routes/health.routes.ts` | Health check probe for Docker, Podman, and cloud orchestrators. |
| `GET /api/v1/ai/status` | `routes/ai.routes.ts` | Live diagnostics of Gemini, Groq, or Ollama availability. |
| `POST /api/v1/ai/configure` | `routes/ai.routes.ts` | Dynamic runtime configuration for active models and credentials. |
| `POST /api/v1/missions/generate` | `routes/mission.routes.ts` | Generates 3 tailored nature exploration missions with structured phases. |
| `POST /api/v1/missions/scaffold` | `routes/mission.routes.ts` | Generates diagnostic field-note templates and taxonomic scaffolding. |

---

## 🛠️ Developer Scripts

Run from `apps/api` (or via `npm run <script> --workspace=apps/api` from the repo root):

```bash
# Start development server with hot-reload (tsx)
npm run dev

# Compile TypeScript to dist/
npm run build

# Start production server
npm start

# Run unit & integration tests (Vitest)
npm run test

# Typecheck without emitting files
npm run typecheck
```

---

## 📁 Directory Structure

```
apps/api/
├── src/
│   ├── config/         # Environment variables & runtime settings
│   ├── middleware/     # Rate limiters, request logger, error handler
│   ├── prompts/        # System prompts for nature mission generation
│   ├── providers/      # Gemini, Groq, Ollama, and Demo AI provider implementations
│   ├── routes/         # Express 5 route handlers (health, ai, missions)
│   ├── schemas/        # Zod schemas for input validation and output types
│   ├── services/       # MissionGeneratorService with cascading failover
│   ├── app.ts          # Express app factory & middleware stack
│   └── server.ts       # HTTP listener entrypoint
├── tests/              # Vitest & Supertest test suites
└── package.json
```
