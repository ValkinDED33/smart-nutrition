import { Resend } from "resend";

const RESEND_PROVIDER = "resend";
const BREVO_PROVIDER = "brevo";
const BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";
const MAX_EMAIL_ATTEMPTS = 3;
const EMAIL_RETRY_DELAYS_MS = [300, 900, 1800];
const EMAIL_PROVIDER_TIMEOUT_MS = 8000;
const TRANSIENT_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const NON_RETRY_PROVIDER_CODES = new Set(["daily_quota_exceeded"]);
const TRANSIENT_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "EHOSTUNREACH",
  "ENETDOWN",
  "ENETRESET",
  "ENETUNREACH",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildResetSubject = () => "Reset your Smart Nutrition password";

const buildVerificationSubject = () => "Confirm your Smart Nutrition email";

const buildPartnerInviteSubject = () => "Join your Smart Nutrition family space";

const sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const createTimeoutSignal = (timeoutMs) => {
  const numericTimeoutMs = Number(timeoutMs);

  if (
    !Number.isFinite(numericTimeoutMs) ||
    numericTimeoutMs <= 0 ||
    typeof AbortController === "undefined"
  ) {
    return {
      signal: undefined,
      cancel: () => {},
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, numericTimeoutMs);

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeout),
  };
};

const readProviderErrorStatus = (error) => {
  const status = error?.statusCode ?? error?.status;
  const numericStatus = Number(status);

  return Number.isFinite(numericStatus) ? numericStatus : null;
};

const readProviderErrorCode = (error) => {
  const code = error?.code ?? error?.name;
  const value = String(code ?? "").trim();

  return value || null;
};

const readProviderErrorMessage = (error) => {
  if (typeof error === "string") {
    const directValue = error.replace(/\s+/g, " ").trim();

    return directValue ? directValue.slice(0, 240) : null;
  }

  const message = error?.message ?? error?.error ?? error?.detail;
  const value = String(message ?? "").replace(/\s+/g, " ").trim();

  return value ? value.slice(0, 240) : null;
};

const isTransientProviderError = (error) => {
  const code = readProviderErrorCode(error);

  if (code && NON_RETRY_PROVIDER_CODES.has(code)) {
    return false;
  }

  const status = readProviderErrorStatus(error);

  if (status) {
    return TRANSIENT_STATUS_CODES.has(status) || status >= 500;
  }

  if (code && TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }

  return error instanceof Error;
};

const toSafeProviderErrorDetails = (error, provider = RESEND_PROVIDER) => ({
  provider,
  status: readProviderErrorStatus(error),
  code: readProviderErrorCode(error),
  message: readProviderErrorMessage(error),
  transient: isTransientProviderError(error),
});

const readJsonProviderError = async (response) => {
  try {
    const payload = await response.json();
    return {
      code: readProviderErrorMessage(payload?.code),
      message: readProviderErrorMessage(payload?.message ?? payload?.error),
    };
  } catch {
    return {
      code: null,
      message: readProviderErrorMessage(response.statusText),
    };
  }
};

const createProviderHttpError = ({ provider, response, code, message }) => {
  const error = new Error(message || `${provider} email delivery failed`);
  error.status = response.status;
  error.statusCode = response.status;
  error.code = code || `${provider.toUpperCase()}_${response.status}`;
  return error;
};

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

const buildPartnerInviteText = ({
  appBaseUrl,
  inviterName,
  inviteUrl,
  code,
  expiresAt,
}) => {
  const displayName = String(inviterName ?? "").trim() || "Someone close to you";

  return [
    `Hi,`,
    "",
    `${displayName} invited you to connect as a partner in Smart Nutrition.`,
    "",
    "Use this secure link:",
    inviteUrl,
    "",
    `Or enter this code in the app: ${code}`,
    "",
    "The partner view shares only pregnancy timeline and baby development context. Food, weight, notes, and private profile data are not shared.",
    `This invitation expires at ${new Date(expiresAt).toUTCString()}.`,
    "",
    `App: ${appBaseUrl}`,
  ].join("\n");
};

