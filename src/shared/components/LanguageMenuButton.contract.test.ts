import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const LANGUAGE_MENU_BUTTON_PATH = "src/shared/components/LanguageMenuButton.tsx";

describe("LanguageMenuButton contract", () => {
  it("does not leave the trigger focused while MUI hides the app root", async () => {
    const source = await readFile(LANGUAGE_MENU_BUTTON_PATH, "utf8");

    expect(source).toContain("const trigger = event.currentTarget");
    expect(source).toContain("trigger.blur()");
    expect(source).toContain("setAnchorEl(trigger)");
    expect(source).toContain("disableRestoreFocus");
  });
});
