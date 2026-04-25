import nodemailer from "nodemailer";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const createTransport = (config) => {
  if (!config.emailTransportConfigured) {
    return null;
  }

  if (config.smtpUrl) {
    return nodemailer.createTransport(config.smtpUrl);
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth:
      config.smtpUser && config.smtpPass
        ? {
            user: config.smtpUser,
            pass: config.smtpPass,
          }
        : undefined,
  });
};

const buildResetSubject = () => "Reset your Smart Nutrition password";

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
  const transporter = createTransport(config);
  const from = config.emailFromAddress
    ? `"${config.emailFromName}" <${config.emailFromAddress}>`
    : null;

  return {
    isConfigured: () => Boolean(transporter && from),

    getStatus: () => ({
      configured: Boolean(transporter && from),
      fromAddress: config.emailFromAddress ?? null,
      fromName: config.emailFromName,
    }),

    sendPasswordResetEmail: async ({ to, name, resetUrl, expiresAt }) => {
      if (!transporter || !from) {
        return {
          ok: false,
          code: "EMAIL_NOT_CONFIGURED",
        };
      }

      try {
        const info = await transporter.sendMail({
          from,
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

        logger.info?.(
          `[email] password reset sent to ${to} (${info.messageId ?? "no-message-id"})`
        );

        return {
          ok: true,
          messageId: info.messageId ?? null,
        };
      } catch (error) {
        logger.error?.("[email] password reset delivery failed", error);

        return {
          ok: false,
          code: "EMAIL_SEND_FAILED",
        };
      }
    },
  };
};
