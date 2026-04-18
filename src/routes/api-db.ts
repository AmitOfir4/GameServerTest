import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../core/errors";
import { DbStore } from "../db/db-store";
import { authDbMiddleware } from "../middleware/auth-db";
import { AuthDbService } from "../modules/auth/auth.db.service";
import { PlayersDbService } from "../modules/players/players.db.service";
import { RewardsDbService } from "../modules/rewards/rewards.db.service";
import { SpinsDbService } from "../modules/spins/spins.db.service";
import { LuckyScratchDbService } from "../modules/luckyScratch/luckyScratch.db.service";
import { AppDependencies } from "../types";
import { claimSchema, loginSchema, spinSchema } from "../validation/schemas";

export function apiDbRouter(store: DbStore, deps: Required<AppDependencies>): Router {
  const router = Router();

  const asyncHandler =
    (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
      (req: Request, res: Response, next: NextFunction): void => {
        void handler(req, res, next).catch(next);
      };

  const authService = new AuthDbService(store, deps.now);
  const playersService = new PlayersDbService(store);
  const spinsService = new SpinsDbService(store, deps.rng);
  const rewardsService = new RewardsDbService(store);
  const luckyScratchService = new LuckyScratchDbService(store);

  router.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "fish-of-fortune-api-db" });
  });

  router.post(
    "/auth/login",
    asyncHandler(async (req, res) => {
      const payload = loginSchema.safeParse(req.body);
      if (!payload.success) {
        throw new ApiError(400, "Invalid payload", payload.error.flatten());
      }

      const session = await authService.login(payload.data.username);
      res.json({ token: session.token, playerId: session.playerId });
    })
  );

  router.get(
    "/players/:id",
    authDbMiddleware(store),
    asyncHandler(async (req, res) => {
      const playerId = Array.isArray(req.params.id) ? req.params.id[0] : String(req.params.id);
      const player = await playersService.getPlayer(playerId);
      res.json(player);
    })
  );

  router.post(
    "/spins",
    authDbMiddleware(store),
    asyncHandler(async (req, res) => {
      const payload = spinSchema.safeParse(req.body);
      if (!payload.success) {
        throw new ApiError(400, "Invalid payload", payload.error.flatten());
      }

      if (!req.playerId) {
        throw new ApiError(401, "Unauthorized");
      }

      const result = await spinsService.spin(req.playerId, payload.data.betAmount);
      res.status(200).json(result);
    })
  );

  router.post(
    "/rewards/claim",
    authDbMiddleware(store),
    asyncHandler(async (req, res) => {
      const payload = claimSchema.safeParse(req.body);
      if (!payload.success) {
        throw new ApiError(400, "Invalid payload", payload.error.flatten());
      }

      if (!req.playerId) {
        throw new ApiError(401, "Unauthorized");
      }

      const idempotencyKey = req.header("Idempotency-Key")
      if (!idempotencyKey) {
        throw new ApiError(400, "Idempotency-Key header is required");
      }

      const result = await rewardsService.claimReward(req.playerId, payload.data.rewardId, idempotencyKey);
      res.status(201).json(result);
    })
  );

  router.patch(
    "/players/:id/coins",
    authDbMiddleware(store),
    asyncHandler(async (req, res) => {
      const playerId = String(req.params.id);
      const { coins } = req.body;

      if (typeof coins !== "number" || coins < 0) {
        throw new ApiError(400, "Invalid coins value");
      }

      await playersService.setCoins(playerId, coins);
      res.status(204).send();
    })
  );

  router.post(
    "/lucky-scratch/scratch",
    authDbMiddleware(store),
    asyncHandler(async (req, res) => {
      if (!req.playerId) {
        throw new ApiError(401, "Unauthorized");
      }

      const result = await luckyScratchService.scratch(req.playerId);
      res.status(200).json(result);
    })
  );

  return router;
}
