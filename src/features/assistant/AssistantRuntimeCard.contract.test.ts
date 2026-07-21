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

  it("keeps fallback answers in product language instead of AI infrastructure language", () => {
    expect(source).toContain("Живий діалог тимчасово обмежений");
    expect(source).toContain("Żywy dialog jest chwilowo ograniczony");
    expect(source).toContain("Live conversation is temporarily limited");
    expect(source).not.toContain("Cloud AI is unavailable");
    expect(source).not.toContain("Хмарний AI зараз недоступний");
    expect(source).not.toContain("Chmurowy AI jest teraz niedostępny");
    expect(source).not.toContain("local context");
    expect(source).not.toContain("локального контексту");
    expect(source).not.toContain("lokalnego kontekstu");
  });
});
