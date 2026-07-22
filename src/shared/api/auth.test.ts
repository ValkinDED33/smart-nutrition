import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  getAuthRuntimeInfo,
  logout,
  register,
} from "./auth";

const password = "StrongPass1!";

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
});
