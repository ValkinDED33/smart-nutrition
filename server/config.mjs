import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DEFAULT_JWT_SECRET = "smart-nutrition-dev-secret-change-me";
const PUBLIC_FRONTEND_ORIGINS = [
  "https://smart-nutrition-topaz.vercel.app",
  "https://smart-nutrition-git-master-valkindeds-projects.vercel.app",
  "https://smart-nutrition-ibgl50b69-valkindeds-projects.vercel.app",
];
const PUBLIC_FRONTEND_ORIGIN = PUBLIC_FRONTEND_ORIGINS[0];
const LEGACY_FRONTEND_ORIGINS = ["https://smart-nutrition-nine.vercel.app"];
const DEFAULT_SECRET_FILE_DIR = "/etc/secrets";
const LOOPBACK_HOSTNAMES = new Set([
  ["local", "host"].join(""),
  ["127", "0", "0", "1"].join("."),
  "::1",
]);
const SECRET_FILE_ENV_NAMES = [
  "SMART_NUTRITION_JWT_SECRET",
  "SMART_NUTRITION_ASSISTANT_API_KEY",
  "SMART_NUTRITION_OPENROUTER_API_KEY",
  "SMART_NUTRITION_GROQ_API_KEY",
  "SMART_NUTRITION_GOOGLE_API_KEY",
  "SMART_NUTRITION_RESEND_API_KEY",
  "SMART_NUTRITION_DATABASE_URL",
  "SMART_NUTRITION_MONGO_URI",
  "SMART_NUTRITION_MONGODB_URI",
  "SMART_NUTRITION_REDIS_URL",
];

const toTrimmedString = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const readSecretFileValue = (secretFileDir, name) => {
  const secretPath = path.join(secretFileDir, name);

  try {
    if (!existsSync(secretPath)) {
      return null;
    }

    return readFileSync(secretPath, "utf8").trim() || null;
  } catch {
    return null;
  }
};

const hydrateSecretFileEnv = (env) => {
  const hydratedEnv = { ...env };
  const secretFileDir =
    toTrimmedString(env.SMART_NUTRITION_SECRET_FILE_DIR, DEFAULT_SECRET_FILE_DIR) ||
    DEFAULT_SECRET_FILE_DIR;

  SECRET_FILE_ENV_NAMES.forEach((name) => {
    if (toTrimmedString(hydratedEnv[name])) {
      return;
    }

    const secretValue = readSecretFileValue(secretFileDir, name);

    if (secretValue) {
      hydratedEnv[name] = secretValue;
    }
  });

  return hydratedEnv;
};

const normalizeBaseUrl = (value, fallback) =>
  (toTrimmedString(value, fallback) || fallback).replace(/\/+$/, "");

const isLoopbackUrl = (value) => {
  if (!value) {
    return false;
  }

  try {
    return LOOPBACK_HOSTNAMES.has(new URL(value).hostname);
  } catch {
    return false;
  }
};

const normalizeHttpUrl = (value, fallback, name, errors) => {
  const rawValue = toTrimmedString(value, fallback) || fallback;

  try {
    const parsedUrl = new URL(rawValue);

    if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
      return parsedUrl.toString().replace(/\/+$/, "");
    }
  } catch {
    // Fall through to the shared validation error below.
  }

  errors.push(`${name} must be a valid http/https URL.`);
  return fallback;
};

