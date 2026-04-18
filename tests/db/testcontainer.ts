import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { createDbApp, resetDb } from "../../src/app-db";

export async function setupDbTestApp() {
  const container: StartedMongoDBContainer = await new MongoDBContainer("mongo:7").start();
  const connectionString = container.getConnectionString();
  const dbApp = await createDbApp({ connectionString, autoSeed: true });

  return {
    container,
    app: dbApp.app,
    mongoDb: dbApp.mongoDb,
    reset: async () => resetDb(dbApp.mongoDb),
    close: async () => {
      await dbApp.close();
      await container.stop();
    }
  };
}
