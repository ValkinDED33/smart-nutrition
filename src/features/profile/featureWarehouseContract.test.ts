import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("profile feature warehouse contract", () => {
  it("does not expose disconnected premium purchase buttons", () => {
    const source = readSource("src/features/profile/PremiumAccessCard.tsx");

    expect(source).not.toContain("comingSoon");
    expect(source).not.toContain("Start 7-day trial");
    expect(source).not.toContain("Activate Pro");
    expect(source).not.toContain("disabled\n");
  });

  it("does not show unavailable companion shop items as coming soon inventory", () => {
    const source = readSource("src/features/profile/CompanionShopCard.tsx");

    expect(source).toContain("companionShopCatalog.filter((item) => item.available)");
    expect(source).not.toContain("comingSoon");
    expect(source).not.toContain("futureItem");
    expect(source).not.toContain("Available later");
  });
});
