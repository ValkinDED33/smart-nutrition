import { createEmailService } from "../services/emailService.mjs";
import { createServerConfig } from "../config.mjs";

const config = createServerConfig(process.env);
const testRecipient = String(process.env.SMART_NUTRITION_EMAIL_CHECK_TO ?? "").trim();
const emailService = createEmailService({
  config,
  logger: {
    error: () => {},
    info: () => {},
    warn: () => {},
  },
});
const status = emailService.getStatus();

if (!status.configured) {
  console.error("Transactional email delivery is not configured yet.");
  console.error(
    "Set SMART_NUTRITION_EMAIL_FROM_ADDRESS plus SMART_NUTRITION_BREVO_API_KEY or SMART_NUTRITION_RESEND_API_KEY."
  );
  process.exit(1);
}

const providers = Object.entries(status.providers ?? {})
  .filter(([, enabled]) => enabled)
  .map(([provider]) => provider)
  .join(", ");

console.log("Transactional email delivery is configured.");
console.log(`Provider: ${status.provider}`);
console.log(`Available providers: ${providers || status.provider}`);
console.log(`From: ${status.fromName} <${status.fromAddress}>`);

if (!testRecipient) {
  console.log(
    "Real delivery was not tested. Set SMART_NUTRITION_EMAIL_CHECK_TO to send one verification smoke email."
  );
  process.exit(0);
}

const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
const verificationUrl = new URL("/verify-email", config.appBaseUrl);
verificationUrl.searchParams.set("token", "email-check-smoke-token");

const result = await emailService.sendRegistrationVerificationEmail({
  to: testRecipient,
  name: "Smart Nutrition smoke check",
  verificationUrl: verificationUrl.toString(),
  expiresAt,
});

if (result.ok) {
  const providers = Object.entries(status.providers ?? {})
    .filter(([, enabled]) => enabled)
    .map(([provider]) => provider)
    .join(", ");

  console.log("Transactional email real delivery smoke passed.");
  console.log(`Recipient: ${testRecipient}`);
  console.log(`Provider order: ${providers || status.provider}`);
  console.log(`Message id: ${result.messageId ?? "not returned by provider"}`);
  process.exit(0);
}

console.error("Transactional email real delivery smoke failed.");
console.error(`Recipient: ${testRecipient}`);
console.error(`Provider: ${result.provider ?? status.provider}`);
console.error(`Code: ${result.code ?? "EMAIL_SEND_FAILED"}`);
process.exit(1);
