export const createPlatformRepository = (storage) => ({
  findUserById: (userId) => storage.findUserById(userId),
  listUsers: () => storage.listUsers(),
  updateUserRole: (payload) => storage.updateUserRole(payload),
  updateUserBan: (payload) => storage.updateUserBan(payload),
  hasUserWithRole: (role) => storage.hasUserWithRole(role),
  promoteUserByEmailToOwner: (email) =>
    storage.promoteUserByEmailToOwner?.(email) ??
    storage.promoteUserByEmailToSuperAdmin?.(email) ??
    null,
  promoteUserByEmailToSuperAdmin: (email) =>
    storage.promoteUserByEmailToOwner?.(email) ??
    storage.promoteUserByEmailToSuperAdmin?.(email) ??
    null,
  createAuditLog: (entry) => storage.createAuditLog(entry),
  listAuditLogs: (limit) => storage.listAuditLogs(limit),
  countCatalogProductsByOwnerSince: (userId, sinceIso) =>
    storage.countCatalogProductsByOwnerSince(userId, sinceIso),
  findCatalogProductById: (productId) => storage.findCatalogProductById(productId),
  listCatalogProducts: (options) => storage.listCatalogProducts(options),
  findCatalogDuplicateCandidates: (options) => storage.findCatalogDuplicateCandidates(options),
  insertCatalogProduct: (product) => storage.insertCatalogProduct(product),
  updateCatalogProduct: (product) => storage.updateCatalogProduct(product),
  createCatalogProductVersion: (version) => storage.createCatalogProductVersion(version),
});
