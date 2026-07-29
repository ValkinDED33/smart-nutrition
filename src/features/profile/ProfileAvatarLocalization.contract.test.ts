import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");

describe("Profile avatar localization contract", () => {
  it("keeps profile avatar presets localized and accessible", async () => {
    const [formSource, avatarSource] = await Promise.all([
      readSource("src/features/profile/ProfileForm.tsx"),
      readSource("src/shared/ui/avatar.ts"),
    ]);

    expect(formSource).toContain("avatarImageAlt");
    expect(formSource).toContain("avatarPresetAction");
    expect(formSource).toContain("getAvatarPresetLabel(copy, preset.id)");
    expect(formSource).toContain("alt={copy.avatarImageAlt}");
    expect(formSource).toContain("alt={presetLabel}");
    expect(formSource).toContain("aria-label={copy.avatarPresetAction(presetLabel)}");
    expect(formSource).toContain("Ліс");
    expect(formSource).toContain("Wschód słońca");
    expect(formSource).not.toContain("{preset.label}");
    expect(avatarSource).not.toContain('aria-label="Avatar"');
  });
});
