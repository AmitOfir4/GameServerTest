# Fish of Fortune Backend Test Automation Playground

This repo is a focused practice project for backend automation interviews.

It includes a Node.js + TypeScript API and a full testing pyramid:
- Unit tests
- Integration tests
- End-to-end flow tests
- API contract tests
- Real PostgreSQL integration tests (Testcontainers)
- CI pipeline integration

## Why this matches the Whalo role
- Node.js backend services with automation-first structure
- REST API testing across happy path + edge cases
- Idempotency, auth, and stateful business logic validation
- CI/CD workflow running segmented suites
- STP/STD documentation templates for process maturity discussions

## Project Structure
- `src/` API source code
- `tests/unit/` service-level logic tests
- `tests/integration/` endpoint and middleware tests
- `tests/e2e/` full player lifecycle flows
- `tests/contract/` JSON schema contract checks
- `tests/db/` real PostgreSQL tests with Testcontainers
- `.github/workflows/ci.yml` pipeline setup
- `docs/` STP, STD, and interview drills

## API Endpoints
### Public
- `GET /api/v1/health`
- `POST /api/v1/auth/login`

### Protected (Bearer token)
- `GET /api/v1/players/:id`
- `POST /api/v1/spins`
- `POST /api/v1/rewards/claim` (`Idempotency-Key` required)

### Test only
- `POST /api/v1/test/reset` (enabled only when `NODE_ENV=test`)

## Quick Start
```bash
npm install
npm run dev
```

Server starts on `http://localhost:3000`.

## Run with PostgreSQL
Start the DB-backed API:

```bash
export DATABASE_URL="postgres://test:test@localhost:5432/testdb"
export DB_AUTO_SEED=true
npm run dev:db
```

DB API runs on `http://localhost:3001` by default.

## Run Tests
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:contract
npm run test:db
npm test
npm run test:all
```

`npm run test:db` uses Testcontainers and requires Docker (or another supported container runtime).

## Practice API Examples (DB mode)
```bash
# 1) login
curl -s -X POST http://localhost:3001/api/v1/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username":"nemo"}'

# 2) spin
curl -s -X POST http://localhost:3001/api/v1/spins \
   -H "Authorization: Bearer <TOKEN>" \
   -H "Content-Type: application/json" \
   -d '{"betAmount":100}'

# 3) claim reward with idempotency key
curl -s -X POST http://localhost:3001/api/v1/rewards/claim \
   -H "Authorization: Bearer <TOKEN>" \
   -H "Idempotency-Key: practice-1" \
   -H "Content-Type: application/json" \
   -d '{"rewardId":"luckyBaitReward"}'
```

## Suggested Interview Walkthrough
1. Explain the test pyramid and why each layer exists.
2. Demo idempotency testing and why it matters for backend reliability.
3. Show how deterministic dependencies (`rng`, `now`) reduce flaky tests.
4. Walk through CI quality gates and release confidence.
5. Discuss what you would add for real microservices:
   - DB test containers
   - contract publishing
   - service virtualization
   - parallel test execution and test data management

## 7-Day Prep Plan
1. Day 1: Run all suites and understand flow.
2. Day 2: Add negative tests for every endpoint.
3. Day 3: Replace in-memory store with PostgreSQL and add integration tests.
4. Day 4: Add load-sensitive tests for spin/reward endpoints.
5. Day 5: Add coverage gate and flaky-test retry strategy in CI.
6. Day 6: Write a one-page quality strategy (scope, risks, exit criteria).
7. Day 7: Do a full mock interview using this repo as your sample project.
