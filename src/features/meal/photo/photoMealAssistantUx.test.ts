import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { PhotoMealAnalysis } from "../types/photo";
import {
  getPhotoReviewState,
  photoMealSaveButtonSx,
  shouldShowPhotoInterpretationChoices,
} from "./photoMealAssistantUx";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const componentSource = readFileSync(
  path.resolve(currentDir, "../PhotoMealAssistant.tsx"),
  "utf8"
);

const createAnalysis = (overrides: Partial<PhotoMealAnalysis> = {}): PhotoMealAnalysis => ({
  dishName: "Bowl",
  summary: "Review the bowl",
  confidence: 0.82,
  estimatedPortions: 1,
  cautions: [],
  manualReviewRequired: false,
  items: [
    {
      name: "Rice",
      quantityGrams: 120,
      confidence: 0.22,
      reason: "Visible ingredient",
      estimatedNutritionPer100g: {
        calories: 130,
        protein: 2.7,
        fat: 0.3,
        carbs: 28,
      },
    },
  ],
  interpretations: [
    {
      id: "primary",
      title: "Rice bowl",
      confidence: 0.82,
      reason: "Visible bowl",
      items: [],
    },
    {
      id: "second",
      title: "Lunch bowl",
      confidence: 0.64,
      reason: "Similar meal",
      items: [],
    },
  ],
  ...overrides,
});

describe("photo meal assistant UX contract", () => {
  it("translates raw confidence into product review states", () => {
    expect(getPhotoReviewState(createAnalysis())).toBe("ready");
    expect(getPhotoReviewState(createAnalysis({ confidence: 0.62 }))).toBe("review");
    expect(getPhotoReviewState(createAnalysis({ confidence: 0.22 }))).toBe("needsDetails");
  });

  it("hides interpretation choices when recognition needs user details first", () => {
    expect(shouldShowPhotoInterpretationChoices(createAnalysis())).toBe(true);
    expect(shouldShowPhotoInterpretationChoices(createAnalysis({ confidence: 0.2 }))).toBe(
      false
    );
  });

  it("keeps raw low confidence percentages out of the primary photo flow", () => {
    expect(componentSource).not.toMatch(/copy\.confidence/);
    expect(componentSource).not.toMatch(/confidence \* 100[^`]*%/);
    expect(componentSource).not.toMatch(/(16|22|28)%/);
  });

  it("keeps research wording out of user-facing photo assistant copy", () => {
    expect(componentSource).not.toContain("AI estimate");
    expect(componentSource).not.toMatch(/low confidence/i);
    expect(componentSource).not.toMatch(/manual verification/i);
    expect(componentSource).not.toMatch(/manual review/i);
    expect(componentSource).not.toMatch(/candidate/i);
    expect(componentSource).not.toMatch(/alternative/i);
  });

  it("localizes backend default photo review questions before rendering", () => {
    expect(componentSource).toContain("getLocalizedHiddenIngredientQuestions");
    expect(componentSource).toContain("hiddenQuestionList");
    expect(componentSource).toContain("rawBackendPhotoQuestionPattern");
    expect(componentSource).not.toContain("analysis.hiddenIngredientQuestions.slice(0, 3).map");
  });

  it("localizes fallback photo draft names while preserving lookup source names", () => {
    expect(componentSource).toContain("localizeFallbackPhotoAnalysis");
    expect(componentSource).toContain("Чернетка сніданку з фото");
    expect(componentSource).toContain("Грецький йогурт");
    expect(componentSource).toContain("Jogurt grecki");
    expect(componentSource).toContain("item.originalName?.trim() || item.name");
  });

  it("keeps the save action reachable on narrow mobile screens", () => {
    expect(photoMealSaveButtonSx.alignSelf.xs).toBe("stretch");
    expect(photoMealSaveButtonSx.position.xs).toBe("sticky");
    expect(photoMealSaveButtonSx.bottom.xs).toBe(12);
  });

  it("keeps the editable draft and confirmed backend add path wired", () => {
    expect(componentSource).toContain("handleSuggestionChange");
    expect(componentSource).toContain("copy.itemName");
    expect(componentSource).toContain("copy.itemGrams");
    expect(componentSource).toContain("createConfirmedPhotoEntries");
    expect(componentSource).toContain("addMealEntriesToCloud");
    expect(componentSource).toContain("runMealAction");
  });
});
