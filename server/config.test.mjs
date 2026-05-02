import path from "node:path";
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
      SMART_NUTRITION_APP_BASE_URL: "https://app.smartnutrition.test",
    });

    expect(config.isProduction).toBe(true);
    expect(config.port).toBe(9090);
    expect(config.serveStatic).toBe(false);
    expect(config.authCookieSameSite).toBe("None");
    expect(config.authCookieSecure).toBe(true);
    expect(config.allowedCorsOrigins).toEqual(["https://app.smartnutrition.test"]);
    expect(config.warnings).toHaveLength(0);
  });

  it("allows explicit local cookie settings for local production-style containers", () => {
    const config = createServerConfig({
      NODE_ENV: "production",
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_AUTH_COOKIE_SAME_SITE: "Lax",
      SMART_NUTRITION_AUTH_COOKIE_SECURE: "false",
    });

    expect(config.authCookieSameSite).toBe("Lax");
    expect(config.authCookieSecure).toBe(false);
  });

  it("rejects SameSite=None cookies without Secure", () => {
    expect(() =>
      createServerConfig({
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_AUTH_COOKIE_SAME_SITE: "None",
        SMART_NUTRITION_AUTH_COOKIE_SECURE: "false",
      })
    ).toThrow(/SMART_NUTRITION_AUTH_COOKIE_SECURE/);
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
      SMART_NUTRITION_ASSISTANT_PROVIDER: "openai",
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
    expect(config.assistantProviderOrder).toEqual(["openai"]);
    expect(config.assistantProviders).toHaveLength(1);
  });

  it("accepts multi-provider assistant configuration with explicit primary order", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_ASSISTANT_API_KEY: "primary-secret",
      SMART_NUTRITION_ASSISTANT_MODEL: "llama-3.3-70b-versatile",
      SMART_NUTRITION_ASSISTANT_PROVIDER: "groq",
      SMART_NUTRITION_ASSISTANT_BASE_URL: "https://api.groq.com/openai/v1/",
      SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER: "openrouter, groq, google",
      SMART_NUTRITION_OPENROUTER_API_KEY: "router-secret",
      SMART_NUTRITION_OPENROUTER_MODEL: "openai/gpt-5.4-mini",
      SMART_NUTRITION_GOOGLE_API_KEY: "google-secret",
      SMART_NUTRITION_GOOGLE_MODEL: "gemini-2.5-flash",
    });

    expect(config.assistantRuntimeConfigured).toBe(true);
    expect(config.assistantProviderOrder).toEqual(["openrouter", "groq", "google"]);
    expect(config.assistantPrimaryProviderId).toBe("openrouter");
    expect(config.assistantModel).toBe("openai/gpt-5.4-mini");
    expect(config.assistantProviders.map((provider) => provider.id)).toEqual([
      "openrouter",
      "groq",
      "google",
    ]);
  });

  it("defaults multi-provider assistant fallback to OpenRouter, Groq, then Google", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_ASSISTANT_API_KEY: "primary-secret",
      SMART_NUTRITION_ASSISTANT_MODEL: "llama-3.3-70b-versatile",
      SMART_NUTRITION_ASSISTANT_PROVIDER: "groq",
      SMART_NUTRITION_ASSISTANT_BASE_URL: "https://api.groq.com/openai/v1/",
      SMART_NUTRITION_OPENROUTER_API_KEY: "router-secret",
      SMART_NUTRITION_OPENROUTER_MODEL: "openai/gpt-5.4-mini",
      SMART_NUTRITION_GOOGLE_API_KEY: "google-secret",
      SMART_NUTRITION_GOOGLE_MODEL: "gemini-2.5-flash",
    });

    expect(config.assistantProviderOrder).toEqual(["openrouter", "groq", "google"]);
    expect(config.assistantPrimaryProviderId).toBe("openrouter");
    expect(config.assistantModel).toBe("openai/gpt-5.4-mini");
  });

  it("accepts legacy provider priority hints with a warning", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_AI_PROVIDER: "groq",
      SMART_NUTRITION_GROQ_API_KEY: "legacy-secret",
      SMART_NUTRITION_GROQ_MODEL: "llama-3.1-8b-instant",
      SMART_NUTRITION_GROQ_BASE_URL: "https://api.groq.com/openai/v1/",
      SMART_NUTRITION_OPENROUTER_API_KEY: "router-secret",
      SMART_NUTRITION_OPENROUTER_MODEL: "openai/gpt-5.4-mini",
      SMART_NUTRITION_GROQ_TIMEOUT_MS: "25000",
      SMART_NUTRITION_AI_TEMPERATURE: "0.5",
    });

    expect(config.assistantRuntimeConfigured).toBe(true);
    expect(config.assistantProviders.map((provider) => provider.id)).toEqual([
      "openrouter",
      "groq",
    ]);
    expect(config.warnings.join(" ")).toMatch(/Legacy SMART_NUTRITION_AI_PROVIDER/);
  });

  it("warns when the OpenRouter key contains a duplicated provider prefix", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_OPENROUTER_API_KEY: "sk-or-sk-or-v1-test",
      SMART_NUTRITION_OPENROUTER_MODEL: "openai/gpt-5.4-mini",
    });

    expect(config.assistantProviderOrder).toEqual(["openrouter"]);
    expect(config.warnings.join(" ")).toMatch(/SMART_NUTRITION_OPENROUTER_API_KEY/);
    expect(config.warnings.join(" ")).toMatch(/sk-or-sk-or-/);
  });

  it("maps Docker-style local paths back into the current project root", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_DB_PATH: "/app/server/data/smart-nutrition.sqlite",
      SMART_NUTRITION_STATIC_DIR: "/app/dist",
    });

    expect(config.sqlitePath).toBe(
      path.join(config.projectRoot, "server", "data", "smart-nutrition.sqlite")
    );
    expect(config.staticDir).toBe(path.join(config.projectRoot, "dist"));
  });

  it("accepts an explicit CORS allowlist", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_APP_BASE_URL: "https://app.smartnutrition.test",
      SMART_NUTRITION_CORS_ORIGINS:
        "https://app.smartnutrition.test, https://admin.smartnutrition.test",
    });

    expect(config.allowedCorsOrigins).toEqual([
      "https://app.smartnutrition.test",
      "https://admin.smartnutrition.test",
    ]);
  });

  it("allows local Vite origins in development", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_SERVE_STATIC: "true",
      SMART_NUTRITION_API_PORT: "8787",
    });

    expect(config.allowedCorsOrigins).toEqual(
      expect.arrayContaining([
        "http://localhost:8787",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ])
    );
  });
});
