import { ApiError } from "../../core/errors";
import { DataStore } from "../../data/store";
import { SpinResult } from "../../types";

export class SpinsService {
  constructor(
    private readonly store: DataStore,
    private readonly rng: () => number
  ) {}

  spin(playerId: string, betAmount: number): SpinResult {
    const player = this.store.getPlayerById(playerId);

    if (player.coins < betAmount) {
      throw new ApiError(422, "Insufficient balance");
    }

    const didWin = this.rng() >= 0.55;
    const deltaCoins = didWin ? betAmount * 2 : -betAmount;
    player.coins += deltaCoins;
    this.store.updatePlayer(player);

    return {
      outcome: didWin ? "win" : "lose",
      deltaCoins,
      balanceAfter: player.coins
    };
  }
}
