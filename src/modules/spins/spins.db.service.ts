import { ApiError } from "../../core/errors";
import { DbStore } from "../../db/db-store";
import { SpinResult } from "../../types";

export class SpinsDbService {
  constructor(
    private readonly store: DbStore,
    private readonly rng: () => number
  ) {}

  async spin(playerId: string, betAmount: number): Promise<SpinResult> {
    const player = await this.store.getPlayerById(playerId);

    if (player.coins < betAmount) {
      throw new ApiError(422, "Insufficient balance");
    }

    const didWin = this.rng() >= 0.75; 
    const deltaCoins = didWin ? betAmount * 2 : -betAmount;
    player.coins += deltaCoins;
    await this.store.updatePlayer(player);

    return {
      outcome: didWin ? "win" : "lose",
      deltaCoins,
      balanceAfter: player.coins
    };
  }
}
