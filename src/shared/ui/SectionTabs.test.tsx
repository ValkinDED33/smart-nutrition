import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SectionTabs } from "./SectionTabs";

describe("SectionTabs", () => {
  it("renders sections and marks the active section", () => {
    const html = renderToString(
      <SectionTabs
        sections={[
          { id: "today", label: "Today" },
          { id: "meals", label: "Meals", badge: "2" },
        ]}
        activeSection="meals"
        onChange={vi.fn()}
      />
    );

    expect(html).toContain("Today");
    expect(html).toContain("Meals");
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-current="page"');
  });
});
