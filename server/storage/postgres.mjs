import crypto from "node:crypto";
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
import { Pool } from "pg";
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

const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toJsonParam = (value) => JSON.stringify(value ?? null);

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toBoolean = (value, fallback = false) =>
  typeof value === "boolean" ? value : value === 1 || value === "1" ? true : fallback;

const isVerificationChannel = (value) => value === "email";
const isProductModerationStatus = (value) =>
  value === "pending" || value === "approved" || value === "rejected";
const isAssistantMessageRole = (value) => value === "user" || value === "assistant";
const isAiUsageEventType = (value) =>
  value === "completed" || value === "blocked" || value === "failed";
const isUnit = (value) => value === "g" || value === "ml" || value === "piece";
const isSource = (value) =>
  value === "USDA" || value === "OpenFoodFacts" || value === "Manual" || value === "Recipe";

const normalizeTextToken = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const normalizeProduct = (value, fallbackIdPrefix = "product") => {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};

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
    nutrients:
      record.nutrients && typeof record.nutrients === "object" && !Array.isArray(record.nutrients)
        ? record.nutrients
        : {},
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
    facts:
      record.facts && typeof record.facts === "object" && !Array.isArray(record.facts)
        ? record.facts
        : undefined,
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
          if (!item || typeof item !== "object" || Array.isArray(item)) {
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
          if (!template || typeof template !== "object" || Array.isArray(template)) {
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
                    item && typeof item === "object" && !Array.isArray(item)
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
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
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

const normalizeProfileState = (value, user) => ({
  ...createInitialProfileState(user),
  ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}),
});

const normalizeWaterState = (value) => ({
  ...createInitialWaterState(),
  ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}),
});

const normalizeFridgeState = (value) => ({
  ...createInitialFridgeState(),
  ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}),
});

const normalizeCommunityState = (value) => ({
  ...createInitialCommunityState(),
  ...(value && typeof value === "object" && !Array.isArray(value) ? value : {}),
});

const normalizeSnapshotForUser = (snapshot, user) => ({
  profile: normalizeProfileState(snapshot?.profile, user),
  meal: normalizeMealState(snapshot?.meal),
  water: normalizeWaterState(snapshot?.water),
  fridge: normalizeFridgeState(snapshot?.fridge),
  community: normalizeCommunityState(snapshot?.community),
  companion: normalizeCompanionState(snapshot?.companion),
});

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    emailVerified: toBoolean(row.email_verified, true),
    verificationChannel: isVerificationChannel(row.verification_channel)
      ? row.verification_channel
      : "email",
    avatar: row.avatar ?? undefined,
    age: Number(row.age),
    weight: Number(row.weight),
    height: Number(row.height),
    gender: row.gender,
    activity: row.activity,
    goal: row.goal,
    measurements: parseJsonValue(row.measurements_json, undefined),
    createdAt: row.created_at,
    role: isUserRole(row.role) ? row.role : "USER",
    bannedAt: row.banned_at ?? null,
    bannedReason: row.banned_reason ?? null,
    twoFactorEnabled: toBoolean(row.two_factor_enabled, false),
    twoFactorRequired: toBoolean(row.two_factor_required, false),
    telegramChatId: row.telegram_chat_id ?? null,
    telegramConnectedAt: row.telegram_connected_at ?? null,
    medicationReminders: Array.isArray(row.medication_reminders_json)
      ? row.medication_reminders_json
      : [],
    tokenVersion: Math.max(toNumber(row.token_version, 0), 0),
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    passwordVersion: row.password_version,
  };
};

const mapSessionRow = (row) =>
  row
    ? {
        token: row.token,
        userId: row.user_id,
        expiresAt: Number(row.expires_at),
      }
    : null;

const mapPasswordResetTokenRow = (row) =>
  row
    ? {
        id: row.id,
        userId: row.user_id,
        tokenHash: row.token_hash,
        expiresAt: Number(row.expires_at),
        consumedAt: row.consumed_at ?? null,
        createdAt: row.created_at,
      }
    : null;

const mapRegistrationVerificationTokenRow = (row) =>
  row
    ? {
        id: row.id,
        userId: row.user_id,
        channel: isVerificationChannel(row.channel) ? row.channel : "email",
        target: row.target,
        codeHash: row.code_hash,
        expiresAt: Number(row.expires_at),
        consumedAt: row.consumed_at ?? null,
        createdAt: row.created_at,
      }
    : null;

const mapLoginAttemptRow = (row) =>
  row
    ? {
        email: row.email,
        count: Number(row.count),
        lockUntil: row.lock_until === null ? null : Number(row.lock_until),
      }
    : null;

const mapAuditLogRow = (row) =>
  row
    ? {
        id: row.id,
        actorUserId: row.actor_user_id ?? null,
        actorRole: isUserRole(row.actor_role) ? row.actor_role : "USER",
        action: row.action,
        targetType: row.target_type ?? null,
        targetId: row.target_id ?? null,
        details: parseJsonValue(row.details_json, null),
        createdAt: row.created_at,
      }
    : null;

const mapCatalogProductRow = (row) =>
  row
    ? {
        id: row.id,
        ownerUserId: row.owner_user_id,
        name: row.name,
        brand: row.brand ?? undefined,
        barcode: row.barcode ?? undefined,
        category: row.category ?? undefined,
        imageUrl: row.image_url ?? undefined,
        unit: isUnit(row.unit) ? row.unit : "g",
        source: isSource(row.source) ? row.source : "Manual",
        nutrients: parseJsonValue(row.nutrients_json, {}),
        facts: parseJsonValue(row.facts_json, undefined),
        status: isProductModerationStatus(row.status) ? row.status : "pending",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        approvedAt: row.approved_at ?? null,
        approvedByUserId: row.approved_by_user_id ?? null,
        rejectionReason: row.rejection_reason ?? null,
        version: Math.max(Number(row.version ?? 1), 1),
      }
    : null;

const mapAssistantMessageRow = (row) =>
  row
    ? {
        id: row.id,
        userId: row.user_id,
        role: isAssistantMessageRole(row.role) ? row.role : "assistant",
        text: row.text,
        createdAt: row.created_at,
      }
    : null;

