import { DataStore } from "../../data/store";

export class PlayersService {
  constructor(private readonly store: DataStore) {}

  getPlayer(playerId: string) {
    return this.store.getPlayerById(playerId);
  }

  setPlayerCoins(playerId: string, coins: number) {
    const player = this.store.getPlayerById(playerId);
    if (!player) {
      throw new Error(`Player with ID ${playerId} not found`);
    }
    player.coins = coins;
    this.store.updatePlayer(player);
  }

}
