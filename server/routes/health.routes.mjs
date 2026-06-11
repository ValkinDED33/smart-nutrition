import { sendJson } from "../lib/http.mjs";

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
        {
          method: "GET",
          pathname: "/api/debug/startup",
          handler: healthController.getDebugStartup,
        },
      ]
    : [];

export const createHealthController = ({
  authService,
  getStorageStatus,
  getCacheStatus,
  getStaticStatus,
  getMetrics,
  getLimits,
  getWarnings,
  getEmailStatus,
  getBrevoStatus,
  getProductLookupStatus,
  getAiStatus,
  getReadiness,
  getDebugStartup,
}) => ({
  getHealth: ({ response }) => {
    sendJson(response, 200, {
      ...authService.getHealthInfo(),
      storage: getStorageStatus(),
      cache: getCacheStatus(),
      static: getStaticStatus(),
      metrics: getMetrics(),
      limits: getLimits(),
      warnings: getWarnings(),
      email: getEmailStatus(),
      brevo: getBrevoStatus?.() ?? null,
      products: getProductLookupStatus?.() ?? null,
      ai: getAiStatus(),
    });
  },

  getReadiness: ({ response }) => {
    const readiness = getReadiness();
    sendJson(response, readiness.ready ? 200 : 503, readiness);
  },

  getDebugStartup: ({ response }) => {
    sendJson(response, 200, getDebugStartup());
  },
});
