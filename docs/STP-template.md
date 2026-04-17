# Software Test Plan (STP) Template

## 1. Scope
- Services in scope: Auth, Players, Spins, Rewards
- Out of scope: mobile client rendering, third-party SDK UI behavior

## 2. Test Objectives
- Validate API correctness and business rules
- Prevent regressions in economy-impacting endpoints
- Ensure idempotency and auth protections are enforced

## 3. Test Levels
- Unit: service business logic
- Integration: API endpoints + middleware + validation
- End-to-End: full user flow through multiple endpoints
- Contract: schema compatibility for consumer safety

## 4. Environments
- Local: Node 20 + in-memory store
- CI: GitHub Actions pipeline
- Optional staging: real database + service dependencies

## 5. Risk Areas
- Currency manipulation via spin/reward operations
- Unauthorized data access
- Duplicate processing without idempotency
- API contract drift

## 6. Exit Criteria
- All suites pass in CI
- Critical and high-severity defects closed
- Coverage target met (example: >= 80%)

## 7. Deliverables
- Automated test code
- Execution reports
- Defect log
- Regression checklist
