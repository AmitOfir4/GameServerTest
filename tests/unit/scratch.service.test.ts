import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { Db, MongoClient } from "mongodb";
import { createMongoDb } from "../../src/db/mongo";
import { DbStore } from "../../src/db/db-store";
import { seedDatabase } from "../../src/db/seed-db";
import { LuckyScratchDbService } from "../../src/modules/luckyScratch/luckyScratch.db.service";

describe("LuckyScratchDbService", () => {
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

  it("allows scratching when player has eligible rewards", async () => {
    const service = new LuckyScratchDbService(store);
    const result = await service.scratch("p1");

    expect(result).toHaveProperty("reward");
    expect(result).toHaveProperty("coinsBefore");
    expect(result).toHaveProperty("coinsAfter");
    expect(result.coinsAfter).toBeLessThan(result.coinsBefore);
  });
});
