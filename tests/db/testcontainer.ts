import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDbApp, resetDb } from "../../src/app-db";

export async function setupDbTestApp() {
  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("testdb")
    .withUsername("test")
    .withPassword("test")
    .start();

  const connectionString = container.getConnectionUri();
  const dbApp = await createDbApp({ connectionString, autoSeed: true });

  return {
    container,
    app: dbApp.app,
    pool: dbApp.pool,
    reset: async () => resetDb(dbApp.pool),
    close: async () => {
      await dbApp.close();
      await container.stop();
    }
  };
}
