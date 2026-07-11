import { describe, expect, it } from "vitest";
import {
  analyzeProductAdditives,
  getAdditiveRiskLabel,
} from "./additiveAnalysis";

describe("analyzeProductAdditives", () => {
  it("detects E-codes and named additives from OpenFoodFacts ingredient text", () => {
    const findings = analyzeProductAdditives(
      "Carbonated water, sugar, colour E150d, phosphoric acid, natural flavourings, caffeine."
    );

    expect(findings.map((finding) => finding.code)).toEqual(["E150D", "E338"]);
    expect(findings[0]?.dailyExample70Kg).toBe(21000);
    expect(findings[1]?.dailyExample70Kg).toBe(2800);
  });

  it("detects common preservatives and assigns stricter risk where needed", () => {
    const findings = analyzeProductAdditives(
      "Pork, salt, preservative sodium nitrite, antioxidant E220, spices."
    );

    expect(findings.map((finding) => finding.code)).toEqual(["E250", "E220"]);
    expect(findings[0]?.riskLevel).toBe("limit");
    expect(findings[0]).toBeDefined();
    expect(getAdditiveRiskLabel(findings[0]!.riskLevel, "uk")).toBe("Краще обмежити");
  });

  it("localizes risk labels for every product language", () => {
    expect(getAdditiveRiskLabel("low", "uk")).toBe("Зазвичай безпечно");
    expect(getAdditiveRiskLabel("low", "pl")).toBe("Zwykle bezpieczne");
    expect(getAdditiveRiskLabel("low", "en")).toBe("Usually safe");
  });

  it("returns no findings when composition has no known additives", () => {
    expect(analyzeProductAdditives("water, oats, banana, chia seeds")).toEqual([]);
  });
});
