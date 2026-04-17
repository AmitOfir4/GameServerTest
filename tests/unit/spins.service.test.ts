import { DataStore } from "../../src/data/store";
import { SpinsService } from "../../src/modules/spins/spins.service";

describe("SpinsService", () => {
  it("applies winning spin", () => {
    const store = new DataStore();
    const service = new SpinsService(store, () => 0.99);

    const result = service.spin("p1", 100);

    expect(result.outcome).toBe("win");
    expect(result.deltaCoins).toBe(200);
    expect(result.balanceAfter).toBe(1400);
  });

  it("rejects spins that exceed balance", () => {
    const store = new DataStore();
    const service = new SpinsService(store, () => 0.0);

    expect(() => service.spin("p2", 9999)).toThrow("Insufficient balance");
  });
});
