import 'dotenv/config';
import { createDbApp } from "./app-db";

const PORT = Number(process.env.PORT ?? 3000);
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required");
}

createDbApp({ connectionString: MONGODB_URI, autoSeed: process.env.DB_AUTO_SEED === "true" })
  .then(({ app }) => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Failed to start server:", err);
    process.exit(1);
  });
