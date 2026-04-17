import { loadTestApp, loginAsNemo } from "../helpers/test-app";

describe("Auth + Player integration", () => {
  it("returns 400 on invalid login payload", async () => {
    const { client } = loadTestApp();

    const response = await client.post("/api/v1/auth/login").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid payload");
  });

  it("logs in and fetches player with auth token", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const playerResponse = await client
      .get(`/api/v1/players/${auth.playerId}`)
      .set("Authorization", `Bearer ${auth.token}`);

    expect(playerResponse.status).toBe(200);
    expect(playerResponse.body.id).toBe("p1");
    expect(playerResponse.body.username).toBe("nemo");
  });

  it("returns 401 for protected endpoints without token", async () => {
    const { client } = loadTestApp();

    const response = await client.get("/api/v1/players/p1");

    expect(response.status).toBe(401);
  });

  it("returns 401 when Authorization uses wrong scheme (Token instead of Bearer)", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .get(`/api/v1/players/${auth.playerId}`)
      .set("Authorization", `Token ${auth.token}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Missing or invalid authorization header");
  });

  it("returns 401 when Authorization header has no token after Bearer", async () => {
    const { client } = loadTestApp();

    const response = await client
      .get("/api/v1/players/p1")
      .set("Authorization", "Bearer");

    expect(response.status).toBe(401);
  });

  it("returns 401 when Authorization header is a random string", async () => {
    const { client } = loadTestApp();

    const response = await client
      .get("/api/v1/players/p1")
      .set("Authorization", "notavalidheaderatall");

    expect(response.status).toBe(401);
  });

  it("returns 401 when Bearer token is not a known session", async () => {
    const { client } = loadTestApp();

    const response = await client
      .get("/api/v1/players/p1")
      .set("Authorization", "Bearer 00000000-0000-0000-0000-000000000000");

    expect(response.status).toBe(401);
  });

  it("returns 401 for unknown player id (player not found)", async () => {
    const { client } = loadTestApp();
    const auth = await loginAsNemo(client);

    const response = await client
      .get("/api/v1/players/does-not-exist")
      .set("Authorization", `Bearer ${auth.token}`);

    expect(response.status).toBe(404);
  });
});
