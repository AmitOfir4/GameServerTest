import { loadTestApp, loginAsNemo } from "../helpers/test-app";

describe("E2E player lifecycle", () => {
  it("login -> spin -> claim reward -> verify player state", async () => {
    const { client } = loadTestApp({ rng: () => 0.9 });
    const auth = await loginAsNemo(client);

    const spin = await client
      .post("/api/v1/spins")
      .set("Authorization", `Bearer ${auth.token}`)
      .send({ betAmount: 100 });

    expect(spin.status).toBe(201);
    expect(spin.body.outcome).toBe("win");

    const claim = await client
      .post("/api/v1/rewards/claim")
      .set("Authorization", `Bearer ${auth.token}`)
      .set("Idempotency-Key", "flow-1")
      .send({ rewardId: "r1" });

    expect(claim.status).toBe(201);
    expect(claim.body.status).toBe("claimed");

    const player = await client
      .get(`/api/v1/players/${auth.playerId}`)
      .set("Authorization", `Bearer ${auth.token}`);

    expect(player.status).toBe(200);
    expect(player.body.coins).toBe(600);
    expect(player.body.inventory).toContain("golden-net");
  });
});
