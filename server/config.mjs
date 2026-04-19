import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DEFAULT_JWT_SECRET = "smart-nutrition-dev-secret-change-me";

const toTrimmedString = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const normalizeBaseUrl = (value, fallback) =>
  (toTrimmedString(value, fallback) || fallback).replace(/\/+$/, "");

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

const readProviderPair = (env, errors, apiKeyName, modelName) => {
  const apiKey = toTrimmedString(env[apiKeyName]) || null;
  const model = toTrimmedString(env[modelName]) || null;

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

  const explicitPair = readProviderPair(
    env,
    errors,
    "SMART_NUTRITION_ASSISTANT_API_KEY",
    "SMART_NUTRITION_ASSISTANT_MODEL"
  );
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

  if (explicitPair.apiKey && explicitPair.model) {
    const providerId =
      explicitAssistantProviderId ?? inferAssistantProviderId(explicitAssistantBaseUrl);
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
      timeoutName: "SMART_NUTRITION_GOOGLE_TIMEOUT_MS",
      httpReferer: null,
      title: null,
    },
  ];

  legacyProviderDefinitions.forEach((definition) => {
    const pair = readProviderPair(env, errors, definition.apiKeyName, definition.modelName);

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
  const providerOrderHints = [
    ...parseAssistantProviderOrder(env.SMART_NUTRITION_ASSISTANT_PROVIDER_ORDER, warnings),
    explicitPair.apiKey && explicitPair.model
      ? explicitAssistantProviderId ?? inferAssistantProviderId(explicitAssistantBaseUrl)
      : null,
    legacyProviderId,
    ...configuredProviderIds,
  ];

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
    normalizeRuntimePath(env.SMART_NUTRITION_STATIC_DIR, path.join(PROJECT_ROOT, "dist"));
  const sqlitePath =
    normalizeRuntimePath(
      env.SMART_NUTRITION_DB_PATH,
      path.join(DATA_DIR, "smart-nutrition.sqlite")
    );
  const superAdminEmail = normalizeOptionalEmail(env.SMART_NUTRITION_SUPER_ADMIN_EMAIL);
  const productSubmissionDailyLimit = readPositiveInteger(
    env.SMART_NUTRITION_PRODUCT_SUBMISSION_DAILY_LIMIT,
    12,
    "SMART_NUTRITION_PRODUCT_SUBMISSION_DAILY_LIMIT",
    errors
  );
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
    maxLoginAttempts: 5,
    loginLockMs: 1000 * 60 * 5,
    passwordIterations,
    bodyLimitBytes,
    dataDir: DATA_DIR,
    sqlitePath,
    legacyJsonPath: path.join(DATA_DIR, "db.json"),
    jwtSecret,
    superAdminEmail,
    productSubmissionDailyLimit,
    backupDir: path.join(DATA_DIR, "backups"),
    backupIntervalMs,
    maxBackupFilesPerUser,
    requestLimitWindowMs,
    requestLimitMax,
    assistantApiKey,
    assistantModel,
    assistantBaseUrl,
    assistantApiPath,
    assistantTemperature,
    assistantMemoryMessageLimit,
    assistantTimeoutMs,
    assistantRetryCooldownMs,
    assistantRuntimeConfigured,
    assistantProviderOrder: assistantProviders.map((provider) => provider.id),
    assistantPrimaryProviderId: primaryAssistantProvider?.id ?? null,
    assistantProviders,
    serveStatic,
    staticDir,
  };
};

export const serverConfig = createServerConfig(process.env);
