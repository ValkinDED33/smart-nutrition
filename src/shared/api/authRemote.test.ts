import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseRemoteBaseUrlInCurrentBrowser,
  checkRemoteBackendAvailability,
} from "./authRemote";

describe("remote API base URL guards", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects loopback API URLs from deployed browser origins", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-topaz.vercel.app",
        origin: "https://smart-nutrition-topaz.vercel.app",
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
        hostname: "smart-nutrition-topaz.vercel.app",
        origin: "https://smart-nutrition-topaz.vercel.app",
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser("https://api.smart-nutrition.app/api")).toBe(true);
  });

  it("probes the Render API for the public Vercel deployment when no build env is set", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-topaz.vercel.app",
        origin: "https://smart-nutrition-topaz.vercel.app",
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          provider: "smart-nutrition-sqlite-api",
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkRemoteBackendAvailability(true)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://smart-nutrition-sk5r.onrender.com/api/health",
      expect.any(Object)
    );
  });
});
