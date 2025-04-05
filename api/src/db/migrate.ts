import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@db:5432/postgres",
});

const db = drizzle(pool);

async function main() {
  console.log("Running migrations...");

  // Add retry logic for Docker startup race condition
  let retries = 5;
  while (retries) {
    try {
      await migrate(db, { migrationsFolder: "drizzle" });
      console.log("Migrations completed!");
      break;
    } catch (err) {
      console.log(`Migration failed, retries left: ${retries}`);
      retries--;
      if (retries === 0) throw err;
      await new Promise((res) => setTimeout(res, 2000)); // wait 2 seconds
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed!", err);
  process.exit(1);
});
