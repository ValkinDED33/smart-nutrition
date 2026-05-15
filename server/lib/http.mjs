export const isCorsOriginAllowed = (origin, allowedOrigins = []) =>
  Boolean(origin) && allowedOrigins.includes(origin);

const mutationMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const readRequestOrigin = (request) => {
  const origin = request.headers.origin;

  if (Array.isArray(origin)) {
    return String(origin[0] ?? "").trim();
  }

  return String(origin ?? "").trim();
};

const readRequestHeader = (request, name) => {
  const value = request.headers[name];
  return Array.isArray(value) ? String(value[0] ?? "").trim() : String(value ?? "").trim();
};

export const setCorsHeaders = (request, response, allowedOrigins = []) => {
  const origin = readRequestOrigin(request);

  response.setHeader("Vary", "Origin");
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Device-Id, X-State-Version"
  );
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  if (isCorsOriginAllowed(origin, allowedOrigins)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Access-Control-Allow-Credentials", "true");
  }
};

export const isUnsafeCrossSiteMutation = (request, allowedOrigins = []) => {
  if (!mutationMethods.has(request.method ?? "")) {
    return false;
  }

  const origin = readRequestOrigin(request);

  if (origin) {
    return !isCorsOriginAllowed(origin, allowedOrigins);
  }

  return readRequestHeader(request, "sec-fetch-site").toLowerCase() === "cross-site";
};

export const setSecurityHeaders = (response) => {
  response.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https: wss:",
      "worker-src 'self'",
      "manifest-src 'self'",
    ].join("; ")
  );
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  response.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
  response.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-DNS-Prefetch-Control", "off");
  response.setHeader("X-Download-Options", "noopen");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
};

const serializeCookie = ({
  name,
  value,
  maxAge,
  path = "/",
  httpOnly = true,
  sameSite = "Lax",
  secure = false,
}) => {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (Number.isFinite(maxAge)) {
    parts.push(`Max-Age=${Math.max(Math.floor(maxAge), 0)}`);
  }

  if (path) {
    parts.push(`Path=${path}`);
  }

  if (httpOnly) {
    parts.push("HttpOnly");
  }

  if (sameSite) {
    parts.push(`SameSite=${sameSite}`);
  }

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
};

const appendSetCookie = (response, cookieValue) => {
  const current = response.getHeader("Set-Cookie");

  if (!current) {
    response.setHeader("Set-Cookie", cookieValue);
    return;
  }

  if (Array.isArray(current)) {
    response.setHeader("Set-Cookie", [...current, cookieValue]);
    return;
  }

  response.setHeader("Set-Cookie", [String(current), cookieValue]);
};

export const setCookie = (response, options) => {
  appendSetCookie(response, serializeCookie(options));
};

export const clearCookie = (
  response,
  { name, path = "/", sameSite = "Lax", secure = false, httpOnly = true }
) => {
  appendSetCookie(
    response,
    serializeCookie({
      name,
      value: "",
      maxAge: 0,
      path,
      httpOnly,
      sameSite,
      secure,
    })
  );
};

export const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
};

export const sendNoContent = (response, statusCode = 204) => {
  response.writeHead(statusCode);
  response.end();
};

export const sendError = (response, statusCode, code, message, details = undefined) => {
  sendJson(response, statusCode, {
    success: false,
    code,
    error: message,
    message,
    ...(details && typeof details === "object" ? details : {}),
  });
};

const readHeaderValue = (value) =>
  Array.isArray(value) ? String(value[0] ?? "").trim() : String(value ?? "").trim();

const isJsonContentType = (contentType) => {
  const mimeType = String(contentType ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  return mimeType === "application/json" || mimeType.endsWith("+json");
};

export const readJsonBody = async (request, bodyLimitBytes) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    let contentTypeChecked = false;

    const assertJsonContentType = () => {
      if (contentTypeChecked) {
        return true;
      }

      contentTypeChecked = true;

      if (isJsonContentType(readHeaderValue(request.headers["content-type"]))) {
        return true;
      }

      reject(new Error("UNSUPPORTED_MEDIA_TYPE"));
      request.destroy();
      return false;
    };

    request.on("data", (chunk) => {
      if (chunk.length > 0 && !assertJsonContentType()) {
        return;
      }

      totalLength += chunk.length;

      if (totalLength > bodyLimitBytes) {
        reject(new Error("BODY_TOO_LARGE"));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("INVALID_JSON"));
      }
    });

    request.on("error", reject);
  });
