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
});
