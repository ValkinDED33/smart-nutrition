import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/features/meal/NutritionCoachCard.tsx"),
  "utf8"
);

describe("NutritionCoachCard visible language contract", () => {
  it("keeps Ukrainian and Polish nutrition helper copy native", () => {
    expect(source).toContain("Харчовий помічник");
    expect(source).toContain("Оцінка помічника");
    expect(source).toContain("Головний напрям");
    expect(source).toContain("Asystent żywieniowy");
    expect(source).toContain("Ocena asystenta");
    expect(source).toContain("Główny kierunek");
    expect(source).not.toContain("Харчовий коуч");
    expect(source).not.toContain("Оцінка коуча");
    expect(source).not.toContain("Головний фокус");
    expect(source).not.toContain("Coach żywieniowy");
    expect(source).not.toContain("Ocena coacha");
    expect(source).not.toContain("Główny fokus");
  });
});
