import {
  PlatformApiError,
  createId,
  hasRoleAtLeast,
  isUserRole,
  toPublicUser,
} from "../lib/domain.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isStatus = (value) =>
  value === "pending" || value === "approved" || value === "rejected";

const isUnit = (value) => value === "g" || value === "ml" || value === "piece";

const normalizeText = (value, { maxLength = 160, fallback = "" } = {}) => {
  const nextValue = String(value ?? "").trim().replace(/\s+/g, " ");
  return nextValue ? nextValue.slice(0, maxLength) : fallback;
};

const normalizeOptionalText = (value, maxLength = 160) => {
  const nextValue = normalizeText(value, { maxLength });
  return nextValue || null;
};

const toFiniteNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const createPermissions = (role) => ({
  moderateContent: hasRoleAtLeast(role, "MODERATOR"),
  reviewReports: hasRoleAtLeast(role, "MODERATOR"),
  reviewCatalog: hasRoleAtLeast(role, "MODERATOR"),
  manageModerators: hasRoleAtLeast(role, "ADMIN"),
  manageAdmins: hasRoleAtLeast(role, "SUPER_ADMIN"),
  viewAuditLogs: hasRoleAtLeast(role, "ADMIN"),
  accessAdminCenter: hasRoleAtLeast(role, "MODERATOR"),
});

const assertModerationAccess = (user) => {
  if (!hasRoleAtLeast(user.role, "MODERATOR")) {
    throw new PlatformApiError("FORBIDDEN", "Moderator access is required.");
  }
};

const assertAdminAccess = (user) => {
  if (!hasRoleAtLeast(user.role, "ADMIN")) {
    throw new PlatformApiError("FORBIDDEN", "Admin access is required.");
  }
};

const normalizeStatusFilters = (status) => {
  if (Array.isArray(status)) {
    return status.filter(isStatus);
  }

  if (typeof status === "string" && status.trim().length > 0) {
    return status
      .split(",")
      .map((item) => item.trim())
      .filter(isStatus);
  }

  return [];
};

const buildCatalogNutrients = (payload, existingNutrients = {}) => {
  const nextNutrients = isRecord(payload?.nutrients)
    ? { ...existingNutrients, ...payload.nutrients }
    : { ...existingNutrients };

  const calories = toFiniteNumber(payload?.calories ?? nextNutrients.calories, NaN);
  const protein = toFiniteNumber(payload?.protein ?? nextNutrients.protein, NaN);
  const fat = toFiniteNumber(payload?.fat ?? nextNutrients.fat, NaN);
  const carbs = toFiniteNumber(payload?.carbs ?? nextNutrients.carbs, NaN);

  if (
    !Number.isFinite(calories) ||
    !Number.isFinite(protein) ||
    !Number.isFinite(fat) ||
    !Number.isFinite(carbs)
  ) {
    throw new PlatformApiError(
      "INVALID_FOOD_SUBMISSION",
      "Calories, protein, fat, and carbs are required."
    );
  }

  nextNutrients.calories = Math.max(calories, 0);
  nextNutrients.protein = Math.max(protein, 0);
  nextNutrients.fat = Math.max(fat, 0);
  nextNutrients.carbs = Math.max(carbs, 0);

  return nextNutrients;
};

const buildCatalogProduct = (payload, currentUser) => {
  const name = normalizeText(payload?.name, { maxLength: 160 });

  if (!name) {
    throw new PlatformApiError("INVALID_FOOD_SUBMISSION", "Product name is required.");
  }

  const now = new Date().toISOString();

  return {
    id: createId("food"),
    ownerUserId: currentUser.id,
    name,
    brand: normalizeOptionalText(payload?.brand, 120),
    barcode: normalizeOptionalText(payload?.barcode, 64),
    category: normalizeOptionalText(payload?.category, 120),
    imageUrl: normalizeOptionalText(payload?.imageUrl ?? payload?.photo, 500),
    unit: isUnit(payload?.unit) ? payload.unit : "g",
    source: "Manual",
    nutrients: buildCatalogNutrients(payload),
    facts: isRecord(payload?.facts) ? payload.facts : undefined,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
    approvedByUserId: null,
    rejectionReason: null,
    version: 1,
  };
};

