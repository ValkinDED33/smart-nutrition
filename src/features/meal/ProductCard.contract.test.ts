import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ProductCard contract", () => {
  it("keeps product catalog status visible in product cards", async () => {
    const source = await readFile("src/features/meal/ProductCard.tsx", "utf8");

    expect(source).toContain("getProductStatusChip");
    expect(source).toContain("product.status");
    expect(source).toContain("statusApproved");
    expect(source).toContain("statusPending");
    expect(source).toContain("statusPersonal");
  });
});
