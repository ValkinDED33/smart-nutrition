import { describe, expect, it } from "vitest";
import { stripSensitiveSearchParamsFromLocation } from "./sensitiveUrl";

describe("sensitiveUrl", () => {
  it("removes sensitive search params while preserving route, safe params, and hash", () => {
    expect(
      stripSensitiveSearchParamsFromLocation({
        pathname: "/reset-password",
        search: "?token=secret&sn_recovery=12345&mode=pwa",
        hash: "#form",
      })
    ).toEqual({
      changed: true,
      path: "/reset-password?sn_recovery=12345&mode=pwa#form",
    });
  });

  it("reports unchanged URLs without sensitive params", () => {
    expect(
      stripSensitiveSearchParamsFromLocation({
        pathname: "/dashboard",
        search: "?tab=meals",
        hash: "",
      })
    ).toEqual({
      changed: false,
      path: "/dashboard?tab=meals",
    });
  });

  it("removes the default sensitive auth and identity params", () => {
    expect(
      stripSensitiveSearchParamsFromLocation({
        pathname: "/verify-email",
        search: "?access_token=a&code=b&key=c&password=d&email=e&safe=1",
        hash: "",
      })
    ).toEqual({
      changed: true,
      path: "/verify-email?safe=1",
    });
  });
});
