import { DataStore } from "../../src/data/store";
import { RewardsService } from "../../src/modules/rewards/rewards.service";

describe("RewardsService", () => {
  it("claims reward and updates player data", () => {
    const store = new DataStore();
    const service = new RewardsService(store);

    const result = service.claimReward("p1", "goldenNetReward", "idem-1");

    expect(result.status).toBe("claimed");
    expect(result.player.coins).toBe(400);
    expect(result.player.inventory["golden-net"]).toBe(1);
  });

  it("returns duplicate for same idempotency key and payload", () => {
    const store = new DataStore();
    const service = new RewardsService(store);

    service.claimReward("p1", "luckyBaitReward", "idem-2");
    const second = service.claimReward("p1", "luckyBaitReward", "idem-2");

    expect(second.status).toBe("duplicate");
  });

  it("throws when same idempotency key is reused with a different reward", () => {
    const store = new DataStore();
    const service = new RewardsService(store);

    service.claimReward("p1", "luckyBaitReward", "idem-3");

    expect(() => service.claimReward("p1", "goldenNetReward", "idem-3")).toThrow(
      "Idempotency-Key already used with different payload"
    );
  });
});
