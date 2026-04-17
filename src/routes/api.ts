import { Router } from "express";
import { DataStore } from "../data/store";
import { AuthService } from "../modules/auth/auth.service";
import { PlayersService } from "../modules/players/players.service";
import { RewardsService } from "../modules/rewards/rewards.service";
import { SpinsService } from "../modules/spins/spins.service";
import { authMiddleware } from "../middleware/auth";
import { claimSchema, loginSchema, spinSchema } from "../validation/schemas";
import { ApiError } from "../core/errors";
import { AppDependencies } from "../types";

export function apiRouter(store: DataStore, deps: Required<AppDependencies>): Router {
  const router = Router();

  const authService = new AuthService(store, deps.now);
  const playersService = new PlayersService(store);
  const spinsService = new SpinsService(store, deps.rng);
  const rewardsService = new RewardsService(store);

  router.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "fish-of-fortune-api" });
  });

  router.post("/auth/login", (req, res) => {
    const payload = loginSchema.safeParse(req.body);
    if (!payload.success) {
      throw new ApiError(400, "Invalid payload", payload.error.flatten());
    }

    const session = authService.login(payload.data.username);
    res.json({ token: session.token, playerId: session.playerId });
  });

  router.get("/players/:id", authMiddleware(store), (req, res) => {
    const playerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const player = playersService.getPlayer(playerId);
    res.json(player);
  });

  router.patch("/players/:id/coins", authMiddleware(store), (req, res) => {
    const playerId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { coins } = req.body;

    if (typeof coins !== "number" || coins < 0) {
      throw new ApiError(400, "Invalid payload", { coins: "Must be a non-negative number" });
    }

    playersService.setCoins(playerId, coins);
    res.status(204).json({"message": "Player coins updated successfully" });
  });

  router.post("/spins", authMiddleware(store), (req, res) => {
    const payload = spinSchema.safeParse(req.body);
    if (!payload.success) {
      throw new ApiError(400, "Invalid payload", payload.error.flatten());
    }

    if (!req.playerId) {
      throw new ApiError(401, "Unauthorized");
    }

    const result = spinsService.spin(req.playerId, payload.data.betAmount);
    res.status(201).json(result);
  });

  router.post("/rewards/claim", authMiddleware(store), (req, res) => {
    const payload = claimSchema.safeParse(req.body);
    if (!payload.success) {
      throw new ApiError(400, "Invalid payload", payload.error.flatten());
    }

    if (!req.playerId) {
      throw new ApiError(401, "Unauthorized");
    }

    const idempotencyKey = req.header("Idempotency-Key") ?? "";
    const result = rewardsService.claimReward(req.playerId, payload.data.rewardId, idempotencyKey);
    res.status(201).json(result);
  });

  router.post("/test/reset", (req, res) => {
    if (process.env.NODE_ENV !== "test") {
      throw new ApiError(403, "Test reset endpoint is disabled");
    }

    store.reset(req.body);
    res.status(204).send();
  });

  return router;
}
