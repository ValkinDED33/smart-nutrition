import { afterEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import type { User } from "@domain/user/types";
import {
  canUseRemoteBaseUrlInCurrentBrowser,
  checkRemoteBackendAvailability,
  remoteAuthProvider,
  updateRemoteProfileWithState,
} from "./authRemote";
import {
  getClientStorageItem,
  removeClientStorageItem,
  setClientStorageItem,
} from "../lib/clientPersistence";
import {
  clearCachedRemoteState,
  readCachedRemoteSnapshot,
  setCachedRemoteStateOwner,
} from "../lib/remoteStateCache";

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
const TEST_REMOTE_API_URL = "https://smart-nutrition.example/api";
const REQUEST_ID_HEADER = "X-Request-Id";

describe("remote API base URL guards", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    setCachedRemoteStateOwner(null);
    clearCachedRemoteState();
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

  it("probes the same-origin API proxy for public Vercel deployments", async () => {
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
      `${VERCEL_PREVIEW_ORIGIN}/api/health`,
      expect.any(Object)
    );
  });

  it("uses the configured Render API from Vercel previews when the preview API is protected", async () => {
    vi.stubEnv(
      "VITE_SMART_NUTRITION_API_BASE_URL",
      "https://smart-nutrition-sk5r.onrender.com/api"
    );
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-aphqw8kjs-valkindeds-projects.vercel.app",
        origin: "https://smart-nutrition-aphqw8kjs-valkindeds-projects.vercel.app",
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
      "https://smart-nutrition-sk5r.onrender.com/api/health",
      expect.any(Object)
    );
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(
      "smart-nutrition-aphqw8kjs-valkindeds-projects.vercel.app/api"
    );
  });

  it("falls back to the canonical Render API for unlisted Vercel previews without a configured API URL", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-aphqw8kjs-valkindeds-projects.vercel.app",
        origin: "https://smart-nutrition-aphqw8kjs-valkindeds-projects.vercel.app",
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
      "https://smart-nutrition-sk5r.onrender.com/api/health",
      expect.any(Object)
    );
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(
      "smart-nutrition-aphqw8kjs-valkindeds-projects.vercel.app/api"
    );
  });

  it("keeps the Vercel API proxy ahead of the SPA catch-all rewrite", async () => {
    const vercelConfig = JSON.parse(await readFile("vercel.json", "utf8")) as {
      rewrites?: Array<{ source?: string; destination?: string }>;
    };
    const rewrites = vercelConfig.rewrites ?? [];
    const apiProxyIndex = rewrites.findIndex(
      (rewrite) =>
        rewrite.source === "/api/(.*)" &&
        rewrite.destination ===
          "https://smart-nutrition-sk5r.onrender.com/api/$1"
    );
    const spaCatchAllIndex = rewrites.findIndex(
      (rewrite) => rewrite.destination === "/index.html"
    );

    expect(apiProxyIndex).toBeGreaterThanOrEqual(0);
    expect(spaCatchAllIndex).toBeGreaterThanOrEqual(0);
    expect(apiProxyIndex).toBeLessThan(spaCatchAllIndex);
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
    const remoteBaseUrl = TEST_REMOTE_API_URL;
    const user: User = {
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
    const refreshHeaders = new Headers(
      (fetchMock.mock.calls[1]?.[1] as RequestInit | undefined)?.headers
    );
    expect(refreshHeaders.get(REQUEST_ID_HEADER)).toMatch(/^sn-web-/);
    expect(getClientStorageItem(REMOTE_BASE_URL_KEY)).toBe(remoteBaseUrl);
    expect(getClientStorageItem(AUTH_SESSION_HINT_KEY)).toBeTruthy();
  });

  it("keeps refresh snapshot cache scoped to the restored user", async () => {
    const remoteBaseUrl = TEST_REMOTE_API_URL;
    const user: User = {
      id: "user-refresh-cache-owner",
      name: "Refresh Cache Owner",
      email: "refresh-cache@example.com",
      emailVerified: true,
      age: 27,
      weight: 68,
      height: 172,
      gender: "female",
      activity: "moderate",
      goal: "maintain",
      role: "USER",
      languagePreference: "uk",
    };
    const refreshSnapshot = {
      profile: { calories: 2100 },
      meal: { items: [] },
      water: { consumedMl: 500 },
      fridge: { items: [] },
      community: { posts: [] },
      updatedAt: "2026-08-22T16:30:00.000Z",
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
        new Response(
          JSON.stringify({ user, snapshot: refreshSnapshot }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user, snapshot: null }), { status: 200 })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(remoteAuthProvider.restoreSession()).resolves.toMatchObject({
      user,
      token: "cookie-session",
    });

    expect(readCachedRemoteSnapshot()?.updatedAt).toBe(
      refreshSnapshot.updatedAt
    );

    setCachedRemoteStateOwner("another-user");
    expect(readCachedRemoteSnapshot()).toBeNull();
  });

  it("clears stale startup auth hints only after refresh cookie restore fails", async () => {
    const remoteBaseUrl = TEST_REMOTE_API_URL;
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
      "https://smart-nutrition.club/api/health"
    );
  });

  it("preserves profile-state diagnostics from public error payloads", async () => {
    const source = await readFile("src/shared/api/authRemote.ts", "utf8");
    const providerSource = await readFile("src/shared/api/authProvider.ts", "utf8");

    expect(source).toContain("diagnostics?:");
    expect(source).toContain("requestId?: string");
    expect(source).toContain("payload.requestId");
    expect(source).toContain("diagnostics: error.diagnostics");
    expect(source).toContain("AuthApiErrorDiagnostics");
    expect(providerSource).toContain("syncStage?: string");
    expect(providerSource).toContain("reasonCode?: string");
    expect(providerSource).toContain("providerCode?: string");
  });

  it("adds diagnostic request ids to profile-state writes and preserves header-only error ids", async () => {
    const remoteBaseUrl = TEST_REMOTE_API_URL;
    const user: User = {
      id: "user-diagnostic-profile",
      name: "Diagnostic Profile",
      email: "diagnostic@example.com",
      emailVerified: true,
      age: 31,
      weight: 70,
      height: 175,
      gender: "female",
      activity: "light",
      goal: "maintain",
      role: "USER",
      languagePreference: "uk",
    };

    setClientStorageItem(REMOTE_BASE_URL_KEY, remoteBaseUrl);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user, snapshot: null }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: "STATE_SYNC_UNAVAILABLE",
            message: "Could not save profile.",
            diagnostics: {
              syncStage: "profile-state",
              reasonCode: "PROFILE_STATE_PATCH_FAILED",
            },
          }),
          {
            status: 503,
            headers: {
              [REQUEST_ID_HEADER]: "sn-server-profile-state-123",
            },
          }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      remoteAuthProvider.login("diagnostic@example.com", "Password1")
    ).resolves.toMatchObject({ user });
    const result = await updateRemoteProfileWithState(user, {
      gender: "female",
      pregnancyMode: "pregnant",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "STATE_SYNC_UNAVAILABLE",
      status: 503,
      diagnostics: {
        syncStage: "profile-state",
        reasonCode: "PROFILE_STATE_PATCH_FAILED",
        requestId: "sn-server-profile-state-123",
      },
    });

    const loginHeaders = new Headers(
      (fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.headers
    );
    const profileHeaders = new Headers(
      (fetchMock.mock.calls[1]?.[1] as RequestInit | undefined)?.headers
    );
    expect(loginHeaders.get(REQUEST_ID_HEADER)).toMatch(/^sn-web-/);
    expect(profileHeaders.get(REQUEST_ID_HEADER)).toMatch(/^sn-web-/);
    expect(profileHeaders.get("X-Device-Id")).toBeTruthy();
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
      "https://smart-nutrition.club/api/auth/availability",
      expect.any(Object)
    );
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("stale-preview.example");
  });
});
