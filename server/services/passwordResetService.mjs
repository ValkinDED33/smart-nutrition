import crypto from 'crypto';

export class PasswordResetService {
  constructor(authRepository, config) {
    this.authRepository = authRepository;
    this.config = config;
    this.resetTokens = new Map();
  }

  generateResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async requestPasswordReset(email) {
    const user = this.authRepository.findUserByEmail(email);
    
    if (!user) {
      return { success: true, message: 'If email exists, reset link will be sent' };
    }

    const resetToken = this.generateResetToken();
    const expiresAt = Date.now() + (60 * 60 * 1000);

    this.resetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt,
      used: false,
    });

    return {
      success: true,
      message: 'Password reset email sent',
      token: resetToken,
    };
  }

  validateResetToken(token) {
    const tokenData = this.resetTokens.get(token);

    if (!tokenData) {
      throw new Error('Invalid reset token');
    }

    if (tokenData.expiresAt < Date.now()) {
      this.resetTokens.delete(token);
      throw new Error('Reset token has expired');
    }

    if (tokenData.used) {
      throw new Error('Reset token has already been used');
    }

    return tokenData;
  }

  resetPassword(token, newPassword) {
    const tokenData = this.validateResetToken(token);

    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const user = this.authRepository.findUserById(tokenData.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordSalt = crypto.randomBytes(16).toString('base64');
    const passwordHash = crypto
      .pbkdf2Sync(newPassword, passwordSalt, this.config.passwordIterations, 32, 'sha256')
      .toString('base64');

    this.authRepository.updateUser({
      ...user,
      passwordHash,
      passwordSalt,
      passwordVersion: 'pbkdf2-sha256',
    });

    tokenData.used = true;
    this.authRepository.deleteSessionsByUserId(user.id);

    return { success: true, message: 'Password reset successfully' };
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.resetTokens.entries()) {
      if (data.expiresAt < now) {
        this.resetTokens.delete(token);
      }
    }
  }
}

export const createPasswordResetService = (authRepository, config) => {
  const service = new PasswordResetService(authRepository, config);

  return {
    requestPasswordReset: (email) => service.requestPasswordReset(email),
    validateResetToken: (token) => service.validateResetToken(token),
    resetPassword: (token, newPassword) => service.resetPassword(token, newPassword),
    cleanupExpiredTokens: () => service.cleanupExpiredTokens(),
  };
};
