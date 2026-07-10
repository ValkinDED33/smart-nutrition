import type { CommunityMemberStatus, UserRole } from "./types";

export type AssignableUserRole = "USER" | "HELPER" | "MODERATOR" | "ADMIN";

export const ownerRoles: UserRole[] = ["OWNER", "SUPER_ADMIN"];

export const roleRank: Record<UserRole, number> = {
  USER: 0,
  VERIFIED_USER: 0,
  HELPER: 1,
  NUTRITIONIST: 2,
  MODERATOR: 3,
  ADMIN: 4,
  OWNER: 5,
  SUPER_ADMIN: 5,
};

export const roleLabels: Record<UserRole, string> = {
  USER: "User",
  VERIFIED_USER: "Email verified legacy",
  HELPER: "Helper",
  NUTRITIONIST: "Nutritionist legacy",
  MODERATOR: "Moderator",
  ADMIN: "Admin",
  OWNER: "Owner",
  SUPER_ADMIN: "Owner legacy",
};

export const communityStatusLabels: Record<CommunityMemberStatus, string> = {
  NEW_MEMBER: "New Member",
  ACTIVE_MEMBER: "Active Member",
  TRUSTED_MEMBER: "Trusted Member",
  COMMUNITY_EXPERT: "Community Expert",
};

const getRoleRank = (role: UserRole) => {
  switch (role) {
    case "HELPER":
      return 1;
    case "NUTRITIONIST":
      return 2;
    case "MODERATOR":
      return 3;
    case "ADMIN":
      return 4;
    case "OWNER":
    case "SUPER_ADMIN":
      return 5;
    case "USER":
    case "VERIFIED_USER":
    default:
      return 0;
  }
};

export const isOwnerRole = (role: UserRole | null | undefined) =>
  role === "OWNER" || role === "SUPER_ADMIN";

export const hasUserRoleAtLeast = (
  role: UserRole | null | undefined,
  minimumRole: UserRole
) => {
  if (!role) {
    return false;
  }

  return getRoleRank(role) >= getRoleRank(minimumRole);
};

export const canAccessAdminCenter = (role: UserRole | null | undefined) =>
  role === "HELPER" ||
  role === "NUTRITIONIST" ||
  hasUserRoleAtLeast(role, "MODERATOR");

export const canModerateCommunity = (role: UserRole | null | undefined) =>
  role === "NUTRITIONIST" || hasUserRoleAtLeast(role, "MODERATOR");

export const canReviewReports = (role: UserRole | null | undefined) =>
  role === "HELPER" || canModerateCommunity(role);

export const getAssignableRolesForActor = (
  actorRole: UserRole | null | undefined
): AssignableUserRole[] => {
  if (isOwnerRole(actorRole)) {
    return ["USER", "HELPER", "MODERATOR", "ADMIN"];
  }

  if (actorRole === "ADMIN") {
    return ["USER", "HELPER", "MODERATOR"];
  }

  return [];
};

export const isProtectedOwnerRole = (role: UserRole | null | undefined) =>
  role === "OWNER" || role === "SUPER_ADMIN";

export const resolveCommunityStatus = (
  reputationScore: number | null | undefined
): CommunityMemberStatus => {
  const score = Math.max(Number(reputationScore) || 0, 0);

  if (score >= 1000) return "COMMUNITY_EXPERT";
  if (score >= 500) return "TRUSTED_MEMBER";
  if (score >= 100) return "ACTIVE_MEMBER";
  return "NEW_MEMBER";
};
