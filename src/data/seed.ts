import { StoreState } from "../types";

export function defaultState(): StoreState {
  return {
    players: [
      {
        id: "p1",
        username: "nemo",
        level: 7,
        coins: 1200,
        inventory: ["bronze-chest"]
      },
      {
        id: "p2",
        username: "dory",
        level: 3,
        coins: 300,
        inventory: []
      }
    ],
    rewards: [
      {
        id: "r1",
        name: "golden-net",
        minLevel: 5,
        costCoins: 800
      },
      {
        id: "r2",
        name: "lucky-bait",
        minLevel: 2,
        costCoins: 200
      }
    ]
  };
}