const normalizeRuntimePath = (value, fallback) => {
  const nextValue = toTrimmedString(value, fallback) || fallback;

  if (!nextValue) {
    return nextValue;
  }

  if (nextValue === "/app") {
    return PROJECT_ROOT;
  }

  if (nextValue.startsWith("/app/")) {
    const relativePath = nextValue.slice("/app/".length).replace(/\//g, path.sep);
    return path.join(PROJECT_ROOT, relativePath);
  }

  return nextValue;
};

const normalizeApiPath = (value, fallback = "/chat/completions") => {
  const nextValue = toTrimmedString(value, fallback) || fallback;
  return nextValue.startsWith("/") ? nextValue : `/${nextValue}`;
};

const normalizeOptionalEmail = (value) => {
  const email = toTrimmedString(value).toLowerCase();
  return email || null;
};

const normalizeOrigin = (value) => {
  const nextValue = toTrimmedString(value);

  if (!nextValue) {
    return null;
  }

  try {
    const parsed = new URL(nextValue);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
};

const normalizeCookieSameSite = (value, fallback, warnings) => {
  const normalized = toTrimmedString(value, fallback).toLowerCase();

  if (normalized === "strict") {
    return "Strict";
  }

  if (normalized === "lax") {
    return "Lax";
  }

  if (normalized === "none") {
    return "None";
  }

  warnings.push(
    "SMART_NUTRITION_AUTH_COOKIE_SAME_SITE must be Strict, Lax, or None. Falling back to the default."
  );

  return fallback;
};

const readBooleanFlag = (value, fallback = false) => {
  const normalized = toTrimmedString(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const normalizeStorageProvider = (value, { postgresUrl, mongoUri } = {}) => {
  const normalized = toTrimmedString(value).toLowerCase();

  if (normalized === "postgres" || normalized === "postgresql") {
    return "postgres";
  }

  if (normalized === "mongo" || normalized === "mongodb") {
    return "mongodb";
  }

  if (normalized === "sqlite") {
    return "sqlite";
  }

  if (postgresUrl) {
    return "postgres";
  }

  return mongoUri ? "mongodb" : "sqlite";
};

const normalizeAiDataProvider = (value, mongoUri, { preferMongoUri = false } = {}) => {
  const normalized = toTrimmedString(value).toLowerCase();

  if (normalized === "mongo" || normalized === "mongodb") {
    return "mongodb";
  }

  if (preferMongoUri && mongoUri) {
    return "mongodb";
  }

  if (normalized === "sql" || normalized === "storage" || normalized === "primary") {
    return "primary";
  }

  return mongoUri ? "mongodb" : "primary";
};

const readMongoDatabaseNameFromUri = (mongoUri) => {
  if (!mongoUri) {
    return null;
  }

  try {
    const parsedUrl = new URL(mongoUri);
    const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, "")).trim();
    return databaseName || null;
  } catch {
    return null;
  }
};

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

const assistantProviderLabels = {
  openai: "OpenAI",
  openrouter: "OpenRouter",
  groq: "Groq",
  google: "Google AI Studio",
  custom: "Custom OpenAI-compatible",
};

const assistantProviderDefaultModels = {
  openai: "gpt-4.1-mini",
  openrouter: "openai/gpt-5.4-mini",
  groq: "llama-3.3-70b-versatile",
  google: "gemini-2.5-flash",
};

const getAssistantApiKeyWarning = (providerId, apiKeyName, apiKey) => {
  const normalizedApiKey = toTrimmedString(apiKey);

  if (!normalizedApiKey) {
    return null;
  }

  if (providerId === "openrouter") {
    if (/^sk-or-sk-or-/i.test(normalizedApiKey)) {
      return `${apiKeyName} looks malformed: it starts with "sk-or-sk-or-". Remove the duplicated "sk-or-" prefix.`;
    }

    if (!/^sk-or-/i.test(normalizedApiKey)) {
      return `${apiKeyName} does not look like an OpenRouter key. Expected a value starting with "sk-or-".`;
    }

    return null;
  }

  if (providerId === "groq") {
    if (!/^gsk_/i.test(normalizedApiKey)) {
      return `${apiKeyName} does not look like a Groq key. Expected a value starting with "gsk_".`;
    }

    return null;
  }

  if (providerId === "openai") {
    if (/^sk-or-/i.test(normalizedApiKey)) {
      return `${apiKeyName} looks like an OpenRouter key, but the provider is configured as OpenAI.`;
    }

    if (!/^sk-/i.test(normalizedApiKey)) {
      return `${apiKeyName} does not look like an OpenAI key. Expected a value starting with "sk-".`;
    }

    return null;
  }

  if (providerId === "google" && /^(sk-or-|gsk_|sk-)/i.test(normalizedApiKey)) {
    return `${apiKeyName} looks like a different provider key, but the provider is configured as Google AI Studio.`;
  }

  return null;
};

const normalizeAssistantProviderId = (value) => {
  const normalized = toTrimmedString(value).toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "openrouter") {
    return "openrouter";
  }

  if (normalized === "groq") {
    return "groq";
  }

  if (
    normalized === "google" ||
    normalized === "gemini" ||
    normalized === "google-ai-studio" ||
    normalized === "google_ai_studio"
  ) {
    return "google";
  }

  if (normalized === "openai") {
    return "openai";
  }

  if (normalized === "custom") {
    return "custom";
  }

  return null;
};

const getAssistantProviderLabel = (providerId) =>
  assistantProviderLabels[providerId] ?? assistantProviderLabels.custom;

const defaultAssistantProviderPriority = [
  "openrouter",
  "groq",
  "google",
  "openai",
  "custom",
];

const inferAssistantProviderId = (baseUrl) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl, "https://api.openai.com/v1").toLowerCase();

  if (normalizedBaseUrl.includes("openrouter.ai")) {
    return "openrouter";
  }

  if (normalizedBaseUrl.includes("api.groq.com")) {
    return "groq";
  }

  if (normalizedBaseUrl.includes("generativelanguage.googleapis.com")) {
    return "google";
  }

  if (normalizedBaseUrl.includes("api.openai.com")) {
    return "openai";
  }

  return "custom";
};

const parseAssistantProviderOrder = (value, warnings) => {
  const parsedProviders = [];
  const seenProviders = new Set();

  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const normalizedProviderId = normalizeAssistantProviderId(item);

      if (!normalizedProviderId) {
        warnings.push(
          `Unknown provider "${item}" in SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER. Supported values: openrouter, groq, google, openai, custom.`
        );
        return;
      }

      if (seenProviders.has(normalizedProviderId)) {
        return;
      }

      seenProviders.add(normalizedProviderId);
      parsedProviders.push(normalizedProviderId);
    });

  return parsedProviders;
};

