import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAuthRuntimeInfo,
  login,
  logout,
  register,
  verifyRegistration,
} from "./auth";

const password = "StrongPass1!";

const createRegisterPayload = (email: string) => ({
  name: "Local User",
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

  it("falls back to local browser auth when a deployed app has no usable cloud API", async () => {
    vi.stubGlobal("window", {
      location: {
        hostname: "smart-nutrition-preview.vercel.app",
        origin: "https://smart-nutrition-preview.vercel.app",
      },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const email = `local-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
    const registration = await register(createRegisterPayload(email));

    expect(registration).toMatchObject({
      requiresVerification: true,
      email,
    });
    expect("previewCode" in registration ? registration.previewCode : undefined).toBeTruthy();

    const registeredSession = await verifyRegistration({
      email,
      code: "previewCode" in registration ? registration.previewCode ?? "" : "",
    });

    expect(registeredSession.user.email).toBe(email);
    expect(getAuthRuntimeInfo().mode).toBe("local-browser");
    expect(getAuthRuntimeInfo().supportsCloudSync).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    await logout();

    const loginSession = await login(email, password);

    expect(loginSession.user.email).toBe(email);
    expect(getAuthRuntimeInfo().mode).toBe("local-browser");
  });

  it("validates local registration profile fields before storing an account", async () => {
    await expect(
      register({
        ...createRegisterPayload("invalid-local-profile@example.com"),
        weight: 500,
      })
    ).rejects.toMatchObject({
      code: "INVALID_PROFILE",
    });
  });
});
