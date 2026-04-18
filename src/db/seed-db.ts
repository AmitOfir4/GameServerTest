import { Db } from "mongodb";
import { defaultState } from "../data/seed";

export async function seedDatabase(db: Db): Promise<void> {
  const state = defaultState();

  await db.collection("rewardClaims").deleteMany({});
  await db.collection("sessions").deleteMany({});
  await db.collection("players").deleteMany({});
  await db.collection("rewards").deleteMany({});

  if (state.players.length > 0) {
    await db.collection("players").insertMany(
      state.players.map((p) => ({
        _id: p.id,
        username: p.username,
        level: p.level,
        coins: p.coins,
        inventory: p.inventory
      })) as never[]
    );
  }

  if (state.rewards.length > 0) {
    await db.collection("rewards").insertMany(
      state.rewards.map((r) => ({
        _id: r.id,
        name: r.name,
        minLevel: r.minLevel,
        costCoins: r.costCoins
      })) as never[]
    );
  }
}
