import { MongoClient } from "mongodb";
import { promises as fs } from "node:fs";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import {
  calculateMealTotalNutrients,
  createInitialCommunityState,
  createInitialFridgeState,
  createInitialMealState,
  createInitialProfileState,
  createInitialWaterState,
  isUserRole,
  normalizeCompanionState,
  StateApiError,
} from "../lib/domain.mjs";

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isVerificationChannel = (value) => value === "email";
const isAppLanguage = (value) => value === "uk" || value === "pl" || value === "en";
const isProductModerationStatus = (value) =>
  value === "pending" || value === "approved" || value === "rejected";
const isAssistantMessageRole = (value) => value === "user" || value === "assistant";
const isAiUsageEventType = (value) =>
  value === "completed" || value === "blocked" || value === "failed";
const isUnit = (value) => value === "g" || value === "ml" || value === "piece";
const isSource = (value) =>
  value === "USDA" || value === "OpenFoodFacts" || value === "Manual" || value === "Recipe";
const mongoRoleByAppRole = {
  USER: "user",
  VERIFIED_USER: "user",
  HELPER: "moderator",
  NUTRITIONIST: "moderator",
  MODERATOR: "moderator",
  ADMIN: "admin",
  OWNER: "admin",
  SUPER_ADMIN: "admin",
};
const appRoleByMongoRole = {
  user: "USER",
  moderator: "MODERATOR",
  admin: "ADMIN",
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error) =>
  error instanceof Error ? error.message : "Unknown MongoDB connection error";

const toTrimmedString = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toNonNegativeInteger = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? Math.max(Math.round(next), 0) : fallback;
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? next : fallback;
};

const toAppUserRole = (value, fallback = "USER") => {
  if (isUserRole(value)) {
    return value;
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  return appRoleByMongoRole[normalized] ?? fallback;
};

const toMongoUserRole = (value, fallback = "user") => {
  if (isUserRole(value)) {
    return mongoRoleByAppRole[value] ?? fallback;
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  return appRoleByMongoRole[normalized] ? normalized : fallback;
};

const createMongoRoleQuery = (role) => {
  const appRole = toAppUserRole(role);

  if (appRole === "OWNER" || appRole === "SUPER_ADMIN") {
    return {
      $or: [
        { appRole: "OWNER" },
        { appRole: "SUPER_ADMIN" },
        { role: "OWNER" },
        { role: "SUPER_ADMIN" },
      ],
    };
  }

  return {
    $or: [
      { appRole },
      { role: appRole },
      {
        role: toMongoUserRole(appRole),
        appRole: { $exists: false },
      },
    ],
  };
};

const normalizeTextToken = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const stripUndefined = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, stripUndefined(entryValue)])
  );
};

