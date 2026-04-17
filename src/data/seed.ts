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
        id: "goldenNetReward",
        name: "golden-net",
        minLevel: 5,
        costCoins: 800
      },
      {
        id: "luckyBaitReward",
        name: "lucky-bait",
        minLevel: 2,
        costCoins: 200
      },
      {
        id: "silverHookReward",
        name: "silver-hook",
        minLevel: 3,
        costCoins: 500
      },
      {
        id: "magicRodReward",
        name: "magic-rod",
        minLevel: 10,
        costCoins: 1500
      },
      {
        id: "pearlCharmReward",
        name: "pearl-charm",
        minLevel: 7,
        costCoins: 1000
      },
      {
        id: "anglerLightReward",
        name: "angler-light",
        minLevel: 4,
        costCoins: 300
      },
      {
        id: "oceanCompassReward",
        name: "ocean-compass",
        minLevel: 6,
        costCoins: 700
      },
      {
        id: "shinyScaleReward",
        name: "shiny-scale",
        minLevel: 8,
        costCoins: 1200
      },
      {
        id: "deepSeaGemReward",
        name: "deep-sea-gem",
        minLevel: 12,
        costCoins: 1800
      },
      {
        id: "stormBreakerReward",
        name: "storm-breaker",
        minLevel: 15,
        costCoins: 2500
      },
      {
        id: "tidalWaveReward",
        name: "tidal-wave",
        minLevel: 9,
        costCoins: 1400
      },
      {
        id: "coralShieldReward",
        name: "coral-shield",
        minLevel: 11,
        costCoins: 1600
      },
      {
        id: "whaleSongReward",
        name: "whale-song",
        minLevel: 13,
        costCoins: 2000
      },
      {
        id: "krakenEyeReward",
        name: "kraken-eye",
        minLevel: 14,
        costCoins: 2200
      },
      {
        id: "mermaidTearReward",
        name: "mermaid-tear",
        minLevel: 5,
        costCoins: 900
      },
      {
        id: "pirateMapReward",
        name: "pirate-map",
        minLevel: 6,
        costCoins: 750
      },
      {
        id: "treasureChestReward",
        name: "treasure-chest",
        minLevel: 10,
        costCoins: 1700
      },
      {
        id: "seaDragonScaleReward",
        name: "sea-dragon-scale",
        minLevel: 16,
        costCoins: 3000
      },
      {
        id: "fisherKingCrownReward",
        name: "fisher-king-crown",
        minLevel: 18,
        costCoins: 3500
      },
      {
        id: "abyssalLanternReward",
        name: "abyssal-lantern",
        minLevel: 7,
        costCoins: 1100
      },
      {
        id: "netherPearlReward",
        name: "nether-pearl",
        minLevel: 20,
        costCoins: 4000
      },
      {
        id: "leviathanFangReward",
        name: "leviathan-fang",
        minLevel: 19,
        costCoins: 3800
      },
      {
        id: "sunkenCompassReward",
        name: "sunken-compass",
        minLevel: 8,
        costCoins: 1300
      },
      {
        id: "mysticAnchorReward",
        name: "mystic-anchor",
        minLevel: 17,
        costCoins: 3200
      },
      {
        id: "eternalShellReward",
        name: "eternal-shell",
        minLevel: 21,
        costCoins: 4500
      }
    ]
  };
}
