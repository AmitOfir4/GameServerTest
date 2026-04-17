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
});
