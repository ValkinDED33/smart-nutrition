import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";

const authRateLimitedRoutes = new Map([
  ["POST /api/auth/register", "register"],
  ["POST /api/auth/login", "login"],
  ["POST /api/auth/forgot-password", "forgotPassword"],
  ["POST /api/auth/verify-registration", "verifyEmail"],
  ["POST /api/auth/resend-verification", "verifyEmail"],
]);

const isAiMutationRoute = (pathname, method) =>
  (pathname === "/api/ai" || pathname === "/api/assistant/message") && method === "POST";

export const createRateLimiters = ({ redisCache, serverConfig, getClientAddress }) => {
  const createRateLimiter = ({ keyPrefix, points, duration }) => {
    if (redisCache.enabled && redisCache.client) {
      return new RateLimiterRedis({
        storeClient: redisCache.client,
        keyPrefix,
        points,
        duration,
        insuranceLimiter: new RateLimiterMemory({
          keyPrefix: `${keyPrefix}-insurance`,
          points,
          duration,
        }),
      });
    }

    return new RateLimiterMemory({
      keyPrefix,
      points,
      duration,
    });
  };

  const requestLimiter = createRateLimiter({
    keyPrefix: "smart-nutrition-api",
    points: serverConfig.requestLimitMax,
    duration: Math.max(Math.ceil(serverConfig.requestLimitWindowMs / 1000), 1),
  });
  const aiRequestLimiter = createRateLimiter({
    keyPrefix: "smart-nutrition-ai",
    points: serverConfig.aiRateLimitMax,
    duration: Math.max(Math.ceil(serverConfig.aiRateLimitWindowMs / 1000), 1),
  });
  const authRateLimitWindowSeconds = Math.max(
    Math.ceil(serverConfig.authRateLimitWindowMs / 1000),
    1
  );
  const authRateLimiters = new Map(
    Object.entries(serverConfig.authRateLimits).map(([name, points]) => [
      name,
      createRateLimiter({
        keyPrefix: `smart-nutrition-auth-${name}`,
        points,
        duration: authRateLimitWindowSeconds,
      }),
    ])
  );

  const consumeRateLimit = async (request) => {
    const clientAddress = getClientAddress(request);

    try {
      const rateLimitResult = await requestLimiter.consume(clientAddress);

      return {
        allowed: true,
        remaining: Math.max(rateLimitResult.remainingPoints, 0),
        resetAt: Date.now() + rateLimitResult.msBeforeNext,
      };
    } catch (rateLimitResult) {
      return {
        allowed: false,
        remaining: 0,
        resetAt:
          Date.now() +
          Number(rateLimitResult?.msBeforeNext ?? serverConfig.requestLimitWindowMs),
      };
    }
  };

  const consumeAiRateLimit = async (request, pathname) => {
    const clientAddress = getClientAddress(request);
    const limiterKey = `${clientAddress}:${pathname}`;

    try {
      const rateLimitResult = await aiRequestLimiter.consume(limiterKey);

      return {
        allowed: true,
        remaining: Math.max(rateLimitResult.remainingPoints, 0),
        resetAt: Date.now() + rateLimitResult.msBeforeNext,
      };
    } catch (rateLimitResult) {
      return {
        allowed: false,
        remaining: 0,
        resetAt:
          Date.now() +
          Number(rateLimitResult?.msBeforeNext ?? serverConfig.aiRateLimitWindowMs),
      };
    }
  };

  const consumeAuthRateLimit = async (request, pathname) => {
    const routeKey = authRateLimitedRoutes.get(`${request.method} ${pathname}`);
    const limiter = routeKey ? authRateLimiters.get(routeKey) : null;

    if (!limiter || !routeKey) {
      return null;
    }

    const clientAddress = getClientAddress(request);
    const limiterKey = `${clientAddress}:${routeKey}`;

    try {
      const rateLimitResult = await limiter.consume(limiterKey);

      return {
        allowed: true,
        remaining: Math.max(rateLimitResult.remainingPoints, 0),
        resetAt: Date.now() + rateLimitResult.msBeforeNext,
      };
    } catch (rateLimitResult) {
      return {
        allowed: false,
        remaining: 0,
        resetAt:
          Date.now() +
          Number(rateLimitResult?.msBeforeNext ?? serverConfig.authRateLimitWindowMs),
      };
    }
  };

  return {
    consumeRateLimit,
    consumeAiRateLimit,
    consumeAuthRateLimit,
    isAiMutationRoute,
  };
};
