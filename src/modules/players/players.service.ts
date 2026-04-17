import { DataStore } from "../../data/store";

export class PlayersService {
  constructor(private readonly store: DataStore) {}

  getPlayer(playerId: string) {
    return this.store.getPlayerById(playerId);
  }

}
