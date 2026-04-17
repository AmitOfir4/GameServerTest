export interface Player {
  id: string;
  username: string;
  level: number;
  coins: number;
  inventory: string[];
}

export interface Reward {
  id: string;
  name: string;
  minLevel: number;
  costCoins: number;
}

export interface SpinResult {
  outcome: "win" | "lose";
  deltaCoins: number;
  balanceAfter: number;
}

export interface Session {
  token: string;
  playerId: string;
  createdAt: string;
}

export interface ClaimRecord {
  playerId: string;
  rewardId: string;
  idempotencyKey: string;
}

export interface StoreState {
  players: Player[];
  rewards: Reward[];
}

export interface AppDependencies {
  rng?: () => number;
  now?: () => Date;
}
