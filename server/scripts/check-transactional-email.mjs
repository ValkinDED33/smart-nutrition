import { createEmailService } from "../services/emailService.mjs";
import { createServerConfig } from "../config.mjs";

const config = createServerConfig(process.env);
const emailService = createEmailService({
  config,
  logger: {
    error: () => {},
    info: () => {},
  },
});
const status = emailService.getStatus();

if (status.configured) {
  const providers = Object.entries(status.providers ?? {})
    .filter(([, enabled]) => enabled)
    .map(([provider]) => provider)
    .join(", ");

  console.log("Transactional email delivery is configured.");
  console.log(`Provider: ${status.provider}`);
  console.log(`Available providers: ${providers || status.provider}`);
  console.log(`From: ${status.fromName} <${status.fromAddress}>`);
  process.exit(0);
}

console.error("Transactional email delivery is not configured yet.");
console.error(
  "Set SMART_NUTRITION_EMAIL_FROM_ADDRESS plus SMART_NUTRITION_BREVO_API_KEY or SMART_NUTRITION_RESEND_API_KEY."
);
process.exit(1);
