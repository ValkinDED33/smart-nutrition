import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface VercelHeader {
  key: string;
  value: string;
}

interface VercelHeaderRule {
  source: string;
  headers: VercelHeader[];
}

interface VercelConfig {
  headers: VercelHeaderRule[];
}

const readVercelConfig = (): VercelConfig =>
  JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as VercelConfig;

describe("frontend security headers", () => {
  it("sets a referrer policy on Vercel-served frontend routes", () => {
    const config = readVercelConfig();

    expect(
      config.headers.some(
        (rule) =>
          rule.source === "/(.*)" &&
          rule.headers.some(
            (header) =>
              header.key === "Referrer-Policy" &&
              header.value === "strict-origin-when-cross-origin"
          )
      )
    ).toBe(true);
  });
});
