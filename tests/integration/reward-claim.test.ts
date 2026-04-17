import { loadTestApp, loginAsNemo } from "../helpers/test-app";

describe("Reward claim integration", () => {
  it("claims reward and returns duplicate for repeated idempotency key", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

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
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/rewards/claim")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ rewardId: "r1" });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Idempotency-Key header is required");
  });
});
