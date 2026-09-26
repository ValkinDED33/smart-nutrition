import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readStorageSource = (fileName) =>
  readFileSync(path.join(__dirname, fileName), "utf8");

describe("user deletion storage contract", () => {
  it("keeps registration rollback clean across relational storage adapters", () => {
    const sqliteSource = readStorageSource("sqlite.mjs");
    const postgresSource = readStorageSource("postgres.mjs");

    expect(sqliteSource).toContain("PRAGMA foreign_keys = ON;");
    [
      "sessions",
      "password_reset_tokens",
      "registration_verification_tokens",
      "snapshots",
      "profile_states",
      "profile_weight_history",
      "meal_entries",
      "meal_templates",
      "meal_product_collections",
      "catalog_products",
      "assistant_messages",
      "ai_usage_events",
    ].forEach((tableName) => {
      expect(sqliteSource).toContain(`CREATE TABLE IF NOT EXISTS ${tableName}`);
      expect(sqliteSource).toContain("ON DELETE CASCADE");
    });

    [
      "sessions",
      "password_reset_tokens",
      "registration_verification_tokens",
      "snapshots",
      "catalog_products",
      "assistant_messages",
      "ai_usage_events",
    ].forEach((tableName) => {
      expect(postgresSource).toContain(`CREATE TABLE IF NOT EXISTS ${tableName}`);
      expect(postgresSource).toContain("ON DELETE CASCADE");
    });
  });

  it("cleans Mongo user-owned documents explicitly when registration rollback deletes a user", () => {
    const mongoSource = readStorageSource("mongo.mjs");

    [
      "collections.users.deleteOne({ id: userId })",
      "collections.sessions.deleteMany({ userId })",
      "collections.passwordResetTokens.deleteMany({ userId })",
      "collections.registrationVerificationTokens.deleteMany({ userId })",
      "collections.states.deleteOne({ userId })",
      "collections.profiles.deleteOne({ userId })",
      "collections.meals.deleteOne({ userId })",
      "collections.assistantMessages.deleteMany({ userId })",
      "collections.aiRequests.deleteMany({ userId })",
      "collections.catalogProducts.deleteMany({ ownerUserId: userId })",
    ].forEach((requiredCleanup) => {
      expect(mongoSource).toContain(requiredCleanup);
    });
  });
});
