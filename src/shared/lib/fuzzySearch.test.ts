import { describe, expect, it } from "vitest";
import { fuzzySearchProducts } from "./fuzzySearch";

const catalog = [
  { id: "yogurt", name: "Greek yogurt" },
  { id: "skyr", name: "Skyr vanilla" },
  { id: "bread", name: "Wholegrain bread" },
  { id: "meat", name: "Mięso drobiowe" },
];

describe("fuzzySearchProducts", () => {
  it("returns exact matches before weaker matches", () => {
    const [firstResult] = fuzzySearchProducts("Greek yogurt", catalog);

    expect(firstResult?.item.id).toBe("yogurt");
    expect(firstResult?.score).toBeGreaterThan(90);
  });

  it("finds products with small typos", () => {
    const [firstResult] = fuzzySearchProducts("bred", catalog);

    expect(firstResult?.item.id).toBe("bread");
  });

  it("expands synonym matches for yogurt-style queries", () => {
    const topIds = fuzzySearchProducts("yogurt", catalog).map((result) => result.item.id);

    expect(topIds).toContain("yogurt");
    expect(topIds).toContain("skyr");
  });

  it("normalizes diacritics for multilingual searches", () => {
    const [firstResult] = fuzzySearchProducts("mieso", catalog);

    expect(firstResult?.item.id).toBe("meat");
  });
});
