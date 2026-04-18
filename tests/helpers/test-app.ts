import request from "supertest";
import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { createDbApp } from "../../src/app-db";
import { AppDependencies } from "../../src/types";

// One container per Jest worker — shared across all tests in this worker.
// Each loadTestApp() call uses a unique DB name so tests are fully isolated.
let containerPromise: Promise<StartedMongoDBContainer> | null = null;

function getContainer(): Promise<StartedMongoDBContainer> {
  if (!containerPromise) {
    containerPromise = new MongoDBContainer("mongo:7").start();
  }
  return containerPromise;
}

export async function loadTestApp(deps: AppDependencies = {}) {
  const container = await getContainer();
  const connectionString = container.getConnectionString();
  const dbName = `testdb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const dbApp = await createDbApp({ connectionString, dbName, autoSeed: true }, deps);
  const client = request(dbApp.app);
  return { app: dbApp.app, client, mongoDb: dbApp.mongoDb, close: dbApp.close };
}

type PostCapableClient = {
  post: (url: string) => request.Test;
};

export async function loginAsNemo(client: PostCapableClient) {
  const response = await client.post("/api/v1/auth/login").send({ username: "nemo" });
  return response.body as { token: string; playerId: string };
}

