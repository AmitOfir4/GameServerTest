const { seedDatabase } = require('../db/seed-db');
const { createPgPool } = require('../db/pg');

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