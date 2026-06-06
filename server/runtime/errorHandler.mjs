import {
  AssistantApiError,
  AuthApiError,
  PlatformApiError,
  StateApiError,
} from "../lib/domain.mjs";
import { sendError } from "../lib/http.mjs";

export const handleRouteError = (error, response) => {
  if (error instanceof AuthApiError) {
    const statusCode =
      error.code === "INVALID_PROFILE"
        ? 400
        : error.code === "EMAIL_IN_USE"
          ? 409
          : error.code === "INVALID_VERIFICATION_LINK"
            ? 400
            : error.code === "REGISTRATION_NOT_VERIFIED"
              ? 403
              : error.code === "ACCOUNT_BANNED"
                ? 403
                : error.code === "INVALID_REFRESH_TOKEN"
                  ? 401
                  : error.code === "TOO_MANY_ATTEMPTS"
                    ? 429
                    : error.code === "EMAIL_DELIVERY_UNAVAILABLE"
                      ? 503
                      : error.code === "VERIFICATION_DELIVERY_UNAVAILABLE"
                        ? 503
                        : error.code === "INVALID_RESET_TOKEN" ||
                            error.code === "WEAK_PASSWORD"
                          ? 400
                          : error.code === "BACKUP_NOT_FOUND"
                            ? 404
                            : error.code === "FORBIDDEN"
                              ? 403
                              : 401;
    sendError(response, statusCode, error.code, error.message);
    return true;
  }

  if (error instanceof PlatformApiError) {
    const statusCode =
      error.code === "FORBIDDEN" || error.code === "ROLE_CHANGE_NOT_ALLOWED"
        ? 403
        : error.code === "FOOD_NOT_FOUND" || error.code === "USER_NOT_FOUND"
          ? 404
          : error.code === "SUBMISSION_LIMIT_REACHED"
            ? 429
            : error.code === "INVALID_ROLE" || error.code === "INVALID_FOOD_SUBMISSION"
              ? 400
              : 409;
    sendError(response, statusCode, error.code, error.message, error.details);
    return true;
  }

  if (error instanceof AssistantApiError) {
    const statusCode =
      error.code === "ASSISTANT_RUNTIME_UNAVAILABLE"
        ? 503
        : error.code === "ASSISTANT_RUNTIME_FAILED"
          ? 502
          : error.code === "ASSISTANT_COOLDOWN" ||
              error.code === "ASSISTANT_QUOTA_EXCEEDED"
            ? 429
            : error.code === "ASSISTANT_REQUEST_BLOCKED"
              ? 403
              : 400;
    if (Number.isFinite(Number(error.details?.retryAfterMs))) {
      response.setHeader(
        "Retry-After",
        String(Math.ceil(Number(error.details.retryAfterMs) / 1000))
      );
    }
    sendError(response, statusCode, error.code, error.message, error.details);
    return true;
  }

  if (error instanceof StateApiError) {
    const statusCode =
      error.code === "PHOTO_ANALYSIS_UNAVAILABLE"
        ? 503
        : error.code === "PHOTO_ANALYSIS_FAILED"
          ? 502
          : error.code === "STATE_CONFLICT"
            ? 409
            : 400;
    sendError(response, statusCode, error.code, error.message, error.details);
    return true;
  }

  if (error instanceof Error && error.message === "INVALID_JSON") {
    sendError(response, 400, "INVALID_JSON", "Request body must be valid JSON.");
    return true;
  }

  if (error instanceof Error && error.message === "BODY_TOO_LARGE") {
    sendError(response, 413, "BODY_TOO_LARGE", "Request body is too large.");
    return true;
  }

  if (error instanceof Error && error.message === "UNSUPPORTED_MEDIA_TYPE") {
    sendError(
      response,
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "JSON requests must use Content-Type: application/json."
    );
    return true;
  }

  return false;
};
