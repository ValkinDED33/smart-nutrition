import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createServerConfig } from "./config.mjs";

const publicVercelOrigins = [
  "https://smart-nutrition-alpha.vercel.app",
  "https://smart-nutrition-topaz.vercel.app",
  "https://smart-nutrition-git-master-valkindeds-projects.vercel.app",
  "https://smart-nutrition-ibgl50b69-valkindeds-projects.vercel.app",
];

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
    expect(config.authRateLimits).toEqual({
      register: 5,
      login: 10,
      forgotPassword: 5,
      verifyEmail: 5,
    });
    expect(config.allowedCorsOrigins).toEqual(["https://app.smartnutrition.test"]);
    expect(config.warnings).toHaveLength(0);
  });

  it("allows per-route auth rate limit overrides", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_AUTH_REGISTER_RATE_LIMIT_MAX: "3",
      SMART_NUTRITION_AUTH_LOGIN_RATE_LIMIT_MAX: "8",
      SMART_NUTRITION_AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX: "4",
      SMART_NUTRITION_AUTH_VERIFY_EMAIL_RATE_LIMIT_MAX: "6",
    });

    expect(config.authRateLimits).toEqual({
      register: 3,
      login: 8,
      forgotPassword: 4,
      verifyEmail: 6,
    });
  });

  it("uses the platform PORT when SMART_NUTRITION_API_PORT is not set", () => {
    const config = createServerConfig({
      NODE_ENV: "production",
      PORT: "10000",
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_SERVE_STATIC: "false",
      SMART_NUTRITION_APP_BASE_URL: "https://app.smartnutrition.test",
    });

    expect(config.port).toBe(10000);
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

  it("rejects assistant model configuration without an API key", () => {
    expect(() =>
      createServerConfig({
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_ASSISTANT_MODEL: "gpt-4.1-mini",
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
      SMART_NUTRITION_AI_RATE_LIMIT_MAX: "12",
      SMART_NUTRITION_AI_DAILY_REQUEST_LIMIT: "25",
      SMART_NUTRITION_AI_MONTHLY_REQUEST_LIMIT: "300",
      SMART_NUTRITION_AI_DAILY_TOKEN_LIMIT: "50000",
      SMART_NUTRITION_AI_MONTHLY_TOKEN_LIMIT: "500000",
      SMART_NUTRITION_AI_REQUEST_COOLDOWN_MS: "5000",
    });

    expect(config.assistantRuntimeConfigured).toBe(true);
    expect(config.assistantBaseUrl).toBe("https://api.openai.com/v1");
    expect(config.assistantApiPath).toBe("/chat/completions");
    expect(config.assistantTemperature).toBe(0.6);
    expect(config.assistantMemoryMessageLimit).toBe(20);
    expect(config.assistantTimeoutMs).toBe(15000);
    expect(config.assistantProviderOrder).toEqual(["openai"]);
    expect(config.assistantProviders).toHaveLength(1);
    expect(config.aiRateLimitMax).toBe(12);
    expect(config.aiDailyRequestLimit).toBe(25);
    expect(config.aiMonthlyRequestLimit).toBe(300);
    expect(config.aiDailyTokenLimit).toBe(50000);
    expect(config.aiMonthlyTokenLimit).toBe(500000);
    expect(config.aiRequestCooldownMs).toBe(5000);
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

  it("reads Render secret files for assistant provider keys", () => {
    const secretFileDir = mkdtempSync(path.join(os.tmpdir(), "smart-nutrition-secrets-"));

    try {
      writeFileSync(
        path.join(secretFileDir, "SMART_NUTRITION_GROQ_API_KEY"),
        `gsk_${"x".repeat(48)}`
      );

      const config = createServerConfig({
        NODE_ENV: "production",
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_SECRET_FILE_DIR: secretFileDir,
      });

      expect(config.assistantRuntimeConfigured).toBe(true);
      expect(config.assistantProviderOrder).toEqual(["groq"]);
      expect(config.assistantPrimaryProviderId).toBe("groq");
      expect(config.assistantModel).toBe("llama-3.3-70b-versatile");
      expect(config.warnings.join(" ")).toContain(
        "SMART_NUTRITION_GROQ_MODEL is not set"
      );
    } finally {
      rmSync(secretFileDir, { recursive: true, force: true });
    }
  });

  it("reads Render secret files for Resend credentials", () => {
    const secretFileDir = mkdtempSync(path.join(os.tmpdir(), "smart-nutrition-secrets-"));

    try {
      writeFileSync(path.join(secretFileDir, "SMART_NUTRITION_RESEND_API_KEY"), "re_key");

      const config = createServerConfig({
        NODE_ENV: "production",
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_SECRET_FILE_DIR: secretFileDir,
        SMART_NUTRITION_EMAIL_FROM_ADDRESS: "noreply@example.com",
      });

      expect(config.emailTransportConfigured).toBe(true);
      expect(config.resendApiKey).toBe("re_key");
      expect(config.emailFromAddress).toBe("noreply@example.com");
    } finally {
      rmSync(secretFileDir, { recursive: true, force: true });
    }
  });

  it("prefers the three provider-specific Render secret files over the generic assistant key", () => {
    const secretFileDir = mkdtempSync(path.join(os.tmpdir(), "smart-nutrition-secrets-"));

    try {
      writeFileSync(
        path.join(secretFileDir, "SMART_NUTRITION_ASSISTANT_API_KEY"),
        `gsk_${"unused".repeat(8)}`
      );
      writeFileSync(
        path.join(secretFileDir, "SMART_NUTRITION_OPENROUTER_API_KEY"),
        `sk-or-${"x".repeat(48)}`
      );
      writeFileSync(
        path.join(secretFileDir, "SMART_NUTRITION_GROQ_API_KEY"),
        `gsk_${"x".repeat(48)}`
      );
      writeFileSync(
        path.join(secretFileDir, "SMART_NUTRITION_GOOGLE_API_KEY"),
        `AIza${"x".repeat(48)}`
      );

      const config = createServerConfig({
        NODE_ENV: "production",
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_SECRET_FILE_DIR: secretFileDir,
        SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER: "openrouter,groq,google",
      });

      expect(config.assistantRuntimeConfigured).toBe(true);
      expect(config.assistantProviderOrder).toEqual(["openrouter", "groq", "google"]);
      expect(config.assistantProviders.map((provider) => provider.id)).toEqual([
        "openrouter",
        "groq",
        "google",
      ]);
      expect(config.warnings.join(" ")).toContain(
        "SMART_NUTRITION_ASSISTANT_API_KEY is ignored"
      );
      expect(config.warnings.join(" ")).not.toContain("OpenAI key");
    } finally {
      rmSync(secretFileDir, { recursive: true, force: true });
    }
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
      SMART_NUTRITION_BACKUP_DIR: "/app/server/data/backups",
      SMART_NUTRITION_STATIC_DIR: "/app/dist",
    });

    expect(config.sqlitePath).toBe(
      path.join(config.projectRoot, "server", "data", "smart-nutrition.sqlite")
    );
    expect(config.backupDir).toBe(path.join(config.projectRoot, "server", "data", "backups"));
    expect(config.staticDir).toBe(path.join(config.projectRoot, "dist"));
  });

  it("keeps public platform paths absolute for persistent disks", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_DB_PATH: "/var/data/smart-nutrition.sqlite",
      SMART_NUTRITION_BACKUP_DIR: "/var/data/backups",
    });

    expect(config.sqlitePath).toBe("/var/data/smart-nutrition.sqlite");
    expect(config.backupDir).toBe("/var/data/backups");
  });

  it("accepts a single MongoDB Atlas URI alias and reads the database from the URI path", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_AI_DATA_PROVIDER: "primary",
      SMART_NUTRITION_MONGO_URI:
        "mongodb+srv://cluster0.example.mongodb.net/smart-nutrition?retryWrites=true&w=majority&appName=Cluster0",
    });

    expect(config.aiDataProvider).toBe("mongodb");
    expect(config.mongoAiEnabled).toBe(true);
    expect(config.mongoUri).toContain("mongodb+srv://cluster0.example.mongodb.net");
    expect(config.mongoDatabaseName).toBe("smart-nutrition");
    expect(config.mongoConnectRetries).toBe(3);
    expect(config.mongoConnectRetryDelayMs).toBe(1000);
    expect(config.mongoConnectTimeoutMs).toBe(10000);
    expect(config.mongoSocketTimeoutMs).toBe(45000);
    expect(config.mongoMinPoolSize).toBe(0);
    expect(config.mongoMaxPoolSize).toBe(20);
  });

  it("allows MongoDB database and pool overrides", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_MONGODB_URI: "mongodb://mongo.internal:27017/uri_db",
      SMART_NUTRITION_MONGODB_DB: "override_db",
      SMART_NUTRITION_MONGODB_CONNECT_RETRIES: "5",
      SMART_NUTRITION_MONGODB_CONNECT_RETRY_DELAY_MS: "250",
      SMART_NUTRITION_MONGODB_CONNECT_TIMEOUT_MS: "1500",
      SMART_NUTRITION_MONGODB_SOCKET_TIMEOUT_MS: "3000",
      SMART_NUTRITION_MONGODB_MIN_POOL_SIZE: "2",
      SMART_NUTRITION_MONGODB_MAX_POOL_SIZE: "12",
    });

    expect(config.mongoDatabaseName).toBe("override_db");
    expect(config.mongoConnectRetries).toBe(5);
    expect(config.mongoConnectRetryDelayMs).toBe(250);
    expect(config.mongoConnectTimeoutMs).toBe(1500);
    expect(config.mongoSocketTimeoutMs).toBe(3000);
    expect(config.mongoMinPoolSize).toBe(2);
    expect(config.mongoMaxPoolSize).toBe(12);
  });

  it("rejects an invalid MongoDB pool range", () => {
    expect(() =>
      createServerConfig({
        SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
        SMART_NUTRITION_MONGO_URI: "mongodb://mongo.internal:27017/smart_nutrition",
        SMART_NUTRITION_MONGODB_MIN_POOL_SIZE: "10",
        SMART_NUTRITION_MONGODB_MAX_POOL_SIZE: "2",
      })
    ).toThrow(/SMART_NUTRITION_MONGODB_MIN_POOL_SIZE/);
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

  it("keeps the configured app base URL allowed when CORS has an explicit allowlist", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_APP_BASE_URL: "https://new.smartnutrition.test",
      SMART_NUTRITION_CORS_ORIGINS: "https://old.smartnutrition.test",
    });

    expect(config.allowedCorsOrigins).toEqual([
      "https://old.smartnutrition.test",
      "https://new.smartnutrition.test",
    ]);
  });

  it("uses the first valid app base URL when a comma-separated list is configured", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_APP_BASE_URL:
        "https://smart-nutrition.club, https://www.smart-nutrition.club",
      SMART_NUTRITION_CORS_ORIGINS:
        "https://smart-nutrition.club, https://www.smart-nutrition.club",
    });

    expect(config.appBaseUrl).toBe("https://smart-nutrition.club");
    expect(config.allowedCorsOrigins).toEqual([
      "https://smart-nutrition.club",
      "https://www.smart-nutrition.club",
    ]);
    expect(config.warnings.join(" ")).toContain(
      "SMART_NUTRITION_APP_BASE_URL should contain one canonical URL"
    );
  });

  it("keeps the public Vercel origins available for production Render defaults", () => {
    const config = createServerConfig({
      NODE_ENV: "production",
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
    });

    expect(config.allowedCorsOrigins).toEqual(publicVercelOrigins);
  });

  it("adds the public Vercel origins when a legacy frontend origin is configured", () => {
    const config = createServerConfig({
      NODE_ENV: "production",
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_CORS_ORIGINS: "https://smart-nutrition-nine.vercel.app",
    });

    expect(config.allowedCorsOrigins).toEqual([
      "https://smart-nutrition-nine.vercel.app",
      ...publicVercelOrigins,
    ]);
  });

  it("uses the public frontend origin as the development default", () => {
    const config = createServerConfig({
      SMART_NUTRITION_JWT_SECRET: "x".repeat(40),
      SMART_NUTRITION_SERVE_STATIC: "true",
      SMART_NUTRITION_API_PORT: "8787",
    });

    expect(config.allowedCorsOrigins).toEqual(["https://smart-nutrition-alpha.vercel.app"]);
  });
});
