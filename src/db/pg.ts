import { Pool } from "pg";

export interface DbConfig {
  connectionString: string;
}

export function createPgPool(config: DbConfig): Pool {
  return new Pool({
    connectionString: config.connectionString
  });
}
