import 'dotenv/config';
import { seedDatabase } from '../db/seed-db';
import { createMongoDb } from '../db/mongo';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not defined in the environment variables');
}

async function main() {
  const { client, db } = await createMongoDb({ connectionString: uri! });
  try {
    await seedDatabase(db);
    console.log('Database seeded successfully');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});