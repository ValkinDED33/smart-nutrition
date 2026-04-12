import { describe, expect, it } from "vitest";
import { createServerConfig } from "./config.mjs";

describe("createServerConfig", () => {
  it("rejects the default JWT secret in production", () => {
    expect(() =>
      createServerConfig({
        NODE_ENV: "production",
      })
    ).toThrow(/SMART_NUTRITION_JWT_SECRET/);
  });

  it("rejects refresh TTL values that are not greater than access TTL", () => {
    expect(() =>
      createServerConfig({
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_ACCESS_TTL_MS: "60000",
        SMART_NUTRITION_REFRESH_TTL_MS: "60000",
      })
    ).toThrow(/SMART_NUTRITION_REFRESH_TTL_MS/);
  });

  it("accepts a valid production configuration", () => {
    const config = createServerConfig({
      NODE_ENV: "production",
      SMART_NUTRITION_API_PORT: "9090",
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_ACCESS_TTL_MS: "900000",
      SMART_NUTRITION_REFRESH_TTL_MS: "604800000",
      SMART_NUTRITION_SERVE_STATIC: "false",
    });

    expect(config.isProduction).toBe(true);
    expect(config.port).toBe(9090);
    expect(config.serveStatic).toBe(false);
    expect(config.warnings).toHaveLength(0);
  });

  it("rejects partial assistant runtime configuration", () => {
    expect(() =>
      createServerConfig({
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_ASSISTANT_API_KEY: "secret",
      })
    ).toThrow(/SMART_NUTRITION_ASSISTANT_API_KEY/);
  });

  it("accepts assistant runtime configuration", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_ASSISTANT_API_KEY: "secret",
      SMART_NUTRITION_ASSISTANT_MODEL: "gpt-4.1-mini",
      SMART_NUTRITION_ASSISTANT_BASE_URL: "https://api.openai.com/v1/",
      SMART_NUTRITION_ASSISTANT_API_PATH: "chat/completions",
      SMART_NUTRITION_ASSISTANT_TEMPERATURE: "0.6",
      SMART_NUTRITION_ASSISTANT_MEMORY_LIMIT: "20",
      SMART_NUTRITION_ASSISTANT_TIMEOUT_MS: "15000",
    });

    expect(config.assistantRuntimeConfigured).toBe(true);
    expect(config.assistantBaseUrl).toBe("https://api.openai.com/v1");
    expect(config.assistantApiPath).toBe("/chat/completions");
    expect(config.assistantTemperature).toBe(0.6);
    expect(config.assistantMemoryMessageLimit).toBe(20);
    expect(config.assistantTimeoutMs).toBe(15000);
  });
});
