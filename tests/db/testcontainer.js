"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDbTestApp = setupDbTestApp;
const postgresql_1 = require("@testcontainers/postgresql");
const app_db_1 = require("../../src/app-db");
async function setupDbTestApp() {
    const container = await new postgresql_1.PostgreSqlContainer("postgres:16-alpine")
        .withDatabase("testdb")
        .withUsername("test")
        .withPassword("test")
        .start();
    const connectionString = container.getConnectionUri();
    const dbApp = await (0, app_db_1.createDbApp)({ connectionString, autoSeed: true });
    return {
        container,
        app: dbApp.app,
        pool: dbApp.pool,
        reset: async () => (0, app_db_1.resetDb)(dbApp.pool),
        close: async () => {
            await dbApp.close();
            await container.stop();
        }
    };
}
