import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const REMINDER_CARD_SOURCE = "src/features/profile/ReminderManagementCard.tsx";

describe("ReminderManagementCard mobile contract", () => {
  it("keeps reminder reports and actions compact on mobile", async () => {
    const source = await readFile(REMINDER_CARD_SOURCE, "utf8");

    expect(source).toContain('spacing={{ xs: 1.15, md: 2 }}');
    expect(source).toContain('xs: "minmax(112px, 0.45fr) minmax(0, 1fr)"');
    expect(source).toContain('gridColumn: { xs: "1 / -1", md: "auto" }');
    expect(source).toContain('display: { xs: "flex", md: "grid" }');
    expect(source).toContain('flex: { xs: "0 0 264px", md: "initial" }');
    expect(source).toContain('data-reminder-mobile-action-rail="true"');
    expect(source).toContain('flexWrap={{ xs: "nowrap", sm: "wrap" }}');
  });
});
