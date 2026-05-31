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
  console.log("Resend email delivery is configured.");
  console.log(`Provider: ${status.provider}`);
  console.log(`From: ${status.fromName} <${status.fromAddress}>`);
  process.exit(0);
}

console.error("Resend email delivery is not configured yet.");
console.error("Set SMART_NUTRITION_RESEND_API_KEY and SMART_NUTRITION_EMAIL_FROM_ADDRESS.");
process.exit(1);
