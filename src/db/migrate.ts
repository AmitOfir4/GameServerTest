import { Pool } from "pg";
import { schemaSql } from "./sql";

export async function runMigrations(pool: Pool): Promise<void> {
  await pool.query(schemaSql);
}
