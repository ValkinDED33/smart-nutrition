const defaultApiUrl = "https://smart-nutrition-sk5r.onrender.com";
const defaultAppOrigin = "https://smart-nutrition.club";
const requestTimeoutMs = 18_000;

const requiredEnvNames = [
  "SMART_NUTRITION_LIVE_SMOKE_EMAIL",
  "SMART_NUTRITION_LIVE_SMOKE_PASSWORD",
];

const apiOrigin = String(
  process.env.SMART_NUTRITION_LIVE_API_URL || defaultApiUrl
).replace(/\/+$/, "");
const appOrigin = String(
  process.env.SMART_NUTRITION_LIVE_APP_URL || defaultAppOrigin
).replace(/\/+$/, "");
const smokeEmail = String(process.env.SMART_NUTRITION_LIVE_SMOKE_EMAIL || "").trim();
const smokePassword = String(process.env.SMART_NUTRITION_LIVE_SMOKE_PASSWORD || "");
const smokeDeviceId = `live-smoke-${Date.now().toString(36)}`;

const checks = [];
const cookies = new Map();
const cleanup = [];
let authenticatedUser = null;

const addCheck = (label, pass, detail) => {
  checks.push({ label, pass, detail });
};

const failConfiguration = () => {
  const missing = requiredEnvNames.filter((name) => !process.env[name]);
  console.error("Smart Nutrition authenticated live audit cannot run.");
  console.error(`Missing required env: ${missing.join(", ")}`);
  console.error(
    "Use a dedicated verified smoke account. Do not use personal/admin passwords in committed files."
  );
  process.exitCode = 1;
};

const joinUrl = (pathname) =>
  `${apiOrigin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

const getCookieHeader = () =>
  [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");

const splitSetCookieHeader = (value) => {
  if (!value) {
    return [];
  }

  return value.split(/,(?=\s*[^;,=\s]+=[^;,]*)/g);
};

const storeResponseCookies = (response) => {
  const setCookieValues =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : splitSetCookieHeader(response.headers.get("set-cookie"));

  for (const setCookie of setCookieValues) {
    const [pair] = String(setCookie).split(";");
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    if (value) {
      cookies.set(name, value);
    } else {
      cookies.delete(name);
    }
  }
};

const fetchWithTimeout = async (pathname, options = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("Origin", appOrigin);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const cookieHeader = getCookieHeader();

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  if (options.withSyncContext) {
    headers.set("X-Device-Id", smokeDeviceId);
  }

  try {
    const response = await fetch(joinUrl(pathname), {
      redirect: "manual",
      ...options,
      headers,
      signal: controller.signal,
    });
    storeResponseCookies(response);
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

const login = async () => {
  const result = await requestJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: smokeEmail,
      password: smokePassword,
    }),
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
};

const main = async () => {
  if (!smokeEmail || !smokePassword) {
    failConfiguration();
    return;
  }

  try {
    await login();
    await verifySessionRestore();
    await verifyProfileStateMutationAndRestore();
    await verifyWaterMutationAndRestore();
    await verifyProductIntakeAndCleanup();
    await verifyReminderLifecycle();
    await verifyTelegramStatus();
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