const parseJson = (value, fallback) => {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mapUserDoc = (doc) => {
  if (!doc) {
    return null;
  }

  const appRole = toAppUserRole(doc.appRole ?? doc.role);

  return {
    id: doc.id,
    email: doc.email,
    name: doc.name,
    emailVerified: doc.emailVerified !== false,
    verificationChannel: isVerificationChannel(doc.verificationChannel)
      ? doc.verificationChannel
      : "email",
    avatar: doc.avatar ?? undefined,
    age: Number(doc.age),
    weight: Number(doc.weight),
    height: Number(doc.height),
    gender: doc.gender,
    activity: doc.activity,
    goal: doc.goal,
    languagePreference: isAppLanguage(doc.languagePreference) ? doc.languagePreference : "uk",
    measurements: doc.measurements,
    createdAt: doc.createdAt,
    lastSessionAt: doc.lastSessionAt ?? null,
    hasActiveSession: Boolean(doc.hasActiveSession),
    role: appRole,
    communityStatus: doc.communityStatus,
    reputationScore: toNonNegativeNumber(doc.reputationScore, 0),
    bannedAt: doc.bannedAt ?? null,
    bannedReason: doc.bannedReason ?? null,
    twoFactorEnabled: Boolean(doc.twoFactorEnabled),
    twoFactorRequired: Boolean(doc.twoFactorRequired),
    telegramChatId: doc.telegramChatId ?? null,
    telegramConnectedAt: doc.telegramConnectedAt ?? null,
    medicationReminders: Array.isArray(doc.medicationReminders)
      ? doc.medicationReminders
      : [],
    tokenVersion: Math.max(toNumber(doc.tokenVersion, 0), 0),
    passwordHash: doc.passwordHash,
    passwordSalt: doc.passwordSalt,
    passwordVersion: doc.passwordVersion,
  };
};

const mapSessionDoc = (doc) =>
  doc
    ? {
        token: doc.token,
        userId: doc.userId,
        expiresAt: Number(doc.expiresAt),
      }
    : null;

const mapPasswordResetTokenDoc = (doc) =>
  doc
    ? {
        id: doc.id,
        userId: doc.userId,
        tokenHash: doc.tokenHash,
        expiresAt: Number(doc.expiresAt),
        consumedAt: doc.consumedAt ?? null,
        createdAt: doc.createdAt,
      }
    : null;

const mapRegistrationVerificationTokenDoc = (doc) =>
  doc
    ? {
        id: doc.id,
        userId: doc.userId,
        channel: isVerificationChannel(doc.channel) ? doc.channel : "email",
        target: doc.target,
        codeHash: doc.codeHash,
        expiresAt: Number(doc.expiresAt),
        consumedAt: doc.consumedAt ?? null,
        createdAt: doc.createdAt,
      }
    : null;

const mapLoginAttemptDoc = (doc) =>
  doc
    ? {
        email: doc.email,
        count: Number(doc.count),
        lockUntil: doc.lockUntil === null || doc.lockUntil === undefined ? null : Number(doc.lockUntil),
      }
    : null;

const mapAuditLogDoc = (doc) =>
  doc
    ? {
        id: doc.id,
        actorUserId: doc.actorUserId ?? null,
        actorRole: isUserRole(doc.actorRole) ? doc.actorRole : "USER",
        action: doc.action,
        targetType: doc.targetType ?? null,
        targetId: doc.targetId ?? null,
        details: doc.details ?? null,
        createdAt: doc.createdAt,
      }
    : null;

const mapCatalogProductDoc = (doc) =>
  doc
    ? {
        id: doc.id,
        ownerUserId: doc.ownerUserId,
        name: doc.name,
        brand: doc.brand ?? undefined,
        barcode: doc.barcode ?? undefined,
        category: doc.category ?? undefined,
        imageUrl: doc.imageUrl ?? undefined,
        unit: isUnit(doc.unit) ? doc.unit : "g",
        source: isSource(doc.source) ? doc.source : "Manual",
        nutrients: isRecord(doc.nutrients) ? doc.nutrients : {},
        facts: isRecord(doc.facts) ? doc.facts : undefined,
        status: isProductModerationStatus(doc.status) ? doc.status : "pending",
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        approvedAt: doc.approvedAt ?? null,
        approvedByUserId: doc.approvedByUserId ?? null,
        rejectionReason: doc.rejectionReason ?? null,
        version: Math.max(Number(doc.version ?? 1), 1),
      }
    : null;

const mapAssistantMessageDoc = (doc) =>
  doc
    ? {
        id: doc.id,
        userId: doc.userId,
        role: isAssistantMessageRole(doc.role) ? doc.role : "assistant",
        text: String(doc.text ?? ""),
        createdAt: doc.createdAt,
      }
    : null;

const mapAiUsageEventDoc = (doc) =>
  doc
    ? {
        id: doc.id,
        userId: doc.userId,
        route: String(doc.route ?? "ai"),
        eventType: isAiUsageEventType(doc.eventType) ? doc.eventType : "completed",
        promptTokens: toNonNegativeInteger(doc.promptTokens),
        completionTokens: toNonNegativeInteger(doc.completionTokens),
        totalTokens: toNonNegativeInteger(doc.totalTokens),
        estimatedCostUsd: toNonNegativeNumber(doc.estimatedCostUsd),
        providerId: doc.providerId ?? null,
        blockedReason: doc.blockedReason ?? null,
        createdAt: doc.createdAt,
      }
    : null;

const normalizeProduct = (value, fallbackIdPrefix = "product") => {
  const record = isRecord(value) ? value : {};

  return {
    id:
      typeof record.id === "string" && record.id.trim().length > 0
        ? record.id
        : `${fallbackIdPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name:
      typeof record.name === "string" && record.name.trim().length > 0
        ? record.name
        : "Unknown product",
    unit: isUnit(record.unit) ? record.unit : "g",
    source: isSource(record.source) ? record.source : "Manual",
    nutrients: isRecord(record.nutrients) ? record.nutrients : {},
    brand:
      typeof record.brand === "string" && record.brand.trim().length > 0
        ? record.brand
        : undefined,
    barcode:
      typeof record.barcode === "string" && record.barcode.trim().length > 0
        ? record.barcode
        : undefined,
    category:
      typeof record.category === "string" && record.category.trim().length > 0
        ? record.category
        : undefined,
    imageUrl:
      typeof record.imageUrl === "string" && record.imageUrl.trim().length > 0
        ? record.imageUrl
        : undefined,
    facts: isRecord(record.facts) ? record.facts : undefined,
  };
};

const createProductKey = (product) =>
  product?.barcode?.replace(/\D/g, "") ||
  product?.id ||
  `${product?.name ?? "product"}:${product?.brand ?? ""}`.toLowerCase();

const normalizeMealEntries = (value) =>
  Array.isArray(value)
    ? value
        .map((item, index) => {
          if (!isRecord(item)) {
            return null;
          }

          return {
            id:
              typeof item.id === "string" && item.id.trim().length > 0
                ? item.id
                : `meal-${index}-${Date.now()}`,
            product: normalizeProduct(item.product, "meal-product"),
            quantity: toNumber(item.quantity, 100),
            mealType: ["breakfast", "lunch", "dinner", "snack"].includes(item.mealType)
              ? item.mealType
              : "snack",
            eatenAt:
              typeof item.eatenAt === "string" && item.eatenAt.trim().length > 0
                ? item.eatenAt
                : new Date().toISOString(),
            origin: ["manual", "barcode", "recipe"].includes(item.origin) ? item.origin : "manual",
          };
        })
        .filter(Boolean)
    : [];

const normalizeMealTemplates = (value) =>
  Array.isArray(value)
    ? value
        .map((template, index) => {
          if (!isRecord(template)) {
            return null;
          }

          return {
            id:
              typeof template.id === "string" && template.id.trim().length > 0
                ? template.id
                : `template-${index}-${Date.now()}`,
            name:
              typeof template.name === "string" && template.name.trim().length > 0
                ? template.name
                : "Meal template",
            mealType: ["breakfast", "lunch", "dinner", "snack"].includes(template.mealType)
              ? template.mealType
              : "snack",
            createdAt:
              typeof template.createdAt === "string" && template.createdAt.trim().length > 0
                ? template.createdAt
                : new Date().toISOString(),
            items: Array.isArray(template.items)
              ? template.items
                  .map((item) =>
                    isRecord(item)
                      ? {
                          product: normalizeProduct(item.product, "template-product"),
                          quantity: toNumber(item.quantity, 100),
                        }
                      : null
                  )
                  .filter(Boolean)
              : [],
          };
        })
        .filter(Boolean)
    : [];

const normalizeProductCollection = (value, prefix) =>
  Array.isArray(value)
    ? value.map((item, index) => normalizeProduct(item, `${prefix}-${index}`))
    : [];

const normalizeMealState = (value) => {
  const fallback = createInitialMealState();
  const record = isRecord(value) ? value : {};
  const items = normalizeMealEntries(record.items);

  return {
    ...fallback,
    ...record,
    items,
    templates: normalizeMealTemplates(record.templates),
    totalNutrients: calculateMealTotalNutrients(items),
    savedProducts: normalizeProductCollection(record.savedProducts, "saved"),
    recentProducts: normalizeProductCollection(record.recentProducts, "recent"),
    personalBarcodeProducts: normalizeProductCollection(record.personalBarcodeProducts, "barcode"),
  };
};

const normalizeProfileState = (value, user) => {
  const fallback = createInitialProfileState(user);
  const record = isRecord(value) ? value : {};
  const assistant = isRecord(record.assistant) ? record.assistant : {};
  const onboarding = isRecord(assistant.onboarding) ? assistant.onboarding : {};
  const assistantMemory = isRecord(assistant.assistantMemory)
    ? assistant.assistantMemory
    : {};

  return {
    ...fallback,
    ...record,
    assistant: {
      ...fallback.assistant,
      ...assistant,
      onboarding: {
        ...fallback.assistant.onboarding,
        ...onboarding,
      },
      assistantMemory: {
        ...fallback.assistant.assistantMemory,
        ...assistantMemory,
      },
    },
  };
};

const normalizeWaterState = (value) => ({
  ...createInitialWaterState(),
  ...(isRecord(value) ? value : {}),
});

const normalizeFridgeState = (value) => ({
  ...createInitialFridgeState(),
  ...(isRecord(value) ? value : {}),
});

const normalizeCommunityState = (value) => ({
  ...createInitialCommunityState(),
  ...(isRecord(value) ? value : {}),
});

const normalizeSnapshotForUser = (snapshot, user) => ({
  profile: normalizeProfileState(snapshot?.profile, user),
  meal: normalizeMealState(snapshot?.meal),
  water: normalizeWaterState(snapshot?.water),
  fridge: normalizeFridgeState(snapshot?.fridge),
  community: normalizeCommunityState(snapshot?.community),
  companion: normalizeCompanionState(snapshot?.companion),
});

const normalizeSyncContext = (syncContext = undefined) => ({
  baseVersion:
    typeof syncContext?.baseVersion === "string" && syncContext.baseVersion.trim().length > 0
      ? syncContext.baseVersion.trim()
      : null,
  deviceId:
    typeof syncContext?.deviceId === "string" && syncContext.deviceId.trim().length > 0
      ? syncContext.deviceId.trim().slice(0, 96)
      : null,
});

const matchesCatalogSearch = (product, search) => {
  const normalizedSearch = String(search ?? "").trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return normalizedSearch
    .split(/\s+/)
    .every((token) =>
      `${product.name} ${product.brand ?? ""} ${product.barcode ?? ""} ${product.category ?? ""}`
        .toLowerCase()
        .includes(token)
    );
};

const getMongoUriFromEnv = () =>
  toTrimmedString(process.env.SMART_NUTRITION_MONGO_URI) ||
  toTrimmedString(process.env.SMART_NUTRITION_MONGODB_URI ?? process.env.MONGODB_URI) ||
  null;

const getMongoHostLabel = (mongoUri) => {
  try {
    return new URL(mongoUri).host || "unknown";
  } catch {
    return "unknown";
  }
};

async function connectMongo(config = {}) {
  const mongoUri = toTrimmedString(config.mongoUri) || getMongoUriFromEnv();

  if (!mongoUri) {
    throw new Error("SMART_NUTRITION_MONGO_URI is missing");
  }

  const client = new MongoClient(mongoUri, {
    appName: config.mongoAppName ?? "smart-nutrition-api",
    serverSelectionTimeoutMS: config.mongoServerSelectionTimeoutMs ?? 5000,
    connectTimeoutMS: config.mongoConnectTimeoutMs ?? 10000,
    socketTimeoutMS: config.mongoSocketTimeoutMs ?? 45000,
    minPoolSize: config.mongoMinPoolSize ?? 0,
    maxPoolSize: config.mongoMaxPoolSize ?? 10,
    retryReads: true,
    retryWrites: true,
  });
  const maxAttempts = Math.max(Number(config.mongoConnectRetries) || 1, 1);
  const retryDelayMs = Math.max(Number(config.mongoConnectRetryDelayMs) || 0, 0);
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await client.connect();
      const database = client.db(config.mongoDatabaseName ?? "smart-nutrition");
      await database.command({ ping: 1 });
      config.logger?.info?.("[mongodb] storage connected", {
        database: database.databaseName,
        host: getMongoHostLabel(mongoUri),
      });
      return { client, database };
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts) {
        break;
      }

      console.warn(
        `MongoDB connection attempt ${attempt}/${maxAttempts} failed: ${getErrorMessage(
          error
        )}. Retrying...`
      );
      await wait(retryDelayMs * attempt);
    }
  }

  await client.close().catch(() => {});
  throw new Error(`MongoDB connection error: ${getErrorMessage(lastError)}`);
}

export const createMongoStorage = async (config) => {
  await fs.mkdir(config.backupDir, { recursive: true });

  const { client, database } = await connectMongo({
    ...config,
    mongoAppName: "smart-nutrition-api",
  });

  const collections = {
    users: database.collection("users"),
    sessions: database.collection("sessions"),
    states: database.collection("states"),
    profiles: database.collection("profiles"),
    meals: database.collection("meals"),
    passwordResetTokens: database.collection("password_reset_tokens"),
    registrationVerificationTokens: database.collection("registration_verification_tokens"),
    loginAttempts: database.collection("login_attempts"),
    auditLogs: database.collection("audit_logs"),
    catalogProducts: database.collection("catalog_products"),
    catalogProductVersions: database.collection("catalog_product_versions"),
    assistantMessages: database.collection("assistant_messages"),
    aiRequests: database.collection("aiRequests"),
  };

  await Promise.all([
    collections.users.createIndex({ id: 1 }, { unique: true }),
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.users.createIndex({ role: 1 }),
    collections.users.createIndex(
      { telegramChatId: 1 },
      { unique: true, sparse: true }
    ),
    collections.sessions.createIndex({ token: 1 }, { unique: true }),
    collections.sessions.createIndex({ userId: 1 }),
    collections.sessions.createIndex({ expiresAt: 1 }),
    collections.states.createIndex({ userId: 1 }, { unique: true }),
    collections.profiles.createIndex({ userId: 1 }, { unique: true }),
    collections.meals.createIndex({ userId: 1 }, { unique: true }),
    collections.passwordResetTokens.createIndex({ tokenHash: 1 }, { unique: true }),
    collections.passwordResetTokens.createIndex({ userId: 1, expiresAt: 1 }),
    collections.registrationVerificationTokens.createIndex({ codeHash: 1 }, { unique: true }),
    collections.registrationVerificationTokens.createIndex({ userId: 1, expiresAt: 1 }),
    collections.loginAttempts.createIndex({ email: 1 }, { unique: true }),
    collections.auditLogs.createIndex({ createdAt: -1 }),
    collections.catalogProducts.createIndex({ id: 1 }, { unique: true }),
    collections.catalogProducts.createIndex({ ownerUserId: 1, updatedAt: -1 }),
    collections.catalogProducts.createIndex({ status: 1, updatedAt: -1 }),
    collections.catalogProducts.createIndex({ barcode: 1 }),
    collections.catalogProductVersions.createIndex({ productId: 1, version: -1 }),
    collections.assistantMessages.createIndex({ id: 1 }, { unique: true }),
    collections.assistantMessages.createIndex({ userId: 1, createdAt: -1 }),
    collections.aiRequests.createIndex({ id: 1 }, { unique: true }),
    collections.aiRequests.createIndex({ userId: 1, createdAt: -1 }),
    collections.aiRequests.createIndex({ route: 1, createdAt: -1 }),
  ]);

  const userRoleBackfillOps = (await collections.users.find({}).toArray())
    .map((doc) => {
      const appRole = toAppUserRole(doc.appRole ?? doc.role);
      const role = toMongoUserRole(appRole);

      if (doc.role === role && doc.appRole === appRole) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: {
              role,
              appRole,
            },
          },
        },
      };
    })
    .filter(Boolean);

  if (userRoleBackfillOps.length > 0) {
    await collections.users.bulkWrite(userRoleBackfillOps);
  }

  const backupWriteTracker = new Map();

  const pruneUserBackups = (userId) => {
    const userBackupDir = path.join(config.backupDir, userId);

    try {
      const backupFiles = readdirSync(userBackupDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => ({
          name: entry.name,
          fullPath: path.join(userBackupDir, entry.name),
          mtimeMs: statSync(path.join(userBackupDir, entry.name)).mtimeMs,
        }))
        .sort((left, right) => right.mtimeMs - left.mtimeMs);

      backupFiles.slice(config.maxBackupFilesPerUser).forEach((file) => {
        rmSync(file.fullPath, { force: true });
      });
    } catch {
      // Missing backup directories are expected for new MongoDB users.
    }
  };

  const writeBackupSnapshot = (
    userId,
    snapshot,
    reason,
    updatedAt = new Date().toISOString()
  ) => {
    const now = Date.now();
    const lastBackupAt = backupWriteTracker.get(userId) ?? 0;

    if (reason !== "account-created" && now - lastBackupAt < config.backupIntervalMs) {
      return;
    }

    backupWriteTracker.set(userId, now);

    const userBackupDir = path.join(config.backupDir, userId);
    mkdirSync(userBackupDir, { recursive: true });

    const fileName = `${updatedAt.replace(/[:.]/g, "-")}-${reason}.json`;

    writeFileSync(
      path.join(userBackupDir, fileName),
      JSON.stringify(
        {
          userId,
          reason,
          updatedAt,
          snapshot,
        },
        null,
        2
      ),
      "utf8"
    );

    pruneUserBackups(userId);
  };

  const removeUserBackups = (userId) => {
    backupWriteTracker.delete(userId);
    rmSync(path.join(config.backupDir, userId), { recursive: true, force: true });
  };

  const getUserBackupEntries = (userId) => {
    const userBackupDir = path.join(config.backupDir, userId);

    try {
      return readdirSync(userBackupDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => {
          const fullPath = path.join(userBackupDir, entry.name);
          const fileStats = statSync(fullPath);
          const parsed = parseJson(readFileSync(fullPath, "utf8"), null);

          return {
            id: entry.name,
            name: entry.name,
            reason:
              typeof parsed?.reason === "string" && parsed.reason.trim().length > 0
                ? parsed.reason
                : "snapshot",
            updatedAt:
              typeof parsed?.updatedAt === "string" && parsed.updatedAt.trim().length > 0
                ? parsed.updatedAt
                : new Date(fileStats.mtimeMs).toISOString(),
            sizeBytes: fileStats.size,
            fullPath,
          };
        })
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    } catch {
      return [];
    }
  };

  const readUserBackupPayload = (userId, backupId = undefined) => {
    const backups = getUserBackupEntries(userId);
    const selectedBackup =
      typeof backupId === "string" && backupId.trim().length > 0
        ? backups.find((backup) => backup.id === backupId.trim())
        : backups[0];

    if (!selectedBackup) {
      return null;
    }

    return {
      ...selectedBackup,
      payload: parseJson(readFileSync(selectedBackup.fullPath, "utf8"), null),
    };
  };

  const getResolvedUser = async (userId) =>
    mapUserDoc(await collections.users.findOne({ id: userId }));

  const getSnapshotMeta = async (userId) => {
    const stateDoc = await collections.states.findOne({ userId });

    return {
      updatedAt: stateDoc?.updatedAt ?? null,
      profileUpdatedAt: stateDoc?.profileUpdatedAt ?? stateDoc?.updatedAt ?? null,
      mealUpdatedAt: stateDoc?.mealUpdatedAt ?? stateDoc?.updatedAt ?? null,
      waterUpdatedAt: stateDoc?.waterUpdatedAt ?? stateDoc?.updatedAt ?? null,
      backupEnabled: stateDoc?.backupEnabled !== false,
      lastWriterDeviceId: stateDoc?.lastWriterDeviceId ?? null,
    };
  };

  const assertNoStateConflict = async (userId, syncContext = undefined) => {
    const normalizedSyncContext = normalizeSyncContext(syncContext);

    if (!normalizedSyncContext.baseVersion) {
      return normalizedSyncContext;
    }

    const meta = await getSnapshotMeta(userId);

    if (meta.updatedAt && meta.updatedAt !== normalizedSyncContext.baseVersion) {
      throw new StateApiError(
        "STATE_CONFLICT",
        "Cloud data changed on another device. Pull the latest cloud state before retrying.",
        { meta }
      );
    }

    return normalizedSyncContext;
  };

  const updateSnapshotMeta = async (
    userId,
    {
      updatedAt,
      profileUpdatedAt = undefined,
      mealUpdatedAt = undefined,
      waterUpdatedAt = undefined,
      deviceId = undefined,
    }
  ) => {
    const set = stripUndefined({
      userId,
      updatedAt,
      profileUpdatedAt,
      mealUpdatedAt,
      waterUpdatedAt,
      backupEnabled: true,
      lastWriterDeviceId: deviceId,
    });

    await collections.states.updateOne({ userId }, { $set: set }, { upsert: true });
  };

  const buildSnapshot = async (userId, user = null) => {
    const resolvedUser = user ?? (await getResolvedUser(userId));

    if (!resolvedUser) {
      return null;
    }

    const [profileDoc, mealDoc, stateDoc, meta] = await Promise.all([
      collections.profiles.findOne({ userId }),
      collections.meals.findOne({ userId }),
      collections.states.findOne({ userId }),
      getSnapshotMeta(userId),
    ]);

    return {
      profile: normalizeProfileState(profileDoc?.state, resolvedUser),
      meal: normalizeMealState(mealDoc?.state),
      water: normalizeWaterState(stateDoc?.water),
      fridge: normalizeFridgeState(stateDoc?.fridge),
      community: normalizeCommunityState(stateDoc?.community),
      companion: normalizeCompanionState(stateDoc?.companion),
      updatedAt: meta.updatedAt,
      profileUpdatedAt: meta.profileUpdatedAt,
      mealUpdatedAt: meta.mealUpdatedAt,
      waterUpdatedAt: meta.waterUpdatedAt,
      backupEnabled: meta.backupEnabled,
      lastWriterDeviceId: meta.lastWriterDeviceId,
    };
  };

  const writeSnapshot = async (
    userId,
    snapshot,
    {
      updatedAt,
      profileUpdatedAt = undefined,
      mealUpdatedAt = undefined,
      waterUpdatedAt = undefined,
      deviceId = undefined,
      baseVersion = null,
    } = {}
  ) => {
    const now = updatedAt ?? new Date().toISOString();
    const session = client.startSession();

    try {
      await session.withTransaction(async () => {
        await collections.profiles.updateOne(
          { userId },
          { $set: { userId, state: stripUndefined(snapshot.profile), updatedAt: now } },
          { upsert: true, session }
        );
        await collections.meals.updateOne(
          { userId },
          { $set: { userId, state: stripUndefined(snapshot.meal), updatedAt: now } },
          { upsert: true, session }
        );

        const stateUpdate = await collections.states.updateOne(
          baseVersion ? { userId, updatedAt: baseVersion } : { userId },
          {
            $set: stripUndefined({
              userId,
              water: snapshot.water,
              fridge: snapshot.fridge,
              community: snapshot.community,
              companion: snapshot.companion,
              updatedAt: now,
              profileUpdatedAt,
              mealUpdatedAt,
              waterUpdatedAt,
              backupEnabled: true,
              lastWriterDeviceId: deviceId,
            }),
          },
          { upsert: !baseVersion, session }
        );

        if (baseVersion && stateUpdate.matchedCount === 0) {
          throw new StateApiError(
            "STATE_CONFLICT",
            "Cloud data changed on another device. Pull the latest cloud state before retrying.",
            { meta: await getSnapshotMeta(userId) }
          );
        }
      });
    } finally {
      await session.endSession();
    }
  };

  const listCatalogProductsInternal = async ({
    viewerUserId = null,
    includeUnapproved = false,
    ownerUserId = null,
    statuses = [],
    search = "",
    limit = 60,
  } = {}) => {
    const normalizedStatuses = Array.isArray(statuses)
      ? statuses.filter(isProductModerationStatus)
      : [];
    const docs = await collections.catalogProducts
      .find({})
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(500)
      .toArray();

    return docs
      .map(mapCatalogProductDoc)
      .filter(Boolean)
      .filter((product) => {
        if (ownerUserId && product.ownerUserId !== ownerUserId) {
          return false;
        }

        if (
          !includeUnapproved &&
          product.status !== "approved" &&
          product.ownerUserId !== viewerUserId
        ) {
          return false;
        }

        if (normalizedStatuses.length > 0 && !normalizedStatuses.includes(product.status)) {
          return false;
        }

        return matchesCatalogSearch(product, search);
      })
      .slice(0, Math.max(Number(limit) || 0, 1));
  };

  const findCatalogDuplicateCandidatesInternal = async ({
    name,
    barcode = "",
    excludeProductId = null,
    limit = 5,
  }) => {
    const normalizedName = normalizeTextToken(name);
    const normalizedBarcode = String(barcode ?? "").replace(/\D/g, "");
    const queryTokens = normalizedName
      .replace(/[^\p{Letter}\p{Number}\s]+/gu, " ")
      .split(/\s+/)
      .filter(Boolean);

    if (!normalizedName && !normalizedBarcode) {
      return [];
    }

    return (
      await listCatalogProductsInternal({
        includeUnapproved: true,
        statuses: ["pending", "approved", "rejected"],
        limit: 250,
      })
    )
      .filter((product) => product.id !== excludeProductId)
      .filter((product) => {
        const productBarcode = String(product.barcode ?? "").replace(/\D/g, "");
        const productName = normalizeTextToken(product.name);
        const productTokens = productName
          .replace(/[^\p{Letter}\p{Number}\s]+/gu, " ")
          .split(/\s+/)
          .filter(Boolean);
        const overlap = queryTokens.filter((token) => productTokens.includes(token)).length;
        const tokenThreshold = Math.min(2, queryTokens.length, productTokens.length);

        return (
          (normalizedBarcode && productBarcode && productBarcode === normalizedBarcode) ||
          productName === normalizedName ||
          (normalizedName.length >= 4 &&
            (productName.includes(normalizedName) || normalizedName.includes(productName))) ||
          (tokenThreshold > 0 && overlap >= tokenThreshold)
        );
      })
      .slice(0, Math.max(Number(limit) || 0, 1));
  };

  const upsertMealStateInternal = async (
    userId,
    resolvedUser,
    mealState,
    syncContext = undefined
  ) => {
    const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
    const normalizedMeal = normalizeMealState(mealState);
    const updatedAt = new Date().toISOString();
    const currentSnapshot = await buildSnapshot(userId, resolvedUser);
    const nextSnapshot = {
      ...currentSnapshot,
      meal: normalizedMeal,
    };

    await writeSnapshot(userId, nextSnapshot, {
      updatedAt,
      mealUpdatedAt: updatedAt,
      deviceId: normalizedSyncContext.deviceId,
      baseVersion: normalizedSyncContext.baseVersion,
    });
    writeBackupSnapshot(userId, nextSnapshot, "meal-state", updatedAt);
    return normalizedMeal;
  };

  return {
    getEngineInfo: () => ({
      engine: "mongodb",
      database: config.mongoDatabaseName,
      collections: {
        users: "users",
        sessions: "sessions",
        states: "states",
        profiles: "profiles",
        meals: "meals",
        aiRequests: "aiRequests",
      },
    }),

    close: () => client.close(),

    cleanupExpiredSessions: async (now = Date.now()) => {
      await collections.sessions.deleteMany({ expiresAt: { $lte: now } });
    },

    cleanupExpiredPasswordResetTokens: async (now = Date.now()) => {
      await collections.passwordResetTokens.deleteMany({
        $or: [{ expiresAt: { $lte: now } }, { consumedAt: { $ne: null } }],
      });
    },

    cleanupExpiredRegistrationVerificationTokens: async (now = Date.now()) => {
      await collections.registrationVerificationTokens.deleteMany({
        $or: [{ expiresAt: { $lte: now } }, { consumedAt: { $ne: null } }],
      });
    },

    findUserByEmail: async (email) => mapUserDoc(await collections.users.findOne({ email })),

    findUserById: async (userId) => getResolvedUser(userId),

    findUserByTelegramChatId: async (telegramChatId) =>
      mapUserDoc(await collections.users.findOne({ telegramChatId: String(telegramChatId) })),

    hasUserWithRole: async (role) =>
      Boolean(await collections.users.findOne(createMongoRoleQuery(role))),

    insertUser: async (user) => {
      const appRole = toAppUserRole(user.role ?? "USER");
      const doc = stripUndefined({
        ...user,
        emailVerified: user.emailVerified !== false,
        verificationChannel: isVerificationChannel(user.verificationChannel)
          ? user.verificationChannel
          : "email",
        role: toMongoUserRole(appRole),
        appRole,
        bannedAt: user.bannedAt ?? null,
        bannedReason: user.bannedReason ?? null,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        twoFactorRequired: Boolean(user.twoFactorRequired),
        tokenVersion: Math.max(toNumber(user.tokenVersion, 0), 0),
      });

      await collections.users.insertOne(doc);
      return mapUserDoc(doc);
    },

    listUsers: async () => {
      const now = Date.now();
      const docs = await collections.users
        .aggregate([
          {
            $lookup: {
              from: "sessions",
              localField: "id",
              foreignField: "userId",
              as: "sessions",
            },
          },
          {
            $addFields: {
              lastSessionAt: { $max: "$sessions.createdAt" },
              hasActiveSession: {
                $anyElementTrue: {
                  $map: {
                    input: "$sessions",
                    as: "session",
                    in: { $gt: ["$$session.expiresAt", now] },
                  },
                },
              },
            },
          },
          {
            $project: {
              sessions: 0,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
        ])
        .toArray();

      return docs.map(mapUserDoc).filter(Boolean);
    },

    updateUser: async (user) => {
      const roleFields = user.role
        ? {
            role: toMongoUserRole(user.role),
            appRole: toAppUserRole(user.role),
          }
        : {};

      await collections.users.updateOne(
        { id: user.id },
        { $set: stripUndefined({ ...user, ...roleFields }) }
      );
      return getResolvedUser(user.id);
    },

    updateUserPassword: async ({ userId, passwordHash, passwordSalt, passwordVersion }) => {
      await collections.users.updateOne(
        { id: userId },
        {
          $set: {
            passwordHash,
            passwordSalt,
            passwordVersion,
          },
        }
      );
      return getResolvedUser(userId);
    },

    updateUserTelegramConnection: async ({
      userId,
      telegramChatId,
      telegramConnectedAt = new Date().toISOString(),
    }) => {
      const normalizedChatId = String(telegramChatId ?? "").trim();

      if (!normalizedChatId) {
        return getResolvedUser(userId);
      }

      await collections.users.updateMany(
        {
          telegramChatId: normalizedChatId,
          id: { $ne: userId },
        },
        {
          $unset: {
            telegramChatId: "",
            telegramConnectedAt: "",
          },
        }
      );
      await collections.users.updateOne(
        { id: userId },
        {
          $set: {
            telegramChatId: normalizedChatId,
            telegramConnectedAt,
          },
        }
      );

      return getResolvedUser(userId);
    },

    updateUserReminders: async (userId, reminders) => {
      await collections.users.updateOne(
        { id: userId },
        {
          $set: {
            medicationReminders: Array.isArray(reminders) ? reminders : [],
          },
        }
      );

      return getResolvedUser(userId);
    },

    async updateUserMedicationReminders(userId, reminders) {
      return this.updateUserReminders(userId, reminders);
    },

    disconnectUserTelegram: async (userId) => {
      await collections.users.updateOne(
        { id: userId },
        {
          $unset: {
            telegramChatId: "",
            telegramConnectedAt: "",
          },
        }
      );

      return getResolvedUser(userId);
    },

    disconnectTelegramChat: async (telegramChatId) => {
      const normalizedChatId = String(telegramChatId ?? "").trim();

      if (!normalizedChatId) {
        return null;
      }

      const user = mapUserDoc(
        await collections.users.findOne({ telegramChatId: normalizedChatId })
      );

      await collections.users.updateOne(
        { telegramChatId: normalizedChatId },
        {
          $unset: {
            telegramChatId: "",
            telegramConnectedAt: "",
          },
        }
      );

      return user;
    },

    incrementUserTokenVersion: async (userId) => {
      await collections.users.updateOne({ id: userId }, { $inc: { tokenVersion: 1 } });
      return getResolvedUser(userId);
    },

    updateUserRole: async ({ userId, role, twoFactorRequired = false }) => {
      const appRole = toAppUserRole(role);

      await collections.users.updateOne(
        { id: userId },
        {
          $set: {
            role: toMongoUserRole(appRole),
            appRole,
            twoFactorRequired: Boolean(twoFactorRequired),
          },
        }
      );
      return getResolvedUser(userId);
    },

    promoteUserByEmailToOwner: async (email) => {
      await collections.users.updateOne(
        { email },
        {
          $set: {
            role: "admin",
            appRole: "OWNER",
            twoFactorRequired: true,
          },
        }
      );
      return mapUserDoc(await collections.users.findOne({ email }));
    },

    async promoteUserByEmailToSuperAdmin(email) {
      return this.promoteUserByEmailToOwner(email);
    },

    deleteUser: async (userId) => {
      const user = await getResolvedUser(userId);

      await Promise.all([
        collections.users.deleteOne({ id: userId }),
        collections.sessions.deleteMany({ userId }),
        collections.passwordResetTokens.deleteMany({ userId }),
        collections.registrationVerificationTokens.deleteMany({ userId }),
        collections.states.deleteOne({ userId }),
        collections.profiles.deleteOne({ userId }),
        collections.meals.deleteOne({ userId }),
        collections.assistantMessages.deleteMany({ userId }),
        collections.aiRequests.deleteMany({ userId }),
        collections.catalogProducts.deleteMany({ ownerUserId: userId }),
        user?.email ? collections.loginAttempts.deleteOne({ email: user.email }) : Promise.resolve(),
      ]);
      removeUserBackups(userId);
    },

    listUserBackups: async (userId) =>
      getUserBackupEntries(userId).map(({ fullPath, ...backup }) => backup),

    readUserBackup: async (userId, backupId = undefined) => {
      const backup = readUserBackupPayload(userId, backupId);

      if (!backup) {
        return null;
      }

      const { fullPath, ...payload } = backup;
      void fullPath;
      return payload;
    },

    createAuditLog: async ({
      id,
      actorUserId = null,
      actorRole = "USER",
      action,
      targetType = null,
      targetId = null,
      details = null,
      createdAt,
    }) => {
      await collections.auditLogs.insertOne(
        stripUndefined({
          id,
          actorUserId,
          actorRole: isUserRole(actorRole) ? actorRole : "USER",
          action,
          targetType,
          targetId,
          details,
          createdAt,
        })
      );
    },

    listAuditLogs: async (limit = 80) =>
      (
        await collections.auditLogs
          .find({})
          .sort({ createdAt: -1 })
          .limit(Math.max(Number(limit) || 0, 1))
          .toArray()
      )
        .map(mapAuditLogDoc)
        .filter(Boolean),

    countCatalogProductsByOwnerSince: async (userId, sinceIso) =>
      collections.catalogProducts.countDocuments({
        ownerUserId: userId,
        createdAt: { $gte: sinceIso },
      }),

    findCatalogProductById: async (productId) =>
      mapCatalogProductDoc(await collections.catalogProducts.findOne({ id: productId })),

    listCatalogProducts: (options = {}) => listCatalogProductsInternal(options),

    findCatalogDuplicateCandidates: (options = {}) =>
      findCatalogDuplicateCandidatesInternal(options),

    insertCatalogProduct: async (product) => {
      await collections.catalogProducts.insertOne(stripUndefined(product));
      return mapCatalogProductDoc(product);
    },

    updateCatalogProduct: async (product) => {
      await collections.catalogProducts.updateOne(
        { id: product.id },
        { $set: stripUndefined(product) }
      );
      return mapCatalogProductDoc(await collections.catalogProducts.findOne({ id: product.id }));
    },

    createCatalogProductVersion: async ({
      id,
      productId,
      version,
      editorUserId = null,
      note = null,
      snapshot,
      createdAt,
    }) => {
      await collections.catalogProductVersions.insertOne(
        stripUndefined({
          id,
          productId,
          version,
          editorUserId,
          note,
          snapshot,
          createdAt,
        })
      );
    },

    createSession: async ({ token, userId, expiresAt }) => {
      const session = { token, userId, expiresAt, createdAt: new Date().toISOString() };
      await collections.sessions.insertOne(session);
      return { token, userId, expiresAt };
    },

    findSessionByToken: async (token) =>
      mapSessionDoc(await collections.sessions.findOne({ token })),

    deleteSessionByToken: async (token) => {
      await collections.sessions.deleteOne({ token });
    },

    deleteSessionsByUserId: async (userId) => {
      await collections.sessions.deleteMany({ userId });
    },

    createPasswordResetToken: async ({ id, userId, tokenHash, expiresAt, createdAt }) => {
      const token = { id, userId, tokenHash, expiresAt, consumedAt: null, createdAt };
      await collections.passwordResetTokens.insertOne(token);
      return mapPasswordResetTokenDoc(token);
    },

    findPasswordResetTokenByHash: async (tokenHash) =>
      mapPasswordResetTokenDoc(
        await collections.passwordResetTokens.findOne({ tokenHash })
      ),

    markPasswordResetTokenConsumed: async (tokenHash, consumedAt) => {
      await collections.passwordResetTokens.updateOne(
        { tokenHash, consumedAt: null },
        { $set: { consumedAt } }
      );
      return mapPasswordResetTokenDoc(
        await collections.passwordResetTokens.findOne({ tokenHash })
      );
    },

    deletePasswordResetTokensByUserId: async (userId) => {
      await collections.passwordResetTokens.deleteMany({ userId });
    },

    createRegistrationVerificationToken: async ({
      id,
      userId,
      channel,
      target,
      codeHash,
      expiresAt,
      createdAt,
    }) => {
      const token = {
        id,
        userId,
        channel: isVerificationChannel(channel) ? channel : "email",
        target,
        codeHash,
        expiresAt,
        consumedAt: null,
        createdAt,
      };

      await collections.registrationVerificationTokens.insertOne(token);
      return mapRegistrationVerificationTokenDoc(token);
    },

    findRegistrationVerificationTokenByHash: async (codeHash) =>
      mapRegistrationVerificationTokenDoc(
        await collections.registrationVerificationTokens.findOne({ codeHash })
      ),

    markRegistrationVerificationTokenConsumed: async (codeHash, consumedAt) => {
      await collections.registrationVerificationTokens.updateOne(
        { codeHash, consumedAt: null },
        { $set: { consumedAt } }
      );
      return mapRegistrationVerificationTokenDoc(
        await collections.registrationVerificationTokens.findOne({ codeHash })
      );
    },

    deleteRegistrationVerificationTokensByUserId: async (userId) => {
      await collections.registrationVerificationTokens.deleteMany({ userId });
    },

    markUserRegistrationVerified: async ({ userId, channel }) => {
      const existingUser = await getResolvedUser(userId);

      if (!existingUser) {
        return null;
      }

      await collections.users.updateOne(
        { id: userId },
        {
          $set: {
            emailVerified: channel === "email" ? true : existingUser.emailVerified,
            verificationChannel: isVerificationChannel(channel)
              ? channel
              : existingUser.verificationChannel,
          },
        }
      );
      return getResolvedUser(userId);
    },

    updateUserVerificationTarget: async ({ userId, channel }) => {
      await collections.users.updateOne(
        { id: userId },
        {
          $set: {
            verificationChannel: isVerificationChannel(channel) ? channel : "email",
          },
        }
      );
      return getResolvedUser(userId);
    },

    updateUserBan: async ({ userId, bannedAt = null, bannedReason = null }) => {
      await collections.users.updateOne(
        { id: userId },
        {
          $set: {
            bannedAt,
            bannedReason,
          },
        }
      );
      return getResolvedUser(userId);
    },

    getSnapshotByUserId: (userId, user = null) => buildSnapshot(userId, user),

    getSnapshotMetaByUserId: (userId) => getSnapshotMeta(userId),

    upsertSnapshot: async (userId, snapshot, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const updatedAt = snapshot?.updatedAt ?? new Date().toISOString();
      const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
      const normalizedSnapshot = normalizeSnapshotForUser(snapshot, resolvedUser);

      await writeSnapshot(userId, normalizedSnapshot, {
        updatedAt,
        profileUpdatedAt: updatedAt,
        mealUpdatedAt: updatedAt,
        waterUpdatedAt: updatedAt,
        deviceId: normalizedSyncContext.deviceId,
        baseVersion: normalizedSyncContext.baseVersion,
      });
      writeBackupSnapshot(userId, normalizedSnapshot, "snapshot", updatedAt);
      return normalizedSnapshot;
    },

    getProfileStateByUserId: async (userId, user = null) => {
      const resolvedUser = user ?? (await getResolvedUser(userId));

      if (!resolvedUser) {
        return null;
      }

      return normalizeProfileState(
        (await collections.profiles.findOne({ userId }))?.state,
        resolvedUser
      );
    },

    upsertProfileState: async (userId, profileState, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
      const normalizedProfile = normalizeProfileState(profileState, resolvedUser);
      const updatedAt = new Date().toISOString();
      const currentSnapshot = await buildSnapshot(userId, resolvedUser);
      const nextSnapshot = {
        ...currentSnapshot,
        profile: normalizedProfile,
      };

      await writeSnapshot(userId, nextSnapshot, {
        updatedAt,
        profileUpdatedAt: updatedAt,
        deviceId: normalizedSyncContext.deviceId,
        baseVersion: normalizedSyncContext.baseVersion,
      });
      writeBackupSnapshot(userId, nextSnapshot, "profile-state", updatedAt);
      return normalizedProfile;
    },

    getMealStateByUserId: async (userId) =>
      normalizeMealState((await collections.meals.findOne({ userId }))?.state),

    upsertMealState: async (userId, mealState, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      return upsertMealStateInternal(userId, resolvedUser, mealState, syncContext);
    },

    getWaterStateByUserId: async (userId) =>
      normalizeWaterState((await collections.states.findOne({ userId }))?.water),

    upsertWaterState: async (userId, waterState, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
      const normalizedWater = normalizeWaterState(waterState);
      const updatedAt = new Date().toISOString();
      const currentSnapshot = await buildSnapshot(userId, resolvedUser);
      const nextSnapshot = {
        ...currentSnapshot,
        water: normalizedWater,
      };

      await writeSnapshot(userId, nextSnapshot, {
        updatedAt,
        waterUpdatedAt: updatedAt,
        deviceId: normalizedSyncContext.deviceId,
        baseVersion: normalizedSyncContext.baseVersion,
      });
      writeBackupSnapshot(userId, nextSnapshot, "water-state", updatedAt);
      return normalizedWater;
    },

    getFridgeStateByUserId: async (userId) =>
      normalizeFridgeState((await collections.states.findOne({ userId }))?.fridge),

    upsertFridgeState: async (userId, fridgeState, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
      const normalizedFridge = normalizeFridgeState(fridgeState);
      const updatedAt = new Date().toISOString();
      const currentSnapshot = await buildSnapshot(userId, resolvedUser);
      const nextSnapshot = {
        ...currentSnapshot,
        fridge: normalizedFridge,
      };

      await writeSnapshot(userId, nextSnapshot, {
        updatedAt,
        deviceId: normalizedSyncContext.deviceId,
        baseVersion: normalizedSyncContext.baseVersion,
      });
      writeBackupSnapshot(userId, nextSnapshot, "fridge-state", updatedAt);
      return normalizedFridge;
    },

    getCommunityStateByUserId: async (userId) =>
      normalizeCommunityState((await collections.states.findOne({ userId }))?.community),

    upsertCommunityState: async (userId, communityState, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
      const normalizedCommunity = normalizeCommunityState(communityState);
      const updatedAt = new Date().toISOString();
      const currentSnapshot = await buildSnapshot(userId, resolvedUser);
      const nextSnapshot = {
        ...currentSnapshot,
        community: normalizedCommunity,
      };

      await writeSnapshot(userId, nextSnapshot, {
        updatedAt,
        deviceId: normalizedSyncContext.deviceId,
        baseVersion: normalizedSyncContext.baseVersion,
      });
      writeBackupSnapshot(userId, nextSnapshot, "community-state", updatedAt);
      return normalizedCommunity;
    },

    getCompanionStateByUserId: async (userId) =>
      normalizeCompanionState((await collections.states.findOne({ userId }))?.companion),

    upsertCompanionState: async (userId, companionState, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
      const normalizedCompanion = normalizeCompanionState(companionState);
      const updatedAt = new Date().toISOString();
      const currentSnapshot = await buildSnapshot(userId, resolvedUser);
      const nextSnapshot = {
        ...currentSnapshot,
        companion: normalizedCompanion,
      };

      await writeSnapshot(userId, nextSnapshot, {
        updatedAt,
        deviceId: normalizedSyncContext.deviceId,
        baseVersion: normalizedSyncContext.baseVersion,
      });
      writeBackupSnapshot(userId, nextSnapshot, "companion-state", updatedAt);
      return normalizedCompanion;
    },

    addMealEntries: async (userId, entries, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const currentMealState = normalizeMealState(
        (await collections.meals.findOne({ userId }))?.state
      );
      const normalizedEntries = normalizeMealEntries(entries);
      const existingEntryIds = new Set(currentMealState.items.map((item) => item.id));
      const entriesToAdd = normalizedEntries.filter(
        (entry) => !existingEntryIds.has(entry.id)
      );
      const nextMealState = {
        ...currentMealState,
        items: [...entriesToAdd, ...currentMealState.items],
      };

      entriesToAdd.forEach((entry) => {
        nextMealState.recentProducts = [
          entry.product,
          ...nextMealState.recentProducts.filter(
            (item) => createProductKey(item) !== createProductKey(entry.product)
          ),
        ].slice(0, 16);

        if (entry.product.barcode?.replace(/\D/g, "")) {
          nextMealState.personalBarcodeProducts = [
            entry.product,
            ...nextMealState.personalBarcodeProducts.filter(
              (item) =>
                item.barcode?.replace(/\D/g, "") !== entry.product.barcode?.replace(/\D/g, "")
            ),
          ].slice(0, 240);
        }
      });

      nextMealState.totalNutrients = calculateMealTotalNutrients(nextMealState.items);
      return upsertMealStateInternal(userId, resolvedUser, nextMealState, syncContext);
    },

    removeMealEntry: async (userId, entryId, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const mealState = normalizeMealState((await collections.meals.findOne({ userId }))?.state);
      const nextMealState = {
        ...mealState,
        items: mealState.items.filter((item) => item.id !== entryId),
      };

      nextMealState.totalNutrients = calculateMealTotalNutrients(nextMealState.items);
      return upsertMealStateInternal(userId, resolvedUser, nextMealState, syncContext);
    },

    addMealTemplate: async (userId, template, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const mealState = normalizeMealState((await collections.meals.findOne({ userId }))?.state);
      const normalizedTemplate = normalizeMealTemplates([template])[0];
      const nextMealState = {
        ...mealState,
        templates: [
          normalizedTemplate,
          ...mealState.templates.filter((item) => item.id !== normalizedTemplate.id),
        ],
      };

      return upsertMealStateInternal(userId, resolvedUser, nextMealState, syncContext);
    },

    deleteMealTemplate: async (userId, templateId, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const mealState = normalizeMealState((await collections.meals.findOne({ userId }))?.state);
      const nextMealState = {
        ...mealState,
        templates: mealState.templates.filter((item) => item.id !== templateId),
      };

      return upsertMealStateInternal(userId, resolvedUser, nextMealState, syncContext);
    },

    upsertMealProduct: async (userId, bucketType, product, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const mealState = normalizeMealState((await collections.meals.findOne({ userId }))?.state);
      const normalizedProduct = normalizeProduct(product, `bucket-${bucketType}`);
      const nextMealState = { ...mealState };

      if (bucketType === "saved") {
        nextMealState.savedProducts = [
          normalizedProduct,
          ...mealState.savedProducts.filter(
            (item) => createProductKey(item) !== createProductKey(normalizedProduct)
          ),
        ].slice(0, 24);
      } else {
        nextMealState.recentProducts = [
          normalizedProduct,
          ...mealState.recentProducts.filter(
            (item) => createProductKey(item) !== createProductKey(normalizedProduct)
          ),
        ].slice(0, 16);
      }

      if (normalizedProduct.barcode?.replace(/\D/g, "")) {
        nextMealState.personalBarcodeProducts = [
          normalizedProduct,
          ...mealState.personalBarcodeProducts.filter(
            (item) =>
              item.barcode?.replace(/\D/g, "") !== normalizedProduct.barcode?.replace(/\D/g, "")
          ),
        ].slice(0, 240);
      }

      return upsertMealStateInternal(userId, resolvedUser, nextMealState, syncContext);
    },

    removeMealProduct: async (userId, bucketType, productKey, syncContext = undefined) => {
      const resolvedUser = await getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const mealState = normalizeMealState((await collections.meals.findOne({ userId }))?.state);
      const nextMealState = { ...mealState };

      if (bucketType === "saved") {
        nextMealState.savedProducts = mealState.savedProducts.filter(
          (item) => createProductKey(item) !== productKey
        );
      } else {
        nextMealState.recentProducts = mealState.recentProducts.filter(
          (item) => createProductKey(item) !== productKey
        );
      }

      return upsertMealStateInternal(userId, resolvedUser, nextMealState, syncContext);
    },

    listAssistantMessagesByUserId: async (userId, limit = 16) =>
      (
        await collections.assistantMessages
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(Math.max(Number(limit) || 0, 1))
          .toArray()
      )
        .map(mapAssistantMessageDoc)
        .filter(Boolean)
        .reverse(),

    insertAssistantMessage: async ({ id, userId, role, text, createdAt }) => {
      await collections.assistantMessages.insertOne({
        id,
        userId,
        role: isAssistantMessageRole(role) ? role : "assistant",
        text: String(text ?? ""),
        createdAt,
      });
    },

    deleteAssistantMessagesByUserId: async (userId) => {
      await collections.assistantMessages.deleteMany({ userId });
    },

    pruneAssistantMessagesByUserId: async (userId, keepLast = 16) => {
      const keepIds = (
        await collections.assistantMessages
          .find({ userId }, { projection: { id: 1 } })
          .sort({ createdAt: -1 })
          .limit(Math.max(Number(keepLast) || 0, 1))
          .toArray()
      ).map((doc) => doc.id);

      await collections.assistantMessages.deleteMany({
        userId,
        id: { $nin: keepIds },
      });
    },

    insertAiUsageEvent: async ({
      id,
      userId,
      route,
      eventType,
      promptTokens = 0,
      completionTokens = 0,
      totalTokens = 0,
      estimatedCostUsd = 0,
      providerId = null,
      blockedReason = null,
      createdAt,
    }) => {
      const normalizedPromptTokens = toNonNegativeInteger(promptTokens);
      const normalizedCompletionTokens = toNonNegativeInteger(completionTokens);
      const normalizedTotalTokens = toNonNegativeInteger(
        totalTokens,
        normalizedPromptTokens + normalizedCompletionTokens
      );

      await collections.aiRequests.insertOne({
        id,
        userId,
        route: String(route ?? "ai"),
        eventType: isAiUsageEventType(eventType) ? eventType : "completed",
        promptTokens: normalizedPromptTokens,
        completionTokens: normalizedCompletionTokens,
        totalTokens: normalizedTotalTokens,
        estimatedCostUsd: toNonNegativeNumber(estimatedCostUsd),
        providerId,
        blockedReason,
        createdAt,
      });
    },

    getAiUsageSummary: async ({ userId, sinceIso, route = null }) => {
      const match = {
        userId,
        createdAt: { $gte: sinceIso },
      };

      if (typeof route === "string" && route.trim()) {
        match.route = route.trim();
      }

      const [summary] = await collections.aiRequests
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              requestCount: { $sum: 1 },
              promptTokens: { $sum: "$promptTokens" },
              completionTokens: { $sum: "$completionTokens" },
              totalTokens: { $sum: "$totalTokens" },
              estimatedCostUsd: { $sum: "$estimatedCostUsd" },
            },
          },
        ])
        .toArray();

      return {
        requestCount: toNonNegativeInteger(summary?.requestCount),
        promptTokens: toNonNegativeInteger(summary?.promptTokens),
        completionTokens: toNonNegativeInteger(summary?.completionTokens),
        totalTokens: toNonNegativeInteger(summary?.totalTokens),
        estimatedCostUsd: toNonNegativeNumber(summary?.estimatedCostUsd),
      };
    },

    findLatestAiUsageEvent: async ({ userId, route = null, eventType = null }) => {
      const query = { userId };

      if (typeof route === "string" && route.trim()) {
        query.route = route.trim();
      }

      if (typeof eventType === "string" && eventType.trim()) {
        query.eventType = eventType.trim();
      }

      return mapAiUsageEventDoc(
        await collections.aiRequests.findOne(query, { sort: { createdAt: -1 } })
      );
    },

    getAdminStats: async () => {
      const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        usersTotal,
        usersActive,
        onlineSessionUserIds,
        usersNewThisWeek,
        usersBanned,
        aiRequestsTotal,
        productsTotal,
        productsPending,
        suspiciousAccounts,
      ] = await Promise.all([
        collections.users.countDocuments(),
        collections.users.countDocuments({
          $or: [{ bannedAt: null }, { bannedAt: { $exists: false } }],
        }),
        collections.sessions.distinct("userId", { expiresAt: { $gt: Date.now() } }),
        collections.users.countDocuments({ createdAt: { $gte: weekAgoIso } }),
        collections.users.countDocuments({ bannedAt: { $exists: true, $ne: null } }),
        collections.aiRequests.countDocuments(),
        collections.catalogProducts.countDocuments(),
        collections.catalogProducts.countDocuments({ status: "pending" }),
        collections.loginAttempts.countDocuments({ lockUntil: { $gt: Date.now() } }),
      ]);

      return {
        usersTotal,
        usersActive,
        usersOnline: onlineSessionUserIds.length,
        usersNewThisWeek,
        usersBanned,
        aiRequestsTotal,
        productsTotal,
        productsPending,
        reportsOpen: 0,
        suspiciousAccounts,
        photoAnalysesTotal: 0,
      };
    },

    getLoginAttempt: async (email) =>
      mapLoginAttemptDoc(await collections.loginAttempts.findOne({ email })),

    upsertLoginAttempt: async ({ email, count, lockUntil }) => {
      await collections.loginAttempts.updateOne(
        { email },
        {
          $set: {
            email,
            count,
            lockUntil,
          },
        },
        { upsert: true }
      );
    },

    clearLoginAttempt: async (email) => {
      await collections.loginAttempts.deleteOne({ email });
    },
  };
};
