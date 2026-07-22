import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  login,
  logout,
  register,
} from "./auth";

const password = "StrongPass1!";
const PUBLIC_API_BASE_URL = "https://smart-nutrition-sk5r.onrender.com/api";
const PUBLIC_APP_HOSTNAME = "smart-nutrition.club";
const PUBLIC_APP_ORIGIN = `https://${PUBLIC_APP_HOSTNAME}`;

const createRegisterPayload = (email: string) => ({
  name: "Cloud User",
  email,
  password,
  age: 32,
  weight: 74,
  height: 178,
  gender: "male" as const,
  activity: "moderate" as const,
  goal: "maintain" as const,
});

describe("auth provider selection", () => {
  afterEach(async () => {
    await logout();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("requires the cloud API instead of falling back to browser auth", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-preview.vercel.app",
        origin: "https://smart-nutrition-preview.vercel.app",
      },
    });
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("network down"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      register(createRegisterPayload("cloud-required@example.com"))
    ).rejects.toMatchObject({
      code: "REMOTE_API_UNAVAILABLE",
      message:
        "The Smart Nutrition cloud service is temporarily unavailable. Try again in a moment.",
    } satisfies Partial<AuthApiError>);

    expect(getAuthRuntimeInfo().mode).toBe("remote-cloud");
  });

  it("exposes cloud runtime metadata only", () => {
    const runtime = getAuthRuntimeInfo();

    expect(runtime).toMatchObject({
      mode: "remote-cloud",
      supportsAccountDeletion: true,
      supportsDataExport: true,
      supportsSessionRevocation: true,
    });
  });

  it("keeps raw login backend messages out of AuthApiError text", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: PUBLIC_APP_HOSTNAME,
        origin: PUBLIC_APP_ORIGIN,
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "INVALID_CREDENTIALS",
          message: "Provider stack trace: auth database rejected password",
        }),
        { status: 401 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(login("person@example.com", password)).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    } satisfies Partial<AuthApiError>);
    expect(fetchMock).toHaveBeenCalledWith(
      `${PUBLIC_API_BASE_URL}/auth/login`,
      expect.any(Object)
    );
  });

  it("keeps raw registration backend messages out of AuthApiError text", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: PUBLIC_APP_HOSTNAME,
        origin: PUBLIC_APP_ORIGIN,
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "EMAIL_IN_USE",
          message: "Raw unique index violation on users.email",
        }),
        { status: 409 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      register(createRegisterPayload("existing@example.com"))
    ).rejects.toMatchObject({
      code: "EMAIL_IN_USE",
      message: "A user with this email already exists.",
    } satisfies Partial<AuthApiError>);
  });
});
