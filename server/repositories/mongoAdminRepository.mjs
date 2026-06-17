const adminRoleMap = {
  user: "USER",
  helper: "HELPER",
  moderator: "MODERATOR",
  admin: "ADMIN",
  USER: "USER",
  VERIFIED_USER: "VERIFIED_USER",
  HELPER: "HELPER",
  NUTRITIONIST: "NUTRITIONIST",
  MODERATOR: "MODERATOR",
  ADMIN: "ADMIN",
  OWNER: "OWNER",
  SUPER_ADMIN: "SUPER_ADMIN",
};

const normalizeAdminRole = (role) => adminRoleMap[String(role ?? "").trim()] ?? "USER";

const toDateMs = (value) => {
  const time = Date.parse(String(value ?? ""));
  return Number.isFinite(time) ? time : 0;
};

export const createMongoAdminRepository = (storage) => ({
  getAllUsers: () => storage.listUsers(),

  updateUserRole: (userId, role) =>
    storage.updateUserRole({
      userId,
      role: normalizeAdminRole(role),
      twoFactorRequired: normalizeAdminRole(role) === "ADMIN",
    }),

  banUser: (userId, reason = "Admin moderation action") =>
    storage.updateUserBan({
      userId,
      bannedAt: new Date().toISOString(),
      bannedReason: reason,
    }),

  unbanUser: (userId) =>
    storage.updateUserBan({
      userId,
      bannedAt: null,
      bannedReason: null,
    }),

  deleteUser: (userId) => storage.deleteUser(userId),

  createAuditLog: (entry) => storage.createAuditLog?.(entry),

  getStats: async () => {
    if (storage.getAdminStats) {
      return storage.getAdminStats();
    }

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const [users, products] = await Promise.all([
      storage.listUsers(),
      storage.listCatalogProducts?.({
        includeUnapproved: true,
        statuses: ["pending", "approved", "rejected"],
        limit: 10_000,
      }) ?? [],
    ]);

    return {
      usersTotal: users.length,
      usersActive: users.filter((user) => !user.bannedAt).length,
      usersNewThisWeek: users.filter((user) => toDateMs(user.createdAt) >= weekAgo).length,
      usersBanned: users.filter((user) => Boolean(user.bannedAt)).length,
      aiRequestsTotal: 0,
      productsTotal: products.length,
      productsPending: products.filter((product) => product.status === "pending").length,
      reportsOpen: 0,
      suspiciousAccounts: 0,
      photoAnalysesTotal: 0,
    };
  },
});
