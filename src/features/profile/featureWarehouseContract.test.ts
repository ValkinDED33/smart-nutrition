import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const collectSourceFiles = (roots: string[]) => {
  const pending = roots.map((root) => resolve(process.cwd(), root));
  const sourceFiles: string[] = [];

  while (pending.length > 0) {
    const currentPath = pending.pop();

    if (!currentPath) {
      continue;
    }

    const currentStats = statSync(currentPath);

    if (currentStats.isDirectory()) {
      for (const entry of readdirSync(currentPath)) {
        pending.push(resolve(currentPath, entry));
      }
      continue;
    }

    if (/\.(mjs|ts|tsx)$/.test(currentPath) && !/\.test\.(mjs|ts|tsx)$/.test(currentPath)) {
      sourceFiles.push(currentPath);
    }
  }

  return sourceFiles;
};

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

  it("does not let women-health competitor branding become product direction", () => {
    const source = collectSourceFiles(["src", "server"])
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n");

    expect(source).not.toMatch(/Flo-level|flo app/i);
  });

  it("keeps regular cloud recovery and account copy free from infrastructure jargon", () => {
    const userFacingSources = [
      "src/shared/components/BackendOfflineBanner.tsx",
      "src/shared/components/SessionRestoreFallback.tsx",
      "src/features/profile/PremiumAccessCard.tsx",
      "src/features/profile/accountDataCardCopy.ts",
    ]
      .map(readSource)
      .join("\n");

    expect(userFacingSources).toContain("Хмарний сервіс");
    expect(userFacingSources).toContain("Usługa w chmurze");
    expect(userFacingSources).toContain("cloud service");
    expect(userFacingSources).toContain("protected sync");
    expect(userFacingSources).not.toContain("Cloud API");
    expect(userFacingSources).not.toContain("cloud server");
    expect(userFacingSources).not.toContain("Backend прокидається");
    expect(userFacingSources).not.toContain("Доступ керується сервером");
    expect(userFacingSources).not.toContain("zarządzany przez serwer");
    expect(userFacingSources).not.toContain("verified by the server");
  });
});
