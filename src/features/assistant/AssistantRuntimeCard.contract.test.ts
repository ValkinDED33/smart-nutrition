import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/features/assistant/AssistantRuntimeCard.tsx"),
  "utf8"
);

describe("AssistantRuntimeCard contracts", () => {
  it("renders assistant replies as living assistant cards with the selected companion", () => {
    expect(source).toContain("AssistantAvatar");
    expect(source).toContain("data-assistant-runtime-message-card={message.role}");
    expect(source).toContain('data-assistant-runtime-message-avatar="true"');
    expect(source).toContain("variant={profile.assistant.companionKind}");
    expect(source).toContain("const REMOTE_CLOUD_MODE = \"remote-cloud\"");
    expect(source).toContain("mood={message.mode === REMOTE_CLOUD_MODE ? \"happy\" : \"coach\"}");
    expect(source).toContain("active={loading && message.id === latestAssistantMessage?.id}");
    expect(source).not.toContain('variant="robot"');
  });

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

  it("keeps Ukrainian and Polish assistant prompts free from coach/focus jargon", () => {
    expect(source).toContain("харчовому аналізу");
    expect(source).toContain("Який зараз головний напрям?");
    expect(source).toContain("analizy żywienia");
    expect(source).toContain("Jaki jest teraz główny kierunek?");
    expect(source).not.toContain("coach-аналітиці");
    expect(source).not.toContain("focus коуча");
    expect(source).not.toContain("analizy coacha");
    expect(source).not.toContain("fokus coacha");
  });
});
