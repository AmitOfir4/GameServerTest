"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("../../src/data/store");
const rewards_service_1 = require("../../src/modules/rewards/rewards.service");
describe("RewardsService", () => {
    it("claims reward and updates player data", () => {
        const store = new store_1.DataStore();
        const service = new rewards_service_1.RewardsService(store);
        const result = service.claimReward("p1", "r1", "idem-1");
        expect(result.status).toBe("claimed");
        expect(result.player.coins).toBe(400);
        expect(result.player.inventory).toContain("golden-net");
    });
    it("returns duplicate for same idempotency key and payload", () => {
        const store = new store_1.DataStore();
        const service = new rewards_service_1.RewardsService(store);
        service.claimReward("p1", "r2", "idem-2");
        const second = service.claimReward("p1", "r2", "idem-2");
        expect(second.status).toBe("duplicate");
    });
    it("throws when same idempotency key is reused with a different reward", () => {
        const store = new store_1.DataStore();
        const service = new rewards_service_1.RewardsService(store);
        service.claimReward("p1", "r2", "idem-3");
        expect(() => service.claimReward("p1", "r1", "idem-3")).toThrow("Idempotency-Key already used with different payload");
    });
});
