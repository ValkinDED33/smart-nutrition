import { hasRoleAtLeast, PlatformApiError } from "./domain.mjs";

const roleAliases = {
  user: "USER",
  moderator: "MODERATOR",
  admin: "ADMIN",
  super_admin: "SUPER_ADMIN",
};

export const normalizeRequiredRole = (role) =>
  roleAliases[String(role ?? "").trim().toLowerCase()] ?? role;

export const hasRequiredRole = (user, role) => {
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

export function requireRole(role) {
  const middleware = (req, res, next) => {
    if (!hasRequiredRole(req.user, role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  };

  middleware.assert = (user) => assertRole(user, role);
  return middleware;
}
