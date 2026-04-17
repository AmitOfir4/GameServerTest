# Software Test Design (STD) Sample

## Feature: Reward Claim

### Preconditions
- Player is authenticated
- Reward exists in catalog
- Player has sufficient level and coins

### Test Scenarios
1. Valid claim with new idempotency key
2. Repeat claim with same key and payload (duplicate-safe)
3. Reuse same key with different payload (conflict)
4. Missing idempotency key
5. Player below minimum level
6. Insufficient coins

### Data Sets
- Player p1: level 7, coins 1200
- Reward r1: minLevel 5, cost 800
- Reward r2: minLevel 2, cost 200

### Assertions
- HTTP status and response body
- Balance and inventory updates
- Idempotency behavior consistency