const createAssistantProviderConfig = ({
  providerId,
  apiKey,
  model,
  baseUrl,
  apiPath = "/chat/completions",
  timeoutMs,
  temperature,
  httpReferer = null,
  title = null,
}) => ({
  id: providerId,
  label: getAssistantProviderLabel(providerId),
  apiKey,
  model,
  baseUrl,
  apiPath,
  timeoutMs,
  temperature,
  httpReferer,
  title,
});

const readProviderPair = (
  env,
  errors,
  apiKeyName,
  modelName,
  { defaultModel = null, warnings = null } = {}
) => {
  const apiKey = toTrimmedString(env[apiKeyName]) || null;
  let model = toTrimmedString(env[modelName]) || null;

  if (apiKey && !model && defaultModel) {
    model = defaultModel;
    warnings?.push?.(`${modelName} is not set. Using default model ${defaultModel}.`);
  }

  if (Boolean(apiKey) !== Boolean(model)) {
    errors.push(`${apiKeyName} and ${modelName} must either both be set or both be omitted.`);
  }

  return { apiKey, model };
};

const resolveConfiguredAssistantProviders = (env, errors, warnings) => {
  const configuredProviders = new Map();
  const legacyProviderId = normalizeAssistantProviderId(env.SMART_NUTRITION_AI_PROVIDER);
  const legacyTemperature = readNumberInRange(
    env.SMART_NUTRITION_AI_TEMPERATURE,
    0.4,
    "SMART_NUTRITION_AI_TEMPERATURE",
    errors,
    { min: 0, max: 2 }
  );
  const explicitAssistantProviderId =
    normalizeAssistantProviderId(env.SMART_NUTRITION_ASSISTANT_PROVIDER) ?? null;

  if (
    toTrimmedString(env.SMART_NUTRITION_ASSISTANT_PROVIDER) &&
    !explicitAssistantProviderId
  ) {
    warnings.push(
      "Unknown SMART_NUTRITION_ASSISTANT_PROVIDER value. Falling back to provider inference from SMART_NUTRITION_ASSISTANT_BASE_URL."
    );
  }

  if (toTrimmedString(env.SMART_NUTRITION_AI_PROVIDER) && !legacyProviderId) {
    warnings.push(
      "Unknown SMART_NUTRITION_AI_PROVIDER value. Ignoring legacy provider priority hint."
    );
  } else if (legacyProviderId) {
    warnings.push(
      "Legacy SMART_NUTRITION_AI_PROVIDER detected. Prefer SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER for primary/fallback ordering."
    );
  }

  const explicitAssistantBaseUrl = normalizeBaseUrl(
    env.SMART_NUTRITION_ASSISTANT_BASE_URL,
    "https://api.openai.com/v1"
  );
  const explicitAssistantApiPath = normalizeApiPath(
    env.SMART_NUTRITION_ASSISTANT_API_PATH,
    "/chat/completions"
  );
  const explicitAssistantTemperature = readNumberInRange(
    env.SMART_NUTRITION_ASSISTANT_TEMPERATURE,
    0.4,
    "SMART_NUTRITION_ASSISTANT_TEMPERATURE",
    errors,
    { min: 0, max: 2 }
  );
  const explicitAssistantTimeoutMs = readPositiveInteger(
    env.SMART_NUTRITION_ASSISTANT_TIMEOUT_MS,
    20_000,
    "SMART_NUTRITION_ASSISTANT_TIMEOUT_MS",
    errors,
    { min: 1_000 }
  );
  const explicitProviderId =
    explicitAssistantProviderId ?? inferAssistantProviderId(explicitAssistantBaseUrl);
  const hasProviderSpecificAssistantKey = [
    "SMART_NUTRITION_OPENROUTER_API_KEY",
    "SMART_NUTRITION_GROQ_API_KEY",
    "SMART_NUTRITION_GOOGLE_API_KEY",
  ].some((name) => Boolean(toTrimmedString(env[name])));
  const shouldConsiderExplicitAssistantPair =
    !hasProviderSpecificAssistantKey ||
    Boolean(toTrimmedString(env.SMART_NUTRITION_ASSISTANT_PROVIDER));
  const explicitPair = shouldConsiderExplicitAssistantPair
    ? readProviderPair(
        env,
        errors,
        "SMART_NUTRITION_ASSISTANT_API_KEY",
        "SMART_NUTRITION_ASSISTANT_MODEL",
        {
          defaultModel: assistantProviderDefaultModels[explicitProviderId] ?? null,
          warnings,
        }
      )
    : {
        apiKey: toTrimmedString(env.SMART_NUTRITION_ASSISTANT_API_KEY) || null,
        model: toTrimmedString(env.SMART_NUTRITION_ASSISTANT_MODEL) || null,
      };
  const shouldUseExplicitAssistantPair =
    shouldConsiderExplicitAssistantPair && explicitPair.apiKey && explicitPair.model;

  if (explicitPair.apiKey && !shouldUseExplicitAssistantPair) {
    warnings.push(
      "SMART_NUTRITION_ASSISTANT_API_KEY is ignored because provider-specific assistant API keys are configured."
    );
  }

  if (shouldUseExplicitAssistantPair) {
    const providerId = explicitProviderId;
    const apiKeyWarning = getAssistantApiKeyWarning(
      providerId,
      "SMART_NUTRITION_ASSISTANT_API_KEY",
      explicitPair.apiKey
    );

    if (apiKeyWarning) {
      warnings.push(apiKeyWarning);
    }

    configuredProviders.set(
      providerId,
      createAssistantProviderConfig({
        providerId,
        apiKey: explicitPair.apiKey,
        model: explicitPair.model,
        baseUrl: explicitAssistantBaseUrl,
        apiPath: explicitAssistantApiPath,
        timeoutMs: explicitAssistantTimeoutMs,
        temperature: explicitAssistantTemperature,
        httpReferer:
          providerId === "openrouter"
            ? toTrimmedString(env.SMART_NUTRITION_OPENROUTER_HTTP_REFERER) || null
            : null,
        title:
          providerId === "openrouter"
            ? toTrimmedString(env.SMART_NUTRITION_OPENROUTER_TITLE, "Smart Nutrition") ||
              "Smart Nutrition"
            : null,
      })
    );
  }

  const legacyProviderDefinitions = [
    {
      providerId: "openrouter",
      apiKeyName: "SMART_NUTRITION_OPENROUTER_API_KEY",
      modelName: "SMART_NUTRITION_OPENROUTER_MODEL",
      baseUrlName: "SMART_NUTRITION_OPENROUTER_BASE_URL",
      defaultBaseUrl: "https://openrouter.ai/api/v1",
      defaultModel: assistantProviderDefaultModels.openrouter,
      timeoutName: "SMART_NUTRITION_OPENROUTER_TIMEOUT_MS",
      httpReferer: toTrimmedString(env.SMART_NUTRITION_OPENROUTER_HTTP_REFERER) || null,
      title:
        toTrimmedString(env.SMART_NUTRITION_OPENROUTER_TITLE, "Smart Nutrition") ||
        "Smart Nutrition",
    },
    {
      providerId: "groq",
      apiKeyName: "SMART_NUTRITION_GROQ_API_KEY",
      modelName: "SMART_NUTRITION_GROQ_MODEL",
      baseUrlName: "SMART_NUTRITION_GROQ_BASE_URL",
      defaultBaseUrl: "https://api.groq.com/openai/v1",
      defaultModel: assistantProviderDefaultModels.groq,
      timeoutName: "SMART_NUTRITION_GROQ_TIMEOUT_MS",
      httpReferer: null,
      title: null,
    },
    {
      providerId: "google",
      apiKeyName: "SMART_NUTRITION_GOOGLE_API_KEY",
      modelName: "SMART_NUTRITION_GOOGLE_MODEL",
      baseUrlName: "SMART_NUTRITION_GOOGLE_BASE_URL",
      defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      defaultModel: assistantProviderDefaultModels.google,
      timeoutName: "SMART_NUTRITION_GOOGLE_TIMEOUT_MS",
      httpReferer: null,
      title: null,
    },
  ];

  legacyProviderDefinitions.forEach((definition) => {
    const pair = readProviderPair(env, errors, definition.apiKeyName, definition.modelName, {
      defaultModel: definition.defaultModel,
      warnings,
    });

    if (!pair.apiKey || !pair.model || configuredProviders.has(definition.providerId)) {
      return;
    }

    const apiKeyWarning = getAssistantApiKeyWarning(
      definition.providerId,
      definition.apiKeyName,
      pair.apiKey
    );

    if (apiKeyWarning) {
      warnings.push(apiKeyWarning);
    }

    configuredProviders.set(
      definition.providerId,
      createAssistantProviderConfig({
        providerId: definition.providerId,
        apiKey: pair.apiKey,
        model: pair.model,
        baseUrl: normalizeBaseUrl(env[definition.baseUrlName], definition.defaultBaseUrl),
        timeoutMs: readPositiveInteger(
          env[definition.timeoutName],
          20_000,
          definition.timeoutName,
          errors,
          { min: 1_000 }
        ),
        temperature: legacyTemperature,
        httpReferer: definition.httpReferer,
        title: definition.title,
      })
    );
  });

  const configuredProviderIds = [...configuredProviders.keys()];
  const orderedProviderIds = [];
  const seenProviderIds = new Set();
  const explicitProviderOrder = parseAssistantProviderOrder(
    env.SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER,
    warnings
  );
  const defaultOrderedProviderIds = [
    ...defaultAssistantProviderPriority.filter((providerId) =>
      configuredProviders.has(providerId)
    ),
    ...configuredProviderIds.filter(
      (providerId) => !defaultAssistantProviderPriority.includes(providerId)
    ),
  ];
  const providerOrderHints =
    explicitProviderOrder.length > 0
      ? [...explicitProviderOrder, ...defaultOrderedProviderIds]
      : defaultOrderedProviderIds;

  providerOrderHints.forEach((providerId) => {
    if (!providerId || seenProviderIds.has(providerId) || !configuredProviders.has(providerId)) {
      return;
    }

    seenProviderIds.add(providerId);
    orderedProviderIds.push(providerId);
  });

  return orderedProviderIds.map((providerId) => configuredProviders.get(providerId));
};

