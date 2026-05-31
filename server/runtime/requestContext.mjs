export const getClientAddress = (request) =>
  String(request.headers["x-forwarded-for"] || request.socket.remoteAddress || "unknown")
    .split(",")[0]
    .trim();

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
