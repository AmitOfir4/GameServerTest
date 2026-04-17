import { DbStore } from "../../db/db-store";

export class RewardsDbService {
  constructor(private readonly store: DbStore) {}

  async claimReward(playerId: string, rewardId: string, idempotencyKey: string) {
    return this.store.claimRewardTransactional(playerId, rewardId, idempotencyKey);
  }
}
