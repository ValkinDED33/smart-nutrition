import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminPlatformStats,
  listAdminUsers,
  PlatformApiError,
} from "./platform";

const authMock = vi.hoisted(() => ({
  getRemoteAuthBaseUrl: vi.fn<() => string | null>(
    () => "https://api.example.com/api"
  ),
}));

vi.mock("./auth", () => authMock);

describe("platform api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getRemoteAuthBaseUrl.mockReturnValue("https://api.example.com/api");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses product-language cloud copy when the platform base URL is unavailable", async () => {
    authMock.getRemoteAuthBaseUrl.mockReturnValue(null);

    await expect(listAdminUsers()).rejects.toMatchObject({
      code: "REMOTE_API_UNAVAILABLE",
      message: "The cloud service is temporarily unavailable. Try again later.",
      status: null,
    });
  });

  it("preserves backend error codes without exposing raw backend/provider messages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "PLATFORM_REQUEST_FAILED",
            message: "Provider stack trace: admin database host refused connection",
          }),
          { status: 500 }
        )
      )
    );

    await expect(getAdminPlatformStats()).rejects.toMatchObject({
      code: "PLATFORM_REQUEST_FAILED",
      message: "The platform action could not be completed.",
      status: 500,
    });
  });

  it("maps platform access failures to safe admin-facing copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "FORBIDDEN",
            message: "Raw role policy details must stay private.",
          }),
          { status: 403 }
        )
      )
    );

    await expect(listAdminUsers()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Your account does not have access to this platform action.",
      status: 403,
    });
  });

  it("keeps platform errors typed for callers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "NOT_FOUND" }), { status: 404 })
      )
    );

    await expect(listAdminUsers()).rejects.toBeInstanceOf(PlatformApiError);
  });
});
