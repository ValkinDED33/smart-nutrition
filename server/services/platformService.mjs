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

const clampNumber = (value, { min = 0, max = 100000 } = {}) =>
  Math.min(Math.max(value, min), max);

const readListLimit = (value, { fallback = 48, max = 120 } = {}) => {
  const nextValue = Math.trunc(Number(value));

  if (!Number.isFinite(nextValue)) {
    return fallback;
  }

  return clampNumber(nextValue, { min: 1, max });
};

const normalizeSearchQuery = (value) => normalizeText(value, { maxLength: 120 });

const normalizeImageUrl = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const nextValue = value.trim();

  if (!nextValue || nextValue.length > 512000) {
    return null;
  }

  if (/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(nextValue)) {
    return nextValue;
  }

  if (nextValue.length > 500) {
    return null;
  }

  try {
    const url = new URL(nextValue);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
};

const createPermissions = (role) => ({
  moderateContent: role === "NUTRITIONIST" || hasRoleAtLeast(role, "MODERATOR"),
  reviewReports: hasRoleAtLeast(role, "MODERATOR"),
  reviewCatalog: role === "NUTRITIONIST" || hasRoleAtLeast(role, "MODERATOR"),
  manageModerators: hasRoleAtLeast(role, "ADMIN"),
  manageAdmins: hasRoleAtLeast(role, "SUPER_ADMIN"),
  banUsers: hasRoleAtLeast(role, "ADMIN"),
  manageSystem: hasRoleAtLeast(role, "ADMIN"),
  viewAuditLogs: hasRoleAtLeast(role, "ADMIN"),
  accessAdminCenter: role === "NUTRITIONIST" || hasRoleAtLeast(role, "MODERATOR"),
});

