import { createAiRoutes } from "./ai.routes.mjs";

export const createApiRouter = (dependencies) => {
  const routes = [...createAiRoutes(dependencies)];

  return async (context) => {
    const requestMethod = context.request.method ?? "";
    const route = routes.find(
      (candidate) =>
        candidate.method === requestMethod && candidate.pathname === context.pathname
    );

    if (!route) {
      return false;
    }

    await route.handler(context);
    return true;
  };
};
