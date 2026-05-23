import { describe, expect, it } from "vitest";
import { searchCatalogProducts } from "./productCatalog";

describe("searchCatalogProducts", () => {
  it("maps porridge-style queries to oats", () => {
    const [firstResult] = searchCatalogProducts("porridge", 5);

    expect(firstResult?.id).toBe("manual-oats");
  });

  it("maps curd and twarog queries to cottage cheese", () => {
    const curdResult = searchCatalogProducts("curd", 5)[0];
    const twarogResult = searchCatalogProducts("twarog", 5)[0];

    expect(curdResult?.id).toBe("manual-cottage-cheese");
    expect(twarogResult?.id).toBe("manual-cottage-cheese");
  });

  it("keeps greek yogurt at the top for typoed yogurt searches", () => {
    const [firstResult] = searchCatalogProducts("greek yoghrt", 5);

    expect(firstResult?.id).toBe("manual-greek-yogurt");
  });

  it("prefers high-protein dairy for protein yogurt queries", () => {
    const topResults = searchCatalogProducts("protein yogurt", 3).map((product) => product.id);

    expect(topResults).toContain("manual-greek-yogurt");
    expect(topResults[0]).not.toBe("manual-protein-bar");
  });
});
