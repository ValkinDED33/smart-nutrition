import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const envExampleFiles = [".env.example", "render.env.example", "vercel.env.example"];

const readProjectFile = (fileName) =>
  readFileSync(path.join(rootDir, fileName), "utf8");

const realProviderSecretPatterns = [
  /(?:^|\n)SMART_NUTRITION_RESEND_API_KEY=re_[A-Za-z0-9_-]{20,}(?:\n|$)/,
  /(?:^|\n)SMART_NUTRITION_OPENROUTER_API_KEY=sk-or-[A-Za-z0-9_-]{20,}(?:\n|$)/,
  /(?:^|\n)SMART_NUTRITION_GROQ_API_KEY=gsk_[A-Za-z0-9_-]{20,}(?:\n|$)/,
  /(?:^|\n)SMART_NUTRITION_GOOGLE_API_KEY=AIza[A-Za-z0-9_-]{20,}(?:\n|$)/,
  /(?:^|\n)SMART_NUTRITION_ASSISTANT_API_KEY=sk-[A-Za-z0-9_-]{20,}(?:\n|$)/,
];

const uniqueSecretKeys = [
  "SMART_NUTRITION_JWT_SECRET",
  "SMART_NUTRITION_RESEND_API_KEY",
  "SMART_NUTRITION_ASSISTANT_API_KEY",
  "SMART_NUTRITION_OPENROUTER_API_KEY",
  "SMART_NUTRITION_GROQ_API_KEY",
  "SMART_NUTRITION_GOOGLE_API_KEY",
  "SMART_NUTRITION_DATABASE_URL",
  "SMART_NUTRITION_MONGO_URI",
  "SMART_NUTRITION_REDIS_URL",
];

describe("environment example files", () => {
  it("do not contain real-looking provider secrets", () => {
    for (const fileName of envExampleFiles) {
      const source = readProjectFile(fileName);

      for (const pattern of realProviderSecretPatterns) {
        expect(source, `${fileName} contains a real-looking secret`).not.toMatch(
          pattern,
        );
      }
    }
  });

  it("define sensitive backend keys at most once in .env.example", () => {
    const source = readProjectFile(".env.example");

    for (const key of uniqueSecretKeys) {
      const assignments = source.match(new RegExp(`^${key}=`, "gm")) ?? [];

      expect(
        assignments.length,
        `${key} is duplicated in .env.example`,
      ).toBeLessThanOrEqual(1);
    }
  });
});
