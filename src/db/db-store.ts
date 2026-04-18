import { Collection, Db, MongoError } from "mongodb";
import { v4 as uuid } from "uuid";
import { ApiError } from "../core/errors";
import { ClaimRecord, Player, Reward, Session } from "../types";

interface PlayerDoc {
  _id: string;
  username: string;
  level: number;
  coins: number;
  inventory: Record<string, number>;
}

interface RewardDoc {
  _id: string;
  name: string;
  minLevel: number;
  costCoins: number;
}

interface SessionDoc {
  _id: string;
  playerId: string;
  createdAt: Date;
}

interface RewardClaimDoc {
  _id: string;
  playerId: string;
  rewardId: string;
}

function mapPlayer(doc: PlayerDoc): Player {
  return {
    id: doc._id,
    username: doc.username,
    level: doc.level,
    coins: doc.coins,
    inventory: doc.inventory ?? {}
  };
}

function mapReward(doc: RewardDoc): Reward {
  return {
    id: doc._id,
    name: doc.name,
    minLevel: doc.minLevel,
    costCoins: doc.costCoins
  };
}

export class DbStore {
  private readonly players: Collection<PlayerDoc>;
  private readonly rewards: Collection<RewardDoc>;
  private readonly sessions: Collection<SessionDoc>;
  private readonly rewardClaims: Collection<RewardClaimDoc>;

  constructor(private readonly db: Db) {
    this.players = db.collection<PlayerDoc>("players");
    this.rewards = db.collection<RewardDoc>("rewards");
    this.sessions = db.collection<SessionDoc>("sessions");
    this.rewardClaims = db.collection<RewardClaimDoc>("rewardClaims");
  }

  async setupIndexes(): Promise<void> {
    await this.players.createIndex({ username: 1 }, { unique: true });
    await this.sessions.createIndex({ playerId: 1 });
    await this.rewardClaims.createIndex({ playerId: 1 });
  }

  async getPlayerById(id: string): Promise<Player> {
    const doc = await this.players.findOne({ _id: id });
    if (!doc) throw new ApiError(404, "Player not found");
    return mapPlayer(doc);
  }

  async getPlayerByUsername(username: string): Promise<Player | undefined> {
    const doc = await this.players.findOne({ username });
    return doc ? mapPlayer(doc) : undefined;
  }

  async updatePlayer(player: Player): Promise<Player> {
    const result = await this.players.findOneAndUpdate(
      { _id: player.id },
      { $set: { username: player.username, level: player.level, coins: player.coins, inventory: player.inventory } },
      { returnDocument: "after" }
    );
    if (!result) throw new ApiError(404, "Player not found");
    return mapPlayer(result);
  }

  async listRewards(): Promise<Reward[]> {
    const docs = await this.rewards.find().sort({ _id: 1 }).toArray();
    return docs.map(mapReward);
  }

  async getRewardById(rewardId: string): Promise<Reward> {
    const doc = await this.rewards.findOne({ _id: rewardId });
    if (!doc) throw new ApiError(404, "Reward not found");
    return mapReward(doc);
  }

  async createSession(playerId: string, now: Date): Promise<Session> {
    const token = uuid();
    await this.sessions.insertOne({ _id: token, playerId, createdAt: now });
    return {
      token,
      playerId,
      createdAt: now.toISOString()
    };
  }

  async getSessionByToken(token: string): Promise<Session> {
    const doc = await this.sessions.findOne({ _id: token });
    if (!doc) throw new ApiError(401, "Invalid token");
    return {
      token: doc._id,
      playerId: doc.playerId,
      createdAt: new Date(doc.createdAt).toISOString()
    };
  }

  async getClaimByIdempotencyKey(idempotencyKey: string): Promise<ClaimRecord | undefined> {
    const doc = await this.rewardClaims.findOne({ _id: idempotencyKey });
    if (!doc) return undefined;
    return { playerId: doc.playerId, rewardId: doc.rewardId, idempotencyKey: doc._id };
  }

  async saveClaim(record: ClaimRecord): Promise<ClaimRecord> {
    await this.rewardClaims.insertOne({ _id: record.idempotencyKey, playerId: record.playerId, rewardId: record.rewardId });
    return { ...record };
  }

  async claimRewardTransactional(playerId: string, rewardId: string, idempotencyKey: string): Promise<{
    status: "claimed" | "duplicate";
    player: Player;
    reward: Reward;
  }> {
    if (!idempotencyKey) {
      throw new ApiError(400, "Idempotency-Key header is required");
    }

    // Atomically reserve the idempotency key — unique _id prevents duplicates
    let isNew = false;
    try {
      await this.rewardClaims.insertOne({ _id: idempotencyKey, playerId, rewardId });
      isNew = true;
    } catch (err) {
      if ((err as MongoError).code !== 11000) throw err;
    }

    if (!isNew) {
      const existing = await this.rewardClaims.findOne({ _id: idempotencyKey });
      if (!existing || existing.playerId !== playerId || existing.rewardId !== rewardId) {
        throw new ApiError(409, "Idempotency-Key already used with different payload");
      }
      return {
        status: "duplicate",
        player: await this.getPlayerById(playerId),
        reward: await this.getRewardById(rewardId)
      };
    }

    // New claim — validate and atomically deduct coins + add item to inventory
    try {
      const reward = await this.getRewardById(rewardId);
      const player = await this.getPlayerById(playerId);

      if (player.level < reward.minLevel) {
        throw new ApiError(422, "Player level too low for reward");
      }
      if (player.coins < reward.costCoins) {
        throw new ApiError(422, "Insufficient balance for reward");
      }

      const updated = await this.players.findOneAndUpdate(
        { _id: playerId, coins: { $gte: reward.costCoins } },
        { $inc: { coins: -reward.costCoins, [`inventory.${reward.name}`]: 1 } },
        { returnDocument: "after" }
      );

      if (!updated) {
        throw new ApiError(422, "Insufficient balance for reward");
      }

      return {
        status: "claimed",
        player: mapPlayer(updated),
        reward
      };
    } catch (err) {
      // Roll back the claim reservation on error
      await this.rewardClaims.deleteOne({ _id: idempotencyKey });
      throw err;
    }
  }

  async setPlayerCoins(playerId: string, coins: number): Promise<void> {
    const result = await this.players.updateOne({ _id: playerId }, { $set: { coins } });
    if (result.matchedCount === 0) {
      throw new ApiError(404, "Player not found");
    }
  }
}