const readNumberInRange = (value, fallback, name, errors, { min = 0, max = 1 } = {}) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    errors.push(`${name} must be a number between ${min} and ${max}.`);
    return fallback;
  }

  return parsed;
};

const resolveAllowedCorsOrigins = (envValue, appBaseUrl, warnings, { isProduction }) => {
  const configuredOrigins = String(envValue ?? "")
    .split(",")
    .map((value) => normalizeOrigin(value))
    .filter((value) => Boolean(value));
  const appOrigin = normalizeOrigin(appBaseUrl);
  const shouldIncludePublicFrontendOrigin =
    isProduction &&
    (PUBLIC_FRONTEND_ORIGINS.includes(appOrigin) ||
      PUBLIC_FRONTEND_ORIGINS.some((origin) => configuredOrigins.includes(origin)) ||
      LEGACY_FRONTEND_ORIGINS.some(
        (origin) => origin === appOrigin || configuredOrigins.includes(origin)
      ));
  const includePublicFrontendOrigin = (origins) =>
    shouldIncludePublicFrontendOrigin
      ? [...new Set([...origins, ...PUBLIC_FRONTEND_ORIGINS])]
      : [...new Set(origins)];

  if (String(envValue ?? "").trim()) {
    const rawOrigins = String(envValue)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (configuredOrigins.length !== rawOrigins.length) {
      warnings.push(
        "SMART_NUTRITION_CORS_ORIGINS contains one or more invalid origins. Only valid http/https origins are used."
      );
    }
  }

  if (configuredOrigins.length > 0) {
    return includePublicFrontendOrigin(configuredOrigins);
  }

  return includePublicFrontendOrigin(appOrigin ? [appOrigin] : []);
};

