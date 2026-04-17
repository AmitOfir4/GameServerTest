import { DataStore } from "../../data/store";

export class PlayersService {
  constructor(private readonly store: DataStore) {}

  getPlayer(playerId: string) {
    return this.store.getPlayerById(playerId);
  }

  setCoins(playerId: string, coins: number): void {
    return this.store.setPlayerCoins(playerId, coins);
  };

}
