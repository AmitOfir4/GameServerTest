import { DbStore } from "../../db/db-store";

export class PlayersDbService {
  constructor(private readonly store: DbStore) {}

  async getPlayer(playerId: string) {
    return this.store.getPlayerById(playerId);
  }
}
