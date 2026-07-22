import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve("src/widgets/HabitReminderAgent.tsx"), "utf8");

describe("HabitReminderAgent contracts", () => {
  it("keeps Ukrainian and Polish reminder copy in native product language", () => {
    expect(source).toContain("Нагадування про сніданок");
    expect(source).toContain("Щотижневе оновлення вже на часі");
    expect(source).toContain("Przypomnienie o śniadaniu");
    expect(source).toContain("Cotygodniowa aktualizacja jest już na czasie");
    expect(source).not.toContain("Чек-ін по сніданку");
    expect(source).not.toContain("Check-in śniadania");
    expect(source).not.toContain("Щотижневий check-in");
    expect(source).not.toContain("Weekly check-in jest już na czasie");
  });

  it("uses product-owned notification keys instead of planning jargon", () => {
    expect(source).toContain("weekly-body-update");
    expect(source).toContain("assistant-evening-insight");
    expect(source).not.toContain("weekly-check-in");
    expect(source).not.toContain("coach-focus");
    expect(source).not.toContain("const focus =");
  });
});
