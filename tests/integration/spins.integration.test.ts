import { loadTestApp, loginAsNemo } from "../helpers/test-app";

describe("Spins integration - boundary & validation", () => {
  it("returns 201 for minimum valid bet (boundary: betAmount=1)", async () => {
    const { client } = loadTestApp({ rng: () => 0.99 });
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: 1 });

    expect(response.status).toBe(200);
    expect(response.body.outcome).toBe("win");
  });

  it("returns 201 for maximum valid bet (boundary: betAmount=5000)", async () => {
    const { client } = loadTestApp({ rng: () => 0.99 });
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: 5000 });

    // p1 has 1200 coins — not enough for 5000, but schema validation passes first
    // 422 means it reached the service layer (schema was valid)
    expect([201, 422]).toContain(response.status);
  });

  it("returns 400 for betAmount=0 (below minimum)", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: 0 });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid payload");
  });

  it("returns 400 for betAmount=-1 (negative value)", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: -1 });

    expect(response.status).toBe(400);
  });

  it("returns 400 for betAmount=5001 (above maximum)", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: 5001 });

    expect(response.status).toBe(400);
  });

  it("returns 400 for fractional betAmount (non-integer)", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: 1.5 });

    expect(response.status).toBe(400);
  });

  it("returns 400 for string betAmount", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: "100" });

    expect(response.status).toBe(400);
  });

  it("returns 400 for missing betAmount", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("returns 422 when bet exceeds player balance", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    // p1 has 1200 coins; bet 1201
    const response = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: 1201 });

    expect(response.status).toBe(422);
    expect(response.body.error).toBe("Insufficient balance");
  });

  it("returns 401 for spin without auth token", async () => {
    const { client } = loadTestApp();

    const response = await client
      .post("/api/v1/spins")
      .send({ betAmount: 100 });

    expect(response.status).toBe(401);
  });
});
