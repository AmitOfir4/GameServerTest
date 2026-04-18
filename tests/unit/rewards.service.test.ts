import { MongoDBContainer, StartedMongoDBContainer } from "@testcontainers/mongodb";
import { Db, MongoClient } from "mongodb";
import { createMongoDb } from "../../src/db/mongo";
import { DbStore } from "../../src/db/db-store";
import { seedDatabase } from "../../src/db/seed-db";
import { RewardsDbService } from "../../src/modules/rewards/rewards.db.service";

describe("RewardsDbService", () => {
  let container: StartedMongoDBContainer;
  let mongoClient: MongoClient;
  let db: Db;
  let store: DbStore;
  let service: RewardsDbService;

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
    service = new RewardsDbService(store);
  });

  it("claims reward and updates player data", async () => {
    const result = await service.claimReward("p1", "goldenNetReward", "idem-1");

    expect(result.status).toBe("claimed");
    expect(result.player.coins).toBe(400);
    expect(result.player.inventory["golden-net"]).toBe(1);
  });

  it("returns duplicate for same idempotency key and payload", async () => {
    await service.claimReward("p1", "luckyBaitReward", "idem-2");
    const second = await service.claimReward("p1", "luckyBaitReward", "idem-2");

    expect(second.status).toBe("duplicate");
  });

  it("throws when same idempotency key is reused with a different reward", async () => {
    await service.claimReward("p1", "luckyBaitReward", "idem-3");

    await expect(service.claimReward("p1", "goldenNetReward", "idem-3")).rejects.toThrow(
      "Idempotency-Key already used with different payload"
    );
  });
});

