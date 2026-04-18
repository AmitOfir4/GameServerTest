import { ApiError } from "../../core/errors";
import { DataStore } from "../../data/store";

export class LuckyScratchService {
  constructor(private readonly store: DataStore) {}

  scratch(playerId: string) 
  {
    const player = this.store.getPlayerById(playerId);

    const playerCoinsAmount = player.coins;
    const availableRewards = this.store.listRewards().filter((reward) => player.level >= reward.minLevel && player.coins >= reward.costCoins);

    if (availableRewards.length < 1) {
      throw new ApiError(400, "No available rewards for the user, either due to insufficient level or coins");
    }

    const reward = availableRewards[Math.floor(Math.random() * availableRewards.length)];
    player.coins -= reward.costCoins;
    player.inventory[reward.id] = (player.inventory[reward.id] || 0) + 1;
    this.store.updatePlayer(player);

    return {
      reward: { id: reward.id, name: reward.name },
      coinsBefore: playerCoinsAmount,
      coinsAfter: player.coins
    };
  }
}
