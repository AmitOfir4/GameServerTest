import express from "express";
import { Db } from "mongodb";
import { createMongoDb } from "./db/mongo";
import { seedDatabase } from "./db/seed-db";
import { DbStore } from "./db/db-store";
import { errorHandler } from "./middleware/error-handler";
import { apiDbRouter } from "./routes/api-db";
import { AppDependencies } from "./types";

export interface DbAppConfig {
  connectionString: string;
  dbName?: string;
  autoSeed?: boolean;
}

export async function createDbApp(config: DbAppConfig, deps: AppDependencies = {}) {
  const app = express();
  const { client, db } = await createMongoDb({ connectionString: config.connectionString, dbName: config.dbName });
  const store = new DbStore(db);

  await store.setupIndexes();
  if (config.autoSeed) {
    await seedDatabase(db);
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
    mongoClient: client,
    mongoDb: db,
    close: async () => {
      await client.close();
    }
  };
}

export async function resetDb(db: Db): Promise<void> {
  await seedDatabase(db);
}
