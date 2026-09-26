import { sendJson } from "../lib/http.mjs";

const createPublicReadinessSummary = (readiness) => ({
  ok: Boolean(readiness?.ok),
  ready: Boolean(readiness?.ready),
  checks: readiness?.checks ?? {},
});

const createPublicStorageSummary = (storage) => ({
  engine: storage?.engine ?? "unknown",
});

const readDeploymentProvider = (env) => {
  if (env.RENDER || env.RENDER_SERVICE_ID || env.RENDER_SERVICE_NAME) {
    return "render";
  }

  if (env.VERCEL || env.VERCEL_ENV || env.VERCEL_GIT_COMMIT_SHA) {
    return "vercel";
  }

  return "local";
};

const readSafeCommit = (env) => {
  const commit = String(
    env.SMART_NUTRITION_DEPLOY_COMMIT ||
      env.RENDER_GIT_COMMIT ||
      env.VERCEL_GIT_COMMIT_SHA ||
      env.GIT_COMMIT_SHA ||
      ""
  ).trim();

  return /^[a-f0-9]{7,40}$/i.test(commit) ? commit.slice(0, 12) : null;
};

const createPublicDeploymentSummary = (env) => {
  const commit = readSafeCommit(env);

  return {
    provider: readDeploymentProvider(env),
    ...(commit ? { commit } : {}),
  };
};

export const createHealthRoutes = ({ healthController } = {}) =>
  healthController
    ? [
        {
          method: "GET",
          pathname: "/api/health",
          handler: healthController.getHealth,
        },
        {
          method: "GET",
          pathname: "/api/ready",
          handler: healthController.getReadiness,
        },
        ...(healthController.debugStartupEnabled
          ? [
              {
                method: "GET",
                pathname: "/api/debug/startup",
                handler: healthController.getDebugStartup,
              },
            ]
          : []),
      ]
    : [];

export const createHealthController = ({
  authService,
  getStorageStatus,
  getStaticStatus,
  getEmailStatus,
  getReadiness,
  getDebugStartup,
  debugStartupEnabled = false,
  env = process.env,
}) => ({
  debugStartupEnabled,

  getHealth: ({ response }) => {
    const healthInfo = authService.getHealthInfo();

    sendJson(response, 200, {
      ok: Boolean(healthInfo.ok),
      mode: healthInfo.mode,
      auth: healthInfo.auth,
      storage: createPublicStorageSummary(getStorageStatus()),
      static: getStaticStatus(),
      email: getEmailStatus(),
      deployment: createPublicDeploymentSummary(env),
    });
  },

  getReadiness: ({ response }) => {
    const readiness = getReadiness();
    sendJson(
      response,
      readiness.ready ? 200 : 503,
      createPublicReadinessSummary(readiness)
    );
  },

  getDebugStartup: ({ response }) => {
    sendJson(response, 200, getDebugStartup());
  },
});
