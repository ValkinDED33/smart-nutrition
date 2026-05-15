import { createAiRoutes } from "./ai.routes.mjs";
import { createAdminRoutes } from "./admin.routes.mjs";

export const createApiRouter = (dependencies) => {
  const routes = [...createAiRoutes(dependencies), ...createAdminRoutes(dependencies)];

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
