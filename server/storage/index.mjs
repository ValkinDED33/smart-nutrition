export const createStorage = async (config) => {
  if (config.databaseProvider === "postgres") {
    const { createPostgresStorage } = await import("./postgres.mjs");
    return createPostgresStorage(config);
  }

  if (config.databaseProvider === "mongodb") {
    const { createMongoStorage } = await import("./mongo.mjs");
    return createMongoStorage(config);
  }

  const { createSqliteStorage } = await import("./sqlite.mjs");
  return createSqliteStorage(config);
};
