const normalizeRouteLabel = (pathname) =>
  pathname
    .replace(/^\/api\/meal-entries\/[^/]+$/, "/api/meal-entries/:id")
    .replace(/^\/api\/meal-templates\/[^/]+$/, "/api/meal-templates/:id")
    .replace(/^\/api\/meal-products\/(saved|recent)\/[^/]+$/, "/api/meal-products/$1/:id")
    .replace(/^\/api\/admin\/foods\/submissions\/[^/]+$/, "/api/admin/foods/submissions/:id")
    .replace(/^\/api\/admin\/users\/[^/]+\/role$/, "/api/admin/users/:id/role")
    .replace(/^\/api\/admin\/users\/[^/]+\/ban$/, "/api/admin/users/:id/ban");

export const createRequestMetrics = ({ getRequestPathname, stateStreams }) => {
  const requestMetrics = {
    startedAt: Date.now(),
    totalRequests: 0,
    activeRequests: 0,
    errorResponses: 0,
    rateLimitedResponses: 0,
    totalResponseMs: 0,
    routes: new Map(),
  };

  const getMetricsSnapshot = () => {
    const topRoutes = [...requestMetrics.routes.entries()]
      .sort((left, right) => right[1].count - left[1].count)
      .slice(0, 8)
      .map(([route, value]) => ({
        route,
        count: value.count,
        averageMs: value.totalMs > 0 ? Math.round(value.totalMs / value.count) : 0,
      }));

    return {
      uptimeSeconds: Math.round((Date.now() - requestMetrics.startedAt) / 1000),
      totalRequests: requestMetrics.totalRequests,
      activeRequests: requestMetrics.activeRequests,
      errorResponses: requestMetrics.errorResponses,
      rateLimitedResponses: requestMetrics.rateLimitedResponses,
      averageResponseMs:
        requestMetrics.totalRequests > 0
          ? Math.round(requestMetrics.totalResponseMs / requestMetrics.totalRequests)
          : 0,
      activeStateStreams: [...stateStreams.values()].reduce(
        (sum, streams) => sum + streams.size,
        0
      ),
      topRoutes,
    };
  };

  const trackRequest = (request, response) => {
    const startedAt = Date.now();
    const routeLabel = normalizeRouteLabel(getRequestPathname(request));

    requestMetrics.totalRequests += 1;
    requestMetrics.activeRequests += 1;

    response.on("finish", () => {
      const elapsedMs = Date.now() - startedAt;
      requestMetrics.activeRequests = Math.max(requestMetrics.activeRequests - 1, 0);
      requestMetrics.totalResponseMs += elapsedMs;

      if (response.statusCode >= 400) {
        requestMetrics.errorResponses += 1;
      }

      if (response.statusCode === 429) {
        requestMetrics.rateLimitedResponses += 1;
      }

      const routeStats = requestMetrics.routes.get(routeLabel) ?? { count: 0, totalMs: 0 };
      routeStats.count += 1;
      routeStats.totalMs += elapsedMs;
      requestMetrics.routes.set(routeLabel, routeStats);
    });
  };

  return {
    requestMetrics,
    getMetricsSnapshot,
    trackRequest,
  };
};
