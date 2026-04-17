import 'dotenv/config';
import { createPgPool } from '../db/pg';
import { runMigrations } from '../db/migrate';

const pool = createPgPool({ connectionString: process.env.DATABASE_URL! });

runMigrations(pool)
  .then(() => {
    console.log('Migrations ran successfully');
  })
  .catch((err) => {
    console.error('Error running migrations:', err);
  })
  .finally(() => {
    pool.end();
  });
