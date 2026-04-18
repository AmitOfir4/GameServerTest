import { LuckyScratchService } from "../../src/modules/luckyScratch/luckyScratch.service";
import { DataStore } from "../../src/data/store";
import { ApiError } from "../../src/core/errors";

describe("LuckyScratchService", () => {
    it("allows scratching when player has eligible rewards", () => {
        const store = new DataStore();
        const service = new LuckyScratchService(store);

        const result = service.scratch("p1");

        expect(result).toHaveProperty("reward");
        expect(result).toHaveProperty("coinsBefore");
        expect(result).toHaveProperty("coinsAfter");
        expect(result.coinsAfter).toBeLessThan(result.coinsBefore);
    });
});