import { Db, MongoClient } from "mongodb";

export interface MongoConfig {
  connectionString: string;
  dbName?: string;
}

export async function createMongoDb(config: MongoConfig): Promise<{ client: MongoClient; db: Db }> {
  const url = new URL(config.connectionString);
  if (url.protocol !== "mongodb+srv:" && !url.searchParams.has("directConnection")) {
    url.searchParams.set("directConnection", "true");
  }
  const client = new MongoClient(url.toString());
  await client.connect();
  const db = client.db(config.dbName ?? "fishoffortune");
  return { client, db };
}
