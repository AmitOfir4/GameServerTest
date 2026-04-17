import { Pool } from "pg";
import { defaultState } from "../data/seed";

export async function seedDatabase(pool: Pool): Promise<void> {
  const state = defaultState();
  await pool.query("TRUNCATE TABLE reward_claims, sessions, inventory, rewards, players RESTART IDENTITY CASCADE");

  for (const player of state.players) {
    await pool.query("INSERT INTO players(id, username, level, coins) VALUES($1, $2, $3, $4)", [
      player.id,
      player.username,
      player.level,
      player.coins
    ]);

    for (const [item, count] of Object.entries(player.inventory)) {
      for (let i = 0; i < count; i++) {
        await pool.query("INSERT INTO inventory(player_id, item_name) VALUES($1, $2)", [player.id, item]);
      }
    }
  }

  for (const reward of state.rewards) {
    await pool.query("INSERT INTO rewards(id, name, min_level, cost_coins) VALUES($1, $2, $3, $4)", [
      reward.id,
      reward.name,
      reward.minLevel,
      reward.costCoins
    ]);
  }
}
