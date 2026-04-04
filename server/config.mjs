import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DEFAULT_JWT_SECRET = "smart-nutrition-dev-secret-change-me";

const toTrimmedString = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const readPositiveInteger = (value, fallback, name, errors, { min = 1 } = {}) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min) {
    errors.push(`${name} must be an integer >= ${min}.`);
    return fallback;
  }

  return parsed;
};

export const createServerConfig = (env = process.env) => {
  const errors = [];
  const warnings = [];
  const nodeEnv = toTrimmedString(env.NODE_ENV, "development") || "development";
  const isProduction = nodeEnv === "production";

  const port = readPositiveInteger(
    env.SMART_NUTRITION_API_PORT,
    8787,
    "SMART_NUTRITION_API_PORT",
    errors
  );
  const accessTokenTtlMs = readPositiveInteger(
    env.SMART_NUTRITION_ACCESS_TTL_MS,
    1000 * 60 * 15,
    "SMART_NUTRITION_ACCESS_TTL_MS",
    errors
  );
  const refreshTokenTtlMs = readPositiveInteger(
    env.SMART_NUTRITION_REFRESH_TTL_MS,
    1000 * 60 * 60 * 24 * 7,
    "SMART_NUTRITION_REFRESH_TTL_MS",
    errors
  );
  const backupIntervalMs = readPositiveInteger(
    env.SMART_NUTRITION_BACKUP_INTERVAL_MS,
    1000 * 60 * 10,
    "SMART_NUTRITION_BACKUP_INTERVAL_MS",
    errors
  );
  const maxBackupFilesPerUser = readPositiveInteger(
    env.SMART_NUTRITION_MAX_BACKUPS,
    24,
    "SMART_NUTRITION_MAX_BACKUPS",
    errors
  );
  const requestLimitWindowMs = readPositiveInteger(
    env.SMART_NUTRITION_RATE_LIMIT_WINDOW_MS,
    60_000,
    "SMART_NUTRITION_RATE_LIMIT_WINDOW_MS",
    errors
  );
  const requestLimitMax = readPositiveInteger(
    env.SMART_NUTRITION_RATE_LIMIT_MAX,
    180,
    "SMART_NUTRITION_RATE_LIMIT_MAX",
    errors
  );
  const passwordIterations = readPositiveInteger(
    env.SMART_NUTRITION_PASSWORD_ITERATIONS,
    180_000,
    "SMART_NUTRITION_PASSWORD_ITERATIONS",
    errors,
    { min: 100_000 }
  );
  const bodyLimitBytes = readPositiveInteger(
    env.SMART_NUTRITION_BODY_LIMIT_BYTES,
    5 * 1024 * 1024,
    "SMART_NUTRITION_BODY_LIMIT_BYTES",
    errors
  );

  if (refreshTokenTtlMs <= accessTokenTtlMs) {
    errors.push(
      "SMART_NUTRITION_REFRESH_TTL_MS must be greater than SMART_NUTRITION_ACCESS_TTL_MS."
    );
  }

  const jwtSecret = toTrimmedString(
    env.SMART_NUTRITION_JWT_SECRET,
    DEFAULT_JWT_SECRET
  ) || DEFAULT_JWT_SECRET;

  if (jwtSecret === DEFAULT_JWT_SECRET) {
    if (isProduction) {
      errors.push(
        "SMART_NUTRITION_JWT_SECRET must be explicitly set in production and must not use the default development secret."
      );
    } else {
      warnings.push(
        "SMART_NUTRITION_JWT_SECRET is using the default development secret. Set a custom secret before sharing the backend."
      );
    }
  }

  if (isProduction && jwtSecret.length < 32) {
    errors.push("SMART_NUTRITION_JWT_SECRET must be at least 32 characters long in production.");
  }

  if (port > 65_535) {
    errors.push("SMART_NUTRITION_API_PORT must be <= 65535.");
  }

  const serveStatic =
    toTrimmedString(env.SMART_NUTRITION_SERVE_STATIC, "true").toLowerCase() !== "false";
  const staticDir =
    toTrimmedString(env.SMART_NUTRITION_STATIC_DIR) || path.join(PROJECT_ROOT, "dist");
  const sqlitePath =
    toTrimmedString(env.SMART_NUTRITION_DB_PATH) || path.join(DATA_DIR, "smart-nutrition.sqlite");

  if (errors.length > 0) {
    throw new Error(`Invalid Smart Nutrition server config:\n- ${errors.join("\n- ")}`);
  }

  return {
    nodeEnv,
    isProduction,
    warnings,
    projectRoot: PROJECT_ROOT,
    port,
    accessTokenTtlMs,
    refreshTokenTtlMs,
    maxLoginAttempts: 5,
    loginLockMs: 1000 * 60 * 5,
    passwordIterations,
    bodyLimitBytes,
    dataDir: DATA_DIR,
    sqlitePath,
    legacyJsonPath: path.join(DATA_DIR, "db.json"),
    jwtSecret,
    backupDir: path.join(DATA_DIR, "backups"),
    backupIntervalMs,
    maxBackupFilesPerUser,
    requestLimitWindowMs,
    requestLimitMax,
    serveStatic,
    staticDir,
  };
};

export const serverConfig = createServerConfig(process.env);
