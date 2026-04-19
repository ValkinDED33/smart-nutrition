/**
 * Integration Errors
 *
 * Custom error types for integration layer
 */

type IntegrationErrorDetails = Record<string, unknown>;

export class IntegrationError extends Error {
  constructor(
    public code: string,
    public details: IntegrationErrorDetails = {},
    message: string = "Integration error"
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}

export class OfflineError extends IntegrationError {
  constructor() {
    super("OFFLINE", {}, "No internet connection");
    this.name = "OfflineError";
  }
}

export class NotFoundError extends IntegrationError {
  constructor(resource: string, details?: IntegrationErrorDetails) {
    super("NOT_FOUND", details ?? {}, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends IntegrationError {
  constructor(message: string, details?: IntegrationErrorDetails) {
    super("VALIDATION_ERROR", details ?? {}, message);
    this.name = "ValidationError";
  }
}

export class RateLimitError extends IntegrationError {
  constructor(retryAfterSeconds?: number) {
    super(
      "RATE_LIMITED",
      { retryAfterSeconds },
      `Rate limited${retryAfterSeconds ? ` - retry after ${retryAfterSeconds}s` : ""}`
    );
    this.name = "RateLimitError";
  }
}

export class TimeoutError extends IntegrationError {
  constructor(timeoutMs: number) {
    super("TIMEOUT", { timeoutMs }, `Request timeout after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}
