import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/shared/api/assistant.ts"),
  "utf8"
);

describe("assistant API contracts", () => {
  it("parses assistant actions while rejecting unsafe navigation routes", () => {
    expect(source).toContain("parseAssistantActions");
    expect(source).toContain("isSafeInternalRoute");
    expect(source).toContain('value.startsWith("/")');
    expect(source).toContain('!value.startsWith("//")');
    expect(source).toContain(String.raw`!/[\r\n]/u.test(value)`);
    expect(source).toContain("value.length <= 180");
    expect(source).toContain("targetSurface === \"scanner\"");
    expect(source).toContain("targetSurface === \"photo_meal\"");
    expect(source).toContain("targetSurface === \"food\"");
    expect(source).toContain("actions: parseAssistantActions(payload.actions)");
  });

  it("throws typed safe errors instead of backend/provider infrastructure messages", () => {
    expect(source).toContain("class AssistantApiError");
    expect(source).toContain("getAssistantSafeMessage");
    expect(source).toContain("ASSISTANT_AUTH_REQUIRED");
    expect(source).toContain("ASSISTANT_UNAVAILABLE");
    expect(source).toContain("ASSISTANT_REQUEST_FAILED");
    expect(source).toContain("ASSISTANT_RESPONSE_INVALID");
    expect(source).not.toContain("Backend session is required for assistant requests");
    expect(source).not.toContain("Backend unavailable for assistant requests");
    expect(source).not.toContain("AI request failed");
    expect(source).not.toContain("AI history request failed");
    expect(source).not.toContain("AI history clear failed");
    expect(source).not.toContain("Invalid AI response payload");
    expect(source).not.toContain("Invalid AI history payload");
  });
});