const assertModerationAccess = (user) => {
  if (user.role !== "NUTRITIONIST" && !hasRoleAtLeast(user.role, "MODERATOR")) {
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

  nextNutrients.calories = clampNumber(calories);
  nextNutrients.protein = clampNumber(protein);
  nextNutrients.fat = clampNumber(fat);
  nextNutrients.carbs = clampNumber(carbs);

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
    imageUrl: normalizeImageUrl(payload?.imageUrl ?? payload?.photo),
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

const isReportTargetType = (value) =>
  value === "post" ||
  value === "comment" ||
  value === "progress" ||
  value === "recipe" ||
  value === "meal";

const mapAuditLogToContentReport = (entry) => ({
  id: entry.id,
  reporterUserId: entry.actorUserId ?? null,
  reporterName: normalizeText(entry.details?.reporterName, {
    maxLength: 80,
    fallback: "Smart User",
  }),
  targetType: normalizeText(entry.targetType, { maxLength: 40, fallback: "content" }),
  targetId: normalizeText(entry.targetId, { maxLength: 96 }),
  reason: normalizeText(entry.details?.reason, {
    maxLength: 600,
    fallback: "Content reported by user.",
  }),
  status: "open",
  createdAt: entry.createdAt,
});

export const createPlatformService = ({ platformRepository, config, cacheRepository = null }) => {
  const withCache = async (key, ttlSeconds, producer) => {
    if (!cacheRepository?.enabled) {
      return producer();
    }

    const cachedValue = await cacheRepository.getJson(key).catch(() => null);

    if (cachedValue !== null) {
      return cachedValue;
    }

    const nextValue = await producer();
    await cacheRepository.setJson(key, nextValue, ttlSeconds).catch(() => false);
    return nextValue;
  };

  const writeAuditLog = async ({
    actorUserId = null,
    actorRole = "USER",
    action,
    targetType = null,
    targetId = null,
    details = null,
  }) => {
    await platformRepository.createAuditLog({
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
    bootstrapAccessControl: async () => {
      if (config.superAdminEmail) {
        await platformRepository.promoteUserByEmailToSuperAdmin(config.superAdminEmail);
      }
    },

    getAccessOverview: (currentUser) => ({
      role: currentUser.role,
      permissions: createPermissions(currentUser.role),
      twoFactorEnabled: Boolean(currentUser.twoFactorEnabled),
      twoFactorRequired: Boolean(currentUser.twoFactorRequired),
    }),

    listVisibleCatalogProducts: async (currentUser, query = {}) => {
      const options = {
        viewerUserId: currentUser.id,
        includeUnapproved: false,
        statuses: normalizeStatusFilters(query.status),
        search: normalizeSearchQuery(query.search),
        limit: readListLimit(query.limit),
      };
      const cacheKey = `catalog:visible:${JSON.stringify(options)}`;

      return withCache(cacheKey, config.catalogCacheTtlSeconds ?? 60, () =>
        platformRepository.listCatalogProducts(options)
      );
    },

    listOwnCatalogProducts: async (currentUser, query = {}) =>
      platformRepository.listCatalogProducts({
        viewerUserId: currentUser.id,
        includeUnapproved: true,
        ownerUserId: currentUser.id,
        statuses: normalizeStatusFilters(query.status),
        search: normalizeSearchQuery(query.search),
        limit: readListLimit(query.limit),
      }),

    findCatalogDuplicates: async (currentUser, query = {}) => {
      const options = {
        name: normalizeSearchQuery(query.name ?? query.search),
        barcode: normalizeSearchQuery(query.barcode),
        limit: readListLimit(query.limit, { fallback: 6, max: 12 }),
      };
      const candidates = await withCache(
        `catalog:duplicates:${JSON.stringify(options)}`,
        config.catalogCacheTtlSeconds ?? 60,
        () => platformRepository.findCatalogDuplicateCandidates(options)
      );

      return candidates.filter(
        (product) =>
          product.status === "approved" || product.ownerUserId === currentUser.id
      );
    },

    submitCatalogProduct: async (currentUser, payload) => {
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);

      const submissionsToday = await platformRepository.countCatalogProductsByOwnerSince(
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
      const possibleDuplicates = await platformRepository.findCatalogDuplicateCandidates({
        name: product.name,
        barcode: product.barcode ?? "",
        limit: 6,
      });

      await platformRepository.insertCatalogProduct(product);
      await platformRepository.createCatalogProductVersion(
        createCatalogVersionEntry(product, currentUser.id, "submitted")
      );

      await writeAuditLog({
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

    listModerationQueue: async (currentUser, query = {}) => {
      assertModerationAccess(currentUser);
      const statuses = normalizeStatusFilters(query.status);

      return platformRepository.listCatalogProducts({
        viewerUserId: currentUser.id,
        includeUnapproved: true,
        statuses: statuses.length > 0 ? statuses : ["pending", "approved", "rejected"],
        search: normalizeSearchQuery(query.search),
        limit: readListLimit(query.limit, { fallback: 80, max: 160 }),
      });
    },

    reviewCatalogProduct: async (currentUser, productId, payload) => {
      assertModerationAccess(currentUser);

      const existingProduct = await platformRepository.findCatalogProductById(productId);

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
        imageUrl: normalizeImageUrl(
          payload?.imageUrl ?? payload?.photo ?? existingProduct.imageUrl
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

      const updatedProduct = await platformRepository.updateCatalogProduct(nextProduct);
      await platformRepository.createCatalogProductVersion(
        createCatalogVersionEntry(
          updatedProduct ?? nextProduct,
          currentUser.id,
          decision === "approve" ? "approved" : "rejected"
        )
      );

      await writeAuditLog({
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

      return updatedProduct ?? nextProduct;
    },

    listAuditLogs: async (currentUser, query = {}) => {
      assertAdminAccess(currentUser);

      return platformRepository.listAuditLogs(
        readListLimit(query.limit, { fallback: 80, max: 200 })
      );
    },

    createContentReport: async (currentUser, payload) => {
      const targetType = isReportTargetType(payload?.targetType)
        ? payload.targetType
        : "post";
      const targetId = normalizeText(payload?.targetId, { maxLength: 96 });
      const reason = normalizeText(payload?.reason, { maxLength: 600 });

      if (!targetId || !reason) {
        throw new PlatformApiError(
          "INVALID_CONTENT_REPORT",
          "Report target and reason are required."
        );
      }

      const entry = {
        id: createId("report"),
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: "content.report_created",
        targetType,
        targetId,
        details: {
          reason,
          reporterName: normalizeText(payload?.reporterName ?? currentUser.name, {
            maxLength: 80,
            fallback: "Smart User",
          }),
        },
        createdAt: new Date().toISOString(),
      };

      await platformRepository.createAuditLog(entry);
      return mapAuditLogToContentReport(entry);
    },

    listContentReports: async (currentUser, query = {}) => {
      assertModerationAccess(currentUser);

      return (await platformRepository.listAuditLogs(
        readListLimit(query.limit, { fallback: 80, max: 200 })
      ))
        .filter((entry) => entry.action === "content.report_created")
        .map(mapAuditLogToContentReport);
    },

    listUsers: async (currentUser) => {
      assertAdminAccess(currentUser);

      return (await platformRepository.listUsers()).map((user) => ({
        ...toPublicUser(user),
        createdAt: user.createdAt,
      }));
    },

    updateUserRole: async (currentUser, targetUserId, payload) => {
      assertAdminAccess(currentUser);

      const nextRole = payload?.role;

      if (!isUserRole(nextRole) || nextRole === "SUPER_ADMIN") {
        throw new PlatformApiError(
          "INVALID_ROLE",
          "Role must be USER, VERIFIED_USER, NUTRITIONIST, MODERATOR, or ADMIN."
        );
      }

      const targetUser = await platformRepository.findUserById(targetUserId);

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

      const updatedUser = await platformRepository.updateUserRole({
        userId: targetUserId,
        role: nextRole,
        twoFactorRequired: nextRole === "ADMIN",
      });

      await writeAuditLog({
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

    updateUserBan: async (currentUser, targetUserId, payload) => {
      assertAdminAccess(currentUser);

      const targetUser = await platformRepository.findUserById(targetUserId);

      if (!targetUser) {
        throw new PlatformApiError("USER_NOT_FOUND", "Target user was not found.");
      }

      if (targetUser.role === "SUPER_ADMIN" || targetUser.id === currentUser.id) {
        throw new PlatformApiError(
          "ROLE_CHANGE_NOT_ALLOWED",
          "This account cannot be banned from the admin center."
        );
      }

      if (currentUser.role === "ADMIN" && targetUser.role === "ADMIN") {
        throw new PlatformApiError(
          "ROLE_CHANGE_NOT_ALLOWED",
          "Admins cannot ban other admins."
        );
      }

      const shouldBan = Boolean(payload?.banned);
      const reason = shouldBan
        ? normalizeOptionalText(payload?.reason ?? "Admin action", 240) ?? "Admin action"
        : null;
      const updatedUser = await platformRepository.updateUserBan({
        userId: targetUserId,
        bannedAt: shouldBan ? new Date().toISOString() : null,
        bannedReason: reason,
      });

      await writeAuditLog({
        actorUserId: currentUser.id,
        actorRole: currentUser.role,
        action: shouldBan ? "access.user_banned" : "access.user_unbanned",
        targetType: "user",
        targetId: targetUserId,
        details: createAuditDetails({
          reason,
        }),
      });

      return {
        ...toPublicUser(updatedUser),
        createdAt: updatedUser.createdAt,
      };
    },
  };
};
