import { DbStore } from "../../db/db-store";
import { ApiError } from "../../core/errors";

export class PlayersDbService {
  constructor(private readonly store: DbStore) {}

  async getPlayer(playerId: string) {
    return this.store.getPlayerById(playerId);
  }

  async setCoins(playerId: string, coins: number): Promise<void> {
    await this.store.setPlayerCoins(playerId, coins);
  }
}
