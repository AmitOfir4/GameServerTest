import express from "express";
import { Pool } from "pg";
import { runMigrations } from "./db/migrate";
import { createPgPool } from "./db/pg";
import { seedDatabase } from "./db/seed-db";
import { DbStore } from "./db/db-store";
import { errorHandler } from "./middleware/error-handler";
import { apiDbRouter } from "./routes/api-db";
import { AppDependencies } from "./types";

export interface DbAppConfig {
  connectionString: string;
  autoSeed?: boolean;
}

export async function createDbApp(config: DbAppConfig, deps: AppDependencies = {}) {
  const app = express();
  const pool = createPgPool({ connectionString: config.connectionString });
  const store = new DbStore(pool);

  await runMigrations(pool);
  if (config.autoSeed) {
    await seedDatabase(pool);
  }

  const resolvedDeps: Required<AppDependencies> = {
    rng: deps.rng ?? Math.random,
    now: deps.now ?? (() => new Date())
  };

  app.use(express.json());
  app.use("/api/v1", apiDbRouter(store, resolvedDeps));
  app.use(errorHandler);

  return {
    app,
    pool,
    close: async () => {
      await pool.end();
    }
  };
}

export async function resetDb(pool: Pool): Promise<void> {
  await seedDatabase(pool);
}
