import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("WomenHealthOverviewCard contract", () => {
  it("uses the canonical profile women-health state without local persistence", async () => {
    const source = await readSource("src/features/profile/WomenHealthOverviewCard.tsx");

    expect(source).toContain("state.profile.womenHealth");
    expect(source).toContain("isWomenHealthVisibleForGender");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("dispatch(");
  });

  it("keeps women-health guidance safety-bound instead of medical certainty", async () => {
    const source = await readSource("src/features/profile/WomenHealthOverviewCard.tsx");

    expect(source).toContain("No medical prescriptions");
    expect(source).toContain("лікарем");
    expect(source).toContain("clinician");
    expect(source).not.toMatch(/diagnosis|guarantee/i);
  });

  it("surfaces the women-health center through the existing profile shell", async () => {
    const source = await readSource("src/pages/ProfilePage.tsx");

    expect(source).toContain("WomenHealthOverviewCard");
    expect(source).toContain("../features/profile/WomenHealthOverviewCard");
  });
});
