import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AssistantQuestionInput } from "@domain/assistant/types";
import {
  askAssistantQuestion,
  AssistantApiError,
  clearAssistantConversationHistory,
  getAssistantConversationHistory,
  getAssistantRuntimeStatus,
} from "./assistant";

const authMock = vi.hoisted(() => ({
  getRemoteAuthBaseUrl: vi.fn(() => "https://api.example.com/api"),
  isCloudSyncActive: vi.fn(() => true),
}));

vi.mock("./auth", () => authMock);

const assistantInput = {
  question: "What should I do next?",
  quickQuestionId: null,
  context: {},
} as unknown as AssistantQuestionInput;

describe("assistant api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getRemoteAuthBaseUrl.mockReturnValue("https://api.example.com/api");
    authMock.isCloudSyncActive.mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a typed safe error when the protected session is unavailable", async () => {
    authMock.isCloudSyncActive.mockReturnValue(false);

    await expect(askAssistantQuestion(assistantInput)).rejects.toMatchObject({
      name: "AssistantApiError",
      code: "ASSISTANT_AUTH_REQUIRED",
      message:
        "The assistant needs your protected Smart Nutrition session before it can answer.",
    });
  });

  it("returns a typed safe error when no remote base URL is configured", async () => {
    authMock.getRemoteAuthBaseUrl.mockReturnValue("");

    await expect(askAssistantQuestion(assistantInput)).rejects.toMatchObject({
      code: "ASSISTANT_UNAVAILABLE",
      message: "The assistant is temporarily unavailable. Try again in a moment.",
    });
  });

  it("does not expose backend/provider details from failed assistant requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "Provider stack trace: sk-or-secret failed at baseUrl",
          }),
          { status: 502 }
        )
      )
    );

    await expect(askAssistantQuestion(assistantInput)).rejects.toMatchObject({
      code: "ASSISTANT_REQUEST_FAILED",
      status: 502,
      message: "The assistant could not complete this request. Try again in a moment.",
    });
  });

  it("does not expose raw fetch failure details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED api.internal"))
    );

    await expect(askAssistantQuestion(assistantInput)).rejects.toMatchObject({
      code: "ASSISTANT_UNAVAILABLE",
      message: "The assistant is temporarily unavailable. Try again in a moment.",
    });
  });

  it("rejects invalid assistant payloads with a safe typed error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ text: "" }), { status: 200 }))
    );

    try {
      await askAssistantQuestion(assistantInput);
      throw new Error("Expected invalid assistant payload to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(AssistantApiError);
      expect(error).toMatchObject({
        code: "ASSISTANT_RESPONSE_INVALID",
        message:
          "The assistant response could not be read safely. Try again in a moment.",
      });
    }
  });

  it("parses successful assistant answers and actions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "Add water now.",
          mode: "agent-action",
          actions: [
            {
              id: "open-water",
              ok: true,
              resultType: "navigation_handoff",
              targetRoute: "/water",
              targetSurface: "food",
            },
          ],
          followUpQuestionIds: ["water_help", "unknown"],
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(askAssistantQuestion(assistantInput)).resolves.toMatchObject({
      text: "Add water now.",
      mode: "agent-action",
      followUpQuestionIds: ["water_help"],
      actions: [
        {
          id: "open-water",
          ok: true,
          targetRoute: "/water",
          targetSurface: "food",
        },
      ],
    });
  });

  it("uses safe typed errors for history read and clear failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "raw" }), { status: 500 }))
    );

    await expect(getAssistantConversationHistory()).rejects.toMatchObject({
      code: "ASSISTANT_REQUEST_FAILED",
      status: 500,
    });
    await expect(clearAssistantConversationHistory()).rejects.toMatchObject({
      code: "ASSISTANT_REQUEST_FAILED",
      status: 500,
    });
  });

  it("keeps runtime status nullable instead of throwing user-visible errors", async () => {
    authMock.isCloudSyncActive.mockReturnValue(false);

    await expect(getAssistantRuntimeStatus()).resolves.toBeNull();
  });
});
