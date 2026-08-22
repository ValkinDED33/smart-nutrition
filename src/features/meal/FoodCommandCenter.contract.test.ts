import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readSource = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("FoodCommandCenter production contract", () => {
  const commandSource = readSource("src/features/meal/FoodCommandCenter.tsx");
  const commandModelSource = readSource("src/features/meal/foodCommandCenterModel.ts");
  const mealBuilderSource = readSource("src/pages/MealBuilderPage.tsx");

  it("keeps one primary food command center over existing canonical entry flows", () => {
    expect(mealBuilderSource).toContain("<FoodCommandCenter");
    expect(mealBuilderSource).toContain("onOpenTarget={openFoodCommandTarget}");
    expect(mealBuilderSource).not.toContain("const mealInputModes");
    expect(mealBuilderSource).not.toContain("getMealInputModeCopy");
    expect(mealBuilderSource).not.toContain("MEAL_INPUT_GRID_COLUMNS");
  });

  it("routes command targets to existing scanner, photo, saved, builder, search, and catalog surfaces", () => {
    expect(commandSource).toContain('data-food-command-target="photo"');
    expect(commandSource).toContain('data-food-command-target="barcode"');
    expect(commandSource).toContain('data-food-command-target="composer"');
    expect(commandSource).toContain('data-food-command-target="favorites"');
    expect(commandSource).toContain('data-food-command-target="search"');
    expect(commandSource).toContain('| "catalog"');
    expect(commandSource).toContain('onClick={() => onOpenTarget("catalog")}');
    expect(mealBuilderSource).toContain('target === "catalog"');
    expect(mealBuilderSource).toContain('setActiveSection("templates")');
  });

  it("renders the canonical user assistant as the food command worker", () => {
    expect(commandSource).toContain("const assistant = useSelector((state: RootState) => state.profile.assistant)");
    expect(commandSource).toContain("getAssistantDisplayName(assistant.name, appLanguage)");
    expect(commandSource).toContain('data-food-command-assistant-worker="true"');
    expect(commandSource).toContain("variant={assistant.companionKind}");
    expect(commandSource).toContain('mood={selectedProduct ? "happy" : "coach"}');
    expect(commandSource).toContain("active={isListening || isSearching || isSaving}");
    expect(commandSource).not.toContain('variant="robot"');
  });

  it("supports typed and voice-style meal commands only through canonical product intake", () => {
    expect(commandModelSource).toContain("parseFoodCommandText");
    expect(commandModelSource).toContain("isFoodCommandUnitCompatible");
    expect(commandSource).toContain("parseFoodCommandText(normalizedQuery)");
    expect(commandSource).toContain('data-food-command-voice-action="speech-recognition"');
    expect(commandSource).toContain('data-food-command-intake-action="typed-command"');
    expect(commandSource).toContain("addSelectedProduct(");
    expect(commandSource).toContain("addProductIntakeToCloud");
    expect(commandSource).toContain("parsedCommand.mealType ?? mealType");
    expect(commandSource).not.toContain("localStorage");
    expect(commandSource).not.toContain("addMealEntriesToCloud");
  });

  it("keeps command save failures product-language instead of rendering backend exceptions", () => {
    expect(commandSource).toContain("saveFailed");
    expect(commandSource).toContain("setActionError(copy.saveFailed)");
    expect(commandSource).not.toContain("error instanceof Error ? error.message");
    expect(commandSource).not.toContain("Could not save meal to cloud.");
  });

  it("keeps speech recognition failures product-language instead of browser exception text", () => {
    expect(commandSource).toContain("recognition.onerror = () =>");
    expect(commandSource).toContain("setActionError(copy.voiceUnavailable)");
    expect(commandSource).not.toContain("setActionError(event.message");
    expect(commandSource).not.toContain("event.message || event.error");
  });
});
