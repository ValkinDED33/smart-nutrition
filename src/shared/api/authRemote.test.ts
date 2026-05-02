import { afterEach, describe, expect, it, vi } from "vitest";
import { canUseRemoteBaseUrlInCurrentBrowser } from "./authRemote";

describe("remote API base URL guards", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects loopback API URLs from deployed browser origins", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-nine.vercel.app",
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser("http://localhost:8787/api")).toBe(false);
    expect(canUseRemoteBaseUrlInCurrentBrowser("http://127.0.0.1:8787/api")).toBe(false);
  });

  it("allows loopback API URLs during local development", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "localhost",
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser("http://localhost:8787/api")).toBe(true);
  });

  it("allows public HTTPS API URLs from deployed browser origins", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-nine.vercel.app",
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser("https://api.smart-nutrition.app/api")).toBe(true);
  });
});
