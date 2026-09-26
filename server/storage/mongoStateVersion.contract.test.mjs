import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const mongoStorageSource = readFileSync(
  path.join(repoRoot, "server/storage/mongo.mjs"),
  "utf8"
);

describe("Mongo state version contract", () => {
  it("guards snapshot writes with the caller base version inside one transaction", () => {
    expect(mongoStorageSource).toContain("const session = client.startSession()");
    expect(mongoStorageSource).toContain("await session.withTransaction(async () =>");
    expect(mongoStorageSource).toContain("baseVersion ? { userId, updatedAt: baseVersion } : { userId }");
    expect(mongoStorageSource).toContain("{ upsert: !baseVersion, session }");
    expect(mongoStorageSource).toContain("stateUpdate.matchedCount === 0");
    expect(mongoStorageSource).toContain("\"STATE_CONFLICT\"");
  });

  it("falls back without masking real conflicts when Mongo transactions are unsupported", () => {
    expect(mongoStorageSource).toContain("isMongoTransactionUnsupportedError");
    expect(mongoStorageSource).toContain("error instanceof StateApiError");
    expect(mongoStorageSource).toContain("writeSnapshotDocumentsWithoutTransaction");
    expect(mongoStorageSource).toContain("writeProfileAndUserDocumentsWithoutTransaction");
    expect(mongoStorageSource).toContain("if (!isMongoTransactionUnsupportedError(error))");
    expect(mongoStorageSource).toContain("throw error");
  });

  it("checks profile-state conflicts before writing profile documents in the no-transaction fallback", () => {
    const fallbackStart = mongoStorageSource.indexOf(
      "const writeProfileAndUserDocumentsWithoutTransaction = async () => {"
    );
    const fallbackEnd = mongoStorageSource.indexOf(
      "const session = client.startSession();",
      fallbackStart
    );
    const fallbackSource = mongoStorageSource.slice(fallbackStart, fallbackEnd);

    expect(fallbackStart).toBeGreaterThan(-1);
    expect(fallbackEnd).toBeGreaterThan(fallbackStart);
    expect(fallbackSource.indexOf("const stateUpdate = await collections.states.updateOne(")).toBeLessThan(
      fallbackSource.indexOf("await collections.profiles.updateOne(")
    );
    expect(fallbackSource.indexOf("stateUpdate.matchedCount === 0")).toBeLessThan(
      fallbackSource.indexOf("await collections.profiles.updateOne(")
    );
  });

  it("checks snapshot conflicts before writing profile or meal documents in the no-transaction fallback", () => {
    const fallbackStart = mongoStorageSource.indexOf(
      "const writeSnapshotDocumentsWithoutTransaction = async () => {"
    );
    const fallbackEnd = mongoStorageSource.indexOf(
      "const session = client.startSession();",
      fallbackStart
    );
    const fallbackSource = mongoStorageSource.slice(fallbackStart, fallbackEnd);

    expect(fallbackStart).toBeGreaterThan(-1);
    expect(fallbackEnd).toBeGreaterThan(fallbackStart);
    expect(fallbackSource.indexOf("const stateUpdate = await collections.states.updateOne(")).toBeLessThan(
      fallbackSource.indexOf("await collections.profiles.updateOne(")
    );
    expect(fallbackSource.indexOf("stateUpdate.matchedCount === 0")).toBeLessThan(
      fallbackSource.indexOf("await collections.meals.updateOne(")
    );
  });

  it("passes normalized base versions into every Mongo snapshot mutation", () => {
    const writeCalls = [...mongoStorageSource.matchAll(/writeSnapshot\(userId,/g)];
    const guardedCalls = [
      ...mongoStorageSource.matchAll(/baseVersion: normalizedSyncContext\.baseVersion/g),
    ];

    expect(writeCalls).toHaveLength(7);
    expect(guardedCalls).toHaveLength(writeCalls.length);
  });

  it("does not write nullable Telegram connection fields into Mongo user documents", () => {
    expect(mongoStorageSource).toContain("const stripNullableTelegramConnection = (user) =>");
    expect(mongoStorageSource).toContain("delete nextUser.telegramChatId");
    expect(mongoStorageSource).toContain("delete nextUser.telegramConnectedAt");
    expect(mongoStorageSource).toContain("const createUserSetMutation = (user) =>");
    expect(mongoStorageSource).toContain("telegramChatId: \"\"");
    expect(mongoStorageSource).toContain("telegramConnectedAt: \"\"");
    expect(mongoStorageSource).toContain("const doc = stripNullableTelegramConnection({");
    expect(mongoStorageSource).toContain(
      "createUserSetMutation({ ...user, ...roleFields })"
    );
    expect(mongoStorageSource).toContain(
      "createUserSetMutation({ ...nextUser, ...roleFields }),"
    );
  });
});
