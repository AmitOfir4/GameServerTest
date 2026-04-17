import { v4 as uuid } from "uuid";
import { ApiError } from "../core/errors";
import { ClaimRecord, Player, Reward, Session, StoreState } from "../types";
import { defaultState } from "./seed";

export class DataStore {
  private players: Map<string, Player>;
  private rewards: Map<string, Reward>;
  private sessions: Map<string, Session>;
  private claimsByIdempotencyKey: Map<string, ClaimRecord>;

  constructor(initialState: StoreState = defaultState()) {
    this.players = new Map(initialState.players.map((p) => [p.id, { ...p, inventory: { ...p.inventory } }]));
    this.rewards = new Map(initialState.rewards.map((r) => [r.id, { ...r }]));
    this.sessions = new Map();
    this.claimsByIdempotencyKey = new Map();
  }

  reset(state: StoreState = defaultState()): void {
    this.players = new Map(state.players.map((p) => [p.id, { ...p, inventory: { ...p.inventory } }]));
    this.rewards = new Map(state.rewards.map((r) => [r.id, { ...r }]));
    this.sessions = new Map();
    this.claimsByIdempotencyKey = new Map();
  }

  getPlayerById(id: string): Player {
    const player = this.players.get(id);
    if (!player) {
      throw new ApiError(404, "Player not found");
    }

    return { ...player, inventory: { ...player.inventory } };
  }

  getPlayerByUsername(username: string): Player | undefined {
    for (const player of this.players.values()) {
      if (player.username === username) {
        return { ...player, inventory: { ...player.inventory } };
      }
    }

    return undefined;
  }

  updatePlayer(player: Player): Player {
    if (!this.players.has(player.id)) {
      throw new ApiError(404, "Player not found");
    }

    const copy = { ...player, inventory: { ...player.inventory } };
    this.players.set(player.id, copy);
    return { ...copy, inventory: { ...copy.inventory } };
  }

  listRewards(): Reward[] {
    return [...this.rewards.values()].map((r) => ({ ...r }));
  }

  getRewardById(rewardId: string): Reward {
    const reward = this.rewards.get(rewardId);
    if (!reward) {
      throw new ApiError(404, "Reward not found");
    }

    return { ...reward };
  }

  createSession(playerId: string, now: Date): Session {
    const token = uuid();
    const session: Session = {
      token,
      playerId,
      createdAt: now.toISOString()
    };

    this.sessions.set(token, session);
    return { ...session };
  }

  getSessionByToken(token: string): Session {
    const session = this.sessions.get(token);
    if (!session) {
      throw new ApiError(401, "Invalid token");
    }

    return { ...session };
  }

  getClaimByIdempotencyKey(idempotencyKey: string): ClaimRecord | undefined {
    const existing = this.claimsByIdempotencyKey.get(idempotencyKey);
    return existing ? { ...existing } : undefined;
  }

  saveClaim(record: ClaimRecord): ClaimRecord {
    this.claimsByIdempotencyKey.set(record.idempotencyKey, { ...record });
    return { ...record };
  }

  setPlayerCoins(playerId: string, coins: number): void {
    const player = this.players.get(playerId);
    if (!player) {
      throw new ApiError(404, "Player not found");
    }

    player.coins = coins;
    this.players.set(playerId, { ...player, inventory: { ...player.inventory } });
  }
}
