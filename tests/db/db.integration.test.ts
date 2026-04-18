import request from "supertest";
import { setupDbTestApp } from "./testcontainer";

describe("MongoDB integration", () => {
  jest.setTimeout(120000);

  it("logs in and fetches player from database", async () => {
    const db = await setupDbTestApp();

    try {
      const login = await request(db.app).post("/api/v1/auth/login").send({ username: "nemo" });
      expect(login.status).toBe(200);

      const player = await request(db.app)
        .get(`/api/v1/players/${login.body.playerId}`)
        .set("Authorization", `Bearer ${login.body.token}`);

      expect(player.status).toBe(200);
      expect(player.body.username).toBe("nemo");
      expect(player.body.inventory["bronze-chest"]).toBe(1);
    } finally {
      await db.close();
    }
  });

  it("handles idempotent duplicate claims consistently", async () => {
    const db = await setupDbTestApp();

    try {
      const login = await request(db.app).post("/api/v1/auth/login").send({ username: "nemo" });
      const token = login.body.token;

      const first = await request(db.app)
        .post("/api/v1/rewards/claim")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", "same-key")
        .send({ rewardId: "luckyBaitReward" });

      const second = await request(db.app)
        .post("/api/v1/rewards/claim")
        .set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", "same-key")
        .send({ rewardId: "luckyBaitReward" });

      expect(first.status).toBe(201);
      expect(first.body.status).toBe("claimed");
      expect(second.status).toBe(201);
      expect(second.body.status).toBe("duplicate");

      const claimsCount = await db.mongoDb.collection<{ _id: string }>("rewardClaims").countDocuments({ _id: "same-key" });
      expect(claimsCount).toBe(1);
    } finally {
      await db.close();
    }
  });

  it("supports concurrent claim attempts with same idempotency key", async () => {
    const db = await setupDbTestApp();

    try {
      const login = await request(db.app).post("/api/v1/auth/login").send({ username: "nemo" });
      const token = login.body.token;

      const [a, b] = await Promise.all([
        request(db.app)
          .post("/api/v1/rewards/claim")
          .set("Authorization", `Bearer ${token}`)
          .set("Idempotency-Key", "race-key")
          .send({ rewardId: "luckyBaitReward" }),
        request(db.app)
          .post("/api/v1/rewards/claim")
          .set("Authorization", `Bearer ${token}`)
          .set("Idempotency-Key", "race-key")
          .send({ rewardId: "luckyBaitReward" })
      ]);

      const statuses = [a.body.status, b.body.status].sort();
      expect(a.status).toBe(201);
      expect(b.status).toBe(201);
      expect(statuses).toEqual(["claimed", "duplicate"]);

      const claimsCount = await db.mongoDb.collection<{ _id: string }>("rewardClaims").countDocuments({ _id: "race-key" });
      expect(claimsCount).toBe(1);
    } finally {
      await db.close();
    }
  });
});
