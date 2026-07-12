import { describe, expect, it } from "vitest";
import {
  analyzeProductAdditives,
  analyzeProductIngredientInsights,
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

  it("extracts user-friendly ingredient insights from raw composition text", () => {
    const insights = analyzeProductIngredientInsights(
      "Carbonated water, sugar, phosphoric acid, colour E150d, caffeine."
    );

    expect(insights.map((insight) => insight.id)).toEqual([
      "water",
      "sugar",
      "acid",
      "colour",
      "caffeine",
    ]);
    expect(insights.find((insight) => insight.id === "sugar")?.label.uk).toBe("Цукор");
    expect(insights.find((insight) => insight.id === "caffeine")?.tone).toBe("watch");
  });

  it("extracts user-friendly ingredient insights from Polish composition text", () => {
    const insights = analyzeProductIngredientInsights(
      "Woda gazowana, cukier, barwnik E150d, kwas fosforowy, naturalne aromaty, kofeina."
    );

    expect(insights.map((insight) => insight.id)).toEqual([
      "water",
      "sugar",
      "acid",
      "colour",
      "caffeine",
    ]);
    expect(
      analyzeProductAdditives("barwnik E150d, kwas fosforowy").map((item) => item.code)
    ).toEqual(["E150D", "E338"]);
  });

  it("extracts allergens and preservation signals without exposing raw language noise", () => {
    const insights = analyzeProductIngredientInsights(
      "Wheat flour, milk powder, salt, preservative sodium benzoate, sunflower oil."
    );

    expect(insights.map((insight) => insight.id)).toEqual([
      "preservative",
      "salt",
      "oil",
      "milk",
      "gluten",
    ]);
    expect(insights.find((insight) => insight.id === "milk")?.label.uk).toBe("Молоко / лактоза");
    expect(insights.find((insight) => insight.id === "gluten")?.group.uk).toBe(
      "Алергенний компонент"
    );
  });

  it("normalizes OpenFoodFacts additive tags into user-safe additive cards", () => {
    const findings = analyzeProductAdditives(
      "en:e150d,en:e338,en:e950,en:e955,en:e407,en:e471"
    );

    expect(findings.map((finding) => finding.code)).toEqual([
      "E150D",
      "E338",
      "E950",
      "E955",
      "E407",
      "E471",
    ]);
    expect(findings.find((finding) => finding.code === "E407")?.riskLevel).toBe("watch");
    expect(findings.find((finding) => finding.code === "E471")?.name.uk).toBe(
      "Моно- та дигліцериди жирних кислот"
    );
    expect(findings.find((finding) => finding.code === "E955")?.group.uk).toBe(
      "Підсолоджувач"
    );
  });

  it("explains vitamins, thickeners, and sweeteners from consumer label language", () => {
    const insights = analyzeProductIngredientInsights(
      "Woda, witamina C, guma ksantanowa, substancje słodzące: sukraloza i acesulfam K."
    );

    expect(insights.map((insight) => insight.id)).toEqual([
      "water",
      "sweetener",
      "vitamins",
      "thickener",
    ]);
    expect(insights.find((insight) => insight.id === "vitamins")?.label.uk).toBe(
      "Вітаміни"
    );
    expect(insights.find((insight) => insight.id === "thickener")?.group.uk).toBe(
      "Текстура продукту"
    );
  });
});
