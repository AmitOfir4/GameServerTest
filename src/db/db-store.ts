import { Pool, PoolClient } from "pg";
import { v4 as uuid } from "uuid";
import { ApiError } from "../core/errors";
import { ClaimRecord, Player, Reward, Session } from "../types";

function mapPlayer(row: { id: string; username: string; level: number; coins: number; inventory: string[] }): Player {
  return {
    id: row.id,
    username: row.username,
    level: row.level,
    coins: row.coins,
    inventory: row.inventory ?? []
  };
}

export class DbStore {
  constructor(private readonly pool: Pool) {}

  async getPlayerById(id: string): Promise<Player> {
    const result = await this.pool.query(
      `
      SELECT p.id, p.username, p.level, p.coins,
      COALESCE(array_remove(array_agg(i.item_name), NULL), '{}') AS inventory
      FROM players p
      LEFT JOIN inventory i ON i.player_id = p.id
      WHERE p.id = $1
      GROUP BY p.id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Player not found");
    }

    return mapPlayer(result.rows[0]);
  }

  async getPlayerByUsername(username: string): Promise<Player | undefined> {
    const result = await this.pool.query(
      `
      SELECT p.id, p.username, p.level, p.coins,
      COALESCE(array_remove(array_agg(i.item_name), NULL), '{}') AS inventory
      FROM players p
      LEFT JOIN inventory i ON i.player_id = p.id
      WHERE p.username = $1
      GROUP BY p.id
      `,
      [username]
    );

    return result.rowCount ? mapPlayer(result.rows[0]) : undefined;
  }

  async updatePlayer(player: Player): Promise<Player> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const updated = await client.query(
        "UPDATE players SET username = $1, level = $2, coins = $3 WHERE id = $4 RETURNING id, username, level, coins",
        [player.username, player.level, player.coins, player.id]
      );

      if (updated.rowCount === 0) {
        throw new ApiError(404, "Player not found");
      }

      await client.query("DELETE FROM inventory WHERE player_id = $1", [player.id]);
      for (const item of player.inventory) {
        await client.query("INSERT INTO inventory(player_id, item_name) VALUES($1, $2)", [player.id, item]);
      }

      await client.query("COMMIT");
      return this.getPlayerById(player.id);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async listRewards(): Promise<Reward[]> {
    const result = await this.pool.query("SELECT id, name, min_level, cost_coins FROM rewards ORDER BY id ASC");
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      minLevel: row.min_level,
      costCoins: row.cost_coins
    }));
  }

  async getRewardById(rewardId: string): Promise<Reward> {
    const result = await this.pool.query("SELECT id, name, min_level, cost_coins FROM rewards WHERE id = $1", [rewardId]);
    if (result.rowCount === 0) {
      throw new ApiError(404, "Reward not found");
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      minLevel: row.min_level,
      costCoins: row.cost_coins
    };
  }

  async createSession(playerId: string, now: Date): Promise<Session> {
    const token = uuid();
    const result = await this.pool.query(
      "INSERT INTO sessions(token, player_id, created_at) VALUES($1, $2, $3) RETURNING token, player_id, created_at",
      [token, playerId, now.toISOString()]
    );

    return {
      token: result.rows[0].token,
      playerId: result.rows[0].player_id,
      createdAt: new Date(result.rows[0].created_at).toISOString()
    };
  }

  async getSessionByToken(token: string): Promise<Session> {
    const result = await this.pool.query("SELECT token, player_id, created_at FROM sessions WHERE token = $1", [token]);
    if (result.rowCount === 0) {
      throw new ApiError(401, "Invalid token");
    }

    return {
      token: result.rows[0].token,
      playerId: result.rows[0].player_id,
      createdAt: new Date(result.rows[0].created_at).toISOString()
    };
  }

  async getClaimByIdempotencyKey(idempotencyKey: string): Promise<ClaimRecord | undefined> {
    const result = await this.pool.query(
      "SELECT player_id, reward_id, idempotency_key FROM reward_claims WHERE idempotency_key = $1",
      [idempotencyKey]
    );

    if (result.rowCount === 0) {
      return undefined;
    }

    return {
      playerId: result.rows[0].player_id,
      rewardId: result.rows[0].reward_id,
      idempotencyKey: result.rows[0].idempotency_key
    };
  }

  async saveClaim(record: ClaimRecord): Promise<ClaimRecord> {
    await this.pool.query(
      "INSERT INTO reward_claims(idempotency_key, player_id, reward_id) VALUES($1, $2, $3)",
      [record.idempotencyKey, record.playerId, record.rewardId]
    );

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

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT player_id, reward_id FROM reward_claims WHERE idempotency_key = $1 FOR UPDATE",
        [idempotencyKey]
      );

      if (existing.rowCount) {
        const record = existing.rows[0];
        if (record.player_id !== playerId || record.reward_id !== rewardId) {
          throw new ApiError(409, "Idempotency-Key already used with different payload");
        }

        await client.query("COMMIT");
        return {
          status: "duplicate",
          player: await this.getPlayerById(playerId),
          reward: await this.getRewardById(rewardId)
        };
      }

      const playerRes = await client.query("SELECT id, username, level, coins FROM players WHERE id = $1 FOR UPDATE", [playerId]);
      if (!playerRes.rowCount) {
        throw new ApiError(404, "Player not found");
      }

      const rewardRes = await client.query("SELECT id, name, min_level, cost_coins FROM rewards WHERE id = $1", [rewardId]);
      if (!rewardRes.rowCount) {
        throw new ApiError(404, "Reward not found");
      }

      const player = playerRes.rows[0];
      const reward = rewardRes.rows[0];

      if (player.level < reward.min_level) {
        throw new ApiError(422, "Player level too low for reward");
      }

      if (player.coins < reward.cost_coins) {
        throw new ApiError(422, "Insufficient balance for reward");
      }

      await client.query("UPDATE players SET coins = coins - $1 WHERE id = $2", [reward.cost_coins, playerId]);
      await client.query(
        "INSERT INTO inventory(player_id, item_name) VALUES($1, $2) ON CONFLICT (player_id, item_name) DO NOTHING",
        [playerId, reward.name]
      );
      await client.query(
        "INSERT INTO reward_claims(idempotency_key, player_id, reward_id) VALUES($1, $2, $3)",
        [idempotencyKey, playerId, rewardId]
      );

      await client.query("COMMIT");
      return {
        status: "claimed",
        player: await this.getPlayerById(playerId),
        reward: {
          id: reward.id,
          name: reward.name,
          minLevel: reward.min_level,
          costCoins: reward.cost_coins
        }
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async setPlayerCoins(playerId: string, coins: number): Promise<void> {
    const result = await this.pool.query(
      "UPDATE players SET coins = $1 WHERE id = $2",
      [coins, playerId]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Player not found");
    }
  }
}
