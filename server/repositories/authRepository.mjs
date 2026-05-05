export const createAuthRepository = (storage) => ({
  findUserByEmail: (email) => storage.findUserByEmail(email),
  findUserById: (userId) => storage.findUserById(userId),
  hasUserWithRole: (role) => storage.hasUserWithRole(role),
  insertUser: (user) => storage.insertUser(user),
  updateUser: (user) => storage.updateUser(user),
  updateUserPassword: (payload) => storage.updateUserPassword(payload),
  updateUserRole: (payload) => storage.updateUserRole(payload),
  listUsers: () => storage.listUsers(),
  promoteUserByEmailToSuperAdmin: (email) => storage.promoteUserByEmailToSuperAdmin(email),
  deleteUser: (userId) => storage.deleteUser(userId),
  listUserBackups: (userId) => storage.listUserBackups(userId),
  readUserBackup: (userId, backupId) => storage.readUserBackup(userId, backupId),
  createAuditLog: (entry) => storage.createAuditLog(entry),
  listAuditLogs: (limit) => storage.listAuditLogs(limit),
  createSession: (session) => storage.createSession(session),
  findSessionByToken: (token) => storage.findSessionByToken(token),
  deleteSessionByToken: (token) => storage.deleteSessionByToken(token),
  deleteSessionsByUserId: (userId) => storage.deleteSessionsByUserId(userId),
  createPasswordResetToken: (token) => storage.createPasswordResetToken(token),
  findPasswordResetTokenByHash: (tokenHash) => storage.findPasswordResetTokenByHash(tokenHash),
  markPasswordResetTokenConsumed: (tokenHash, consumedAt) =>
    storage.markPasswordResetTokenConsumed(tokenHash, consumedAt),
  deletePasswordResetTokensByUserId: (userId) => storage.deletePasswordResetTokensByUserId(userId),
  createRegistrationVerificationToken: (token) =>
    storage.createRegistrationVerificationToken(token),
  findRegistrationVerificationTokenByHash: (codeHash) =>
    storage.findRegistrationVerificationTokenByHash(codeHash),
  markRegistrationVerificationTokenConsumed: (codeHash, consumedAt) =>
    storage.markRegistrationVerificationTokenConsumed(codeHash, consumedAt),
  deleteRegistrationVerificationTokensByUserId: (userId) =>
    storage.deleteRegistrationVerificationTokensByUserId(userId),
  markUserRegistrationVerified: (payload) => storage.markUserRegistrationVerified(payload),
  updateUserVerificationTarget: (payload) => storage.updateUserVerificationTarget(payload),
  incrementUserTokenVersion: (userId) => storage.incrementUserTokenVersion(userId),
  getLoginAttempt: (email) => storage.getLoginAttempt(email),
  upsertLoginAttempt: (attempt) => storage.upsertLoginAttempt(attempt),
  clearLoginAttempt: (email) => storage.clearLoginAttempt(email),
  cleanupExpiredSessions: (now) => storage.cleanupExpiredSessions(now),
  cleanupExpiredPasswordResetTokens: (now) => storage.cleanupExpiredPasswordResetTokens(now),
  cleanupExpiredRegistrationVerificationTokens: (now) =>
    storage.cleanupExpiredRegistrationVerificationTokens(now),
});
