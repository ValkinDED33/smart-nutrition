import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const readStorageSource = (fileName) =>
  readFileSync(path.join(__dirname, fileName), "utf8");

describe("reminder storage contract", () => {
  it("exposes canonical reminder persistence on every storage adapter", () => {
    ["sqlite.mjs", "postgres.mjs", "mongo.mjs"].forEach((fileName) => {
      const source = readStorageSource(fileName);

      expect(source).toContain("updateUserReminders");
      expect(source).toContain("updateUserMedicationReminders");
      expect(source).toContain("return this.updateUserReminders(userId, reminders)");
    });
  });
});
