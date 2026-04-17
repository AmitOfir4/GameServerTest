import { ApiError } from "../../core/errors";
import { DataStore } from "../../data/store";

export class AuthService {
  constructor(
    private readonly store: DataStore,
    private readonly now: () => Date
  ) {}

  login(username: string) {
    const player = this.store.getPlayerByUsername(username);
    if (!player) {
      throw new ApiError(401, "Invalid credentials");
    }

    return this.store.createSession(player.id, this.now());
  }
}
