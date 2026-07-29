import {
  AssistantApiError,
  AuthApiError,
  PlatformApiError,
  StateApiError,
} from "../lib/domain.mjs";
import { sendError } from "../lib/http.mjs";

const authErrorMessages = {
  ACCOUNT_BANNED: "This account cannot be used right now.",
  BACKUP_NOT_FOUND: "Backup was not found.",
  EMAIL_DELIVERY_UNAVAILABLE: "Email delivery is temporarily unavailable.",
  EMAIL_IN_USE: "This email is already used.",
  FORBIDDEN: "This action is not available for this account.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  INVALID_PROFILE: "Profile data is invalid.",
  INVALID_REFRESH_TOKEN: "Session expired.",
  INVALID_RESET_TOKEN: "Password reset link is invalid or expired.",
  INVALID_VERIFICATION_LINK: "Confirmation link is invalid or expired.",
  NAME_IN_USE: "This name is already used.",
  REGISTRATION_NOT_VERIFIED: "Please confirm your email before signing in.",
  TOO_MANY_ATTEMPTS: "Too many attempts. Try again later.",
  VERIFICATION_DELIVERY_UNAVAILABLE:
    "Confirmation email delivery is temporarily unavailable.",
  WEAK_PASSWORD: "Password is too weak.",
};

const platformErrorMessages = {
  FOOD_NOT_FOUND: "Product submission was not found.",
  FORBIDDEN: "This action requires elevated access.",
  INVALID_FOOD_SUBMISSION: "Product submission data is invalid.",
  INVALID_ROLE: "User role is invalid.",
  ROLE_CHANGE_NOT_ALLOWED: "This role change is not allowed.",
  SUBMISSION_LIMIT_REACHED: "Submission limit was reached. Try again later.",
  USER_NOT_FOUND: "Target user was not found.",
};

const assistantErrorMessages = {
  ASSISTANT_COOLDOWN: "The assistant is cooling down. Try again shortly.",
  ASSISTANT_QUOTA_EXCEEDED:
    "The assistant is temporarily limited. Try again later.",
  ASSISTANT_REQUEST_BLOCKED: "The assistant cannot help with that request.",
  ASSISTANT_RUNTIME_FAILED:
    "The assistant could not complete this request right now.",
  ASSISTANT_RUNTIME_UNAVAILABLE:
    "The assistant is temporarily unavailable.",
};

const stateErrorMessages = {
  INVALID_IDEMPOTENCY_KEY: "Request confirmation key is missing.",
  INVALID_INTAKE_SOURCE: "Meal source is invalid.",
  INVALID_MEAL_TYPE: "Meal type is invalid.",
  INVALID_PARTNER_INVITE: "Partner invite code is invalid.",
  INVALID_PHOTO_PAYLOAD: "Photo could not be prepared for analysis.",
  INVALID_PRODUCT: "Product data is invalid.",
  INVALID_QUANTITY: "Meal quantity must be positive.",
  PARTNER_INVITE_EXPIRED: "Partner invite has expired.",
  PARTNER_INVITE_NOT_FOUND: "Partner invite was not found.",
  PHOTO_ANALYSIS_FAILED: "Photo analysis could not be completed right now.",
  PHOTO_ANALYSIS_UNAVAILABLE: "Photo analysis is temporarily unavailable.",
  PRODUCT_NOT_FOUND: "Product could not be resolved.",
  PROFILE_NOT_FOUND: "Cloud profile is unavailable.",
  STATE_CONFLICT:
    "Cloud data changed on another device. Use the latest cloud version before retrying.",
};

const getPublicMessage = (messages, code, fallback) =>
  messages[code] ?? fallback;

const getPublicAssistantDetails = (details) => {
  const retryAfterMs = Number(details?.retryAfterMs);

  return Number.isFinite(retryAfterMs) && retryAfterMs > 0
    ? { retryAfterMs }
    : undefined;
};

export const handleRouteError = (error, response) => {
  if (error instanceof AuthApiError) {
    const statusCode =
      error.code === "INVALID_PROFILE"
        ? 400
        : error.code === "EMAIL_IN_USE"
          ? 409
          : error.code === "NAME_IN_USE"
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
    sendError(
      response,
      statusCode,
      error.code,
      getPublicMessage(authErrorMessages, error.code, "Authentication request failed.")
    );
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
    sendError(
      response,
      statusCode,
      error.code,
      getPublicMessage(platformErrorMessages, error.code, "Platform request failed.")
    );
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
    sendError(
      response,
      statusCode,
      error.code,
      getPublicMessage(
        assistantErrorMessages,
        error.code,
        "The assistant could not complete this request right now."
      ),
      getPublicAssistantDetails(error.details)
    );
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
    sendError(
      response,
      statusCode,
      error.code,
      getPublicMessage(stateErrorMessages, error.code, "Cloud request failed.")
    );
    return true;
  }

  if (
    error instanceof Error &&
    error.code === "PRODUCT_LOOKUP_PROVIDER_UNAVAILABLE"
  ) {
    sendError(
      response,
      Number.isFinite(Number(error.statusCode)) ? Number(error.statusCode) : 502,
      error.code,
      "Product catalog is temporarily unavailable."
    );
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
