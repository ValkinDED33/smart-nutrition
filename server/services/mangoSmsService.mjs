import crypto from "node:crypto";

const MANGO_SUCCESS_CODE = "1000";

const toTrimmedString = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const normalizePhoneNumber = (value) => String(value ?? "").replace(/\D+/g, "");

const createCommandId = () =>
  `SN${Date.now()}${crypto.randomInt(100000, 999999)}`;

const createSignature = ({ apiKey, apiSalt, json }) =>
  crypto.createHash("sha256").update(`${apiKey}${json}${apiSalt}`).digest("hex");

const parseMangoResponse = (text) => {
  const trimmed = toTrimmedString(text);

  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return { raw: trimmed };
  }
};

const readMangoCode = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const rawCode =
    payload.result ??
    payload.Result ??
    payload.code ??
    payload.Code ??
    payload.result_code ??
    payload.ResultCode ??
    null;

  return rawCode === null || rawCode === undefined ? null : String(rawCode);
};

const readMangoMessage = (payload) => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  return (
    toTrimmedString(payload.message) ||
    toTrimmedString(payload.Message) ||
    toTrimmedString(payload.error) ||
    toTrimmedString(payload.Error) ||
    toTrimmedString(payload.raw) ||
    null
  );
};

const readMangoMessageId = (payload, fallback) => {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  return (
    toTrimmedString(payload.command_id) ||
    toTrimmedString(payload.commandId) ||
    toTrimmedString(payload.sms_id) ||
    toTrimmedString(payload.smsId) ||
    fallback
  );
};

const isMangoSuccess = (code) => code === null || code === MANGO_SUCCESS_CODE;

const buildRegistrationSmsText = ({ code, expiresAt }) => {
  const expiresInMinutes = Math.max(
    1,
    Math.ceil((Number(expiresAt) - Date.now()) / 60_000)
  );

  return `Smart Nutrition verification code: ${code}. Valid for ${expiresInMinutes} min.`;
};

export const createMangoSmsService = ({
  config,
  fetchImpl = globalThis.fetch,
  logger = console,
}) => {
  const isConfigured = () => Boolean(config.mangoSmsConfigured);

  const sendSms = async ({ to, text }) => {
    if (!isConfigured()) {
      return {
        ok: false,
        code: "MANGO_SMS_NOT_CONFIGURED",
      };
    }

    if (typeof fetchImpl !== "function") {
      return {
        ok: false,
        code: "MANGO_SMS_FETCH_UNAVAILABLE",
      };
    }

    const toNumber = normalizePhoneNumber(to);

    if (!toNumber) {
      return {
        ok: false,
        code: "MANGO_SMS_INVALID_PHONE",
      };
    }

    const commandId = createCommandId();
    const payload = {
      command_id: commandId,
      from_extension: String(config.mangoFromExtension ?? "101"),
      text: String(text ?? "").trim().slice(0, 1000),
      to_number: toNumber,
      sms_sender: String(config.mangoSmsSender ?? ""),
    };
    const json = JSON.stringify(payload);
    const sign = createSignature({
      apiKey: config.mangoApiKey,
      apiSalt: config.mangoApiSalt,
      json,
    });
    const body = new URLSearchParams({
      vpbx_api_key: config.mangoApiKey,
      sign,
      json,
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, config.mangoSmsTimeoutMs);

    try {
      const response = await fetchImpl(config.mangoSmsEndpoint, {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: body.toString(),
        signal: controller.signal,
      });
      const responseText = await response.text().catch(() => "");
      const responsePayload = parseMangoResponse(responseText);
      const mangoCode = readMangoCode(responsePayload);

      if (!response.ok) {
        return {
          ok: false,
          code: "MANGO_SMS_HTTP_ERROR",
          status: response.status,
          message: readMangoMessage(responsePayload),
        };
      }

      if (!isMangoSuccess(mangoCode)) {
        return {
          ok: false,
          code: "MANGO_SMS_REJECTED",
          status: response.status,
          mangoCode,
          message: readMangoMessage(responsePayload),
        };
      }

      return {
        ok: true,
        commandId,
        providerMessageId: readMangoMessageId(responsePayload, commandId),
        mangoCode,
      };
    } catch (error) {
      if (error?.name === "AbortError") {
        return {
          ok: false,
          code: "MANGO_SMS_TIMEOUT",
        };
      }

      logger.warn?.("[mango-sms] delivery failed", error);

      return {
        ok: false,
        code: "MANGO_SMS_REQUEST_FAILED",
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  };

  return {
    isConfigured,

    getStatus: () => ({
      provider: "mango-office",
      configured: isConfigured(),
      endpoint: config.mangoSmsEndpoint,
      fromExtension: config.mangoFromExtension,
      senderConfigured: Boolean(toTrimmedString(config.mangoSmsSender)),
    }),

    sendRegistrationVerificationSms: async ({ to, code, expiresAt }) =>
      sendSms({
        to,
        text: buildRegistrationSmsText({ code, expiresAt }),
      }),

    sendSms,
  };
};
