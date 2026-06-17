import { describe, expect, it } from "vitest";
import {
  canAccessAdminCenter,
  canModerateCommunity,
  canReviewReports,
  getAssignableRolesForActor,
  resolveCommunityStatus,
} from "./roles";

describe("user role model", () => {
  it("keeps email verification legacy role out of admin access", () => {
    expect(canAccessAdminCenter("USER")).toBe(false);
    expect(canAccessAdminCenter("VERIFIED_USER")).toBe(false);
  });

  it("opens report review to helpers without full moderation", () => {
    expect(canAccessAdminCenter("HELPER")).toBe(true);
    expect(canReviewReports("HELPER")).toBe(true);
    expect(canModerateCommunity("HELPER")).toBe(false);
  });

  it("limits role assignment by actor authority", () => {
    expect(getAssignableRolesForActor("ADMIN")).toEqual([
      "USER",
      "HELPER",
      "MODERATOR",
    ]);
    expect(getAssignableRolesForActor("OWNER")).toEqual([
      "USER",
      "HELPER",
      "MODERATOR",
      "ADMIN",
    ]);
  });

  it("resolves community status from reputation separately from role", () => {
    expect(resolveCommunityStatus(0)).toBe("NEW_MEMBER");
    expect(resolveCommunityStatus(100)).toBe("ACTIVE_MEMBER");
    expect(resolveCommunityStatus(500)).toBe("TRUSTED_MEMBER");
    expect(resolveCommunityStatus(1000)).toBe("COMMUNITY_EXPERT");
  });
});
