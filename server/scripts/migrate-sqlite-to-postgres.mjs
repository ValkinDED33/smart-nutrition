import { createServerConfig } from "../config.mjs";
import { createSqliteStorage } from "../storage/sqlite.mjs";
import { createPostgresStorage } from "../storage/postgres.mjs";

const config = createServerConfig(process.env);

if (!config.postgresUrl) {
  throw new Error(
    "Set SMART_NUTRITION_DATABASE_URL or DATABASE_URL before running the SQLite to PostgreSQL migration."
  );
}

const sqliteStorage = await createSqliteStorage(config);
const postgresStorage = await createPostgresStorage(config);

const counters = {
  users: 0,
  snapshots: 0,
  catalogProducts: 0,
};

try {
  const users = await sqliteStorage.listUsers();

  for (const user of users) {
    const existingUser = await postgresStorage.findUserByEmail(user.email);

    if (!existingUser) {
      await postgresStorage.insertUser(user);
      counters.users += 1;
    }

    const snapshot = await sqliteStorage.getSnapshotByUserId(user.id, user);

    if (snapshot) {
      await postgresStorage.upsertSnapshot(user.id, snapshot);
      counters.snapshots += 1;
    }
  }

  const catalogProducts = await sqliteStorage.listCatalogProducts({
    includeUnapproved: true,
    statuses: ["pending", "approved", "rejected"],
    limit: 100000,
  });

  for (const product of catalogProducts) {
    const existingProduct = await postgresStorage.findCatalogProductById(product.id);

    if (!existingProduct) {
      await postgresStorage.insertCatalogProduct(product);
      counters.catalogProducts += 1;
    }
  }

  console.log(
    [
      "SQLite to PostgreSQL migration completed.",
      `Users inserted: ${counters.users}`,
      `Snapshots upserted: ${counters.snapshots}`,
      `Catalog products inserted: ${counters.catalogProducts}`,
    ].join("\n")
  );
} finally {
  await postgresStorage.close?.();
  sqliteStorage.close?.();
}