const buildPartnerInviteHtml = ({ inviterName, inviteUrl, code, expiresAt }) => {
  const displayName = escapeHtml(String(inviterName ?? "").trim() || "Someone close to you");
  const safeUrl = escapeHtml(inviteUrl);
  const safeCode = escapeHtml(code);
  const expiresLabel = escapeHtml(new Date(expiresAt).toUTCString());

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(15,23,42,0.08);border-radius:20px;padding:32px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.08em;color:#0f766e;text-transform:uppercase;">Smart Nutrition</p>
      <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">Family wellness invitation</h1>
      <p style="margin:0 0 16px;line-height:1.7;">${displayName} invited you to connect as a partner.</p>
      <p style="margin:0 0 20px;line-height:1.7;">The partner view shares only pregnancy timeline and baby development context. Food, weight, notes, and private profile data are not shared.</p>
      <p style="margin:0 0 20px;">
        <a href="${safeUrl}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:linear-gradient(135deg,#0f766e 0%,#65a30d 100%);color:#ffffff;text-decoration:none;font-weight:700;">Join family space</a>
      </p>
      <p style="margin:0 0 12px;line-height:1.7;">Or enter this code in Smart Nutrition:</p>
      <p style="margin:0 0 20px;font-size:24px;font-weight:800;letter-spacing:0.08em;">${safeCode}</p>
      <p style="margin:0 0 12px;line-height:1.7;">If the button does not open, copy and paste this link into your browser:</p>
      <p style="margin:0 0 20px;word-break:break-all;line-height:1.7;"><a href="${safeUrl}" style="color:#2563eb;">${safeUrl}</a></p>
      <p style="margin:0;line-height:1.7;color:#475569;">This invitation expires at <strong>${expiresLabel}</strong>.</p>
    </div>
  </body>
</html>`;
};

export const createEmailService = ({
  config,
  logger = console,
  resendClient = null,
  fetchImpl = globalThis.fetch,
  retryDelaysMs = EMAIL_RETRY_DELAYS_MS,
  providerTimeoutMs = EMAIL_PROVIDER_TIMEOUT_MS,
  wait = sleep,
} = {}) => {
  const resend = resendClient ?? (config.resendApiKey ? new Resend(config.resendApiKey) : null);
  const brevoApiKey = String(config.brevoApiKey ?? "").trim();
  const brevo = brevoApiKey && fetchImpl ? { apiKey: brevoApiKey } : null;
  const from = config.emailFromAddress
    ? `"${config.emailFromName}" <${config.emailFromAddress}>`
    : null;
  const maxAttempts = MAX_EMAIL_ATTEMPTS;

  const sendWithResend = async ({ to, subject, html, text }) => {
    if (!resend) {
      return {
        ok: false,
        code: "RESEND_NOT_CONFIGURED",
      };
    }

    let lastError = null;
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attemptsUsed = attempt;

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
          attempts: attempt,
        };
      } catch (error) {
        lastError = error;
        const details = {
          ...toSafeProviderErrorDetails(error, RESEND_PROVIDER),
          attempt,
          maxAttempts,
          willRetry: attempt < maxAttempts && isTransientProviderError(error),
        };

        logger.error?.("[email] delivery attempt failed", details);

        if (!details.willRetry) {
          break;
        }

        await wait(retryDelaysMs[attempt - 1] ?? retryDelaysMs.at(-1) ?? 0);
      }
    }

    logger.error?.("[email] delivery failed", {
      ...toSafeProviderErrorDetails(lastError, RESEND_PROVIDER),
      attempts: attemptsUsed,
    });

    return {
      ok: false,
      code: "EMAIL_SEND_FAILED",
      attempts: attemptsUsed,
    };
  };

  const sendWithBrevo = async ({ to, subject, html, text }) => {
    if (!brevo) {
      return {
        ok: false,
        code: "BREVO_NOT_CONFIGURED",
      };
    }

    let lastError = null;
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attemptsUsed = attempt;
      const timeoutSignal = createTimeoutSignal(providerTimeoutMs);

      try {
        const response = await fetchImpl(BREVO_TRANSACTIONAL_EMAIL_URL, {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": brevo.apiKey,
            "Content-Type": "application/json",
          },
          signal: timeoutSignal.signal,
          body: JSON.stringify({
            sender: {
              email: config.emailFromAddress,
              name: config.emailFromName,
            },
            to: [{ email: to }],
            subject,
            htmlContent: html,
            textContent: text,
          }),
        });

        if (!response.ok) {
          const providerError = await readJsonProviderError(response);
          throw createProviderHttpError({
            provider: BREVO_PROVIDER,
            response,
            code: providerError.code,
            message: providerError.message,
          });
        }

        const payload = await response.json().catch(() => ({}));

        return {
          ok: true,
          provider: BREVO_PROVIDER,
          messageId: payload?.messageId ?? payload?.messageIds?.[0] ?? null,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error;
        const details = {
          ...toSafeProviderErrorDetails(error, BREVO_PROVIDER),
          attempt,
          maxAttempts,
          willRetry: attempt < maxAttempts && isTransientProviderError(error),
        };

        logger.error?.("[email] brevo delivery attempt failed", details);

        if (!details.willRetry) {
          break;
        }

        await wait(retryDelaysMs[attempt - 1] ?? retryDelaysMs.at(-1) ?? 0);
      } finally {
        timeoutSignal.cancel();
      }
    }

    logger.error?.("[email] brevo delivery failed", {
      ...toSafeProviderErrorDetails(lastError, BREVO_PROVIDER),
      attempts: attemptsUsed,
    });

    return {
      ok: false,
      code: "BREVO_SEND_FAILED",
      provider: BREVO_PROVIDER,
      attempts: attemptsUsed,
    };
  };

  const sendEmail = async ({ to, subject, html, text }) => {
    if (!from || (!resend && !brevo)) {
      return {
        ok: false,
        code: "EMAIL_NOT_CONFIGURED",
      };
    }

    if (brevo) {
      const brevoResult = await sendWithBrevo({ to, subject, html, text });

      if (brevoResult.ok || !resend) {
        return brevoResult;
      }

      logger.warn?.("[email] falling back to resend transactional delivery", {
        provider: RESEND_PROVIDER,
        previousProvider: BREVO_PROVIDER,
        previousCode: brevoResult.code,
      });
    }

    return sendWithResend({ to, subject, html, text });
  };

  return {
    isConfigured: () => Boolean(from && (resend || brevo)),

    getStatus: () => ({
      configured: Boolean(from && (resend || brevo)),
      provider: brevo ? BREVO_PROVIDER : RESEND_PROVIDER,
      providers: {
        brevo: Boolean(brevo),
        resend: Boolean(resend),
      },
      fromAddress: config.emailFromAddress || null,
      fromName: config.emailFromName,
      retryEnabled: true,
      maxAttempts,
      providerTimeoutMs,
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

    sendPartnerInviteEmail: async ({ to, inviterName, inviteUrl, code, expiresAt }) => {
      const result = await sendEmail({
        to,
        subject: buildPartnerInviteSubject(),
        text: buildPartnerInviteText({
          appBaseUrl: config.appBaseUrl,
          inviterName,
          inviteUrl,
          code,
          expiresAt,
        }),
        html: buildPartnerInviteHtml({ inviterName, inviteUrl, code, expiresAt }),
      });

      if (result.ok) {
        logger.info?.(
          `[email] partner invite sent to ${to} (${result.messageId ?? "no-message-id"})`
        );
      }

      return result;
    },
  };
};
