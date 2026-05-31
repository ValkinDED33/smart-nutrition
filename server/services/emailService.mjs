import { Resend } from "resend";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildResetSubject = () => "Reset your Smart Nutrition password";

const buildVerificationSubject = () => "Confirm your Smart Nutrition email";

const buildVerificationText = ({ appBaseUrl, name, verificationUrl, expiresAt }) => {
  const displayName = String(name ?? "").trim() || "there";

  return [
    `Hi ${displayName},`,
    "",
    "Confirm your Smart Nutrition email with the secure link below:",
    verificationUrl,
    "",
    `This link expires at ${new Date(expiresAt).toUTCString()}.`,
    "",
    "If you did not create this account, you can ignore this message.",
    "",
    `App: ${appBaseUrl}`,
  ].join("\n");
};

const buildVerificationHtml = ({ name, verificationUrl, expiresAt }) => {
  const displayName = escapeHtml(String(name ?? "").trim() || "there");
  const safeUrl = escapeHtml(verificationUrl);
  const expiresLabel = escapeHtml(new Date(expiresAt).toUTCString());

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:20px;padding:32px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;color:#0f766e;text-transform:uppercase;">Smart Nutrition</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">Confirm your email</h1>
      <p style="margin:0 0 16px;line-height:1.7;">Hi ${displayName},</p>
      <p style="margin:0 0 20px;line-height:1.7;">Finish creating your Smart Nutrition account with the secure button below.</p>
      <p style="margin:0 0 20px;">
        <a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#0f766e 0%,#65a30d 100%);color:#ffffff;text-decoration:none;font-weight:700;">Verify Email</a>
      </p>
      <p style="margin:0 0 12px;line-height:1.7;">If the button does not open, copy and paste this link into your browser:</p>
      <p style="margin:0 0 20px;word-break:break-all;line-height:1.7;"><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
      <p style="margin:0;line-height:1.7;color:#475569;">This link expires at <strong>${expiresLabel}</strong>.</p>
    </div>
  </body>
</html>`;
};

const buildResetText = ({ appBaseUrl, name, resetUrl, expiresAt }) => {
  const displayName = String(name ?? "").trim() || "there";

  return [
    `Hi ${displayName},`,
    "",
    "We received a request to reset your Smart Nutrition password.",
    "Use the secure link below to choose a new password:",
    resetUrl,
    "",
    `This link expires at ${new Date(expiresAt).toUTCString()}.`,
    "",
    "If you did not request this reset, you can safely ignore this email.",
    "",
    `App: ${appBaseUrl}`,
  ].join("\n");
};

const buildResetHtml = ({ name, resetUrl, expiresAt }) => {
  const displayName = escapeHtml(String(name ?? "").trim() || "there");
  const safeUrl = escapeHtml(resetUrl);
  const expiresLabel = escapeHtml(new Date(expiresAt).toUTCString());

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:20px;padding:32px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;color:#0f766e;text-transform:uppercase;">Smart Nutrition</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">Reset your password</h1>
      <p style="margin:0 0 16px;line-height:1.7;">Hi ${displayName},</p>
      <p style="margin:0 0 20px;line-height:1.7;">We received a request to reset your Smart Nutrition password. Use the secure button below to choose a new password.</p>
      <p style="margin:0 0 20px;">
        <a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#0f766e 0%,#65a30d 100%);color:#ffffff;text-decoration:none;font-weight:700;">Set a new password</a>
      </p>
      <p style="margin:0 0 12px;line-height:1.7;">If the button does not open, copy and paste this link into your browser:</p>
      <p style="margin:0 0 20px;word-break:break-all;line-height:1.7;"><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
      <p style="margin:0 0 12px;line-height:1.7;">This link expires at <strong>${expiresLabel}</strong>.</p>
      <p style="margin:0;line-height:1.7;color:#475569;">If you did not request this reset, you can safely ignore this email.</p>
    </div>
  </body>
</html>`;
};

export const createEmailService = ({ config, logger = console }) => {
  const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;
  const from = config.emailFromAddress
    ? `"${config.emailFromName}" <${config.emailFromAddress}>`
    : null;

  const sendEmail = async ({ to, subject, html, text }) => {
    if (!resend || !from) {
      return {
        ok: false,
        code: "EMAIL_NOT_CONFIGURED",
      };
    }

    try {
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject,
        html,
        text,
      });

      if (error) {
        throw error;
      }

      return {
        ok: true,
        messageId: data?.id ?? null,
      };
    } catch (error) {
      logger.error?.("[email] delivery failed", error);

      return {
        ok: false,
        code: "EMAIL_SEND_FAILED",
      };
    }
  };

  return {
    isConfigured: () => Boolean(resend && from),

    getStatus: () => ({
      configured: Boolean(resend && from),
      provider: "resend",
      fromAddress: config.emailFromAddress ?? null,
      fromName: config.emailFromName,
    }),

    sendPasswordResetEmail: async ({ to, name, resetUrl, expiresAt }) => {
      const result = await sendEmail({
        to,
        subject: buildResetSubject(),
        text: buildResetText({
          appBaseUrl: config.appBaseUrl,
          name,
          resetUrl,
          expiresAt,
        }),
        html: buildResetHtml({
          name,
          resetUrl,
          expiresAt,
        }),
      });

      if (result.ok) {
        logger.info?.(
          `[email] password reset sent to ${to} (${result.messageId ?? "no-message-id"})`
        );
      }

      return result;
    },

    sendRegistrationVerificationEmail: async ({
      to,
      name,
      verificationUrl,
      expiresAt,
    }) => {
      const result = await sendEmail({
        to,
        subject: buildVerificationSubject(),
        text: buildVerificationText({
          appBaseUrl: config.appBaseUrl,
          name,
          verificationUrl,
          expiresAt,
        }),
        html: buildVerificationHtml({ name, verificationUrl, expiresAt }),
      });

      if (result.ok) {
        logger.info?.(
          `[email] registration verification sent to ${to} (${result.messageId ?? "no-message-id"})`
        );
      }

      return result;
    },
  };
};
