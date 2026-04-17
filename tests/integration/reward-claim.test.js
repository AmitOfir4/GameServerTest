"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_app_1 = require("../helpers/test-app");
describe("Reward claim integration", () => {
    it("claims reward and returns duplicate for repeated idempotency key", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const first = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Idempotency-Key", "req-1")
            .send({ rewardId: "r2" });
        const second = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Idempotency-Key", "req-1")
            .send({ rewardId: "r2" });
        expect(first.status).toBe(201);
        expect(first.body.status).toBe("claimed");
        expect(second.status).toBe(201);
        expect(second.body.status).toBe("duplicate");
    });
    it("fails if idempotency key is missing", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const response = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .send({ rewardId: "r1" });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Idempotency-Key header is required");
    });
    it("returns 409 when same idempotency key is reused with different reward", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Idempotency-Key", "conflict-key")
            .send({ rewardId: "r2" });
        const conflict = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Idempotency-Key", "conflict-key")
            .send({ rewardId: "r1" });
        expect(conflict.status).toBe(409);
        expect(conflict.body.error).toBe("Idempotency-Key already used with different payload");
    });
    it("returns 422 when player level is too low for reward", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        // dory is level 3; r1 requires minLevel 5
        const loginRes = await client.post("/api/v1/auth/login").send({ username: "dory" });
        const { token, playerId } = loginRes.body;
        const response = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", "level-key")
            .send({ rewardId: "r1" });
        expect(response.status).toBe(422);
        expect(response.body.error).toBe("Player level too low for reward");
    });
    it("returns 422 when player has insufficient coins for reward", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        // dory has 300 coins; r1 costs 800
        const loginRes = await client.post("/api/v1/auth/login").send({ username: "dory" });
        const { token } = loginRes.body;
        // dory level 3, r2 costs 200 and requires level 2 — first drain coins
        await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", "drain-coins")
            .send({ rewardId: "r2" }); // costs 200, dory now has 100 coins
        const response = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", "broke-key")
            .send({ rewardId: "r2" }); // costs 200, dory only has 100
        expect(response.status).toBe(422);
        expect(response.body.error).toBe("Insufficient balance for reward");
    });
    it("handles concurrent claims with same idempotency key gracefully", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        // Note: Node.js is single-threaded so these resolve sequentially.
        // This verifies the idempotency contract holds under Promise.all — the real
        // race-condition safety is validated in tests/db with Testcontainers.
        const [a, b] = await Promise.all([
            client
                .post("/api/v1/rewards/claim")
                .set("Authorization", `Bearer ${auth.token}`)
                .set("Idempotency-Key", "concurrent-key")
                .send({ rewardId: "r2" }),
            client
                .post("/api/v1/rewards/claim")
                .set("Authorization", `Bearer ${auth.token}`)
                .set("Idempotency-Key", "concurrent-key")
                .send({ rewardId: "r2" })
        ]);
        expect(a.status).toBe(201);
        expect(b.status).toBe(201);
        const statuses = [a.body.status, b.body.status].sort();
        expect(statuses).toEqual(["claimed", "duplicate"]);
    });
    it("returns 400 for missing rewardId in body", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const response = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Idempotency-Key", "bad-body")
            .send({});
        expect(response.status).toBe(400);
    });
    it("returns 404 for unknown rewardId", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const response = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Idempotency-Key", "unknown-reward-key")
            .send({ rewardId: "does-not-exist" });
        expect(response.status).toBe(404);
    });
});