const mapAiUsageEventRow = (row) =>
  row
    ? {
        id: row.id,
        userId: row.user_id,
        route: row.route,
        eventType: isAiUsageEventType(row.event_type) ? row.event_type : "completed",
        promptTokens: Math.max(Number(row.prompt_tokens ?? 0), 0),
        completionTokens: Math.max(Number(row.completion_tokens ?? 0), 0),
        totalTokens: Math.max(Number(row.total_tokens ?? 0), 0),
        estimatedCostUsd: Math.max(Number(row.estimated_cost_usd ?? 0), 0),
        providerId: row.provider_id ?? null,
        blockedReason: row.blocked_reason ?? null,
        createdAt: row.created_at,
      }
    : null;

const mapAiUsageSummaryRow = (row) => ({
  requestCount: Math.max(Number(row?.request_count ?? 0), 0),
  promptTokens: Math.max(Number(row?.prompt_tokens ?? 0), 0),
  completionTokens: Math.max(Number(row?.completion_tokens ?? 0), 0),
  totalTokens: Math.max(Number(row?.total_tokens ?? 0), 0),
  estimatedCostUsd: Math.max(Number(row?.estimated_cost_usd ?? 0), 0),
});

const POSTGRES_MIGRATION_LOCK_NAMESPACE = 2026;
const POSTGRES_MIGRATION_LOCK_ID = 515;