const createCatalogVersionEntry = (product, editorUserId, note) => ({
  id: createId("food-version"),
  productId: product.id,
  version: product.version,
  editorUserId,
  note,
  snapshot: product,
  createdAt: product.updatedAt,
});

const createAuditDetails = (extra = {}) => ({
  ...extra,
});

export const createPlatformService = ({ platformRepository, config }) => {
  const writeAuditLog = ({
    actorUserId = null,
    actorRole = "USER",
    action,
    targetType = null,
    targetId = null,
    details = null,
  }) => {
    platformRepository.createAuditLog({
      id: createId("audit"),
      actorUserId,
      actorRole,
      action,
      targetType,
      targetId,
      details,
      createdAt: new Date().toISOString(),
    });
  };

  return {
    bootstrapAccessControl: () => {
      if (config.superAdminEmail) {
        platformRepository.promoteUserByEmailToSuperAdmin(config.superAdminEmail);
      }
    },

    getAccessOverview: (currentUser) => ({
      role: currentUser.role,
      permissions: createPermissions(currentUser.role),
      twoFactorEnabled: Boolean(currentUser.twoFactorEnabled),
      twoFactorRequired: Boolean(currentUser.twoFactorRequired),
    }),

    listVisibleCatalogProducts: (currentUser, query = {}) =>
      platformRepository.listCatalogProducts({
        viewerUserId: currentUser.id,
        includeUnapproved: false,
        statuses: normalizeStatusFilters(query.status),
        search: query.search ?? "",
        limit: Number(query.limit ?? 48),
      }),

    listOwnCatalogProducts: (currentUser, query = {}) =>
      platformRepository.listCatalogProducts({
        viewerUserId: currentUser.id,
        includeUnapproved: true,
        ownerUserId: currentUser.id,
        statuses: normalizeStatusFilters(query.status),
        search: query.search ?? "",
        limit: Number(query.limit ?? 48),
      }),

    submitCatalogProduct: (currentUser, payload) => {
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);

      const submissionsToday = platformRepository.countCatalogProductsByOwnerSince(
        currentUser.id,
        dayStart.toISOString()
      );

      if (submissionsToday >= config.productSubmissionDailyLimit) {
        throw new PlatformApiError(
          "SUBMISSION_LIMIT_REACHED",
          "You reached the daily product submission limit."
        );
      }

      const product = buildCatalogProduct(payload, currentUser);
      const possibleDuplicates = platformRepository.findCatalogDuplicateCandidates({
        name: product.name,
        barcode: product.barcode ?? "",
        limit: 6,
      });

      platformRepository.insertCatalogProduct(product);
      platformRepository.createCatalogProductVersion(
        createCatalogVersionEntry(product, currentUser.id, "submitted")
      );

      writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "catalog.product_submitted",
        targetType: "catalog_product",
        targetId: product.id,
        details: createAuditDetails({
          duplicateCount: possibleDuplicates.length,
          status: product.status,
        }),
      });

      return {
        item: product,
        possibleDuplicates,
      };
    },

    listModerationQueue: (currentUser, query = {}) => {
      assertModerationAccess(currentUser);

      return platformRepository.listCatalogProducts({
        viewerUserId: currentUser.id,
        includeUnapproved: true,
        statuses:
          normalizeStatusFilters(query.status).length > 0
            ? normalizeStatusFilters(query.status)
            : ["pending", "approved", "rejected"],
        search: query.search ?? "",
        limit: Number(query.limit ?? 80),
      });
    },

    reviewCatalogProduct: (currentUser, productId, payload) => {
      assertModerationAccess(currentUser);

      const existingProduct = platformRepository.findCatalogProductById(productId);

      if (!existingProduct) {
        throw new PlatformApiError("FOOD_NOT_FOUND", "Product submission was not found.");
      }

      const decision = payload?.decision === "reject" ? "reject" : "approve";
      const now = new Date().toISOString();
      const nextProduct = {
        ...existingProduct,
        name: normalizeText(payload?.name ?? existingProduct.name, { maxLength: 160 }),
        brand: normalizeOptionalText(payload?.brand ?? existingProduct.brand, 120),
        barcode: normalizeOptionalText(payload?.barcode ?? existingProduct.barcode, 64),
        category: normalizeOptionalText(payload?.category ?? existingProduct.category, 120),
        imageUrl: normalizeOptionalText(
          payload?.imageUrl ?? payload?.photo ?? existingProduct.imageUrl,
          500
        ),
        unit: isUnit(payload?.unit) ? payload.unit : existingProduct.unit,
        source: existingProduct.source,
        nutrients: buildCatalogNutrients(payload ?? {}, existingProduct.nutrients),
        facts: isRecord(payload?.facts) ? payload.facts : existingProduct.facts,
        status: decision === "approve" ? "approved" : "rejected",
        updatedAt: now,
        approvedAt: decision === "approve" ? now : null,
        approvedByUserId: decision === "approve" ? currentUser.id : null,
        rejectionReason:
          decision === "reject"
            ? normalizeOptionalText(payload?.reason ?? payload?.rejectionReason, 240)
            : null,
        version: existingProduct.version + 1,
      };

      platformRepository.updateCatalogProduct(nextProduct);
      platformRepository.createCatalogProductVersion(
        createCatalogVersionEntry(
          nextProduct,
          currentUser.id,
          decision === "approve" ? "approved" : "rejected"
        )
      );

      writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action:
          decision === "approve"
            ? "catalog.product_approved"
            : "catalog.product_rejected",
        targetType: "catalog_product",
        targetId: nextProduct.id,
        details: createAuditDetails({
          previousStatus: existingProduct.status,
          nextStatus: nextProduct.status,
          rejectionReason: nextProduct.rejectionReason,
        }),
      });

      return nextProduct;
    },

    listAuditLogs: (currentUser, query = {}) => {
      assertAdminAccess(currentUser);

      return platformRepository.listAuditLogs(Number(query.limit ?? 80));
    },

    listUsers: (currentUser) => {
      assertAdminAccess(currentUser);

      return platformRepository.listUsers().map((user) => ({
        ...toPublicUser(user),
        createdAt: user.createdAt,
      }));
    },

    updateUserRole: (currentUser, targetUserId, payload) => {
      assertAdminAccess(currentUser);

      const nextRole = payload?.role;

      if (!isUserRole(nextRole) || nextRole === "SUPER_ADMIN") {
        throw new PlatformApiError("INVALID_ROLE", "Role must be USER, MODERATOR, or ADMIN.");
      }

      const targetUser = platformRepository.findUserById(targetUserId);

      if (!targetUser) {
        throw new PlatformApiError("USER_NOT_FOUND", "Target user was not found.");
      }

      if (targetUser.role === "SUPER_ADMIN") {
        throw new PlatformApiError(
          "ROLE_CHANGE_NOT_ALLOWED",
          "The super admin account cannot be changed."
        );
      }

      if (currentUser.role === "ADMIN" && nextRole === "ADMIN") {
        throw new PlatformApiError(
          "ROLE_CHANGE_NOT_ALLOWED",
          "Only the super admin can assign admin access."
        );
      }

      if (currentUser.role === "ADMIN" && targetUser.role === "ADMIN") {
        throw new PlatformApiError(
          "ROLE_CHANGE_NOT_ALLOWED",
          "Admins cannot change other admins."
        );
      }

      const updatedUser = platformRepository.updateUserRole({
        userId: targetUserId,
        role: nextRole,
        twoFactorRequired: nextRole === "ADMIN",
      });

      writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "access.role_updated",
        targetType: "user",
        targetId: targetUserId,
        details: createAuditDetails({
          previousRole: targetUser.role,
          nextRole,
        }),
      });

      return {
        ...toPublicUser(updatedUser),
        createdAt: updatedUser.createdAt,
      };
    },
  };
};
