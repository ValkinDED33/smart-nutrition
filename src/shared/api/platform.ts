import type {
  AccessOverview,
  AdminPlatformStats,
  AdminUserSummary,
  AuditLogEntry,
  CatalogProductItem,
  CatalogProductSubmissionPayload,
  CatalogSubmissionResponse,
  ContentReportItem,
  ContentReportPayload,
} from "../types/platform";
import type { AssignableUserRole } from "@domain/user/roles";
import { getRemoteAuthBaseUrl } from "./auth";

export class PlatformApiError extends Error {
  code: string;
  status: number | null;

  constructor(code: string, message: string, status: number | null = null) {
    super(message);
    this.name = "PlatformApiError";
    this.code = code;
    this.status = status;
  }
}

const PLATFORM_ERROR_MESSAGES = {
  REMOTE_API_UNAVAILABLE:
    "The cloud service is temporarily unavailable. Try again later.",
  UNAUTHORIZED: "Sign in again before using platform tools.",
  FORBIDDEN: "Your account does not have access to this platform action.",
  NOT_FOUND: "This platform item is no longer available.",
  VALIDATION_ERROR: "Check the platform form and try again.",
  CONFLICT: "This platform item changed in the cloud. Refresh and try again.",
  TOO_MANY_REQUESTS: "Too many platform requests. Wait a moment and try again.",
  PLATFORM_REQUEST_FAILED: "The platform action could not be completed.",
} as const;

const getPlatformErrorMessage = (code: string, status: number) => {
  switch (code) {
    case "REMOTE_API_UNAVAILABLE":
      return PLATFORM_ERROR_MESSAGES.REMOTE_API_UNAVAILABLE;
    case "UNAUTHORIZED":
      return PLATFORM_ERROR_MESSAGES.UNAUTHORIZED;
    case "FORBIDDEN":
      return PLATFORM_ERROR_MESSAGES.FORBIDDEN;
    case "NOT_FOUND":
      return PLATFORM_ERROR_MESSAGES.NOT_FOUND;
    case "VALIDATION_ERROR":
      return PLATFORM_ERROR_MESSAGES.VALIDATION_ERROR;
    case "CONFLICT":
      return PLATFORM_ERROR_MESSAGES.CONFLICT;
    case "TOO_MANY_REQUESTS":
      return PLATFORM_ERROR_MESSAGES.TOO_MANY_REQUESTS;
    case "PLATFORM_REQUEST_FAILED":
      return PLATFORM_ERROR_MESSAGES.PLATFORM_REQUEST_FAILED;
    default:
      break;
  }

  if (status === 401) {
    return PLATFORM_ERROR_MESSAGES.UNAUTHORIZED;
  }

  if (status === 403) {
    return PLATFORM_ERROR_MESSAGES.FORBIDDEN;
  }

  if (status === 404) {
    return PLATFORM_ERROR_MESSAGES.NOT_FOUND;
  }

  if (status === 409) {
    return PLATFORM_ERROR_MESSAGES.CONFLICT;
  }

  if (status === 422) {
    return PLATFORM_ERROR_MESSAGES.VALIDATION_ERROR;
  }

  if (status === 429) {
    return PLATFORM_ERROR_MESSAGES.TOO_MANY_REQUESTS;
  }

  if (status >= 500) {
    return PLATFORM_ERROR_MESSAGES.REMOTE_API_UNAVAILABLE;
  }

  return PLATFORM_ERROR_MESSAGES.PLATFORM_REQUEST_FAILED;
};

const requestPlatform = async <T>(
  pathname: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = getRemoteAuthBaseUrl();

  if (!baseUrl) {
    throw new PlatformApiError(
      "REMOTE_API_UNAVAILABLE",
      PLATFORM_ERROR_MESSAGES.REMOTE_API_UNAVAILABLE
    );
  }

  const response = await fetch(buildPlatformUrl(baseUrl, pathname), {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
  } & T;

  if (!response.ok) {
    const code: string = payload.code ?? "PLATFORM_REQUEST_FAILED";

    throw new PlatformApiError(
      code,
      getPlatformErrorMessage(code, response.status),
      response.status
    );
  }

  return payload;
};

const buildPlatformUrl = (baseUrl: string, pathname: string) => {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const pathForBase = /\/api$/i.test(normalizedBaseUrl)
    ? normalizedPathname.replace(/^\/api(?=\/|$)/i, "") || "/"
    : normalizedPathname;

  return `${normalizedBaseUrl}${pathForBase}`;
};

export const getPlatformAccessOverview = () =>
  requestPlatform<AccessOverview>("/api/access");

export const listOwnCatalogSubmissions = async () =>
  (await requestPlatform<{ items: CatalogProductItem[] }>("/api/foods/submissions")).items;

export const findCatalogDuplicateCandidates = async ({
  name,
  barcode = "",
  limit = 6,
}: {
  name: string;
  barcode?: string;
  limit?: number;
}) => {
  const params = new URLSearchParams({
    name,
    barcode,
    limit: String(limit),
  });

  return (
    await requestPlatform<{ items: CatalogProductItem[] }>(
      `/api/foods/duplicates?${params.toString()}`
    )
  ).items;
};

export const submitCatalogSubmission = (
  payload: CatalogProductSubmissionPayload
) =>
  requestPlatform<CatalogSubmissionResponse>("/api/foods/submissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listModerationQueue = async () =>
  (
    await requestPlatform<{ items: CatalogProductItem[] }>("/api/admin/foods/submissions")
  ).items;

export const reviewCatalogSubmission = (
  submissionId: string,
  payload: { decision: "approve" | "reject"; reason?: string }
) =>
  requestPlatform<CatalogProductItem>(
    `/api/admin/foods/submissions/${encodeURIComponent(submissionId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

export const listAdminUsers = async () =>
  (await requestPlatform<{ items: AdminUserSummary[] }>("/api/admin/users")).items;

export const getAdminPlatformStats = () =>
  requestPlatform<AdminPlatformStats>("/api/admin/stats");

export const updateAdminUserRole = (
  userId: string,
  role: AssignableUserRole
) =>
  requestPlatform<AdminUserSummary>(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const updateAdminUserBan = (
  userId: string,
  payload: { banned: boolean; reason?: string }
) =>
  requestPlatform<AdminUserSummary>(`/api/admin/users/${encodeURIComponent(userId)}/ban`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminUser = (userId: string) =>
  requestPlatform<void>(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });

export const listAuditLogs = async () =>
  (await requestPlatform<{ items: AuditLogEntry[] }>("/api/admin/audit-logs")).items;

export const submitContentReport = (payload: ContentReportPayload) =>
  requestPlatform<ContentReportItem>("/api/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listContentReports = async () =>
  (await requestPlatform<{ items: ContentReportItem[] }>("/api/admin/reports")).items;
