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

  it("passes normalized base versions into every Mongo snapshot mutation", () => {
    const writeCalls = [...mongoStorageSource.matchAll(/writeSnapshot\(userId,/g)];
    const guardedCalls = [
      ...mongoStorageSource.matchAll(/baseVersion: normalizedSyncContext\.baseVersion/g),
    ];

    expect(writeCalls).toHaveLength(7);
    expect(guardedCalls).toHaveLength(writeCalls.length);
  });
});
