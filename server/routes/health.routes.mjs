import { sendJson } from "../lib/http.mjs";

const createPublicReadinessSummary = (readiness) => ({
  ok: Boolean(readiness?.ok),
  ready: Boolean(readiness?.ready),
  checks: readiness?.checks ?? {},
});

const createPublicStorageSummary = (storage) => ({
  engine: storage?.engine ?? "unknown",
});

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
