const securityHeaderValues = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()",
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-site",
};

const hasHeader = (response, name) => {
  if (typeof response.getHeader === "function") {
    return response.getHeader(name) !== undefined;
  }

  return false;
};

const setHeaderIfMissing = (response, name, value) => {
  if (hasHeader(response, name)) {
    return;
  }

  response.setHeader(name, value);
};

export const buildContentSecurityPolicy = ({ isProduction = false } = {}) => {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://smart-nutrition-sk5r.onrender.com https://*.posthog.com https://*.ingest.sentry.io",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' data: blob:",
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
};

export const applySecurityHeaders = (
  response,
  { isProduction = false } = {}
) => {
  setHeaderIfMissing(
    response,
    "Content-Security-Policy",
    buildContentSecurityPolicy({ isProduction })
  );

  for (const [name, value] of Object.entries(securityHeaderValues)) {
    setHeaderIfMissing(response, name, value);
  }
};
