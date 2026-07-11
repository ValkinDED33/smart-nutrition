import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseRemoteBaseUrlInCurrentBrowser,
  checkRemoteBackendAvailability,
  remoteAuthProvider,
} from "./authRemote";
import {
  removeClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";

const loopbackHostname = ["local", "host"].join("");
const loopbackIpv4 = ["127", "0", "0", "1"].join(".");
const loopbackApiUrl = (hostname: string) => `http://${hostname}:8787/api`;
const VERCEL_PREVIEW_HOSTNAME = "smart-nutrition-topaz.vercel.app";
const VERCEL_PREVIEW_ORIGIN = "https://smart-nutrition-topaz.vercel.app";
const REMOTE_BASE_URL_KEY = "smart-nutrition.remote-base-url";

describe("remote API base URL guards", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    removeClientStorageItem(REMOTE_BASE_URL_KEY);
  });

  it("rejects loopback API URLs from deployed browser origins", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: VERCEL_PREVIEW_HOSTNAME,
        origin: VERCEL_PREVIEW_ORIGIN,
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser(loopbackApiUrl(loopbackHostname))).toBe(false);
    expect(canUseRemoteBaseUrlInCurrentBrowser(loopbackApiUrl(loopbackIpv4))).toBe(false);
  });

  it("rejects loopback API URLs during local development", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: loopbackHostname,
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser(loopbackApiUrl(loopbackHostname))).toBe(false);
  });

  it("allows public HTTPS API URLs from deployed browser origins", () => {
    vi.stubGlobal("window", {
      location: {
        hostname: VERCEL_PREVIEW_HOSTNAME,
        origin: VERCEL_PREVIEW_ORIGIN,
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser("https://api.smart-nutrition.app/api")).toBe(true);
  });

  it("probes the Render API for the public Vercel deployment when no build env is set", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: VERCEL_PREVIEW_HOSTNAME,
        origin: VERCEL_PREVIEW_ORIGIN,
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

  it("times out stalled health probes instead of blocking startup", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {
      location: {
        hostname: VERCEL_PREVIEW_HOSTNAME,
        origin: VERCEL_PREVIEW_ORIGIN,
      },
    });
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;

          if (!signal) {
            reject(new Error("Expected probe request to receive AbortSignal."));
            return;
          }

          signal.addEventListener(
            "abort",
            () => {
              const abortError = new Error("Aborted");
              abortError.name = "AbortError";
              reject(abortError);
            },
            { once: true }
          );
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const availabilityPromise = checkRemoteBackendAvailability(true);
    await vi.runOnlyPendingTimersAsync();

    await expect(availabilityPromise).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not let restore session block on a stalled startup health probe", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", {
      location: {
        hostname: VERCEL_PREVIEW_HOSTNAME,
        origin: VERCEL_PREVIEW_ORIGIN,
      },
    });
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;

          if (!signal) {
            reject(new Error("Expected startup probe request to receive AbortSignal."));
            return;
          }

          signal.addEventListener(
            "abort",
            () => {
              const abortError = new Error("Aborted");
              abortError.name = "AbortError";
              reject(abortError);
            },
            { once: true }
          );
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const sessionPromise = remoteAuthProvider.restoreSession({ timeoutMs: 6_000 });
    await vi.advanceTimersByTimeAsync(2_000);

    await expect(sessionPromise).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts a healthy Postgres-backed remote API", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: VERCEL_PREVIEW_HOSTNAME,
        origin: VERCEL_PREVIEW_ORIGIN,
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

  it("accepts a healthy MongoDB-backed remote API", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: VERCEL_PREVIEW_HOSTNAME,
        origin: VERCEL_PREVIEW_ORIGIN,
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          provider: "smart-nutrition-mongodb-api",
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkRemoteBackendAvailability(true)).resolves.toBe(true);
  });

  it("accepts the sanitized public health payload without diagnostic provider details", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition.club",
        origin: "https://smart-nutrition.club",
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          mode: "remote-cloud",
          auth: "httpOnly-cookie-session",
          storage: { engine: "mongodb" },
          static: { enabled: false },
          email: { configured: true },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkRemoteBackendAvailability(true)).resolves.toBe(true);
    expect(JSON.stringify(fetchMock.mock.calls)).toContain(
      "https://smart-nutrition-sk5r.onrender.com/api/health"
    );
  });

  it("ignores stale stored API URLs on the public deployment", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition.club",
        origin: "https://smart-nutrition.club",
      },
    });
    setClientStorageItem(REMOTE_BASE_URL_KEY, "https://stale-preview.example/api");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          email: {
            checked: true,
            valid: true,
            available: false,
          },
          name: {
            checked: true,
            valid: true,
            available: true,
          },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      remoteAuthProvider.checkRegistrationAvailability({
        name: "Igor",
        email: "sonyerik289@gmail.com",
      })
    ).resolves.toMatchObject({
      email: { available: false },
      name: { available: true },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://smart-nutrition-sk5r.onrender.com/api/auth/availability",
      expect.any(Object)
    );
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("stale-preview.example");
  });
});
