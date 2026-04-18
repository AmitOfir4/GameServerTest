import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { Db, MongoClient } from "mongodb";
import { createMongoDb } from "../../src/db/mongo";
import { DbStore } from "../../src/db/db-store";
import { seedDatabase } from "../../src/db/seed-db";
import { SpinsDbService } from "../../src/modules/spins/spins.db.service";

describe("SpinsDbService", () => {
  let container: StartedMongoDBContainer;
  let mongoClient: MongoClient;
  let db: Db;
  let store: DbStore;

  beforeAll(async () => {
    container = await new MongoDBContainer("mongo:7").start();
    ({ client: mongoClient, db } = await createMongoDb({ connectionString: container.getConnectionString() }));
    store = new DbStore(db);
    await store.setupIndexes();
  });

  afterAll(async () => {
    await mongoClient.close();
    await container.stop();
  });

  beforeEach(async () => {
    await seedDatabase(db);
  });

  it("applies winning spin", async () => {
    const service = new SpinsDbService(store, () => 0.99);
    const result = await service.spin("p1", 100);

    expect(result.outcome).toBe("win");
    expect(result.deltaCoins).toBe(200);
    expect(result.balanceAfter).toBe(1400);
  });

  it("applies losing spin", async () => {
    const service = new SpinsDbService(store, () => 0.0);
    const result = await service.spin("p1", 100);

    expect(result.outcome).toBe("lose");
    expect(result.deltaCoins).toBe(-100);
    expect(result.balanceAfter).toBe(1100);
  });

  it("rejects spins that exceed balance", async () => {
    const service = new SpinsDbService(store, () => 0.0);
    await expect(service.spin("p2", 9999)).rejects.toThrow("Insufficient balance");
  });

  it("accepts bet exactly equal to player balance (boundary: exact balance)", async () => {
    const service = new SpinsDbService(store, () => 0.99);
    const result = await service.spin("p1", 1200);

    expect(result.outcome).toBe("win");
    expect(result.balanceAfter).toBe(3600);
  });

  it("rejects bet of 1 over player balance (boundary: over by one)", async () => {
    const service = new SpinsDbService(store, () => 0.99);
    await expect(service.spin("p1", 1201)).rejects.toThrow("Insufficient balance");
  });

  it("rejects spin for unknown player", async () => {
    const service = new SpinsDbService(store, () => 0.99);
    await expect(service.spin("unknown-id", 100)).rejects.toThrow("Player not found");
  });
});

