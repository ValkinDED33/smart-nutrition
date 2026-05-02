import type {
  AccessOverview,
  AdminUserSummary,
  AuditLogEntry,
  CatalogProductItem,
  CatalogProductSubmissionPayload,
  CatalogSubmissionResponse,
} from "../types/platform";
import { getRemoteAuthBaseUrl } from "./auth";

export class PlatformApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "PlatformApiError";
    this.code = code;
  }
}

const requestPlatform = async <T>(
  pathname: string,
  options: RequestInit = {}
): Promise<T> => {
  const baseUrl = getRemoteAuthBaseUrl();

  if (!baseUrl) {
    throw new PlatformApiError(
      "BACKEND_UNAVAILABLE",
      "Cloud backend is unavailable for platform tools."
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
    throw new PlatformApiError(
      payload.code ?? "PLATFORM_REQUEST_FAILED",
      payload.message ?? "Platform request failed."
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

export const updateAdminUserRole = (
  userId: string,
  role: "USER" | "MODERATOR" | "ADMIN"
) =>
  requestPlatform<AdminUserSummary>(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const listAuditLogs = async () =>
  (await requestPlatform<{ items: AuditLogEntry[] }>("/api/admin/audit-logs")).items;