export const createServerConfig = (rawEnv = process.env) => {
  const env = hydrateSecretFileEnv(rawEnv);
  const errors = [];
  const warnings = [];
  const nodeEnv = toTrimmedString(env.NODE_ENV, "development") || "development";
  const isProduction = nodeEnv === "production";

  const port = readPositiveInteger(
    env.SMART_NUTRITION_API_PORT ?? env.PORT,
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
  const passwordResetTokenTtlMs = readPositiveInteger(
    env.SMART_NUTRITION_PASSWORD_RESET_TTL_MS,
    1000 * 60 * 60,
    "SMART_NUTRITION_PASSWORD_RESET_TTL_MS",
    errors,
    { min: 60_000 }
  );
  const registrationVerificationTokenTtlMs = readPositiveInteger(
    env.SMART_NUTRITION_REGISTRATION_VERIFICATION_TTL_MS,
    1000 * 60 * 15,
    "SMART_NUTRITION_REGISTRATION_VERIFICATION_TTL_MS",
    errors,
    { min: 60_000 }
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
  const authRateLimitWindowMs = readPositiveInteger(
    env.SMART_NUTRITION_AUTH_RATE_LIMIT_WINDOW_MS,
    60_000,
    "SMART_NUTRITION_AUTH_RATE_LIMIT_WINDOW_MS",
    errors
  );
  const authRateLimitMax = readPositiveInteger(
    env.SMART_NUTRITION_AUTH_RATE_LIMIT_MAX,
    10,
    "SMART_NUTRITION_AUTH_RATE_LIMIT_MAX",
    errors
  );
  const authRegisterRateLimitMax = readPositiveInteger(
    env.SMART_NUTRITION_AUTH_REGISTER_RATE_LIMIT_MAX,
    5,
    "SMART_NUTRITION_AUTH_REGISTER_RATE_LIMIT_MAX",
    errors
  );
  const authLoginRateLimitMax = readPositiveInteger(
    env.SMART_NUTRITION_AUTH_LOGIN_RATE_LIMIT_MAX,
    10,
    "SMART_NUTRITION_AUTH_LOGIN_RATE_LIMIT_MAX",
    errors
  );
  const authForgotPasswordRateLimitMax = readPositiveInteger(
    env.SMART_NUTRITION_AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX,
    5,
    "SMART_NUTRITION_AUTH_FORGOT_PASSWORD_RATE_LIMIT_MAX",
    errors
  );
  const authVerifyEmailRateLimitMax = readPositiveInteger(
    env.SMART_NUTRITION_AUTH_VERIFY_EMAIL_RATE_LIMIT_MAX,
    5,
    "SMART_NUTRITION_AUTH_VERIFY_EMAIL_RATE_LIMIT_MAX",
    errors
  );
  const tokenCleanupIntervalMs = readPositiveInteger(
    env.SMART_NUTRITION_TOKEN_CLEANUP_INTERVAL_MS,
    86_400_000,
    "SMART_NUTRITION_TOKEN_CLEANUP_INTERVAL_MS",
    errors,
    { min: 60_000 }
  );
  const redisUrl = toTrimmedString(env.SMART_NUTRITION_REDIS_URL ?? env.REDIS_URL) || null;
  const redisKeyPrefix =
    toTrimmedString(env.SMART_NUTRITION_REDIS_KEY_PREFIX, "smart-nutrition") ||
    "smart-nutrition";
  const redisConnectTimeoutMs = readPositiveInteger(
    env.SMART_NUTRITION_REDIS_CONNECT_TIMEOUT_MS,
    5_000,
    "SMART_NUTRITION_REDIS_CONNECT_TIMEOUT_MS",
    errors,
    { min: 500 }
  );
  const catalogCacheTtlSeconds = readPositiveInteger(
    env.SMART_NUTRITION_CATALOG_CACHE_TTL_SECONDS,
    60,
    "SMART_NUTRITION_CATALOG_CACHE_TTL_SECONDS",
    errors,
    { min: 1 }
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
    normalizeRuntimePath(env.SMART_NUTRITION_STATIC_DIR, path.join(PROJECT_ROOT, "dist"));
  const sqlitePath =
    normalizeRuntimePath(
      env.SMART_NUTRITION_DB_PATH,
      path.join(DATA_DIR, "smart-nutrition.sqlite")
    );
  const postgresUrl =
    toTrimmedString(
      env.SMART_NUTRITION_DATABASE_URL ?? env.DATABASE_URL ?? env.POSTGRES_URL
    ) || null;
  const explicitMongoUri = toTrimmedString(env.SMART_NUTRITION_MONGO_URI) || null;
  const mongoUri =
    explicitMongoUri ||
    toTrimmedString(env.SMART_NUTRITION_MONGODB_URI ?? env.MONGODB_URI) ||
    null;
  const mongoDatabaseName =
    toTrimmedString(env.SMART_NUTRITION_MONGODB_DB) ||
    readMongoDatabaseNameFromUri(mongoUri) ||
    "smart_nutrition";
  const databaseProvider = normalizeStorageProvider(
    env.SMART_NUTRITION_DATABASE_PROVIDER ?? env.SMART_NUTRITION_DB_PROVIDER,
    { postgresUrl, mongoUri }
  );
  const postgresSsl = readBooleanFlag(
    env.SMART_NUTRITION_DATABASE_SSL,
    isProduction && Boolean(postgresUrl) && !isLoopbackUrl(postgresUrl)
  );

  if (databaseProvider === "postgres" && !postgresUrl) {
    errors.push(
      "SMART_NUTRITION_DATABASE_URL or DATABASE_URL is required when SMART_NUTRITION_DATABASE_PROVIDER=postgres."
    );
  }

  if (databaseProvider === "mongodb" && !mongoUri) {
    errors.push(
      "SMART_NUTRITION_MONGO_URI, SMART_NUTRITION_MONGODB_URI, or MONGODB_URI is required when SMART_NUTRITION_DATABASE_PROVIDER=mongodb."
    );
  }

  const backupDir =
    normalizeRuntimePath(
      env.SMART_NUTRITION_BACKUP_DIR,
      path.join(DATA_DIR, "backups")
    );
  const superAdminEmail = normalizeOptionalEmail(env.SMART_NUTRITION_SUPER_ADMIN_EMAIL);
  const productSubmissionDailyLimit = readPositiveInteger(
    env.SMART_NUTRITION_PRODUCT_SUBMISSION_DAILY_LIMIT,
    12,
    "SMART_NUTRITION_PRODUCT_SUBMISSION_DAILY_LIMIT",
    errors
  );
  const defaultAppBaseUrl = PUBLIC_FRONTEND_ORIGIN;
  const appBaseUrl = normalizeBaseUrl(
    env.SMART_NUTRITION_APP_BASE_URL,
    defaultAppBaseUrl
  );
  const authCookieSameSite = normalizeCookieSameSite(
    env.SMART_NUTRITION_AUTH_COOKIE_SAME_SITE,
    isProduction ? "None" : "Lax",
    warnings
  );
  const authCookieSecure = readBooleanFlag(
    env.SMART_NUTRITION_AUTH_COOKIE_SECURE,
    isProduction
  );

  if (authCookieSameSite === "None" && !authCookieSecure) {
    errors.push(
      "SMART_NUTRITION_AUTH_COOKIE_SECURE must be true when SMART_NUTRITION_AUTH_COOKIE_SAME_SITE=None."
    );
  }

  const allowedCorsOrigins = resolveAllowedCorsOrigins(
    env.SMART_NUTRITION_CORS_ORIGINS,
    appBaseUrl,
    warnings,
    { isProduction }
  );
  const resendApiKey = toTrimmedString(env.SMART_NUTRITION_RESEND_API_KEY) || null;
  const emailFromAddress =
    normalizeOptionalEmail(env.SMART_NUTRITION_EMAIL_FROM_ADDRESS) ??
    normalizeOptionalEmail(env.SMART_NUTRITION_EMAIL_FROM) ??
    null;
  const emailFromName =
    toTrimmedString(env.SMART_NUTRITION_EMAIL_FROM_NAME, "Smart Nutrition") ||
    "Smart Nutrition";

  if (resendApiKey && !emailFromAddress) {
    warnings.push(
      "Email delivery is configured without SMART_NUTRITION_EMAIL_FROM_ADDRESS."
    );
  }

  const emailTransportConfigured = Boolean(emailFromAddress && resendApiKey);
  const explicitAssistantApiKey =
    toTrimmedString(env.SMART_NUTRITION_ASSISTANT_API_KEY) || null;
  const explicitAssistantModel =
    toTrimmedString(env.SMART_NUTRITION_ASSISTANT_MODEL) || null;
  const assistantProviders = resolveConfiguredAssistantProviders(env, errors, warnings);
  const primaryAssistantProvider = assistantProviders[0] ?? null;
  const assistantApiKey = primaryAssistantProvider?.apiKey ?? explicitAssistantApiKey ?? null;
  const assistantModel = primaryAssistantProvider?.model ?? explicitAssistantModel ?? null;
  const assistantBaseUrl =
    primaryAssistantProvider?.baseUrl ??
    normalizeBaseUrl(env.SMART_NUTRITION_ASSISTANT_BASE_URL, "https://api.openai.com/v1");
  const assistantApiPath =
    primaryAssistantProvider?.apiPath ??
    normalizeApiPath(env.SMART_NUTRITION_ASSISTANT_API_PATH, "/chat/completions");
  const assistantTemperature =
    primaryAssistantProvider?.temperature ??
    readNumberInRange(
      env.SMART_NUTRITION_ASSISTANT_TEMPERATURE,
      0.4,
      "SMART_NUTRITION_ASSISTANT_TEMPERATURE",
      errors,
      { min: 0, max: 2 }
    );
  const assistantMemoryMessageLimit = readPositiveInteger(
    env.SMART_NUTRITION_ASSISTANT_MEMORY_LIMIT,
    16,
    "SMART_NUTRITION_ASSISTANT_MEMORY_LIMIT",
    errors,
    { min: 4 }
  );
  const assistantTimeoutMs =
    primaryAssistantProvider?.timeoutMs ??
    readPositiveInteger(
      env.SMART_NUTRITION_ASSISTANT_TIMEOUT_MS,
      20_000,
      "SMART_NUTRITION_ASSISTANT_TIMEOUT_MS",
      errors,
      { min: 1_000 }
    );
  const assistantRetryCooldownMs = readPositiveInteger(
    env.SMART_NUTRITION_ASSISTANT_RETRY_COOLDOWN_MS,
    1000 * 60 * 5,
    "SMART_NUTRITION_ASSISTANT_RETRY_COOLDOWN_MS",
    errors,
    { min: 1_000 }
  );
  const aiRateLimitWindowMs = readPositiveInteger(
    env.SMART_NUTRITION_AI_RATE_LIMIT_WINDOW_MS,
    60_000,
    "SMART_NUTRITION_AI_RATE_LIMIT_WINDOW_MS",
    errors
  );
  const aiRateLimitMax = readPositiveInteger(
    env.SMART_NUTRITION_AI_RATE_LIMIT_MAX,
    20,
    "SMART_NUTRITION_AI_RATE_LIMIT_MAX",
    errors
  );
  const aiDailyRequestLimit = readPositiveInteger(
    env.SMART_NUTRITION_AI_DAILY_REQUEST_LIMIT,
    40,
    "SMART_NUTRITION_AI_DAILY_REQUEST_LIMIT",
    errors
  );
  const aiMonthlyRequestLimit = readPositiveInteger(
    env.SMART_NUTRITION_AI_MONTHLY_REQUEST_LIMIT,
    600,
    "SMART_NUTRITION_AI_MONTHLY_REQUEST_LIMIT",
    errors
  );
  const aiDailyTokenLimit = readPositiveInteger(
    env.SMART_NUTRITION_AI_DAILY_TOKEN_LIMIT,
    60_000,
    "SMART_NUTRITION_AI_DAILY_TOKEN_LIMIT",
    errors
  );
  const aiMonthlyTokenLimit = readPositiveInteger(
    env.SMART_NUTRITION_AI_MONTHLY_TOKEN_LIMIT,
    800_000,
    "SMART_NUTRITION_AI_MONTHLY_TOKEN_LIMIT",
    errors
  );
  const aiRequestCooldownMs = readPositiveInteger(
    env.SMART_NUTRITION_AI_REQUEST_COOLDOWN_MS,
    6_000,
    "SMART_NUTRITION_AI_REQUEST_COOLDOWN_MS",
    errors
  );
  const aiEstimatedUsdPer1kTokens = readNumberInRange(
    env.SMART_NUTRITION_AI_ESTIMATED_USD_PER_1K_TOKENS,
    0.002,
    "SMART_NUTRITION_AI_ESTIMATED_USD_PER_1K_TOKENS",
    errors,
    { min: 0, max: 100 }
  );
  const mongoServerSelectionTimeoutMs = readPositiveInteger(
    env.SMART_NUTRITION_MONGODB_TIMEOUT_MS,
    5_000,
    "SMART_NUTRITION_MONGODB_TIMEOUT_MS",
    errors,
    { min: 500 }
  );
  const mongoConnectRetries = readPositiveInteger(
    env.SMART_NUTRITION_MONGODB_CONNECT_RETRIES,
    3,
    "SMART_NUTRITION_MONGODB_CONNECT_RETRIES",
    errors,
    { min: 1 }
  );
  const mongoConnectRetryDelayMs = readPositiveInteger(
    env.SMART_NUTRITION_MONGODB_CONNECT_RETRY_DELAY_MS,
    1_000,
    "SMART_NUTRITION_MONGODB_CONNECT_RETRY_DELAY_MS",
    errors,
    { min: 100 }
  );
  const mongoConnectTimeoutMs = readPositiveInteger(
    env.SMART_NUTRITION_MONGODB_CONNECT_TIMEOUT_MS,
    10_000,
    "SMART_NUTRITION_MONGODB_CONNECT_TIMEOUT_MS",
    errors,
    { min: 500 }
  );
  const mongoSocketTimeoutMs = readPositiveInteger(
    env.SMART_NUTRITION_MONGODB_SOCKET_TIMEOUT_MS,
    45_000,
    "SMART_NUTRITION_MONGODB_SOCKET_TIMEOUT_MS",
    errors,
    { min: 1_000 }
  );
  const mongoMinPoolSize = readPositiveInteger(
    env.SMART_NUTRITION_MONGODB_MIN_POOL_SIZE,
    0,
    "SMART_NUTRITION_MONGODB_MIN_POOL_SIZE",
    errors,
    { min: 0 }
  );
  const mongoMaxPoolSize = readPositiveInteger(
    env.SMART_NUTRITION_MONGODB_MAX_POOL_SIZE,
    20,
    "SMART_NUTRITION_MONGODB_MAX_POOL_SIZE",
    errors,
    { min: 1 }
  );

  if (mongoMinPoolSize > mongoMaxPoolSize) {
    errors.push(
      "SMART_NUTRITION_MONGODB_MIN_POOL_SIZE must be less than or equal to SMART_NUTRITION_MONGODB_MAX_POOL_SIZE."
    );
  }

  const aiDataProvider = normalizeAiDataProvider(
    env.SMART_NUTRITION_AI_DATA_PROVIDER,
    mongoUri,
    { preferMongoUri: Boolean(explicitMongoUri) }
  );

  if (aiDataProvider === "mongodb" && !mongoUri) {
    errors.push(
      "SMART_NUTRITION_MONGO_URI, SMART_NUTRITION_MONGODB_URI, or MONGODB_URI is required when SMART_NUTRITION_AI_DATA_PROVIDER=mongodb."
    );
  }

  const assistantRuntimeConfigured = assistantProviders.length > 0;

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
    passwordResetTokenTtlMs,
    maxLoginAttempts: 5,
    loginLockMs: 1000 * 60 * 5,
    passwordIterations,
    registrationVerificationTokenTtlMs,
    bodyLimitBytes,
    dataDir: DATA_DIR,
    databaseProvider,
    sqlitePath,
    postgresUrl,
    postgresSsl,
    legacyJsonPath: path.join(DATA_DIR, "db.json"),
    jwtSecret,
    superAdminEmail,
    productSubmissionDailyLimit,
    backupDir,
    backupIntervalMs,
    maxBackupFilesPerUser,
    requestLimitWindowMs,
    requestLimitMax,
    authRateLimitWindowMs,
    authRateLimitMax,
    authRateLimits: {
      register: authRegisterRateLimitMax,
      login: authLoginRateLimitMax,
      forgotPassword: authForgotPasswordRateLimitMax,
      verifyEmail: authVerifyEmailRateLimitMax,
    },
    tokenCleanupIntervalMs,
    redisUrl,
    redisKeyPrefix,
    redisConnectTimeoutMs,
    redisEnabled: Boolean(redisUrl),
    catalogCacheTtlSeconds,
    authAccessCookieName: "smart-nutrition-access",
    authRefreshCookieName: "smart-nutrition-refresh",
    authCookieSameSite,
    authCookieSecure,
    appBaseUrl,
    allowedCorsOrigins,
    emailFromAddress,
    emailFromName,
    resendApiKey,
    emailTransportConfigured,
    assistantApiKey,
    assistantModel,
    assistantBaseUrl,
    assistantApiPath,
    assistantTemperature,
    assistantMemoryMessageLimit,
    assistantTimeoutMs,
    assistantRetryCooldownMs,
    aiRateLimitWindowMs,
    aiRateLimitMax,
    aiDailyRequestLimit,
    aiMonthlyRequestLimit,
    aiDailyTokenLimit,
    aiMonthlyTokenLimit,
    aiRequestCooldownMs,
    aiEstimatedUsdPer1kTokens,
    aiDataProvider,
    mongoUri,
    mongoDatabaseName,
    mongoServerSelectionTimeoutMs,
    mongoConnectRetries,
    mongoConnectRetryDelayMs,
    mongoConnectTimeoutMs,
    mongoSocketTimeoutMs,
    mongoMinPoolSize,
    mongoMaxPoolSize,
    mongoAiEnabled: aiDataProvider === "mongodb" && Boolean(mongoUri),
    assistantRuntimeConfigured,
    assistantProviderOrder: assistantProviders.map((provider) => provider.id),
    assistantPrimaryProviderId: primaryAssistantProvider?.id ?? null,
    assistantProviders,
    serveStatic,
    staticDir,
  };
};

export const serverConfig = createServerConfig(process.env);
