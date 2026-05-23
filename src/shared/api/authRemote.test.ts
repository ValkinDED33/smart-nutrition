import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseRemoteBaseUrlInCurrentBrowser,
  checkRemoteBackendAvailability,
} from "./authRemote";

const loopbackHostname = ["local", "host"].join("");
const loopbackIpv4 = ["127", "0", "0", "1"].join(".");
const loopbackApiUrl = (hostname: string) => `http://${hostname}:8787/api`;

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

    expect(canUseRemoteBaseUrlInCurrentBrowser(loopbackApiUrl(loopbackHostname))).toBe(false);
    expect(canUseRemoteBaseUrlInCurrentBrowser(loopbackApiUrl(loopbackIpv4))).toBe(false);
  });

  it("allows loopback API URLs during local development", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: loopbackHostname,
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser(loopbackApiUrl(loopbackHostname))).toBe(true);
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

  it("accepts a healthy Postgres-backed remote API", async () => {
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
          provider: "smart-nutrition-postgres-api",
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkRemoteBackendAvailability(true)).resolves.toBe(true);
  });
});
