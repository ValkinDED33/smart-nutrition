import { createAiRoutes } from "./ai.routes.mjs";
import { createAdminRoutes } from "./admin.routes.mjs";
import { createAccountRoutes } from "./account.routes.mjs";
import { createAuthRoutes } from "./auth.routes.mjs";
import { createHealthRoutes } from "./health.routes.mjs";
import { createStateRoutes } from "./state.routes.mjs";

export const createApiRouter = (dependencies) => {
  const routes = [
    ...createHealthRoutes(dependencies),
    ...createAuthRoutes(dependencies),
    ...createAccountRoutes(dependencies),
    ...createStateRoutes(dependencies),
    ...(dependencies.aiController ? createAiRoutes(dependencies) : []),
    ...(dependencies.adminController ? createAdminRoutes(dependencies) : []),
  ];

  return async (context) => {
    const requestMethod = context.request.method ?? "";
    let route = null;
    let params = {};

    for (const candidate of routes) {
      if (candidate.method !== requestMethod) {
        continue;
      }

      if (candidate.pathname === context.pathname) {
        route = candidate;
        break;
      }

      const matchedParams = candidate.match?.(context.pathname);

      if (matchedParams) {
        route = candidate;
        params = matchedParams;
        break;
      }
    }

    if (!route) {
      return false;
    }

    await route.handler({ ...context, params });
    return true;
  };
};
