import 'dotenv/config';
import { seedDatabase } from '../db/seed-db';
import { createPgPool } from '../db/pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}

const pool = createPgPool({ connectionString: process.env.DATABASE_URL });

seedDatabase(pool)
  .then(() => {
    console.log('Database seeded successfully');
  })
  .catch((err) => {
    console.error('Error seeding database:', err);
  })
  .finally(() => {
    pool.end();
  });