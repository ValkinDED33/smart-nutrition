import { hasRoleAtLeast, PlatformApiError } from "./domain.mjs";

const roleAliases = {
  user: "USER",
  helper: "HELPER",
  moderator: "MODERATOR",
  admin: "ADMIN",
  owner: "OWNER",
  super_admin: "SUPER_ADMIN",
};

const normalizeRequiredRole = (role) =>
  roleAliases[String(role ?? "").trim().toLowerCase()] ?? role;

const hasRequiredRole = (user, role) => {
  const requiredRole = normalizeRequiredRole(role);

  if (!user?.role || !requiredRole) {
    return false;
  }

  return hasRoleAtLeast(user.role, requiredRole);
};

export const assertRole = (user, role) => {
  if (!hasRequiredRole(user, role)) {
    throw new PlatformApiError("FORBIDDEN", "Forbidden");
  }
};
