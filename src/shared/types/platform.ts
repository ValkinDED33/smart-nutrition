import type { Product } from "./product";
import type { User, UserRole } from "./user";

type ProductModerationStatus = "pending" | "approved" | "rejected";

export interface AccessOverview {
  role: UserRole;
  twoFactorEnabled: boolean;
  twoFactorRequired: boolean;
  permissions: {
    moderateContent: boolean;
    reviewReports: boolean;
    reviewCatalog: boolean;
    manageModerators: boolean;
    manageAdmins: boolean;
    banUsers: boolean;
    manageSystem: boolean;
    viewAuditLogs: boolean;
    accessAdminCenter: boolean;
  };
}

export interface CatalogProductItem extends Product {
  ownerUserId: string;
  status: ProductModerationStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedByUserId: string | null;
  rejectionReason: string | null;
  version: number;
}

export interface CatalogProductSubmissionPayload {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  brand?: string;
  barcode?: string;
  category?: string;
  imageUrl?: string;
  unit?: "g" | "ml" | "piece";
}

export interface CatalogSubmissionResponse {
  item: CatalogProductItem;
  possibleDuplicates: CatalogProductItem[];
}

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  actorRole: UserRole;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserSummary extends User {
  createdAt: string;
}

export interface AdminPlatformStats {
  usersTotal: number;
  usersActive: number;
  usersNewThisWeek: number;
  usersBanned: number;
  aiRequestsTotal: number;
  productsTotal: number;
  productsPending: number;
  reportsOpen: number;
  suspiciousAccounts: number;
  photoAnalysesTotal: number;
}

export interface ContentReportItem {
  id: string;
  reporterUserId: string | null;
  reporterName: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: "open" | "reviewed";
  createdAt: string;
}

export interface ContentReportPayload {
  targetType: "post" | "comment" | "progress" | "recipe" | "meal";
  targetId: string;
  reason: string;
  reporterName?: string;
}
