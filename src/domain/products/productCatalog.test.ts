import { describe, expect, it } from "vitest";
import { productCatalog, searchCatalogProducts } from "./productCatalog";

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

  it("supports Cyrillic product queries used in the meal composer", () => {
    const chickenResult = searchCatalogProducts("куряче", 5)[0];
    const tomatoResult = searchCatalogProducts("помидор", 5)[0];

    expect(chickenResult?.id).toBe("manual-chicken-breast");
    expect(tomatoResult?.id).toBe("manual-tomato");
  });

  it("supports local ready-made dish queries", () => {
    const borschtResult = searchCatalogProducts("борщ", 5)[0];
    const shawarmaResult = searchCatalogProducts("шаурма", 5)[0];
    const omeletteResult = searchCatalogProducts("омлет", 5)[0];
    const pilafResult = searchCatalogProducts("плов", 5)[0];

    expect(borschtResult?.id).toBe("manual-borscht-home");
    expect(shawarmaResult?.id).toBe("manual-shawarma-bowl");
    expect(omeletteResult?.id).toBe("manual-omelette-home");
    expect(pilafResult?.id).toBe("manual-chicken-pilaf-home");
  });

  it("prefers high-protein dairy for protein yogurt queries", () => {
    const topResults = searchCatalogProducts("protein yogurt", 3).map((product) => product.id);

    expect(topResults).toContain("manual-greek-yogurt");
    expect(topResults[0]).not.toBe("manual-protein-bar");
  });

  it("does not pretend the manual starter catalog is a barcode source of truth", () => {
    expect(productCatalog.every((product) => !product.barcode)).toBe(true);
  });
});
