export const isCorsOriginAllowed = (origin, allowedOrigins = []) =>
  Boolean(origin) && allowedOrigins.includes(origin);

export const setCorsHeaders = (request, response, allowedOrigins = []) => {
  const origin = request.headers.origin;

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

export const setSecurityHeaders = (response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
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

export const readJsonBody = async (request, bodyLimitBytes) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;

    request.on("data", (chunk) => {
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
