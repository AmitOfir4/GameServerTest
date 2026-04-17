import express from "express";
import { DataStore } from "./data/store";
import { errorHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes/api";
import { AppDependencies } from "./types";

export function createApp(deps: AppDependencies = {}) {
  const app = express();
  const store = new DataStore();

  const resolvedDeps: Required<AppDependencies> = {
    rng: deps.rng ?? Math.random,
    now: deps.now ?? (() => new Date())
  };

  app.use(express.json());
  app.use("/api/v1", apiRouter(store, resolvedDeps));
  app.use(errorHandler);

  return { app, store };
}
