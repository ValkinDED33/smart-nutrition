export const getClientAddress = (request, { trustForwardedFor = true } = {}) => {
  const socketAddress = String(request.socket?.remoteAddress || "unknown").trim();

  if (!trustForwardedFor) {
    return socketAddress || "unknown";
  }

  const forwarded = String(request.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();

  return forwarded || socketAddress || "unknown";
};

export const readSingleHeader = (value) =>
  Array.isArray(value) ? String(value[0] ?? "").trim() : String(value ?? "").trim();

export const getRequestUrl = (request) => {
  try {
    return new URL(
      request.url ?? "/",
      `https://${request.headers.host || "smart-nutrition.internal"}`
    );
  } catch {
    return null;
  }
};

export const getRequestPathname = (request) => getRequestUrl(request)?.pathname ?? "/";

export const getSyncContext = (request) => ({
  deviceId: readSingleHeader(request.headers["x-device-id"]) || null,
  baseVersion: readSingleHeader(request.headers["x-state-version"]) || null,
});
