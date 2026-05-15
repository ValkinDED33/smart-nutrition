import { createServerConfig } from "./config.mjs";
import { POSTGRES_SCHEMA_VERSION } from "./storage/postgres.mjs";

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

const isLocalDatabaseUrl = (databaseUrl) => {
  if (!databaseUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(databaseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
  } catch {
    return false;
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
      label: "PostgreSQL production database is configured",
      ok: config.databaseProvider === "postgres" && Boolean(config.postgresUrl),
      detail:
        config.databaseProvider === "postgres"
          ? `PostgreSQL provider enabled, schema version ${POSTGRES_SCHEMA_VERSION}`
          : `Current provider: ${config.databaseProvider}. Use SMART_NUTRITION_DATABASE_PROVIDER=postgres for production.`,
    }),
    createCheck({
      id: "postgres-ssl",
      label: "PostgreSQL SSL is enabled for remote production databases",
      ok:
        config.databaseProvider !== "postgres" ||
        !config.postgresUrl ||
        isLocalDatabaseUrl(config.postgresUrl) ||
        config.postgresSsl,
      detail: `SSL=${config.postgresSsl}, local=${isLocalDatabaseUrl(config.postgresUrl)}`,
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
      id: "super-admin-seed",
      label: "Super admin bootstrap email is configured",
      ok: Boolean(config.superAdminEmail),
      detail: config.superAdminEmail
        ? `Bootstrap email: ${config.superAdminEmail}`
        : "Set SMART_NUTRITION_SUPER_ADMIN_EMAIL so the first matching registered account becomes SUPER_ADMIN.",
      required: false,
    }),
    createCheck({
      id: "mango-sms",
      label: "MANGO OFFICE SMS delivery is configured",
      ok: config.mangoSmsConfigured,
      detail: config.mangoSmsConfigured
        ? `Endpoint: ${config.mangoSmsEndpoint}, extension: ${config.mangoFromExtension}`
        : "Set SMART_NUTRITION_MANGO_API_KEY and SMART_NUTRITION_MANGO_API_SALT to enable SMS verification.",
      required: false,
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
    createCheck({
      id: "mongodb-ai",
      label: "MongoDB Atlas AI data store is configured",
      ok: config.mongoAiEnabled,
      detail: config.mongoAiEnabled
        ? `Database: ${config.mongoDatabaseName}, max pool size: ${config.mongoMaxPoolSize}`
        : "Set SMART_NUTRITION_MONGO_URI to persist assistant messages and AI usage events in MongoDB Atlas.",
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
