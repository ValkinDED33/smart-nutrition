import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/features/assistant/AssistantRuntimeCard.tsx"),
  "utf8"
);

describe("AssistantRuntimeCard contracts", () => {
  it("executes backend-confirmed navigation handoffs through safe internal routes", () => {
    expect(source).toContain("useNavigate");
    expect(source).toContain("AssistantRuntimeAction");
    expect(source).toContain("getNavigationTarget");
    expect(source).toContain('action.resultType === "navigation_handoff"');
    expect(source).toContain('targetRoute?.startsWith("/")');
    expect(source).toContain('!targetRoute.startsWith("//")');
    expect(source).toContain("response.actions");
    expect(source).toContain("navigate(targetRoute)");
    expect(source).toContain("assistant_navigation_handoff");
  });
});
