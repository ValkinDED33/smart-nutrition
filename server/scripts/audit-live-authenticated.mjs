import {
  describeCorsResponse,
  describeDeploymentDriftHint,
  describeHealthResponse,
  hasExposedRequestId,
  isRenderCloudHealth,
} from "./liveAuditDiagnostics.mjs";

const defaultApiUrl = "https://smart-nutrition-sk5r.onrender.com";
const defaultAppOrigin = "https://smart-nutrition.club";
const requestTimeoutMs = 18_000;

const requiredEnvNames = [
  "SMART_NUTRITION_LIVE_SMOKE_EMAIL",
  "SMART_NUTRITION_LIVE_SMOKE_PASSWORD",
];
const registrationSmokeEnvNames = [
  "SMART_NUTRITION_LIVE_REGISTRATION_EMAIL",
  "SMART_NUTRITION_LIVE_REGISTRATION_PASSWORD",
  "SMART_NUTRITION_LIVE_REGISTRATION_NAME",
  "SMART_NUTRITION_LIVE_OWNER_EMAIL",
  "SMART_NUTRITION_LIVE_OWNER_PASSWORD",
];

const apiOrigin = String(
  process.env.SMART_NUTRITION_LIVE_API_URL ||
    process.env.SMART_NUTRITION_LIVE_BASE_URL ||
    defaultApiUrl
).replace(/\/+$/, "");
const normalizeOrigin = (value) => String(value || "").replace(/\/+$/, "");
const readOriginList = (value, fallback) => {
  const origins = String(value || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  return [...new Set(origins.length > 0 ? origins : fallback)];
};
const appOrigin = normalizeOrigin(
  process.env.SMART_NUTRITION_LIVE_APP_URL || defaultAppOrigin
);
const trustedAppOrigins = readOriginList(
  process.env.SMART_NUTRITION_LIVE_APP_ORIGINS,
  [appOrigin, "https://www.smart-nutrition.club"]
);
const smokeEmail = String(process.env.SMART_NUTRITION_LIVE_SMOKE_EMAIL || "").trim();
const smokePassword = String(process.env.SMART_NUTRITION_LIVE_SMOKE_PASSWORD || "");
const registrationSmokeEmail = String(
  process.env.SMART_NUTRITION_LIVE_REGISTRATION_EMAIL || ""
).trim();
const registrationSmokePassword = String(
  process.env.SMART_NUTRITION_LIVE_REGISTRATION_PASSWORD || ""
);
const registrationSmokeName = String(
  process.env.SMART_NUTRITION_LIVE_REGISTRATION_NAME || ""
).trim();
const ownerEmail = String(process.env.SMART_NUTRITION_LIVE_OWNER_EMAIL || "").trim();
const ownerPassword = String(process.env.SMART_NUTRITION_LIVE_OWNER_PASSWORD || "");
const smokeDeviceId = `live-smoke-${Date.now().toString(36)}`;
let smokeRequestSequence = 0;

const checks = [];
const cookies = new Map();
const ownerCookies = new Map();
const cleanup = [];
let authenticatedUser = null;

const addCheck = (label, pass, detail) => {
  checks.push({ label, pass, detail });
};

const failConfiguration = () => {
  const missing = requiredEnvNames.filter((name) => !process.env[name]);
  addCheck(
    "live authenticated smoke configuration is complete",
    false,
    `Missing required env: ${missing.join(", ")}`
  );
  console.error("Smart Nutrition authenticated live audit cannot run.");
  console.error(`Missing required env: ${missing.join(", ")}`);
  console.error(
    "Use a dedicated verified smoke account. Do not use personal/admin passwords in committed files."
  );
  process.exitCode = 1;
};

const isRegistrationSmokeRequested = () => Boolean(registrationSmokeEmail);

const failRegistrationSmokeConfiguration = () => {
  const missing = registrationSmokeEnvNames.filter((name) => !process.env[name]);
  addCheck(
    "live registration smoke configuration is complete",
    false,
    `Missing required env: ${missing.join(", ")}`
  );
  console.error("Smart Nutrition registration live smoke cannot run safely.");
  console.error(`Missing required env: ${missing.join(", ")}`);
  console.error(
    "Registration smoke requires a dedicated test email plus owner credentials for cleanup."
  );
  process.exitCode = 1;
};

const assertSafeRegistrationSmokeEmail = () => {
  const normalized = registrationSmokeEmail.toLowerCase();
  const isSafe =
    normalized.includes("+smoke@") ||
    normalized.includes("+live-smoke@") ||
    normalized.includes("+codex-smoke@") ||
    normalized.startsWith("smart-nutrition-smoke");

  if (!isSafe) {
    addCheck(
      "live registration smoke email is disposable",
      false,
      "Registration smoke email must be clearly disposable before owner cleanup can run."
    );
    console.error("Smart Nutrition registration live smoke refused to run.");
    console.error(
      "SMART_NUTRITION_LIVE_REGISTRATION_EMAIL must be a clearly disposable smoke/test address."
    );
    console.error(
      "Use an address with +smoke, +live-smoke, +codex-smoke, or a smart-nutrition-smoke prefix."
    );
    process.exitCode = 1;
    return false;
  }

  return true;
};

const joinUrl = (pathname) =>
  `${apiOrigin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

const getCookieHeader = (cookieJar = cookies) =>
  [...cookieJar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");

const splitSetCookieHeader = (value) => {
  if (!value) {
    return [];
  }

  return value.split(/,(?=\s*[^;,=\s]+=[^;,]*)/g);
};

const getResponseSetCookies = (response) =>
  typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : splitSetCookieHeader(response.headers.get("set-cookie"));

const storeResponseCookies = (response, cookieJar = cookies) => {
  const setCookieValues = getResponseSetCookies(response);

  for (const setCookie of setCookieValues) {
    const [pair] = String(setCookie).split(";");
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    if (value) {
      cookieJar.set(name, value);
    } else {
      cookieJar.delete(name);
    }
  }

  return setCookieValues;
};

const getStoredSetCookies = (response) =>
  Array.isArray(response?.smartNutritionSetCookies)
    ? response.smartNutritionSetCookies
    : [];

const hasCookieAttribute = (setCookie, attribute) =>
  String(setCookie).split(";").some((part) => part.trim().toLowerCase() === attribute);

const hasCookieAttributePrefix = (setCookie, attributePrefix) =>
  String(setCookie)
    .split(";")
    .some((part) => part.trim().toLowerCase().startsWith(attributePrefix));

const assertCorsHeaders = ({ label, response, expectedOrigin = appOrigin }) => {
  const allowOrigin = response.headers.get("access-control-allow-origin");
  const allowCredentials = response.headers.get("access-control-allow-credentials");
  const exposeHeaders = String(
    response.headers.get("access-control-expose-headers") ?? ""
  ).toLowerCase();
  const pass =
    allowOrigin === expectedOrigin &&
    allowCredentials === "true" &&
    exposeHeaders.includes("x-request-id");

  addCheck(
    label,
    pass,
    pass
      ? `Credentialed CORS is enabled for ${expectedOrigin} and exposes request-id diagnostics.`
      : `Expected ACAO=${expectedOrigin}, ACAC=true, and ACEH including x-request-id; got ACAO=${allowOrigin ?? "none"} ACAC=${allowCredentials ?? "none"} ACEH=${exposeHeaders || "none"}.`
  );
};

const assertAuthCookieSet = ({ label, response }) => {
  const setCookies = getStoredSetCookies(response);
  const accessCookie = setCookies.find((value) =>
    String(value).startsWith("smart-nutrition-access=")
  );
  const refreshCookie = setCookies.find((value) =>
    String(value).startsWith("smart-nutrition-refresh=")
  );
  const requiredCookies = [accessCookie, refreshCookie].filter(Boolean);
  const browserCompatible =
    Boolean(accessCookie) &&
    Boolean(refreshCookie) &&
    requiredCookies.every(
      (setCookie) =>
        hasCookieAttribute(setCookie, "httponly") &&
        hasCookieAttribute(setCookie, "secure") &&
        hasCookieAttribute(setCookie, "path=/") &&
        hasCookieAttribute(setCookie, "samesite=none") &&
        hasCookieAttributePrefix(setCookie, "max-age=")
    );

  addCheck(
    label,
    browserCompatible,
    browserCompatible
      ? "Auth response set access and refresh cookies with HttpOnly, Secure, SameSite=None, Path=/, and Max-Age."
      : `Auth cookies are not browser-compatible enough. Set-Cookie count=${setCookies.length}.`
  );
};

const fetchWithTimeout = async (pathname, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const {
    cookieJar = cookies,
    withSyncContext = false,
    origin = appOrigin,
    headers: optionHeaders,
    ...fetchOptions
  } = options;
  const headers = new Headers(optionHeaders);

  headers.set("Accept", "application/json");
  headers.set("Origin", origin);
  headers.set(
    "X-Request-Id",
    `sn-live-${Date.now().toString(36)}-${++smokeRequestSequence}`
  );

  if (fetchOptions.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const cookieHeader = getCookieHeader(cookieJar);

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  if (withSyncContext) {
    headers.set("X-Device-Id", smokeDeviceId);
  }

  try {
    const response = await fetch(joinUrl(pathname), {
      redirect: "manual",
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    const setCookieValues = storeResponseCookies(response, cookieJar);
    Object.defineProperty(response, "smartNutritionSetCookies", {
      value: setCookieValues,
      enumerable: false,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const readJson = async (response) => {
  const body = await response.text();

  if (!body.trim()) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const requestJson = async (pathname, options = {}) => {
  const response = await fetchWithTimeout(pathname, options);
  const data = await readJson(response);
  return { pathname, response, data };
};

const loginWithCredentials = async ({ email, password, cookieJar }) =>
  requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    cookieJar,
  });

const findUserByEmailFromAdmin = async (email) => {
  const list = await requestJson("/api/admin/users", {
    method: "GET",
    cookieJar: ownerCookies,
  });

  if (!list.response.ok || !Array.isArray(list.data?.items)) {
    addCheck(
      "live registration smoke owner user list is available",
      false,
      describeFailureResponse(list)
    );
    return null;
  }

  return list.data.items.find(
    (item) => String(item?.email ?? "").toLowerCase() === email.toLowerCase()
  ) ?? null;
};

const deleteRegistrationSmokeUserIfPresent = async (email, reason) => {
  const user = await findUserByEmailFromAdmin(email);

  if (!user?.id) {
    return false;
  }

  const result = await requestJson(`/api/admin/users/${encodeURIComponent(user.id)}`, {
    method: "DELETE",
    cookieJar: ownerCookies,
  });

  addCheck(
    `live registration smoke cleanup ${reason}`,
    result.response.status === 204,
    result.response.status === 204
      ? `Deleted disposable smoke user ${email}.`
      : describeFailureResponse(result)
  );

  return result.response.status === 204;
};

const describeFailureResponse = ({ pathname, response, data }) => {
  const details = [
    `endpoint=${pathname}`,
    `http=${response?.status ?? "unknown"}`,
  ];

  if (data?.code) {
    details.push(`code=${String(data.code).slice(0, 80)}`);
  }

  if (data?.message) {
    details.push(`message=${String(data.message).slice(0, 180)}`);
  }

  if (data?.diagnostics?.syncStage) {
    details.push(`stage=${String(data.diagnostics.syncStage).slice(0, 80)}`);
  }

  if (data?.diagnostics?.reasonCode) {
    details.push(`reason=${String(data.diagnostics.reasonCode).slice(0, 80)}`);
  }

  if (data?.requestId || data?.diagnostics?.requestId) {
    details.push(
      `requestId=${String(data.requestId ?? data.diagnostics.requestId).slice(0, 80)}`
    );
  }

  return details.join(" · ");
};

const assertResponse = ({ label, pathname, response, data, predicate, detail }) => {
  const pass = response.ok && predicate(data);

  addCheck(
    label,
    pass,
    pass ? detail : `${detail} (${describeFailureResponse({ pathname, response, data })})`
  );
};

const verifyBackendDeploymentFingerprint = async () => {
  for (const trustedOrigin of trustedAppOrigins) {
    const result = await requestJson("/api/health", {
      method: "GET",
      origin: trustedOrigin,
    });

    addCheck(
      `live auth backend deployment fingerprint is current for ${trustedOrigin}`,
      result.response.ok &&
        isRenderCloudHealth(result.data) &&
        result.response.headers.get("access-control-allow-origin") === trustedOrigin &&
        result.response.headers.get("access-control-allow-credentials") === "true" &&
        hasExposedRequestId(result.response),
      `/api/health must expose the same safe Render deployment fingerprint and browser-readable request-id diagnostics required by public live audit before authenticated smoke can prove auth for ${trustedOrigin}. (${describeHealthResponse(
        result
      )})${describeDeploymentDriftHint(result)}`
    );
  }
};

const verifyBrowserAuthProtocol = async () => {
  for (const trustedOrigin of trustedAppOrigins) {
    const preflight = await fetchWithTimeout("/api/auth/profile-state", {
      method: "OPTIONS",
      origin: trustedOrigin,
      headers: {
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers":
          "Content-Type, X-Device-Id, X-State-Version, X-Request-Id",
      },
    });
    const allowHeaders = String(
      preflight.headers.get("access-control-allow-headers") ?? ""
    ).toLowerCase();
    const allowMethods = String(
      preflight.headers.get("access-control-allow-methods") ?? ""
    ).toUpperCase();

    addCheck(
      `live auth profile-state CORS preflight supports ${trustedOrigin}`,
      preflight.status === 204 &&
        preflight.headers.get("access-control-allow-origin") === trustedOrigin &&
        preflight.headers.get("access-control-allow-credentials") === "true" &&
        allowMethods.includes("PATCH") &&
        allowHeaders.includes("content-type") &&
        allowHeaders.includes("x-device-id") &&
        allowHeaders.includes("x-state-version") &&
        allowHeaders.includes("x-request-id"),
      `/api/auth/profile-state OPTIONS must allow PATCH, credentials, sync headers, and request-id diagnostics for ${trustedOrigin}. (${describeCorsResponse(
        preflight
      )})`
    );
  }
};

const verifyRegistrationPreflightAndCleanup = async () => {
  if (!isRegistrationSmokeRequested()) {
    return;
  }

  const hasRegistrationSmokeConfiguration = registrationSmokeEnvNames.every(
    (name) => process.env[name]
  );

  if (!hasRegistrationSmokeConfiguration) {
    failRegistrationSmokeConfiguration();
    return;
  }

  if (!assertSafeRegistrationSmokeEmail()) {
    return;
  }

  const ownerLogin = await loginWithCredentials({
    email: ownerEmail,
    password: ownerPassword,
    cookieJar: ownerCookies,
  });

  assertResponse({
    label: "live registration smoke owner login returns cookie session",
    ...ownerLogin,
    predicate: (data) =>
      Boolean(data?.user?.id) &&
      ["OWNER", "SUPER_ADMIN"].includes(String(data.user.role ?? "").toUpperCase()) &&
      ownerCookies.has("smart-nutrition-access") &&
      ownerCookies.has("smart-nutrition-refresh"),
    detail:
      "Registration smoke cleanup needs an owner session and must not use personal credentials in code.",
  });

  if (!ownerLogin.response.ok) {
    return;
  }

  await deleteRegistrationSmokeUserIfPresent(registrationSmokeEmail, "before register");

  const availabilityBefore = await requestJson("/api/auth/availability", {
    method: "POST",
    body: JSON.stringify({
      email: registrationSmokeEmail,
      name: registrationSmokeName,
    }),
  });

  assertResponse({
    label: "live registration smoke availability starts clean",
    ...availabilityBefore,
    predicate: (data) => data?.email?.available === true && data?.name?.available === true,
    detail:
      "/api/auth/availability must confirm disposable registration email and nickname are free before register.",
  });

  const registered = await requestJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: registrationSmokeEmail,
      password: registrationSmokePassword,
      name: registrationSmokeName,
      languagePreference: "en",
      themePreference: "dark",
    }),
  });

  assertResponse({
    label: "live registration smoke creates pending verified-by-email account",
    ...registered,
    predicate: (data) =>
      data?.ok === true &&
      data?.requiresVerification === true &&
      data?.email === registrationSmokeEmail &&
      data?.delivery === "email" &&
      !JSON.stringify(data).toLowerCase().includes("token"),
    detail:
      "/api/auth/register must create the user, send verification email through backend, and never expose verification tokens.",
  });

  const resend = await requestJson("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email: registrationSmokeEmail }),
  });

  assertResponse({
    label: "live registration smoke resend verification works",
    ...resend,
    predicate: (data) =>
      data?.ok === true &&
      data?.requiresVerification === true &&
      data?.email === registrationSmokeEmail &&
      data?.delivery === "email",
    detail:
      "/api/auth/resend-verification must work for the pending smoke user without revealing tokens.",
  });

  await deleteRegistrationSmokeUserIfPresent(registrationSmokeEmail, "after register");

  const availabilityAfter = await requestJson("/api/auth/availability", {
    method: "POST",
    body: JSON.stringify({
      email: registrationSmokeEmail,
      name: registrationSmokeName,
    }),
  });

  assertResponse({
    label: "live registration smoke cleanup restores availability",
    ...availabilityAfter,
    predicate: (data) => data?.email?.available === true && data?.name?.available === true,
    detail:
      "After owner cleanup, the disposable smoke email and nickname must be available again.",
  });
};

const login = async () => {
  const result = await loginWithCredentials({
    email: smokeEmail,
    password: smokePassword,
    cookieJar: cookies,
  });

  assertResponse({
    label: "live authenticated login returns cookie session",
    ...result,
    predicate: (data) =>
      Boolean(data?.user?.id) &&
      Boolean(data?.snapshot) &&
      cookies.has("smart-nutrition-access") &&
      cookies.has("smart-nutrition-refresh") &&
      !JSON.stringify(data).includes("refreshToken"),
    detail:
      "/api/auth/login must authenticate a verified smoke account through httpOnly cookie session JSON without raw refresh tokens.",
  });
  assertCorsHeaders({
    label: "live authenticated login exposes credentialed CORS headers",
    response: result.response,
  });
  assertAuthCookieSet({
    label: "live authenticated login sets browser-compatible auth cookies",
    response: result.response,
  });

  if (result.response.ok && result.data?.user) {
    authenticatedUser = result.data.user;
  }
};

const verifySessionRestore = async () => {
  const result = await requestJson("/api/auth/session", { method: "GET" });

  assertResponse({
    label: "live authenticated session restores from cookies",
    ...result,
    predicate: (data) => Boolean(data?.user?.id) && Boolean(data?.snapshot),
    detail:
      "/api/auth/session must restore authenticated user and snapshot from cookies after login.",
  });
};

const verifyStateRead = async () => {
  const result = await requestJson("/api/state", { method: "GET" });

  assertResponse({
    label: "live authenticated state snapshot is available",
    ...result,
    predicate: (data) =>
      data &&
      typeof data === "object" &&
      "profile" in data &&
      "meal" in data &&
      "water" in data,
    detail:
      "/api/state must return recoverable profile, meal, and water state for the smoke account.",
  });

  return result;
};

const verifyProfileStateMutationAndRestore = async () => {
  const before = await verifyStateRead();

  if (!before.response.ok || !before.data?.profile || !authenticatedUser) {
    addCheck(
      "live profile-state mutation was skipped because baseline state is unavailable",
      false,
      "/api/auth/profile-state smoke needs a logged-in user and baseline profile snapshot."
    );
    return;
  }

  const profile = before.data.profile;
  const nextProfile = {
    ...profile,
    notificationsEnabled: !Boolean(profile.notificationsEnabled),
  };
  const baseVersion =
    typeof before.data.updatedAt === "string" && before.data.updatedAt
      ? before.data.updatedAt
      : null;
  const mutationHeaders = new Headers();

  if (baseVersion) {
    mutationHeaders.set("X-State-Version", baseVersion);
  }

  const result = await requestJson("/api/auth/profile-state", {
    method: "PATCH",
    body: JSON.stringify({
      user: authenticatedUser,
      profile: nextProfile,
    }),
    headers: mutationHeaders,
    withSyncContext: true,
  });

  assertResponse({
    label: "live profile-state save is backend-confirmed",
    ...result,
    predicate: (data) =>
      data?.ok === true &&
      data?.user?.id === authenticatedUser?.id &&
      data?.profile?.notificationsEnabled === nextProfile.notificationsEnabled &&
      typeof data?.meta?.updatedAt === "string",
    detail:
      "/api/auth/profile-state must atomically confirm the user/profile save and return canonical profile plus cloud meta.",
  });
  assertCorsHeaders({
    label: "live profile-state save exposes credentialed request diagnostics",
    response: result.response,
  });

  if (result.response.ok) {
    cleanup.push(async () => {
      const latest = await requestJson("/api/state", { method: "GET" });
      const restoreHeaders = new Headers();
      const restoreBaseVersion =
        typeof latest.data?.updatedAt === "string" ? latest.data.updatedAt : null;

      if (restoreBaseVersion) {
        restoreHeaders.set("X-State-Version", restoreBaseVersion);
      }

      await requestJson("/api/auth/profile-state", {
        method: "PATCH",
        body: JSON.stringify({
          user: authenticatedUser,
          profile,
        }),
        headers: restoreHeaders,
        withSyncContext: true,
      });
    });
  }

  const restoredSession = await requestJson("/api/auth/session", { method: "GET" });

  assertResponse({
    label: "live profile-state mutation survives session restore",
    ...restoredSession,
    predicate: (data) =>
      data?.user?.id === authenticatedUser?.id &&
      data?.snapshot?.profile?.notificationsEnabled === nextProfile.notificationsEnabled,
    detail:
      "After /api/auth/profile-state succeeds, /api/auth/session must restore the backend-confirmed profile state.",
  });
};

const verifyWaterMutationAndRestore = async () => {
  const before = await requestJson("/api/water-state", { method: "GET" });

  assertResponse({
    label: "live water state can be read before mutation",
    ...before,
    predicate: (data) => data && typeof data === "object",
    detail: "/api/water-state must return the current water state before smoke mutation.",
  });

  const add = await requestJson("/api/water", {
    method: "POST",
    body: JSON.stringify({ amountMl: 1 }),
    withSyncContext: true,
  });

  assertResponse({
    label: "live water add is backend-confirmed",
    ...add,
    predicate: (data) =>
      Number.isFinite(data?.consumedMl) &&
      Number.isFinite(data?.dailyWaterGoal) &&
      Number.isFinite(data?.remainingMl),
    detail:
      "/api/water must confirm a water mutation with canonical today's water totals.",
  });

  if (before.response.ok && before.data && typeof before.data === "object") {
    cleanup.push(async () => {
      await requestJson("/api/water-state", {
        method: "PUT",
        body: JSON.stringify(before.data),
        withSyncContext: true,
      });
    });
  }
};

const verifyProductIntakeAndCleanup = async () => {
  const idempotencyKey = `live-smoke-product-${Date.now().toString(36)}`;
  const product = {
    id: `manual-live-smoke-${Date.now().toString(36)}`,
    name: "Live smoke product",
    unit: "g",
    source: "Manual",
    status: "personal",
    nutrients: {
      calories: 50,
      protein: 2,
      fat: 1,
      carbs: 8,
      sugar: 1,
      fiber: 1,
      sodium: 0,
    },
  };

  const result = await requestJson("/api/meal/product-intake", {
    method: "POST",
    body: JSON.stringify({
      source: "manual",
      product,
      quantity: 10,
      mealType: "snack",
      idempotencyKey,
      options: {
        saveToLibrary: false,
        submitToCatalog: false,
      },
    }),
    withSyncContext: true,
  });
  const entryId = result.data?.entry?.id;

  assertResponse({
    label: "live product intake returns canonical meal state",
    ...result,
    predicate: (data) =>
      data?.ok === true &&
      data?.outcomes?.mealAdded === true &&
      Boolean(data?.entry?.id) &&
      Array.isArray(data?.meal?.items) &&
      data.meal.items.some((item) => item?.id === data.entry.id),
    detail:
      "/api/meal/product-intake must return backend-confirmed entry plus canonical meal state.",
  });

  if (entryId) {
    cleanup.push(async () => {
      await fetchWithTimeout(`/api/meal-entries/${encodeURIComponent(entryId)}`, {
        method: "DELETE",
        withSyncContext: true,
      });
    });
  }
};

const verifyReminderLifecycle = async () => {
  const result = await requestJson("/api/reminders", {
    method: "POST",
    body: JSON.stringify({
      type: "task",
      text: "Live smoke reminder today at 23:59",
    }),
  });
  const reminderId = result.data?.item?.id;

  assertResponse({
    label: "live reminder create is backend-confirmed",
    ...result,
    predicate: (data) =>
      Boolean(data?.item?.id) &&
      data?.item?.type === "task" &&
      data?.item?.active === true,
    detail:
      "/api/reminders must create a canonical reminder item through backend persistence.",
  });

  if (reminderId) {
    const list = await requestJson("/api/reminders?active=true", { method: "GET" });
    assertResponse({
      label: "live reminder appears in canonical list",
      ...list,
      predicate: (data) =>
        Array.isArray(data?.items) &&
        data.items.some((item) => item?.id === reminderId),
      detail:
        "Created reminder must be visible through the canonical reminder list before cleanup.",
    });

    cleanup.push(async () => {
      await fetchWithTimeout(`/api/reminders/${encodeURIComponent(reminderId)}`, {
        method: "DELETE",
      });
    });
  }
};

const verifyTelegramStatus = async () => {
  const result = await requestJson("/api/telegram/status", { method: "GET" });

  assertResponse({
    label: "live Telegram status uses authenticated backend contract",
    ...result,
    predicate: (data) =>
      data?.provider === "telegram" &&
      typeof data?.configured === "boolean" &&
      "connected" in data &&
      !JSON.stringify(data).toLowerCase().includes("token"),
    detail:
      "/api/telegram/status must report connection status without exposing bot tokens.",
  });
};

const runCleanup = async () => {
  const cleanupFailures = [];

  for (const cleanupAction of cleanup.reverse()) {
    try {
      await cleanupAction();
    } catch (error) {
      cleanupFailures.push(error instanceof Error ? error.message : String(error));
    }
  }

  addCheck(
    "live authenticated smoke cleanup completed",
    cleanupFailures.length === 0,
    cleanupFailures.length === 0
      ? "Smoke account mutations were cleaned up."
      : `Cleanup failed: ${cleanupFailures.join("; ")}`
  );
};

const logout = async () => {
  await fetchWithTimeout("/api/auth/logout", { method: "POST" }).catch(() => null);
  await fetchWithTimeout("/api/auth/logout", {
    method: "POST",
    cookieJar: ownerCookies,
  }).catch(() => null);
};

const main = async () => {
  try {
    await verifyBackendDeploymentFingerprint();
    await verifyBrowserAuthProtocol();

    if (!smokeEmail || !smokePassword) {
      failConfiguration();
    } else {
      await verifyRegistrationPreflightAndCleanup();
      await login();
      await verifySessionRestore();
      await verifyProfileStateMutationAndRestore();
      await verifyWaterMutationAndRestore();
      await verifyProductIntakeAndCleanup();
      await verifyReminderLifecycle();
      await verifyTelegramStatus();
    }
  } finally {
    await runCleanup();
    await logout();
  }

  const failed = checks.filter((check) => !check.pass);

  if (failed.length > 0) {
    console.error("Smart Nutrition authenticated live audit failed:");
    for (const check of failed) {
      console.error(`FAIL ${check.label}`);
      console.error(`     ${check.detail}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `Smart Nutrition authenticated live audit passed: ${checks.length} checks.`
  );
};

main().catch((error) => {
  console.error("Smart Nutrition authenticated live audit failed to run.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
