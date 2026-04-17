import { ApiError } from "../../core/errors";
import { DataStore } from "../../data/store";

export class RewardsService {
  constructor(private readonly store: DataStore) {}

  claimReward(playerId: string, rewardId: string, idempotencyKey: string) {
    if (!idempotencyKey) {
      throw new ApiError(400, "Idempotency-Key header is required");
    }

    const existingClaim = this.store.getClaimByIdempotencyKey(idempotencyKey);
    if (existingClaim) {
      if (existingClaim.playerId !== playerId || existingClaim.rewardId !== rewardId) {
        throw new ApiError(409, "Idempotency-Key already used with different payload");
      }

      const existingPlayer = this.store.getPlayerById(playerId);
      return {
        status: "duplicate",
        player: existingPlayer,
        reward: this.store.getRewardById(rewardId)
      };
    }

    const player = this.store.getPlayerById(playerId);
    const reward = this.store.getRewardById(rewardId);

    if (player.level < reward.minLevel) {
      throw new ApiError(422, "Player level too low for reward");
    }

    if (player.coins < reward.costCoins) {
      throw new ApiError(422, "Insufficient balance for reward");
    }

    player.coins -= reward.costCoins;
    player.inventory.push(reward.name);
    this.store.updatePlayer(player);
    this.store.saveClaim({ playerId, rewardId, idempotencyKey });

    return {
      status: "claimed",
      player,
      reward
    };
  }
}
