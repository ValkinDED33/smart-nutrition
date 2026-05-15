import { createSqliteStorage } from "./sqlite.mjs";
import { createPostgresStorage } from "./postgres.mjs";

export const createStorage = async (config) => {
  if (config.databaseProvider === "postgres") {
    return createPostgresStorage(config);
  }

  return createSqliteStorage(config);
};
