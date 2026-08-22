import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const readSource = (path: string) => readFile(path, "utf8");
const AI_COMPANION_PAGE_SOURCE = "src/pages/AiCompanionPage.tsx";
const HOME_PAGE_SOURCE = "src/pages/HomePage.tsx";
const ECOSYSTEM_PULSE_SOURCE = "src/features/assistant/EcosystemPulse.tsx";

describe("AiCompanionPage contract", () => {
  it("keeps assistant sections accessibility copy localized", async () => {
    const source = await readSource(AI_COMPANION_PAGE_SOURCE);

    expect(source).toContain("sectionsAriaLabel");
    expect(source).toContain("Розділи помічника");
    expect(source).toContain("Sekcje asystenta");
    expect(source).toContain("Assistant sections");
    expect(source).toContain("ariaLabel={copy.sectionsAriaLabel}");
    expect(source).not.toContain('ariaLabel="Assistant companion sections"');
  });

  it("keeps the coach page assistant copy product-grade instead of old placeholder wording", async () => {
    const source = await readSource(AI_COMPANION_PAGE_SOURCE);

    expect(source).toContain("Помічник Smart Nutrition");
    expect(source).toContain("Перший день разом");
    expect(source).toContain("Перевіримо прогрес");
    expect(source).toContain("Підтримка без тиску");
    expect(source).toContain("Як помічник з'являється");
    expect(source).toContain("Ефектно");
    expect(source).not.toMatch(
      /Стиль присутності|Легкий образ|Живий образ|Новий помічник|Час перевірити прогрес|М'який контроль|ваш помічник|Styl obecności|Lekki wygląd|Żywy wygląd|Nowy asystent|Czas sprawdzić progres|Presence style|Light look|Living look|New assistant|Check-in due|Gentle control/
    );
  });

  it("keeps the coach page as a real AI worker command center", async () => {
    const source = await readSource(AI_COMPANION_PAGE_SOURCE);

    expect(source).toContain('data-ai-worker-command-center="true"');
    expect(source).toContain('data-ai-worker-metric="true"');
    expect(source).toContain('data-ai-worker-route-item="true"');
    expect(source).toContain('data-ai-worker-tool-grid="true"');
    expect(source).toContain('data-ai-worker-tool="true"');
    expect(source).toContain('data-ai-worker-live-shift="true"');
    expect(source).toContain('data-ai-worker-live-sync="true"');
    expect(source).toContain('data-ai-worker-live-steps="true"');
    expect(source).toContain('data-ai-worker-live-toolbelt="true"');
    expect(source).toContain('data-ai-worker-command-orbit="true"');
    expect(source).toContain('data-ai-worker-hologram-panel="today"');
    expect(source).toContain('data-ai-worker-hologram-panel="analysis"');
    expect(source).toContain('data-ai-worker-orbit-actions="true"');
    expect(source).toContain("data-ai-worker-orbit-action={id}");
    expect(source).toContain("Жива зміна помічника");
    expect(source).toContain("Робочий пояс");
    expect(source).toContain("Żywa zmiana asystenta");
    expect(source).toContain("Live assistant shift");
    expect(source).toContain("Я працюю з твоїм днем");
    expect(source).toContain("Їжа, вода, ліки, тиск, сім'я, Telegram і прогрес");
    expect(source).toContain("Інструменти помічника");
    expect(source).toContain("Pracuję z Twoim dniem");
    expect(source).toContain("I am working with your day");
    expect(source).toContain("This is one worker acting through real Smart Nutrition surfaces");
    expect(source).not.toContain("ВАШ ПОМІЧНИК");
  });

  it("spreads the fixed assistant worker standard beyond the coach page", async () => {
    const homeSource = await readSource(HOME_PAGE_SOURCE);
    const pulseSource = await readSource(ECOSYSTEM_PULSE_SOURCE);

    expect(homeSource).toContain('data-ai-worker-command-center="true"');
    expect(homeSource).toContain('data-ai-worker-home-center="true"');
    expect(homeSource).toContain('data-ai-worker-metric="true"');
    expect(homeSource).toContain('data-ai-worker-route-item="true"');
    expect(homeSource).toContain('data-ai-worker-tool-grid="true"');
    expect(homeSource).toContain('data-ai-worker-tool="true"');
    expect(homeSource).toContain("variant={assistant.companionKind}");
    expect(homeSource).not.toContain('variant="robot"');
    expect(pulseSource).toContain('data-ai-worker-pulse="true"');
    expect(pulseSource).toContain('data-ai-worker-pulse-tools="true"');
    expect(pulseSource).toContain('data-ai-worker-pulse-drawer="true"');
    expect(pulseSource).toContain('data-ai-worker-pulse-chevron="true"');
    expect(pulseSource).toContain("AI-працівник поруч");
    expect(pulseSource).toContain("AI-працівник");
    expect(pulseSource).toContain("Telegram");
    expect(pulseSource).toContain("Здоров'я");
    expect(pulseSource).toContain("Сім'я");
    expect(pulseSource).toContain("Ліки");
    expect(pulseSource).toContain("Події");
    expect(pulseSource).not.toContain('label: "Жива екосистема"');
  });
});
