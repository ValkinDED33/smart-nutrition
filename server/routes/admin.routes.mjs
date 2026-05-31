const matchPath = (pattern) => (pathname) => {
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return match.groups ?? {};
};

export const createAdminRoutes = ({ adminController }) => [
  {
    method: "GET",
    pathname: "/api/admin/users",
    handler: adminController.getUsers,
  },
  {
    method: "POST",
    pathname: "/api/admin/users/role",
    handler: adminController.updateRole,
  },
  {
    method: "PATCH",
    match: matchPath(/^\/api\/admin\/users\/(?<userId>[^/]+)\/role$/),
    handler: adminController.updateRole,
  },
  {
    method: "POST",
    pathname: "/api/admin/users/ban",
    handler: adminController.banUser,
  },
  {
    method: "PATCH",
    match: matchPath(/^\/api\/admin\/users\/(?<userId>[^/]+)\/ban$/),
    handler: adminController.banUser,
  },
  {
    method: "DELETE",
    match: matchPath(/^\/api\/admin\/users\/(?<userId>[^/]+)$/),
    handler: adminController.deleteUser,
  },
  {
    method: "GET",
    pathname: "/api/admin/stats",
    handler: adminController.getStats,
  },
  {
    method: "GET",
    pathname: "/api/admin/foods/submissions",
    handler: adminController.listModerationQueue,
  },
  {
    method: "PATCH",
    match: matchPath(/^\/api\/admin\/foods\/submissions\/(?<submissionId>[^/]+)$/),
    handler: adminController.reviewCatalogProduct,
  },
  {
    method: "GET",
    pathname: "/api/admin/audit-logs",
    handler: adminController.listAuditLogs,
  },
  {
    method: "POST",
    pathname: "/api/reports",
    handler: adminController.createContentReport,
  },
  {
    method: "GET",
    pathname: "/api/admin/reports",
    handler: adminController.listContentReports,
  },
];
