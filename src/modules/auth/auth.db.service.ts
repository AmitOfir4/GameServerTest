import { ApiError } from "../../core/errors";
import { DbStore } from "../../db/db-store";

export class AuthDbService {
  constructor(
    private readonly store: DbStore,
    private readonly now: () => Date
  ) {}

  async login(username: string) {
    const player = await this.store.getPlayerByUsername(username);
    if (!player) {
      throw new ApiError(401, "Invalid credentials");
    }

    return this.store.createSession(player.id, this.now());
  }
}
