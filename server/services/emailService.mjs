import crypto from 'crypto';
import { db } from './db'; // Placeholder for database module

class EmailService {
    // Generate secure verification token
    static generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Store verification token with expiration
    static async storeVerificationToken(email, token) {
        const expiration = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await db.query('INSERT INTO verification_tokens (email, token, expiration) VALUES (?, ?, ?)', [email, token, expiration]);
    }

    // Store password reset token with expiration
    static async storeResetToken(email, token) {
        const expiration = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db.query('INSERT INTO password_reset_tokens (email, token, expiration) VALUES (?, ?, ?)', [email, token, expiration]);
    }

    // Verify token validity and expiration
    static async verifyToken(token, type) {
        const table = type === 'verification' ? 'verification_tokens' : 'password_reset_tokens';
        const result = await db.query(`SELECT * FROM ${table} WHERE token = ?`, [token]);
        if (result.length === 0 || new Date() > new Date(result[0].expiration)) {
            throw new Error('Token is invalid or has expired.');
        }
        return result[0];
    }

    // Mark email as verified
    static async markEmailVerified(email) {
        await db.query('UPDATE users SET verified = ? WHERE email = ?', [true, email]);
    }

    // Send placeholder verification email
    static async sendVerificationEmail(email, token) {
        console.log(`Sending verification email to ${email} with token ${token}.`);
        // Implement real SMTP sending logic here
    }

    // Send placeholder password reset email
    static async sendResetEmail(email, token) {
        console.log(`Sending password reset email to ${email} with token ${token}.`);
        // Implement real SMTP sending logic here
    }

    // Clean up expired tokens
    static async cleanupExpiredTokens() {
        await db.query('DELETE FROM verification_tokens WHERE expiration < NOW()');
        await db.query('DELETE FROM password_reset_tokens WHERE expiration < NOW()');
    }
}

export default EmailService;
