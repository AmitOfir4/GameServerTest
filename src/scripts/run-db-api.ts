import { createDbApp } from "../app-db";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  const port = Number(process.env.PORT ?? 3001);
  const { app } = await createDbApp(
    {
      connectionString,
      autoSeed: process.env.DB_AUTO_SEED === "true"
    },
    {}
  );

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`DB API running on port ${port}`);
  });
}

void main();
