const BREVO_PROVIDER = "brevo";
const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts";
const EXISTING_CONTACT_CODES = new Set([
  "duplicate_parameter",
  "already_exists",
  "contact_already_exist",
]);

const toSafeErrorMessage = (value) => {
  const message = String(value ?? "").replace(/\s+/g, " ").trim();
  return message ? message.slice(0, 240) : null;
};

const readBrevoError = async (response) => {
  try {
    const payload = await response.json();
    return {
      code: toSafeErrorMessage(payload?.code),
      message: toSafeErrorMessage(payload?.message),
    };
  } catch {
    return {
      code: null,
      message: toSafeErrorMessage(response.statusText),
    };
  }
};

const isExistingContactError = ({ status, code, message }) => {
  const normalizedCode = String(code ?? "").toLowerCase();
  const normalizedMessage = String(message ?? "").toLowerCase();

  return (
    status === 400 &&
    (EXISTING_CONTACT_CODES.has(normalizedCode) ||
      normalizedMessage.includes("already exist") ||
      normalizedMessage.includes("already exists"))
  );
};

const logWarning = (logger, message, details) => {
  logger?.warn?.(message, details);
};

export const createBrevoService = ({
  config,
  logger = console,
  fetchImpl = globalThis.fetch,
} = {}) => {
  const apiKey = String(config?.brevoApiKey ?? "").trim();
  const listId = Number(config?.brevoListId);
  const listIdConfigured = Number.isInteger(listId) && listId > 0;
  const configured = Boolean(apiKey && listIdConfigured && fetchImpl);

  const getStatus = () => ({
    configured,
    provider: BREVO_PROVIDER,
    listIdConfigured,
  });

  const upsertContact = async ({ email, name } = {}) => {
    if (!configured) {
      return {
        ok: true,
        skipped: true,
        code: "BREVO_NOT_CONFIGURED",
      };
    }

    const safeEmail = String(email ?? "").trim().toLowerCase();

    if (!safeEmail) {
      return {
        ok: false,
        code: "BREVO_INVALID_CONTACT",
      };
    }

    const payload = {
      email: safeEmail,
      attributes: {
        FIRSTNAME: String(name ?? "").trim() || undefined,
      },
      listIds: [listId],
      updateEnabled: true,
    };

    if (!payload.attributes.FIRSTNAME) {
      delete payload.attributes.FIRSTNAME;
    }

    try {
      const response = await fetchImpl(BREVO_CONTACTS_URL, {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return {
          ok: true,
          provider: BREVO_PROVIDER,
        };
      }

      const providerError = await readBrevoError(response);

      if (isExistingContactError({ status: response.status, ...providerError })) {
        return {
          ok: true,
          provider: BREVO_PROVIDER,
          existingContact: true,
        };
      }

      logWarning(logger, "[brevo] contact sync failed", {
        provider: BREVO_PROVIDER,
        status: response.status,
        code: providerError.code,
        message: providerError.message,
      });

      return {
        ok: false,
        code: "BREVO_CONTACT_SYNC_FAILED",
      };
    } catch (error) {
      logWarning(logger, "[brevo] contact sync failed", {
        provider: BREVO_PROVIDER,
        code: toSafeErrorMessage(error?.code ?? error?.name),
        message: toSafeErrorMessage(error?.message),
      });

      return {
        ok: false,
        code: "BREVO_CONTACT_SYNC_FAILED",
      };
    }
  };

  return {
    isConfigured: () => configured,
    getStatus,
    upsertContact,
  };
};
