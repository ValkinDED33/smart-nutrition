import { createServerConfig } from "./config.mjs";

const statusIcon = (ok) => (ok ? "OK " : "ERR");

const createCheck = ({ id, label, ok, detail, required = true }) => ({
  id,
  label,
  ok: Boolean(ok),
  detail,
  required,
});

const printCheck = (check) => {
  const marker = statusIcon(check.ok);
  const requirement = check.required ? "required" : "recommended";
  console.log(`${marker} ${check.label} (${requirement})`);

  if (check.detail) {
    console.log(`    ${check.detail}`);
  }
};

const run = () => {
  let config;

  try {
    config = createServerConfig(process.env);
  } catch (error) {
    console.error("ERR Smart Nutrition production config is invalid.");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const checks = [
    createCheck({
      id: "node-env",
      label: "NODE_ENV=production",
      ok: config.isProduction,
      detail: `Current NODE_ENV: ${config.nodeEnv}`,
    }),
    createCheck({
      id: "jwt-secret",
      label: "JWT secret is production-ready",
      ok: config.jwtSecret.length >= 32,
      detail: "SMART_NUTRITION_JWT_SECRET must be unique and at least 32 characters.",
    }),
    createCheck({
      id: "cors",
      label: "Frontend origin is allowed by CORS",
      ok: config.allowedCorsOrigins.length > 0,
      detail: `Allowed origins: ${config.allowedCorsOrigins.join(", ") || "-"}`,
    }),
    createCheck({
      id: "cookies",
      label: "Auth cookies match cross-site production mode",
      ok:
        config.authCookieSameSite !== "None" ||
        (config.authCookieSameSite === "None" && config.authCookieSecure),
      detail: `SameSite=${config.authCookieSameSite}, Secure=${config.authCookieSecure}`,
    }),
    createCheck({
      id: "database",
      label: "Database path is configured",
      ok: Boolean(config.sqlitePath),
      detail: `SMART_NUTRITION_DB_PATH: ${config.sqlitePath}`,
    }),
    createCheck({
      id: "backups",
      label: "Backup directory is configured",
      ok: Boolean(config.backupDir) && config.backupIntervalMs > 0,
      detail: `Backups: ${config.backupDir}, interval ${Math.round(
        config.backupIntervalMs / 60000
      )} min, max ${config.maxBackupFilesPerUser} per user`,
    }),
    createCheck({
      id: "health",
      label: "/api/health is enabled",
      ok: true,
      detail: "Render live check path: /api/health",
    }),
    createCheck({
      id: "email",
      label: "Email delivery is configured",
      ok: config.emailTransportConfigured,
      detail: config.emailTransportConfigured
        ? `From: ${config.emailFromName} <${config.emailFromAddress}>`
        : "SMTP env must be configured so production password reset emails can be delivered.",
      required: true,
    }),
    createCheck({
      id: "assistant",
      label: "AI assistant runtime is configured",
      ok: config.assistantRuntimeConfigured,
      detail: config.assistantRuntimeConfigured
        ? `Providers: ${config.assistantProviderOrder.join(", ")}`
        : "Set SMART_NUTRITION_ASSISTANT_API_KEY and SMART_NUTRITION_ASSISTANT_MODEL.",
      required: false,
    }),
  ];

  console.log("Smart Nutrition production readiness");
  console.log("------------------------------------");
  checks.forEach(printCheck);

  if (config.warnings.length > 0) {
    console.log("");
    console.log("Warnings");
    config.warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  const failedRequired = checks.filter((check) => check.required && !check.ok);

  console.log("");
  if (failedRequired.length === 0) {
    console.log("OK Required production checks passed.");
  } else {
    console.log(
      `ERR ${failedRequired.length} required production check(s) failed: ${failedRequired
        .map((check) => check.id)
        .join(", ")}`
    );
    process.exitCode = 1;
  }
};

run();