export const POSTGRES_SCHEMA_MIGRATIONS = [
  {
    id: "202605150001",
    name: "initial_postgres_schema",
    sql: `
      CREATE TABLE IF NOT EXISTS smart_nutrition_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_channel TEXT NOT NULL DEFAULT 'email',
        avatar TEXT,
        age DOUBLE PRECISION NOT NULL,
        weight DOUBLE PRECISION NOT NULL,
        height DOUBLE PRECISION NOT NULL,
        gender TEXT NOT NULL,
        activity TEXT NOT NULL,
        goal TEXT NOT NULL,
        measurements_json JSONB,
        created_at TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        banned_at TEXT,
        banned_reason TEXT,
        two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        two_factor_required BOOLEAN NOT NULL DEFAULT FALSE,
        token_version INTEGER NOT NULL DEFAULT 0,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_version TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at BIGINT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at BIGINT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS registration_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel TEXT NOT NULL DEFAULT 'email',
        target TEXT NOT NULL,
        code_hash TEXT NOT NULL UNIQUE,
        expires_at BIGINT NOT NULL,
        consumed_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS snapshots (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        profile_json JSONB NOT NULL,
        meal_json JSONB NOT NULL,
        water_json JSONB NOT NULL,
        fridge_json JSONB NOT NULL,
        community_json JSONB NOT NULL,
        updated_at TEXT NOT NULL,
        profile_updated_at TEXT,
        meal_updated_at TEXT,
        water_updated_at TEXT,
        backup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        last_writer_device_id TEXT
      );

      CREATE TABLE IF NOT EXISTS login_attempts (
        email TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        lock_until BIGINT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        actor_role TEXT NOT NULL DEFAULT 'USER',
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        details_json JSONB,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS catalog_products (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        brand TEXT,
        barcode TEXT,
        category TEXT,
        image_url TEXT,
        unit TEXT NOT NULL DEFAULT 'g',
        source TEXT NOT NULL DEFAULT 'Manual',
        nutrients_json JSONB NOT NULL,
        facts_json JSONB,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        approved_at TEXT,
        approved_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        rejection_reason TEXT,
        version INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS catalog_product_versions (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        editor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        note TEXT,
        snapshot_json JSONB NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS assistant_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS ai_usage_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        route TEXT NOT NULL,
        event_type TEXT NOT NULL,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        estimated_cost_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
        provider_id TEXT,
        blocked_reason TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id, expires_at);
      CREATE INDEX IF NOT EXISTS idx_registration_verification_tokens_user ON registration_verification_tokens(user_id, expires_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_catalog_products_status ON catalog_products(status, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_catalog_products_owner ON catalog_products(owner_user_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_catalog_products_barcode ON catalog_products(barcode);
      CREATE INDEX IF NOT EXISTS idx_assistant_messages_user ON assistant_messages(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created ON ai_usage_events(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_events_route_created ON ai_usage_events(route, created_at DESC);
    `,
  },
  {
    id: "202605150002",
    name: "production_read_indexes",
    sql: `
      CREATE INDEX IF NOT EXISTS idx_users_banned_at ON users(banned_at);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_registration_verification_tokens_expires ON registration_verification_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_catalog_product_versions_product ON catalog_product_versions(product_id, version DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_route_created ON ai_usage_events(user_id, route, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_event_created ON ai_usage_events(user_id, event_type, created_at DESC);
    `,
  },
  {
    id: "202606160001",
    name: "companion_state_snapshot_column",
    sql: `
      ALTER TABLE snapshots
        ADD COLUMN IF NOT EXISTS companion_json JSONB;
    `,
  },
  {
    id: "202606200001",
    name: "telegram_account_connection",
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
        ADD COLUMN IF NOT EXISTS telegram_connected_at TEXT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_chat_id
        ON users(telegram_chat_id)
      WHERE telegram_chat_id IS NOT NULL;
    `,
  },
  {
    id: "202606200002",
    name: "medication_reminders_user_state",
    sql: `
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS medication_reminders_json JSONB NOT NULL DEFAULT '[]'::jsonb;
    `,
  },
];

export const POSTGRES_SCHEMA_VERSION =
  POSTGRES_SCHEMA_MIGRATIONS[POSTGRES_SCHEMA_MIGRATIONS.length - 1]?.id ?? "unknown";

const normalizeMigrationSql = (sql) => sql.replace(/\r\n/g, "\n").trim();

const calculateMigrationChecksum = (sql) =>
  crypto.createHash("sha256").update(normalizeMigrationSql(sql)).digest("hex");

const bootstrapPostgresMigrationTables = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS smart_nutrition_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
};

const setPostgresMetaValue = async (pool, key, value) => {
  await pool.query(
    `
      INSERT INTO smart_nutrition_meta (key, value)
      VALUES ($1, $2)
      ON CONFLICT(key) DO UPDATE SET value = EXCLUDED.value
    `,
    [key, value]
  );
};

const applyPostgresMigration = async (pool, migration) => {
  const checksum = calculateMigrationChecksum(migration.sql);
  const existing = await pool.query("SELECT checksum FROM schema_migrations WHERE id = $1", [
    migration.id,
  ]);
  const existingChecksum = existing.rows[0]?.checksum ?? null;

  if (existingChecksum) {
    if (existingChecksum !== checksum) {
      throw new Error(
        `PostgreSQL migration ${migration.id} checksum mismatch. Refusing to continue.`
      );
    }

    return;
  }

  await pool.query("BEGIN");

  try {
    await pool.query(migration.sql);
    await pool.query(
      `
        INSERT INTO schema_migrations (id, name, checksum, applied_at)
        VALUES ($1, $2, $3, $4)
      `,
      [migration.id, migration.name, checksum, new Date().toISOString()]
    );
    await setPostgresMetaValue(pool, "schema_version", migration.id);
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
};

const withPostgresMigrationLock = async (pool, task) => {
  await pool.query("SELECT pg_advisory_lock($1, $2)", [
    POSTGRES_MIGRATION_LOCK_NAMESPACE,
    POSTGRES_MIGRATION_LOCK_ID,
  ]);

  try {
    return await task();
  } finally {
    await pool.query("SELECT pg_advisory_unlock($1, $2)", [
      POSTGRES_MIGRATION_LOCK_NAMESPACE,
      POSTGRES_MIGRATION_LOCK_ID,
    ]);
  }
};

export const runPostgresMigrations = async (pool) => {
  await bootstrapPostgresMigrationTables(pool);

  await withPostgresMigrationLock(pool, async () => {
    for (const migration of POSTGRES_SCHEMA_MIGRATIONS) {
      await applyPostgresMigration(pool, migration);
    }

    await setPostgresMetaValue(pool, "storage_engine", "postgres");
    await setPostgresMetaValue(pool, "schema_version", POSTGRES_SCHEMA_VERSION);
  });
};

const getPublicPostgresInfo = (databaseUrl) => {
  try {
    const url = new URL(databaseUrl);

    return {
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\/+/, "") || null,
    };
  } catch {
    return {
      host: null,
      port: null,
      database: null,
    };
  }
};

export const createPostgresStorage = async ({
  postgresUrl,
  postgresSsl = false,
  backupDir,
  backupIntervalMs,
  maxBackupFilesPerUser,
}) => {
  if (!postgresUrl) {
    throw new Error("SMART_NUTRITION_DATABASE_URL is required for PostgreSQL storage.");
  }

  await fs.mkdir(backupDir, { recursive: true });

  const pool = new Pool({
    connectionString: postgresUrl,
    ssl: postgresSsl ? { rejectUnauthorized: false } : undefined,
  });

  await runPostgresMigrations(pool);

  const backupWriteTracker = new Map();

  const queryOne = async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return result.rows[0] ?? null;
  };

  const queryMany = async (sql, params = []) => {
    const result = await pool.query(sql, params);
    return result.rows;
  };

  const getResolvedUser = async (userId) =>
    mapUserRow(await queryOne("SELECT * FROM users WHERE id = $1 LIMIT 1", [userId]));

  const pruneUserBackups = (userId) => {
    const userBackupDir = path.join(backupDir, userId);

    try {
      const backupFiles = readdirSync(userBackupDir, { withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => ({
          name: entry.name,
          fullPath: path.join(userBackupDir, entry.name),
          mtimeMs: statSync(path.join(userBackupDir, entry.name)).mtimeMs,
        }))
        .sort((left, right) => right.mtimeMs - left.mtimeMs);

      backupFiles.slice(maxBackupFilesPerUser).forEach((file) => {
        rmSync(file.fullPath, { force: true });
      });
    } catch {
      // Backup pruning must never block the primary database write.
    }
  };

  const writeBackupSnapshot = (userId, snapshot, reason, updatedAt = new Date().toISOString()) => {
    const now = Date.now();
    const lastBackupAt = backupWriteTracker.get(userId) ?? 0;

    if (reason !== "account-created" && now - lastBackupAt < backupIntervalMs) {
      return;
    }

    backupWriteTracker.set(userId, now);
    const userBackupDir = path.join(backupDir, userId);
    mkdirSync(userBackupDir, { recursive: true });

    writeFileSync(
      path.join(userBackupDir, `${updatedAt.replace(/[:.]/g, "-")}-${reason}.json`),
      JSON.stringify({ userId, reason, updatedAt, snapshot }, null, 2),
      "utf8"
    );

    pruneUserBackups(userId);
  };

  const removeUserBackups = (userId) => {
    backupWriteTracker.delete(userId);
    rmSync(path.join(backupDir, userId), { recursive: true, force: true });
  };

  const getUserBackupEntries = (userId) => {
    const userBackupDir = path.join(backupDir, userId);

    try {
      return readdirSync(userBackupDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => {
          const fullPath = path.join(userBackupDir, entry.name);
          const fileStats = statSync(fullPath);
          const parsed = parseJsonValue(readFileSync(fullPath, "utf8"), null);

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
      payload: parseJsonValue(readFileSync(selectedBackup.fullPath, "utf8"), null),
    };
  };

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

  const getSnapshotMeta = async (userId) => {
    const row = await queryOne(
      `
        SELECT updated_at, profile_updated_at, meal_updated_at, water_updated_at,
               backup_enabled, last_writer_device_id
        FROM snapshots
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );

    return {
      updatedAt: row?.updated_at ?? null,
      profileUpdatedAt: row?.profile_updated_at ?? row?.updated_at ?? null,
      mealUpdatedAt: row?.meal_updated_at ?? row?.updated_at ?? null,
      waterUpdatedAt: row?.water_updated_at ?? row?.updated_at ?? null,
      backupEnabled: row?.backup_enabled ?? true,
      lastWriterDeviceId: row?.last_writer_device_id ?? null,
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

  const upsertSnapshotRow = async (
    userId,
    snapshot,
    {
      updatedAt = new Date().toISOString(),
      profileUpdatedAt = undefined,
      mealUpdatedAt = undefined,
      waterUpdatedAt = undefined,
      deviceId = undefined,
    } = {}
  ) => {
    const existingMeta = await getSnapshotMeta(userId);

    await pool.query(
      `
        INSERT INTO snapshots (
          user_id,
          profile_json,
          meal_json,
          water_json,
          fridge_json,
          community_json,
          companion_json,
          updated_at,
          profile_updated_at,
          meal_updated_at,
          water_updated_at,
          backup_enabled,
          last_writer_device_id
        ) VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, $11, TRUE, $12)
        ON CONFLICT(user_id) DO UPDATE SET
          profile_json = EXCLUDED.profile_json,
          meal_json = EXCLUDED.meal_json,
          water_json = EXCLUDED.water_json,
          fridge_json = EXCLUDED.fridge_json,
          community_json = EXCLUDED.community_json,
          companion_json = EXCLUDED.companion_json,
          updated_at = EXCLUDED.updated_at,
          profile_updated_at = COALESCE(EXCLUDED.profile_updated_at, snapshots.profile_updated_at, EXCLUDED.updated_at),
          meal_updated_at = COALESCE(EXCLUDED.meal_updated_at, snapshots.meal_updated_at, EXCLUDED.updated_at),
          water_updated_at = COALESCE(EXCLUDED.water_updated_at, snapshots.water_updated_at, EXCLUDED.updated_at),
          last_writer_device_id = COALESCE(EXCLUDED.last_writer_device_id, snapshots.last_writer_device_id)
      `,
      [
        userId,
        toJsonParam(snapshot.profile),
        toJsonParam(snapshot.meal),
        toJsonParam(snapshot.water),
        toJsonParam(snapshot.fridge),
        toJsonParam(snapshot.community),
        toJsonParam(snapshot.companion),
        updatedAt,
        profileUpdatedAt ?? existingMeta.profileUpdatedAt ?? updatedAt,
        mealUpdatedAt ?? existingMeta.mealUpdatedAt ?? updatedAt,
        waterUpdatedAt ?? existingMeta.waterUpdatedAt ?? updatedAt,
        deviceId ?? existingMeta.lastWriterDeviceId ?? null,
      ]
    );
  };

  const getSnapshotRow = async (userId) =>
    queryOne(
      `
        SELECT profile_json, meal_json, water_json, fridge_json, community_json, companion_json,
               updated_at, profile_updated_at, meal_updated_at, water_updated_at,
               backup_enabled, last_writer_device_id
        FROM snapshots
        WHERE user_id = $1
        LIMIT 1
      `,
      [userId]
    );

  const buildSnapshot = async (userId, user = null) => {
    const resolvedUser = user ?? (await getResolvedUser(userId));

    if (!resolvedUser) {
      return null;
    }

    const row = await getSnapshotRow(userId);
    const meta = await getSnapshotMeta(userId);
    const baseSnapshot = normalizeSnapshotForUser(
      row
        ? {
            profile: row.profile_json,
            meal: row.meal_json,
            water: row.water_json,
            fridge: row.fridge_json,
            community: row.community_json,
            companion: row.companion_json,
          }
        : null,
      resolvedUser
    );

    return {
      ...baseSnapshot,
      updatedAt: meta.updatedAt,
      profileUpdatedAt: meta.profileUpdatedAt,
      mealUpdatedAt: meta.mealUpdatedAt,
      waterUpdatedAt: meta.waterUpdatedAt,
      backupEnabled: meta.backupEnabled,
      lastWriterDeviceId: meta.lastWriterDeviceId,
    };
  };

  const withCurrentSnapshot = async (userId, syncContext, mutator, metaPatch, reason) => {
    const resolvedUser = await getResolvedUser(userId);

    if (!resolvedUser) {
      return null;
    }

    const normalizedSyncContext = await assertNoStateConflict(userId, syncContext);
    const currentSnapshot = await buildSnapshot(userId, resolvedUser);
    const updatedAt = new Date().toISOString();
    const nextSnapshot = normalizeSnapshotForUser(mutator(currentSnapshot, resolvedUser), resolvedUser);

    await upsertSnapshotRow(userId, nextSnapshot, {
      updatedAt,
      deviceId: normalizedSyncContext.deviceId,
      ...metaPatch(updatedAt),
    });
    writeBackupSnapshot(userId, nextSnapshot, reason, updatedAt);
    return nextSnapshot;
  };

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
    const rows = await queryMany(
      "SELECT * FROM catalog_products ORDER BY updated_at DESC, created_at DESC"
    );

    return rows
      .map(mapCatalogProductRow)
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

    const products = await listCatalogProductsInternal({
      includeUnapproved: true,
      statuses: ["pending", "approved", "rejected"],
      limit: 250,
    });

    return products
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

  const publicPostgresInfo = getPublicPostgresInfo(postgresUrl);

  return {
    getEngineInfo: () => ({
      engine: "postgres",
      schemaVersion: POSTGRES_SCHEMA_VERSION,
      ...publicPostgresInfo,
      ssl: Boolean(postgresSsl),
      backupDir,
    }),

    close: () => pool.end(),

    cleanupExpiredSessions: async (now = Date.now()) => {
      await pool.query("DELETE FROM sessions WHERE expires_at <= $1", [now]);
    },

    cleanupExpiredPasswordResetTokens: async (now = Date.now()) => {
      await pool.query(
        "DELETE FROM password_reset_tokens WHERE expires_at <= $1 OR consumed_at IS NOT NULL",
        [now]
      );
    },

    cleanupExpiredRegistrationVerificationTokens: async (now = Date.now()) => {
      await pool.query("DELETE FROM registration_verification_tokens WHERE expires_at <= $1", [
        now,
      ]);
    },

    findUserByEmail: async (email) =>
      mapUserRow(await queryOne("SELECT * FROM users WHERE email = $1 LIMIT 1", [email])),

    findUserById: async (userId) => getResolvedUser(userId),

    findUserByTelegramChatId: async (telegramChatId) =>
      mapUserRow(
        await queryOne("SELECT * FROM users WHERE telegram_chat_id = $1 LIMIT 1", [
          String(telegramChatId),
        ])
      ),

    hasUserWithRole: async (role) => {
      if (!isUserRole(role)) {
        return false;
      }

      const row = await queryOne("SELECT COUNT(*) AS count FROM users WHERE role = $1", [role]);
      return Number(row?.count ?? 0) > 0;
    },

    insertUser: async (user) => {
      await pool.query(
        `
          INSERT INTO users (
            id, email, name, email_verified, verification_channel,
            avatar, age, weight, height, gender, activity, goal, measurements_json,
            created_at, role, banned_at, banned_reason, two_factor_enabled,
            two_factor_required, token_version, password_hash, password_salt, password_version,
            medication_reminders_json
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
            $13::jsonb, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
            $24::jsonb
          )
        `,
        [
          user.id,
          user.email,
          user.name,
          toBoolean(user.emailVerified, false),
          isVerificationChannel(user.verificationChannel) ? user.verificationChannel : "email",
          user.avatar ?? null,
          user.age,
          user.weight,
          user.height,
          user.gender,
          user.activity,
          user.goal,
          user.measurements ? toJsonParam(user.measurements) : null,
          user.createdAt,
          isUserRole(user.role) ? user.role : "USER",
          user.bannedAt ?? null,
          user.bannedReason ?? null,
          toBoolean(user.twoFactorEnabled, false),
          toBoolean(user.twoFactorRequired, false),
          Math.max(Number(user.tokenVersion ?? 0) || 0, 0),
          user.passwordHash,
          user.passwordSalt,
          user.passwordVersion,
          toJsonParam(Array.isArray(user.medicationReminders) ? user.medicationReminders : []),
        ]
      );

      return user;
    },

    listUsers: async () =>
      (await queryMany("SELECT * FROM users ORDER BY created_at ASC"))
        .map(mapUserRow)
        .filter(Boolean),

    updateUser: async (user) => {
      await pool.query(
        `
          UPDATE users
          SET name = $1,
              avatar = $2,
              age = $3,
              weight = $4,
              height = $5,
              gender = $6,
              activity = $7,
              goal = $8,
              measurements_json = $9::jsonb
          WHERE id = $10
        `,
        [
          user.name,
          user.avatar ?? null,
          user.age,
          user.weight,
          user.height,
          user.gender,
          user.activity,
          user.goal,
          user.measurements ? toJsonParam(user.measurements) : null,
          user.id,
        ]
      );

      return getResolvedUser(user.id);
    },

    updateUserPassword: async ({ userId, passwordHash, passwordSalt, passwordVersion }) => {
      await pool.query(
        `
          UPDATE users
          SET password_hash = $1,
              password_salt = $2,
              password_version = $3
          WHERE id = $4
        `,
        [passwordHash, passwordSalt, passwordVersion, userId]
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

      await pool.query("BEGIN");

      try {
        await pool.query(
          `
            UPDATE users
            SET telegram_chat_id = NULL,
                telegram_connected_at = NULL
            WHERE telegram_chat_id = $1
              AND id <> $2
          `,
          [normalizedChatId, userId]
        );
        await pool.query(
          `
            UPDATE users
            SET telegram_chat_id = $1,
                telegram_connected_at = $2
            WHERE id = $3
          `,
          [normalizedChatId, telegramConnectedAt, userId]
        );
        await pool.query("COMMIT");
      } catch (error) {
        await pool.query("ROLLBACK");
        throw error;
      }

      return getResolvedUser(userId);
    },

    updateUserReminders: async (userId, reminders) => {
      await pool.query(
        `
          UPDATE users
          SET medication_reminders_json = $1::jsonb
          WHERE id = $2
        `,
        [toJsonParam(Array.isArray(reminders) ? reminders : []), userId]
      );

      return getResolvedUser(userId);
    },

    async updateUserMedicationReminders(userId, reminders) {
      return this.updateUserReminders(userId, reminders);
    },

    disconnectUserTelegram: async (userId) => {
      await pool.query(
        `
          UPDATE users
          SET telegram_chat_id = NULL,
              telegram_connected_at = NULL
          WHERE id = $1
        `,
        [userId]
      );

      return getResolvedUser(userId);
    },

    disconnectTelegramChat: async (telegramChatId) => {
      const normalizedChatId = String(telegramChatId ?? "").trim();

      if (!normalizedChatId) {
        return null;
      }

      const user = mapUserRow(
        await queryOne("SELECT * FROM users WHERE telegram_chat_id = $1 LIMIT 1", [
          normalizedChatId,
        ])
      );

      await pool.query(
        `
          UPDATE users
          SET telegram_chat_id = NULL,
              telegram_connected_at = NULL
          WHERE telegram_chat_id = $1
        `,
        [normalizedChatId]
      );

      return user;
    },

    incrementUserTokenVersion: async (userId) => {
      await pool.query(
        "UPDATE users SET token_version = COALESCE(token_version, 0) + 1 WHERE id = $1",
        [userId]
      );

      return getResolvedUser(userId);
    },

    updateUserRole: async ({
      userId,
      role,
      twoFactorRequired = undefined,
      twoFactorEnabled = undefined,
    }) => {
      const existingUser = await getResolvedUser(userId);

      if (!existingUser) {
        return null;
      }

      await pool.query(
        `
          UPDATE users
          SET role = $1,
              two_factor_required = $2,
              two_factor_enabled = $3
          WHERE id = $4
        `,
        [
          isUserRole(role) ? role : existingUser.role,
          twoFactorRequired === undefined
            ? existingUser.twoFactorRequired
            : Boolean(twoFactorRequired),
          twoFactorEnabled === undefined ? existingUser.twoFactorEnabled : Boolean(twoFactorEnabled),
          userId,
        ]
      );

      return getResolvedUser(userId);
    },

    promoteUserByEmailToOwner: async (email) => {
      const normalizedEmail = String(email ?? "").trim().toLowerCase();

      if (!normalizedEmail) {
        return null;
      }

      const existingUser = mapUserRow(
        await queryOne("SELECT * FROM users WHERE email = $1 LIMIT 1", [normalizedEmail])
      );

      if (!existingUser || existingUser.role === "OWNER" || existingUser.role === "SUPER_ADMIN") {
        return existingUser;
      }

      await pool.query(
        `
          UPDATE users
          SET role = 'OWNER',
              two_factor_required = TRUE
          WHERE email = $1
        `,
        [normalizedEmail]
      );

      return mapUserRow(
        await queryOne("SELECT * FROM users WHERE email = $1 LIMIT 1", [normalizedEmail])
      );
    },

    async promoteUserByEmailToSuperAdmin(email) {
      return this.promoteUserByEmailToOwner(email);
    },

    deleteUser: async (userId) => {
      await pool.query("DELETE FROM users WHERE id = $1", [userId]);
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
      await pool.query(
        `
          INSERT INTO audit_logs (
            id, actor_user_id, actor_role, action, target_type, target_id, details_json, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
        `,
        [
          id,
          actorUserId,
          isUserRole(actorRole) ? actorRole : "USER",
          action,
          targetType,
          targetId,
          toJsonParam(details),
          createdAt,
        ]
      );
    },

    listAuditLogs: async (limit = 60) =>
      (
        await queryMany("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1", [
          Math.max(Number(limit) || 0, 1),
        ])
      )
        .map(mapAuditLogRow)
        .filter(Boolean),

    countCatalogProductsByOwnerSince: async (userId, sinceIso) => {
      const row = await queryOne(
        `
          SELECT COUNT(*) AS count
          FROM catalog_products
          WHERE owner_user_id = $1 AND created_at >= $2
        `,
        [userId, sinceIso]
      );

      return Number(row?.count ?? 0);
    },

    findCatalogProductById: async (productId) =>
      mapCatalogProductRow(
        await queryOne("SELECT * FROM catalog_products WHERE id = $1 LIMIT 1", [productId])
      ),

    listCatalogProducts: (options = {}) => listCatalogProductsInternal(options),

    findCatalogDuplicateCandidates: (options = {}) =>
      findCatalogDuplicateCandidatesInternal(options),

    insertCatalogProduct: async (product) => {
      await pool.query(
        `
          INSERT INTO catalog_products (
            id, owner_user_id, name, brand, barcode, category, image_url, unit, source,
            nutrients_json, facts_json, status, created_at, updated_at, approved_at,
            approved_by_user_id, rejection_reason, version
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13,
            $14, $15, $16, $17, $18
          )
        `,
        [
          product.id,
          product.ownerUserId,
          product.name,
          product.brand ?? null,
          product.barcode ?? null,
          product.category ?? null,
          product.imageUrl ?? null,
          isUnit(product.unit) ? product.unit : "g",
          isSource(product.source) ? product.source : "Manual",
          toJsonParam(product.nutrients ?? {}),
          toJsonParam(product.facts ?? null),
          isProductModerationStatus(product.status) ? product.status : "pending",
          product.createdAt,
          product.updatedAt,
          product.approvedAt ?? null,
          product.approvedByUserId ?? null,
          product.rejectionReason ?? null,
          Math.max(Number(product.version ?? 1), 1),
        ]
      );

      return product;
    },

    updateCatalogProduct: async (product) => {
      await pool.query(
        `
          UPDATE catalog_products
          SET name = $1,
              brand = $2,
              barcode = $3,
              category = $4,
              image_url = $5,
              unit = $6,
              source = $7,
              nutrients_json = $8::jsonb,
              facts_json = $9::jsonb,
              status = $10,
              updated_at = $11,
              approved_at = $12,
              approved_by_user_id = $13,
              rejection_reason = $14,
              version = $15
          WHERE id = $16
        `,
        [
          product.name,
          product.brand ?? null,
          product.barcode ?? null,
          product.category ?? null,
          product.imageUrl ?? null,
          isUnit(product.unit) ? product.unit : "g",
          isSource(product.source) ? product.source : "Manual",
          toJsonParam(product.nutrients ?? {}),
          toJsonParam(product.facts ?? null),
          isProductModerationStatus(product.status) ? product.status : "pending",
          product.updatedAt,
          product.approvedAt ?? null,
          product.approvedByUserId ?? null,
          product.rejectionReason ?? null,
          Math.max(Number(product.version ?? 1), 1),
          product.id,
        ]
      );

      return mapCatalogProductRow(
        await queryOne("SELECT * FROM catalog_products WHERE id = $1 LIMIT 1", [product.id])
      );
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
      await pool.query(
        `
          INSERT INTO catalog_product_versions (
            id, product_id, version, editor_user_id, note, snapshot_json, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
        `,
        [id, productId, version, editorUserId, note, toJsonParam(snapshot), createdAt]
      );
    },

    createSession: async ({ token, userId, expiresAt }) => {
      await pool.query(
        "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4)",
        [token, userId, expiresAt, new Date().toISOString()]
      );

      return { token, userId, expiresAt };
    },

    findSessionByToken: async (token) =>
      mapSessionRow(await queryOne("SELECT * FROM sessions WHERE token = $1 LIMIT 1", [token])),

    deleteSessionByToken: async (token) => {
      await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
    },

    deleteSessionsByUserId: async (userId) => {
      await pool.query("DELETE FROM sessions WHERE user_id = $1", [userId]);
    },

    createPasswordResetToken: async ({ id, userId, tokenHash, expiresAt, createdAt }) => {
      await pool.query(
        `
          INSERT INTO password_reset_tokens (
            id, user_id, token_hash, expires_at, consumed_at, created_at
          ) VALUES ($1, $2, $3, $4, NULL, $5)
        `,
        [id, userId, tokenHash, expiresAt, createdAt]
      );

      return { id, userId, tokenHash, expiresAt, consumedAt: null, createdAt };
    },

    findPasswordResetTokenByHash: async (tokenHash) =>
      mapPasswordResetTokenRow(
        await queryOne("SELECT * FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1", [
          tokenHash,
        ])
      ),

    markPasswordResetTokenConsumed: async (tokenHash, consumedAt) => {
      await pool.query(
        `
          UPDATE password_reset_tokens
          SET consumed_at = $1
          WHERE token_hash = $2 AND consumed_at IS NULL
        `,
        [consumedAt, tokenHash]
      );

      return mapPasswordResetTokenRow(
        await queryOne("SELECT * FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1", [
          tokenHash,
        ])
      );
    },

    deletePasswordResetTokensByUserId: async (userId) => {
      await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
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
      const normalizedChannel = isVerificationChannel(channel) ? channel : "email";

      await pool.query(
        `
          INSERT INTO registration_verification_tokens (
            id, user_id, channel, target, code_hash, expires_at, consumed_at, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7)
        `,
        [id, userId, normalizedChannel, target, codeHash, expiresAt, createdAt]
      );

      return {
        id,
        userId,
        channel: normalizedChannel,
        target,
        codeHash,
        expiresAt,
        consumedAt: null,
        createdAt,
      };
    },

    findRegistrationVerificationTokenByHash: async (codeHash) =>
      mapRegistrationVerificationTokenRow(
        await queryOne(
          "SELECT * FROM registration_verification_tokens WHERE code_hash = $1 LIMIT 1",
          [codeHash]
        )
      ),

    markRegistrationVerificationTokenConsumed: async (codeHash, consumedAt) => {
      await pool.query(
        `
          UPDATE registration_verification_tokens
          SET consumed_at = $1
          WHERE code_hash = $2 AND consumed_at IS NULL
        `,
        [consumedAt, codeHash]
      );

      return mapRegistrationVerificationTokenRow(
        await queryOne(
          "SELECT * FROM registration_verification_tokens WHERE code_hash = $1 LIMIT 1",
          [codeHash]
        )
      );
    },

    deleteRegistrationVerificationTokensByUserId: async (userId) => {
      await pool.query("DELETE FROM registration_verification_tokens WHERE user_id = $1", [
        userId,
      ]);
    },

    markUserRegistrationVerified: async ({ userId, channel }) => {
      const existingUser = await getResolvedUser(userId);

      if (!existingUser) {
        return null;
      }

      await pool.query(
        `
          UPDATE users
          SET email_verified = $1,
              verification_channel = $2
          WHERE id = $3
        `,
        [
          channel === "email" ? true : existingUser.emailVerified,
          isVerificationChannel(channel) ? channel : existingUser.verificationChannel,
          userId,
        ]
      );

      return getResolvedUser(userId);
    },

    updateUserVerificationTarget: async ({ userId, channel }) => {
      await pool.query(
        `
          UPDATE users
          SET verification_channel = $1
          WHERE id = $2
        `,
        [isVerificationChannel(channel) ? channel : "email", userId]
      );

      return getResolvedUser(userId);
    },

    updateUserBan: async ({ userId, bannedAt = null, bannedReason = null }) => {
      await pool.query(
        `
          UPDATE users
          SET banned_at = $1,
              banned_reason = $2
          WHERE id = $3
        `,
        [bannedAt, bannedReason, userId]
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

      await upsertSnapshotRow(userId, normalizedSnapshot, {
        updatedAt,
        profileUpdatedAt: updatedAt,
        mealUpdatedAt: updatedAt,
        waterUpdatedAt: updatedAt,
        deviceId: normalizedSyncContext.deviceId,
      });
      writeBackupSnapshot(userId, normalizedSnapshot, "snapshot", updatedAt);
      return normalizedSnapshot;
    },

    getProfileStateByUserId: async (userId, user = null) =>
      (await buildSnapshot(userId, user))?.profile ?? null,

    upsertProfileState: async (userId, profileState, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            profile: profileState,
          }),
          (updatedAt) => ({ profileUpdatedAt: updatedAt }),
          "profile-state"
        )
      )?.profile ?? null,

    getMealStateByUserId: async (userId) => (await buildSnapshot(userId))?.meal ?? null,

    upsertMealState: async (userId, mealState, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            meal: mealState,
          }),
          (updatedAt) => ({ mealUpdatedAt: updatedAt }),
          "meal-state"
        )
      )?.meal ?? null,

    getWaterStateByUserId: async (userId) => (await buildSnapshot(userId))?.water ?? null,

    upsertWaterState: async (userId, waterState, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            water: waterState,
          }),
          (updatedAt) => ({ waterUpdatedAt: updatedAt }),
          "water-state"
        )
      )?.water ?? null,

    getFridgeStateByUserId: async (userId) => (await buildSnapshot(userId))?.fridge ?? null,

    upsertFridgeState: async (userId, fridgeState, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            fridge: fridgeState,
          }),
          () => ({}),
          "fridge-state"
        )
      )?.fridge ?? null,

    getCommunityStateByUserId: async (userId) => (await buildSnapshot(userId))?.community ?? null,

    upsertCommunityState: async (userId, communityState, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            community: communityState,
          }),
          () => ({}),
          "community-state"
        )
      )?.community ?? null,

    getCompanionStateByUserId: async (userId) => (await buildSnapshot(userId))?.companion ?? null,

    upsertCompanionState: async (userId, companionState, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            companion: companionState,
          }),
          () => ({}),
          "companion-state"
        )
      )?.companion ?? null,

    addMealEntries: async (userId, entries, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => {
            const normalizedEntries = normalizeMealEntries(entries);
            const existingEntryIds = new Set(snapshot.meal.items.map((item) => item.id));
            const entriesToAdd = normalizedEntries.filter(
              (entry) => !existingEntryIds.has(entry.id)
            );
            const nextMealState = {
              ...snapshot.meal,
              items: [...entriesToAdd, ...snapshot.meal.items],
            };

            entriesToAdd.forEach((entry) => {
              nextMealState.recentProducts = [
                entry.product,
                ...snapshot.meal.recentProducts.filter(
                  (item) => createProductKey(item) !== createProductKey(entry.product)
                ),
              ].slice(0, 16);

              if (entry.product.barcode?.replace(/\D/g, "")) {
                nextMealState.personalBarcodeProducts = [
                  entry.product,
                  ...snapshot.meal.personalBarcodeProducts.filter(
                    (item) =>
                      item.barcode?.replace(/\D/g, "") !==
                      entry.product.barcode?.replace(/\D/g, "")
                  ),
                ].slice(0, 240);
              }
            });

            nextMealState.totalNutrients = calculateMealTotalNutrients(nextMealState.items);
            return { ...snapshot, meal: nextMealState };
          },
          (updatedAt) => ({ mealUpdatedAt: updatedAt }),
          "meal-state"
        )
      )?.meal ?? null,

    removeMealEntry: async (userId, entryId, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => {
            const nextMealState = {
              ...snapshot.meal,
              items: snapshot.meal.items.filter((item) => item.id !== entryId),
            };
            nextMealState.totalNutrients = calculateMealTotalNutrients(nextMealState.items);
            return { ...snapshot, meal: nextMealState };
          },
          (updatedAt) => ({ mealUpdatedAt: updatedAt }),
          "meal-state"
        )
      )?.meal ?? null,

    addMealTemplate: async (userId, template, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            meal: {
              ...snapshot.meal,
              templates: [
                ...normalizeMealTemplates([template]),
                ...snapshot.meal.templates.filter((item) => item.id !== template.id),
              ],
            },
          }),
          (updatedAt) => ({ mealUpdatedAt: updatedAt }),
          "meal-state"
        )
      )?.meal ?? null,

    deleteMealTemplate: async (userId, templateId, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => ({
            ...snapshot,
            meal: {
              ...snapshot.meal,
              templates: snapshot.meal.templates.filter((item) => item.id !== templateId),
            },
          }),
          (updatedAt) => ({ mealUpdatedAt: updatedAt }),
          "meal-state"
        )
      )?.meal ?? null,

    upsertMealProduct: async (userId, bucketType, product, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => {
            const normalizedProduct = normalizeProduct(product, `bucket-${bucketType}`);
            const nextMealState = { ...snapshot.meal };

            if (bucketType === "saved") {
              nextMealState.savedProducts = [
                normalizedProduct,
                ...snapshot.meal.savedProducts.filter(
                  (item) => createProductKey(item) !== createProductKey(normalizedProduct)
                ),
              ].slice(0, 24);
            } else {
              nextMealState.recentProducts = [
                normalizedProduct,
                ...snapshot.meal.recentProducts.filter(
                  (item) => createProductKey(item) !== createProductKey(normalizedProduct)
                ),
              ].slice(0, 16);
            }

            if (normalizedProduct.barcode?.replace(/\D/g, "")) {
              nextMealState.personalBarcodeProducts = [
                normalizedProduct,
                ...snapshot.meal.personalBarcodeProducts.filter(
                  (item) =>
                    item.barcode?.replace(/\D/g, "") !== normalizedProduct.barcode?.replace(/\D/g, "")
                ),
              ].slice(0, 240);
            }

            return { ...snapshot, meal: nextMealState };
          },
          (updatedAt) => ({ mealUpdatedAt: updatedAt }),
          "meal-state"
        )
      )?.meal ?? null,

    removeMealProduct: async (userId, bucketType, productKey, syncContext = undefined) =>
      (
        await withCurrentSnapshot(
          userId,
          syncContext,
          (snapshot) => {
            const nextMealState = { ...snapshot.meal };

            if (bucketType === "saved") {
              nextMealState.savedProducts = snapshot.meal.savedProducts.filter(
                (item) => createProductKey(item) !== productKey
              );
            } else {
              nextMealState.recentProducts = snapshot.meal.recentProducts.filter(
                (item) => createProductKey(item) !== productKey
              );
            }

            return { ...snapshot, meal: nextMealState };
          },
          (updatedAt) => ({ mealUpdatedAt: updatedAt }),
          "meal-state"
        )
      )?.meal ?? null,

    listAssistantMessagesByUserId: async (userId, limit = 16) =>
      (
        await queryMany(
          `
            SELECT *
            FROM assistant_messages
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2
          `,
          [userId, Math.max(Number(limit) || 0, 1)]
        )
      )
        .map(mapAssistantMessageRow)
        .filter(Boolean)
        .reverse(),

    insertAssistantMessage: async ({ id, userId, role, text, createdAt }) => {
      await pool.query(
        `
          INSERT INTO assistant_messages (id, user_id, role, text, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [id, userId, isAssistantMessageRole(role) ? role : "assistant", String(text ?? ""), createdAt]
      );
    },

    deleteAssistantMessagesByUserId: async (userId) => {
      await pool.query("DELETE FROM assistant_messages WHERE user_id = $1", [userId]);
    },

    pruneAssistantMessagesByUserId: async (userId, keepLast = 16) => {
      await pool.query(
        `
          DELETE FROM assistant_messages
          WHERE user_id = $1
            AND id NOT IN (
              SELECT id
              FROM assistant_messages
              WHERE user_id = $1
              ORDER BY created_at DESC
              LIMIT $2
            )
        `,
        [userId, Math.max(Number(keepLast) || 0, 1)]
      );
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
      const normalizedPromptTokens = Math.max(Math.round(Number(promptTokens) || 0), 0);
      const normalizedCompletionTokens = Math.max(Math.round(Number(completionTokens) || 0), 0);
      const normalizedTotalTokens = Math.max(
        Math.round(Number(totalTokens) || normalizedPromptTokens + normalizedCompletionTokens),
        0
      );

      await pool.query(
        `
          INSERT INTO ai_usage_events (
            id, user_id, route, event_type, prompt_tokens, completion_tokens, total_tokens,
            estimated_cost_usd, provider_id, blocked_reason, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          id,
          userId,
          String(route ?? "ai"),
          isAiUsageEventType(eventType) ? eventType : "completed",
          normalizedPromptTokens,
          normalizedCompletionTokens,
          normalizedTotalTokens,
          Math.max(Number(estimatedCostUsd) || 0, 0),
          providerId,
          blockedReason,
          createdAt,
        ]
      );
    },

    getAiUsageSummary: async ({ userId, sinceIso, route = null }) => {
      const routeFilter = typeof route === "string" && route.trim() ? route.trim() : null;

      return mapAiUsageSummaryRow(
        await queryOne(
          `
            SELECT
              COUNT(*) AS request_count,
              COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
              COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
              COALESCE(SUM(total_tokens), 0) AS total_tokens,
              COALESCE(SUM(estimated_cost_usd), 0) AS estimated_cost_usd
            FROM ai_usage_events
            WHERE user_id = $1
              AND created_at >= $2
              AND ($3::text IS NULL OR route = $3)
          `,
          [userId, sinceIso, routeFilter]
        )
      );
    },

    findLatestAiUsageEvent: async ({ userId, route = null, eventType = null }) => {
      const routeFilter = typeof route === "string" && route.trim() ? route.trim() : null;
      const eventTypeFilter =
        typeof eventType === "string" && eventType.trim() ? eventType.trim() : null;

      return mapAiUsageEventRow(
        await queryOne(
          `
            SELECT *
            FROM ai_usage_events
            WHERE user_id = $1
              AND ($2::text IS NULL OR route = $2)
              AND ($3::text IS NULL OR event_type = $3)
            ORDER BY created_at DESC
            LIMIT 1
          `,
          [userId, routeFilter, eventTypeFilter]
        )
      );
    },

    getLoginAttempt: async (email) =>
      mapLoginAttemptRow(
        await queryOne("SELECT * FROM login_attempts WHERE email = $1 LIMIT 1", [email])
      ),

    upsertLoginAttempt: async ({ email, count, lockUntil }) => {
      await pool.query(
        `
          INSERT INTO login_attempts (email, count, lock_until)
          VALUES ($1, $2, $3)
          ON CONFLICT(email) DO UPDATE SET
            count = EXCLUDED.count,
            lock_until = EXCLUDED.lock_until
        `,
        [email, count, lockUntil]
      );
    },

    clearLoginAttempt: async (email) => {
      await pool.query("DELETE FROM login_attempts WHERE email = $1", [email]);
    },
  };
};
