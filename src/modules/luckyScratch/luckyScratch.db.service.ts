import { ApiError } from "../../core/errors";
import { DbStore } from "../../db/db-store";

export class LuckyScratchDbService {
  constructor(private readonly store: DbStore) {}

  async scratch(playerId: string) {
    const player = await this.store.getPlayerById(playerId);
    const playerCoinsAmount = player.coins;

    const rewards = await this.store.listRewards();
    const availableRewards = rewards.filter(
      (reward) => player.level >= reward.minLevel && player.coins >= reward.costCoins
    );

    if (availableRewards.length < 1) {
      throw new ApiError(400, "No available rewards for the user, either due to insufficient level or coins");
    }

    const reward = availableRewards[Math.floor(Math.random() * availableRewards.length)];
    player.coins -= reward.costCoins;
    player.inventory[reward.id] = (player.inventory[reward.id] || 0) + 1;
    await this.store.updatePlayer(player);

    return {
      reward: { id: reward.id, name: reward.name },
      coinsBefore: playerCoinsAmount,
      coinsAfter: player.coins
    };
  }
}
