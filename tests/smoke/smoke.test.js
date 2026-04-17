"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Smoke suite — critical path only, runs fast on every PR.
 * Goal: confirm the API is alive and core flows aren't broken before running the full suite.
 */
const test_app_1 = require("../helpers/test-app");
describe("[smoke] health check", () => {
    it("GET /health returns ok", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const res = await client.get("/api/v1/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });
});
describe("[smoke] auth", () => {
    it("POST /auth/login succeeds for a known player", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const res = await client.post("/api/v1/auth/login").send({ username: "nemo" });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body).toHaveProperty("playerId");
    });
    it("POST /auth/login returns 401 for unknown player", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const res = await client.post("/api/v1/auth/login").send({ username: "ghost" });
        expect(res.status).toBe(401);
    });
});
describe("[smoke] player", () => {
    it("GET /players/:id returns player data for authenticated request", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const res = await client
            .get(`/api/v1/players/${auth.playerId}`)
            .set("Authorization", `Bearer ${auth.token}`);
        expect(res.status).toBe(200);
        expect(res.body.username).toBe("nemo");
    });
    it("GET /players/:id returns 401 without token", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const res = await client.get("/api/v1/players/p1");
        expect(res.status).toBe(401);
    });
});
describe("[smoke] spins", () => {
    it("POST /spins returns spin result", async () => {
        const { client } = (0, test_app_1.loadTestApp)({ rng: () => 0.99 });
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const res = await client
            .post("/api/v1/spins")
            .set("Authorization", `Bearer ${auth.token}`)
            .send({ betAmount: 100 });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("outcome");
        expect(res.body).toHaveProperty("balanceAfter");
    });
});
describe("[smoke] rewards", () => {
    it("POST /rewards/claim returns claimed status", async () => {
        const { client } = (0, test_app_1.loadTestApp)();
        const auth = await (0, test_app_1.loginAsNemo)(client);
        const res = await client
            .post("/api/v1/rewards/claim")
            .set("Authorization", `Bearer ${auth.token}`)
            .set("Idempotency-Key", "smoke-claim-1")
            .send({ rewardId: "r2" });
        expect(res.status).toBe(201);
        expect(res.body.status).toBe("claimed");
    });
});
