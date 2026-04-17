"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const testcontainer_1 = require("./testcontainer");
describe("PostgreSQL integration", () => {
    jest.setTimeout(120000);
    it("logs in and fetches player from database", async () => {
        const db = await (0, testcontainer_1.setupDbTestApp)();
        try {
            const login = await (0, supertest_1.default)(db.app).post("/api/v1/auth/login").send({ username: "nemo" });
            expect(login.status).toBe(200);
            const player = await (0, supertest_1.default)(db.app)
                .get(`/api/v1/players/${login.body.playerId}`)
                .set("Authorization", `Bearer ${login.body.token}`);
            expect(player.status).toBe(200);
            expect(player.body.username).toBe("nemo");
            expect(player.body.inventory).toContain("bronze-chest");
        }
        finally {
            await db.close();
        }
    });
    it("handles idempotent duplicate claims consistently", async () => {
        const db = await (0, testcontainer_1.setupDbTestApp)();
        try {
            const login = await (0, supertest_1.default)(db.app).post("/api/v1/auth/login").send({ username: "nemo" });
            const token = login.body.token;
            const first = await (0, supertest_1.default)(db.app)
                .post("/api/v1/rewards/claim")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "same-key")
                .send({ rewardId: "r2" });
            const second = await (0, supertest_1.default)(db.app)
                .post("/api/v1/rewards/claim")
                .set("Authorization", `Bearer ${token}`)
                .set("Idempotency-Key", "same-key")
                .send({ rewardId: "r2" });
            expect(first.status).toBe(201);
            expect(first.body.status).toBe("claimed");
            expect(second.status).toBe(201);
            expect(second.body.status).toBe("duplicate");
            const claimsCount = await db.pool.query("SELECT COUNT(*)::int AS count FROM reward_claims WHERE idempotency_key = $1", [
                "same-key"
            ]);
            expect(claimsCount.rows[0].count).toBe(1);
        }
        finally {
            await db.close();
        }
    });
    it("supports concurrent claim attempts with same idempotency key", async () => {
        const db = await (0, testcontainer_1.setupDbTestApp)();
        try {
            const login = await (0, supertest_1.default)(db.app).post("/api/v1/auth/login").send({ username: "nemo" });
            const token = login.body.token;
            const [a, b] = await Promise.all([
                (0, supertest_1.default)(db.app)
                    .post("/api/v1/rewards/claim")
                    .set("Authorization", `Bearer ${token}`)
                    .set("Idempotency-Key", "race-key")
                    .send({ rewardId: "r2" }),
                (0, supertest_1.default)(db.app)
                    .post("/api/v1/rewards/claim")
                    .set("Authorization", `Bearer ${token}`)
                    .set("Idempotency-Key", "race-key")
                    .send({ rewardId: "r2" })
            ]);
            const statuses = [a.body.status, b.body.status].sort();
            expect(a.status).toBe(201);
            expect(b.status).toBe(201);
            expect(statuses).toEqual(["claimed", "duplicate"]);
            const claimsCount = await db.pool.query("SELECT COUNT(*)::int AS count FROM reward_claims WHERE idempotency_key = $1", [
                "race-key"
            ]);
            expect(claimsCount.rows[0].count).toBe(1);
        }
        finally {
            await db.close();
        }
    });
});
