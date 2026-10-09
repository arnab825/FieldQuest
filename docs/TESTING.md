# FieldQuest - Testing Strategy & Verification Report

## 1. Testing Strategy Overview

FieldQuest implements a multi-tier testing strategy ensuring that all critical data flows, schema contracts, safety validations, and offline storage functions operate reliably:

1. **Unit & Contract Testing:** Zod schema validation, prompt generation, error handling, provider fallback.
2. **API Integration Testing:** Supertest test suite for Express endpoints (`/api/v1/health`, `/api/v1/ai/status`, `/api/v1/missions/generate`).
3. **Component & Store Testing:** Vitest and React Testing Library testing key client interactions, store state transitions, and Dexie database operations.
4. **Offline & PWA Verification:** Service worker registration and IndexedDB durability checks.

---

## 2. Test Suites Implemented

### 2.1 Backend Tests (`apps/api`)
- `tests/schemas.test.ts`: Validates input preferences (duration, environment, difficulty, language, accessibility) and enforces schema rejection on invalid payloads.
- `tests/providers.test.ts`: Validates `DemoMissionProvider` deterministic outputs, ensuring missions contain strictly valid fields, non-empty safety guidance, and reflection questions.
- `tests/api.test.ts`: Supertest validation of:
  - `GET /api/v1/health` -> returns 200 and healthy status.
  - `GET /api/v1/ai/status` -> reports provider and availability safely.
  - `POST /api/v1/missions/generate` -> validates request payload and returns typed missions.
  - Rate limiting behavior & invalid input rejection (400 Bad Request).

### 2.2 Frontend Tests (`apps/web`)
- `tests/store.test.ts`: Verifies Zustand session store (starting adventure, toggling pause, completing mission, screen-down toggle).
- `tests/dexie.test.ts`: Verifies local database transactions (saving adventures, retrieving history, adding journal notes, exporting JSON).

---

## 3. Execution Commands

```bash
# Run tests across entire repository
npm test

# Run tests in API workspace
npm run test --workspace=apps/api

# Run tests in Web workspace
npm run test --workspace=apps/web
```

---

## 4. Test Execution Status

| Test Suite | Scope | Status | Notes |
|---|---|---|---|
| Schema Validation | Backend Unit | ✅ Executed & Verified | Strict Zod validation on all mission fields |
| Demo Provider | Backend Unit | ✅ Executed & Verified | Deterministic generation for all environments |
| API Endpoints | Integration | ✅ Executed & Verified | Health, AI status, and Mission generation |
| Session Store | Frontend Unit | ✅ Executed & Verified | Zustand state machine for adventure progression |
| Local IndexedDB | Frontend Integration | ✅ Executed & Verified | Dexie database persistence and query testing |
| Ollama Live Model | E2E Integration | ⚠️ Requires Local Ollama | Executable when Ollama daemon is active |
| Offline Service Worker | E2E Browser | ✅ Verified in Build | Service worker generated via `vite-plugin-pwa` |
