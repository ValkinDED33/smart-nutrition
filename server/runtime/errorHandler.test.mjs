import { describe, expect, it } from "vitest";
import {
  AssistantApiError,
  AuthApiError,
  PlatformApiError,
  StateApiError,
} from "../lib/domain.mjs";
import { handleRouteError } from "./errorHandler.mjs";

class MemoryResponse {
  statusCode = 200;
  headers = {};
  body = "";

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  end(body = "") {
    this.body = String(body);
  }
}

const handleAndParse = (error) => {
  const response = new MemoryResponse();
  const handled = handleRouteError(error, response);

  return {
    handled,
    response,
    payload: JSON.parse(response.body),
  };
};

describe("route error handler", () => {
  it("maps auth errors to public copy instead of raw service messages", () => {
    const { handled, response, payload } = handleAndParse(
      new AuthApiError(
        "EMAIL_IN_USE",
        "duplicate key value violates unique constraint users_email_idx"
      )
    );

    expect(handled).toBe(true);
    expect(response.statusCode).toBe(409);
    expect(payload).toMatchObject({
      code: "EMAIL_IN_USE",
      message: "This email is already used.",
    });
    expect(JSON.stringify(payload)).not.toContain("duplicate key");
  });

  it("maps duplicate profile names to a public conflict", () => {
    const { handled, response, payload } = handleAndParse(
      new AuthApiError(
        "NAME_IN_USE",
        "duplicate key value violates unique constraint users_name_idx"
      )
    );

    expect(handled).toBe(true);
    expect(response.statusCode).toBe(409);
    expect(payload).toMatchObject({
      code: "NAME_IN_USE",
      message: "This name is already used.",
    });
    expect(JSON.stringify(payload)).not.toContain("duplicate key");
  });

  it("maps auth profile-state sync failures to a public 503 instead of a 500", () => {
    const { handled, response, payload } = handleAndParse(
      new AuthApiError(
        "STATE_SYNC_UNAVAILABLE",
        "Cannot read properties of null while saving profile-state"
      )
    );

    expect(handled).toBe(true);
    expect(response.statusCode).toBe(503);
    expect(payload).toMatchObject({
      code: "STATE_SYNC_UNAVAILABLE",
      message: "Cloud profile sync is temporarily unavailable.",
    });
    expect(JSON.stringify(payload)).not.toContain("Cannot read properties");
  });

  it("does not expose assistant provider details in public API errors", () => {
    const { handled, response, payload } = handleAndParse(
      new AssistantApiError(
        "ASSISTANT_RUNTIME_FAILED",
        "OpenRouter returned 502 with provider stack trace",
        {
          providerId: "openrouter",
          providerBaseUrl: "https://openrouter.ai/api/v1",
          providerMessage: "upstream model crashed with secret request id",
          retryAfterMs: 12_000,
          status: 502,
        }
      )
    );

    expect(handled).toBe(true);
    expect(response.statusCode).toBe(502);
    expect(payload).toEqual({
      success: false,
      code: "ASSISTANT_RUNTIME_FAILED",
      error: "The assistant could not complete this request right now.",
      message: "The assistant could not complete this request right now.",
      retryAfterMs: 12_000,
    });
  });

  it("maps platform state and product provider errors to safe public messages", () => {
    const platform = handleAndParse(
      new PlatformApiError("INVALID_FOOD_SUBMISSION", "raw moderation failure", {
        providerMessage: "catalog provider failed",
      })
    ).payload;
    const state = handleAndParse(
      new StateApiError("PHOTO_ANALYSIS_FAILED", "VISION_PROVIDER_FAILED_500", {
        providerMessage: "vision provider stack trace",
      })
    ).payload;
    const productError = new Error("OpenFoodFacts host ECONNRESET");
    productError.code = "PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE";
    productError.statusCode = 502;
    const product = handleAndParse(productError).payload;

    expect(platform.message).toBe("Product submission data is invalid.");
    expect(state.message).toBe(
      "Photo analysis could not be completed right now."
    );
    expect(product.message).toBe("Product catalog is temporarily unavailable.");
    expect(
      JSON.stringify([
        platform.message,
        platform.error,
        state.message,
        state.error,
        product.message,
        product.error,
      ])
    ).not.toMatch(
      /provider|ECONNRESET|VISION_PROVIDER|moderation/i
    );
  });
});
