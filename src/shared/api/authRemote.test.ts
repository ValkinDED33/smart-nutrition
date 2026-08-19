import { afterEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import {
  canUseRemoteBaseUrlInCurrentBrowser,
  checkRemoteBackendAvailability,
  remoteAuthProvider,
} from "./authRemote";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";

const loopbackHostname = ["local", "host"].join("");
const loopbackIpv4 = ["127", "0", "0", "1"].join(".");
const loopbackApiUrl = (hostname: string) => `http://${hostname}:8787/api`;
const VERCEL_PREVIEW_HOSTNAME = "smart-nutrition-topaz.vercel.app";
const VERCEL_PREVIEW_ORIGIN = "https://smart-nutrition-topaz.vercel.app";
const REMOTE_BASE_URL_KEY = "smart-nutrition.remote-base-url";
const AUTH_SESSION_HINT_KEY = "smart-nutrition.auth-session-hint";
const REMOTE_CLOUD_MODE = "remote-cloud";
const HTTP_ONLY_COOKIE_SESSION_AUTH = "httpOnly-cookie-session";
const SESSION_EXPIRED_MESSAGE = "Session expired.";

describe("remote API base URL guards", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    removeClientStorageItem(REMOTE_BASE_URL_KEY);
    removeClientStorageItem(AUTH_SESSION_HINT_KEY);
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
        origin: "http://localhost:5173",
      },
    });

    expect(canUseRemoteBaseUrlInCurrentBrowser(loopbackApiUrl(loopbackHostname))).toBe(false);
  });

  it("uses the same-origin API proxy during local development", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: loopbackHostname,
        origin: "http://localhost:5173",
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          mode: REMOTE_CLOUD_MODE,
          auth: HTTP_ONLY_COOKIE_SESSION_AUTH,
          storage: { engine: "mongodb" },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkRemoteBackendAvailability(true)).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5173/api/health",
      expect.any(Object)
    );
  });

  it("routes local registration availability through the same-origin API proxy", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: loopbackIpv4,
        origin: "http://127.0.0.1:5173",
      },
    });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            mode: REMOTE_CLOUD_MODE,
            auth: HTTP_ONLY_COOKIE_SESSION_AUTH,
            storage: { engine: "mongodb" },
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: {
              checked: false,
              valid: false,
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
        name: "CodexLocal",
      })
    ).resolves.toMatchObject({
      name: { available: true },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:5173/api/health",
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:5173/api/auth/availability",
      expect.any(Object)
    );
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

  it("restores startup auth through refresh cookie when the access cookie is stale", async () => {
    const remoteBaseUrl = "https://smart-nutrition.example/api";
    const user = {
      id: "user-refresh-restore",
      name: "Refresh Restore",
      email: "refresh@example.com",
      emailVerified: true,
      age: 25,
      weight: 70,
      height: 175,
      gender: "female",
      activity: "light",
      goal: "maintain",
      role: "USER",
      languagePreference: "uk",
    };

    setClientStorageItem(REMOTE_BASE_URL_KEY, remoteBaseUrl);
    setClientStorageItem(
      AUTH_SESSION_HINT_KEY,
      JSON.stringify({ savedAt: Date.now(), baseUrl: remoteBaseUrl })
    );

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "INVALID_CREDENTIALS",
            message: SESSION_EXPIRED_MESSAGE,
          }),
          { status: 401 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user, snapshot: null }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user, snapshot: null }), { status: 200 })
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(remoteAuthProvider.restoreSession()).resolves.toMatchObject({
      user,
      token: "cookie-session",
      refreshToken: undefined,
      snapshot: null,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${remoteBaseUrl}/auth/session`,
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${remoteBaseUrl}/auth/refresh`,
      expect.objectContaining({ method: "POST" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `${remoteBaseUrl}/auth/session`,
      expect.objectContaining({ method: "GET" })
    );
    expect(getClientStorageItem(REMOTE_BASE_URL_KEY)).toBe(remoteBaseUrl);
    expect(getClientStorageItem(AUTH_SESSION_HINT_KEY)).toBeTruthy();
  });

  it("clears stale startup auth hints only after refresh cookie restore fails", async () => {
    const remoteBaseUrl = "https://smart-nutrition.example/api";
    setClientStorageItem(REMOTE_BASE_URL_KEY, remoteBaseUrl);
    setClientStorageItem(
      AUTH_SESSION_HINT_KEY,
      JSON.stringify({ savedAt: Date.now(), baseUrl: remoteBaseUrl })
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "INVALID_CREDENTIALS",
            message: SESSION_EXPIRED_MESSAGE,
          }),
          { status: 401 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "INVALID_REFRESH_TOKEN",
            message: "Refresh session expired.",
          }),
          { status: 401 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "INVALID_CREDENTIALS",
            message: SESSION_EXPIRED_MESSAGE,
          }),
          { status: 401 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(remoteAuthProvider.restoreSession()).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `${remoteBaseUrl}/auth/session`,
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `${remoteBaseUrl}/auth/refresh`,
      expect.objectContaining({ method: "POST" })
    );
    expect(getClientStorageItem(REMOTE_BASE_URL_KEY)).toBeNull();
    expect(getClientStorageItem(AUTH_SESSION_HINT_KEY)).toBeNull();
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
          mode: REMOTE_CLOUD_MODE,
          auth: HTTP_ONLY_COOKIE_SESSION_AUTH,
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

  it("preserves profile-state diagnostics from public error payloads", async () => {
    const source = await readFile("src/shared/api/authRemote.ts", "utf8");

    expect(source).toContain("diagnostics?:");
    expect(source).toContain("diagnostics: payload.diagnostics");
    expect(source).toContain("diagnostics: error.diagnostics");
    expect(source).toContain("syncStage?: string");
    expect(source).toContain("reasonCode?: string");
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
