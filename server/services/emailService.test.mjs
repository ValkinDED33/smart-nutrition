import { describe, expect, it, vi } from "vitest";
import { createEmailService } from "./emailService.mjs";

const createConfig = (overrides = {}) => ({
  resendApiKey: "test-resend-key",
  emailFromAddress: "hello@smart-nutrition.club",
  emailFromName: "Smart Nutrition",
  appBaseUrl: "https://smart-nutrition.club",
  ...overrides,
});

const createResendClient = (send) => ({
  emails: {
    send,
  },
});

const createLogger = () => ({
  error: vi.fn(),
  info: vi.fn(),
});

const createService = ({ send, config, logger = createLogger() }) => ({
  logger,
  service: createEmailService({
    config: config ?? createConfig(),
    logger,
    resendClient: createResendClient(send),
    retryDelaysMs: [0, 0, 0],
    wait: vi.fn(),
  }),
});

describe("email service", () => {
  it("sends a successful email once", async () => {
    const send = vi.fn().mockResolvedValue({
      data: { id: "email-1" },
      error: null,
    });
    const { service } = createService({ send });

    await expect(
      service.sendPasswordResetEmail({
        to: "user@example.com",
        name: "User",
        resetUrl: "https://smart-nutrition.club/reset-password?token=secret",
        expiresAt: new Date("2026-06-07T12:00:00.000Z"),
      })
    ).resolves.toEqual({
      ok: true,
      messageId: "email-1",
      attempts: 1,
    });

    expect(send).toHaveBeenCalledTimes(1);
  });

  it("retries transient provider failures and then succeeds", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { statusCode: 503, code: "service_unavailable", message: "Provider busy" },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { statusCode: 429, code: "rate_limited", message: "Retry later" },
      })
      .mockResolvedValueOnce({
        data: { id: "email-2" },
        error: null,
      });
    const logger = createLogger();
    const { service } = createService({ send, logger });

    const result = await service.sendRegistrationVerificationEmail({
      to: "user@example.com",
      name: "User",
      verificationUrl: "https://smart-nutrition.club/verify-email?token=secret",
      expiresAt: new Date("2026-06-07T12:00:00.000Z"),
    });

    expect(result).toEqual({
      ok: true,
      messageId: "email-2",
      attempts: 3,
    });
    expect(send).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error.mock.calls[0][1]).toMatchObject({
      provider: "resend",
      status: 503,
      code: "service_unavailable",
      message: "Provider busy",
      transient: true,
      attempt: 1,
      maxAttempts: 3,
      willRetry: true,
    });
  });

  it("sends partner invite email with code, link, and scoped privacy copy", async () => {
    const send = vi.fn().mockResolvedValue({
      data: { id: "partner-email-1" },
      error: null,
    });
    const { service } = createService({ send });

    const result = await service.sendPartnerInviteEmail({
      to: "partner@example.com",
      inviterName: "Anna",
      inviteUrl: "https://smart-nutrition.club/partner-invite?code=SN-ABC123",
      code: "SN-ABC123",
      expiresAt: new Date("2026-06-07T12:00:00.000Z"),
    });

    expect(result).toEqual({
      ok: true,
      messageId: "partner-email-1",
      attempts: 1,
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["partner@example.com"],
        subject: "Join your Smart Nutrition family space",
        text: expect.stringContaining("SN-ABC123"),
        html: expect.stringContaining("SN-ABC123"),
      })
    );
    expect(send.mock.calls[0][0].text).toContain("private profile data are not shared");
  });

  it("returns EMAIL_SEND_FAILED after max attempts for repeated transient failures", async () => {
    const send = vi.fn().mockResolvedValue({
      data: null,
      error: { statusCode: 503, code: "service_unavailable", message: "Provider down" },
    });
    const logger = createLogger();
    const { service } = createService({ send, logger });

    const result = await service.sendPasswordResetEmail({
      to: "user@example.com",
      name: "User",
      resetUrl: "https://smart-nutrition.club/reset-password?token=secret",
      expiresAt: new Date("2026-06-07T12:00:00.000Z"),
    });

    expect(result).toEqual({
      ok: false,
      code: "EMAIL_SEND_FAILED",
      attempts: 3,
    });
    expect(send).toHaveBeenCalledTimes(3);
    expect(logger.error).toHaveBeenCalledWith(
      "[email] delivery failed",
      expect.objectContaining({
        provider: "resend",
        status: 503,
        code: "service_unavailable",
        message: "Provider down",
        attempts: 3,
      })
    );
  });

  it("returns EMAIL_NOT_CONFIGURED without retrying", async () => {
    const send = vi.fn();
    const service = createEmailService({
      config: createConfig({ resendApiKey: "", emailFromAddress: "" }),
      logger: createLogger(),
      resendClient: null,
      retryDelaysMs: [0, 0, 0],
      wait: vi.fn(),
    });

    const result = await service.sendRegistrationVerificationEmail({
      to: "user@example.com",
      name: "User",
      verificationUrl: "https://smart-nutrition.club/verify-email?token=secret",
      expiresAt: new Date("2026-06-07T12:00:00.000Z"),
    });

    expect(result).toEqual({
      ok: false,
      code: "EMAIL_NOT_CONFIGURED",
    });
    expect(send).not.toHaveBeenCalled();
    expect(service.getStatus()).toMatchObject({
      configured: false,
      provider: "resend",
      fromAddress: null,
      fromName: "Smart Nutrition",
      retryEnabled: true,
      maxAttempts: 3,
    });
  });
});
