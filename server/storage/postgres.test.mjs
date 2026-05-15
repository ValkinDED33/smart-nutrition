import { describe, expect, it } from "vitest";
import {
  POSTGRES_SCHEMA_MIGRATIONS,
  POSTGRES_SCHEMA_VERSION,
  runPostgresMigrations,
} from "./postgres.mjs";

const createMigrationPool = (existingChecksums = new Map()) => {
  const appliedMigrations = new Map(existingChecksums);
  const calls = [];

  return {
    appliedMigrations,
    calls,
    query: async (sql, params = []) => {
      calls.push({ sql, params });

      if (sql.includes("SELECT checksum FROM schema_migrations")) {
        const checksum = appliedMigrations.get(params[0]);
        return { rows: checksum ? [{ checksum }] : [] };
      }

      if (sql.includes("INSERT INTO schema_migrations")) {
        appliedMigrations.set(params[0], params[2]);
      }

      return { rows: [] };
    },
  };
};

describe("PostgreSQL schema migrations", () => {
  it("applies tracked migrations under an advisory lock and stores the schema version", async () => {
    const pool = createMigrationPool();

    await runPostgresMigrations(pool);

    expect([...pool.appliedMigrations.keys()]).toEqual(
      POSTGRES_SCHEMA_MIGRATIONS.map((migration) => migration.id)
    );
    expect(
      pool.calls.some((call) => call.sql.includes("CREATE TABLE IF NOT EXISTS schema_migrations"))
    ).toBe(true);
    expect(pool.calls.some((call) => call.sql.includes("SELECT pg_advisory_lock"))).toBe(true);
    expect(pool.calls.some((call) => call.sql.includes("SELECT pg_advisory_unlock"))).toBe(true);
    expect(pool.calls.filter((call) => call.sql === "BEGIN")).toHaveLength(
      POSTGRES_SCHEMA_MIGRATIONS.length
    );
    expect(
      pool.calls.some(
        (call) =>
          call.sql.includes("INSERT INTO smart_nutrition_meta") &&
          call.params[0] === "schema_version" &&
          call.params[1] === POSTGRES_SCHEMA_VERSION
      )
    ).toBe(true);
  });

  it("refuses to continue when an applied migration checksum changes", async () => {
    const pool = createMigrationPool(new Map([[POSTGRES_SCHEMA_MIGRATIONS[0].id, "tampered"]]));

    await expect(runPostgresMigrations(pool)).rejects.toThrow("checksum mismatch");

    expect(pool.calls.some((call) => call.sql.includes("SELECT pg_advisory_lock"))).toBe(true);
    expect(pool.calls.some((call) => call.sql.includes("SELECT pg_advisory_unlock"))).toBe(true);
    expect(pool.calls.some((call) => call.sql === "BEGIN")).toBe(false);
  });
});
