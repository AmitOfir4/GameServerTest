import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../core/errors";
import { DbStore } from "../db/db-store";
import { authDbMiddleware } from "../middleware/auth-db";
import { AuthDbService } from "../modules/auth/auth.db.service";
import { PlayersDbService } from "../modules/players/players.db.service";
import { RewardsDbService } from "../modules/rewards/rewards.db.service";
import { SpinsDbService } from "../modules/spins/spins.db.service";
import { AppDependencies } from "../types";
import { claimSchema, loginSchema, spinSchema } from "../validation/schemas";
import { query } from '../utils/db';

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
      res.status(201).json(result);
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

      const idempotencyKey = req.header("Idempotency-Key") ?? "";
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

  // Fetch all players
  router.get('/players', async (_req, res) => {
    try {
        const players = await query('SELECT * FROM players');
        res.json(players);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a new player
router.post('/players', async (req, res) => {
    const { name, email } = req.body;
    try {
        // Check if the player already exists
        const existingPlayer = await query(
            'SELECT * FROM players WHERE email = $1',
            [email]
        );

        if (existingPlayer.length > 0) {
            return res.status(400).json({ error: 'Player already exists' });
        }

        // Add the new player
        const result = await query(
            'INSERT INTO players (name, email) VALUES ($1, $2) RETURNING *',
            [name, email]
        );
        res.status(201).json(result[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a player by email
router.delete('/players/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const result = await query(
            'DELETE FROM players WHERE email = $1 RETURNING *',
            [email]
        );

        if (result.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/hello', (req, res) => {
    res.json({ message: 'Hello, world!' });
})


return router;
}
