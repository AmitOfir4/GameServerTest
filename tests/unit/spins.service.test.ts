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

  it("applies losing spin", () => {
    const store = new DataStore();
    const service = new SpinsService(store, () => 0.0);

    const result = service.spin("p1", 100);

    expect(result.outcome).toBe("lose");
    expect(result.deltaCoins).toBe(-100);
    expect(result.balanceAfter).toBe(1100);
  });

  it("rejects spins that exceed balance", () => {
    const store = new DataStore();
    const service = new SpinsService(store, () => 0.0);

    expect(() => service.spin("p2", 9999)).toThrow("Insufficient balance");
  });

  it("accepts bet exactly equal to player balance (boundary: exact balance)", () => {
    const store = new DataStore();
    const service = new SpinsService(store, () => 0.99); // win

    // p1 starts at 1200 coins
    const result = service.spin("p1", 1200);

    expect(result.outcome).toBe("win");
    expect(result.balanceAfter).toBe(3600);
  });

  it("rejects bet of 1 over player balance (boundary: over by one)", () => {
    const store = new DataStore();
    const service = new SpinsService(store, () => 0.99);

    // p1 starts at 1200 coins
    expect(() => service.spin("p1", 1201)).toThrow("Insufficient balance");
  });

  it("rejects spin for unknown player", () => {
    const store = new DataStore();
    const service = new SpinsService(store, () => 0.99);

    expect(() => service.spin("unknown-id", 100)).toThrow("Player not found");
  });
});
