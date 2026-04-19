import { DatabaseSync } from "node:sqlite";
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
  createInitialMealState,
  createInitialProfileState,
  StateApiError,
} from "../lib/domain.mjs";

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

const serializeJson = (value) => JSON.stringify(value ?? null);

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const toNullablePositiveNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : null;
};

const toBoolean = (value, fallback = false) =>
  typeof value === "boolean" ? value : value === 1 || value === "1" ? true : fallback;

const isGoal = (value) => value === "cut" || value === "maintain" || value === "bulk";
const isDietStyle = (value) =>
  value === "balanced" ||
  value === "vegetarian" ||
  value === "vegan" ||
  value === "pescatarian" ||
  value === "low_carb" ||
  value === "gluten_free";
const isAdaptiveMode = (value) => value === "automatic" || value === "manual";
const isAppLanguage = (value) => value === "uk" || value === "pl";
const isAssistantRole = (value) =>
  value === "friend" || value === "assistant" || value === "coach";
const isAssistantTone = (value) => value === "gentle" || value === "playful" || value === "focused";
const isTaskCategory = (value) =>
  value === "nutrition" || value === "consistency" || value === "reflection";
const isReminderTime = (value) =>
  typeof value === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value.trim());
const isIsoDate = (value) =>
  typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));

const isMealType = (value) =>
  value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack";

const isOrigin = (value) => value === "manual" || value === "barcode" || value === "recipe";

const isUnit = (value) => value === "g" || value === "ml" || value === "piece";

const isSource = (value) =>
  value === "USDA" ||
  value === "OpenFoodFacts" ||
  value === "Manual" ||
  value === "Recipe";

const isUserRole = (value) =>
  value === "USER" ||
  value === "MODERATOR" ||
  value === "ADMIN" ||
  value === "SUPER_ADMIN";

const isProductModerationStatus = (value) =>
  value === "pending" || value === "approved" || value === "rejected";
const isAssistantMessageRole = (value) => value === "user" || value === "assistant";

const isRecord = (value) => typeof value === "object" && value !== null;

const normalizeReminderTimes = (value, fallback) => {
  const record = isRecord(value) ? value : {};

  return {
    breakfast: isReminderTime(record.breakfast)
      ? record.breakfast
      : fallback.breakfast,
    lunch: isReminderTime(record.lunch) ? record.lunch : fallback.lunch,
    dinner: isReminderTime(record.dinner) ? record.dinner : fallback.dinner,
    snack: isReminderTime(record.snack) ? record.snack : fallback.snack,
  };
};

const normalizeAssistantCustomization = (value, fallback) => {
  const record = isRecord(value) ? value : {};

  return {
    name:
      typeof record.name === "string" && record.name.trim().length > 0
        ? record.name.trim().slice(0, 32)
        : fallback.name,
    role: isAssistantRole(record.role) ? record.role : fallback.role,
    tone: isAssistantTone(record.tone) ? record.tone : fallback.tone,
    humorEnabled:
      typeof record.humorEnabled === "boolean" ? record.humorEnabled : fallback.humorEnabled,
  };
};

const normalizeMotivationState = (value, fallback) => {
  const record = isRecord(value) ? value : {};

  const activeTasks = Array.isArray(record.activeTasks)
    ? record.activeTasks
        .map((item, index) => {
          if (!isRecord(item)) {
            return null;
          }

          return {
            id:
              typeof item.id === "string" && item.id.trim().length > 0
                ? item.id
                : `task-${index}-${Date.now()}`,
            title:
              typeof item.title === "string" && item.title.trim().length > 0
                ? item.title
                : "Task",
            description:
              typeof item.description === "string" ? item.description : "",
            points: toNumber(item.points, 0),
            category: isTaskCategory(item.category) ? item.category : "consistency",
            createdAt: isIsoDate(item.createdAt) ? item.createdAt : new Date().toISOString(),
            completedAt:
              item.completedAt === null || isIsoDate(item.completedAt) ? item.completedAt : null,
            skippedWithDayOffAt:
              item.skippedWithDayOffAt === null || isIsoDate(item.skippedWithDayOffAt)
                ? item.skippedWithDayOffAt
                : null,
          };
        })
        .filter(Boolean)
    : fallback.activeTasks;

  const history = Array.isArray(record.history)
    ? record.history
        .map((item) => {
          if (!isRecord(item) || !isIsoDate(item.completedAt)) {
            return null;
          }

          return {
            taskId: typeof item.taskId === "string" ? item.taskId : "task",
            title: typeof item.title === "string" ? item.title : "Task",
            pointsEarned: toNumber(item.pointsEarned, 0),
            completedAt: item.completedAt,
            skipped: Boolean(item.skipped),
            usedDayOff:
              item.usedDayOff === "free" || item.usedDayOff === "paid" ? item.usedDayOff : null,
          };
        })
        .filter(Boolean)
    : fallback.history;

  const achievements = Array.isArray(record.achievements)
    ? fallback.achievements.map((achievement) => {
        const match = record.achievements.find(
          (item) => isRecord(item) && typeof item.id === "string" && item.id === achievement.id
        );

        if (!isRecord(match)) {
          return achievement;
        }

        return {
          ...achievement,
          progress: toNumber(match.progress, achievement.progress),
          unlockedAt:
            match.unlockedAt === null || isIsoDate(match.unlockedAt)
              ? match.unlockedAt
              : achievement.unlockedAt,
        };
      })
    : fallback.achievements;

  return {
    points: toNumber(record.points, fallback.points),
    level: Math.max(toNumber(record.level, fallback.level), 1),
    completedTasks: toNumber(record.completedTasks, fallback.completedTasks),
    activeTasks,
    history,
    achievements,
    lastTaskRefreshDate:
      isIsoDate(record.lastTaskRefreshDate)
        ? record.lastTaskRefreshDate.slice(0, 10)
        : fallback.lastTaskRefreshDate,
    freeDayLastUsedAt:
      record.freeDayLastUsedAt === null || isIsoDate(record.freeDayLastUsedAt)
        ? record.freeDayLastUsedAt
        : null,
    paidDayLastUsedAt:
      record.paidDayLastUsedAt === null || isIsoDate(record.paidDayLastUsedAt)
        ? record.paidDayLastUsedAt
        : null,
    paidDayLastUsedMonth:
      typeof record.paidDayLastUsedMonth === "string" &&
      /^\d{4}-\d{2}$/.test(record.paidDayLastUsedMonth)
        ? record.paidDayLastUsedMonth
        : null,
  };
};

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
    imageUrl:
      typeof record.imageUrl === "string" && record.imageUrl.trim().length > 0
        ? record.imageUrl
        : undefined,
    facts: isRecord(record.facts) ? record.facts : undefined,
  };
};

const normalizeProfileState = (value, user) => {
  const fallback = createInitialProfileState(user);
  const record = isRecord(value) ? value : {};
  const weightHistory = Array.isArray(record.weightHistory)
    ? record.weightHistory
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          return {
            date:
              typeof item.date === "string" && item.date.trim().length > 0
                ? item.date
                : new Date().toISOString(),
            weight: toNumber(item.weight, user.weight),
          };
        })
        .filter(Boolean)
    : fallback.weightHistory;

  return {
    dailyCalories: toNumber(record.dailyCalories, fallback.dailyCalories),
    goal: isGoal(record.goal) ? record.goal : fallback.goal,
    weightHistory: weightHistory.length > 0 ? weightHistory : fallback.weightHistory,
    maintenanceCalories: toNumber(record.maintenanceCalories, fallback.maintenanceCalories),
    adaptiveCalories:
      record.adaptiveCalories === null || record.adaptiveCalories === undefined
        ? fallback.adaptiveCalories
        : toNullablePositiveNumber(record.adaptiveCalories),
    targetWeight: toNullablePositiveNumber(record.targetWeight),
    targetWeightStart: toNullablePositiveNumber(record.targetWeightStart),
    dietStyle: isDietStyle(record.dietStyle) ? record.dietStyle : "balanced",
    allergies: Array.isArray(record.allergies)
      ? record.allergies.filter((item) => typeof item === "string" && item.trim().length > 0)
      : [],
    excludedIngredients: Array.isArray(record.excludedIngredients)
      ? record.excludedIngredients.filter(
          (item) => typeof item === "string" && item.trim().length > 0
        )
      : [],
    adaptiveMode: isAdaptiveMode(record.adaptiveMode) ? record.adaptiveMode : "automatic",
    notificationsEnabled: toBoolean(
      record.notificationsEnabled,
      fallback.notificationsEnabled
    ),
    mealRemindersEnabled: toBoolean(
      record.mealRemindersEnabled,
      fallback.mealRemindersEnabled
    ),
    calorieAlertsEnabled: toBoolean(
      record.calorieAlertsEnabled,
      fallback.calorieAlertsEnabled
    ),
    reminderTimes: normalizeReminderTimes(record.reminderTimes, fallback.reminderTimes),
    languagePreference: isAppLanguage(record.languagePreference)
      ? record.languagePreference
      : fallback.languagePreference,
    motivation: normalizeMotivationState(record.motivation, fallback.motivation),
    assistant: normalizeAssistantCustomization(record.assistant, fallback.assistant),
  };
};

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
            mealType: isMealType(item.mealType) ? item.mealType : "snack",
            eatenAt:
              typeof item.eatenAt === "string" && item.eatenAt.trim().length > 0
                ? item.eatenAt
                : new Date().toISOString(),
            origin: isOrigin(item.origin) ? item.origin : "manual",
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

          const items = Array.isArray(template.items)
            ? template.items
                .map((item) => {
                  if (!isRecord(item)) {
                    return null;
                  }

                  return {
                    product: normalizeProduct(item.product, "template-product"),
                    quantity: toNumber(item.quantity, 100),
                  };
                })
                .filter(Boolean)
            : [];

          return {
            id:
              typeof template.id === "string" && template.id.trim().length > 0
                ? template.id
                : `template-${index}-${Date.now()}`,
            name:
              typeof template.name === "string" && template.name.trim().length > 0
                ? template.name
                : "Meal template",
            mealType: isMealType(template.mealType) ? template.mealType : "snack",
            createdAt:
              typeof template.createdAt === "string" && template.createdAt.trim().length > 0
                ? template.createdAt
                : new Date().toISOString(),
            items,
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
  const templates = normalizeMealTemplates(record.templates);
  const savedProducts = normalizeProductCollection(record.savedProducts, "saved");
  const recentProducts = normalizeProductCollection(record.recentProducts, "recent");
  const personalBarcodeProducts = normalizeProductCollection(
    record.personalBarcodeProducts,
    "barcode"
  );

  return {
    ...fallback,
    items,
    templates,
    savedProducts,
    recentProducts,
    personalBarcodeProducts,
    totalNutrients: calculateMealTotalNutrients(items),
  };
};

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatar: row.avatar ?? undefined,
    age: Number(row.age),
    weight: Number(row.weight),
    height: Number(row.height),
    gender: row.gender,
    activity: row.activity,
    goal: row.goal,
    measurements: parseJson(row.measurements_json, undefined),
    createdAt: row.created_at,
    role: isUserRole(row.role) ? row.role : "USER",
    twoFactorEnabled: toBoolean(row.two_factor_enabled, false),
    twoFactorRequired: toBoolean(row.two_factor_required, false),
    tokenVersion: Math.max(toNumber(row.token_version, 0), 0),
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    passwordVersion: row.password_version,
  };
};

const mapSessionRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    token: row.token,
    userId: row.user_id,
    expiresAt: Number(row.expires_at),
  };
};

const mapSnapshotRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    profile: parseJson(row.profile_json, null),
    meal: parseJson(row.meal_json, null),
    updatedAt: row.updated_at,
  };
};

const mapLoginAttemptRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    email: row.email,
    count: Number(row.count),
    lockUntil: row.lock_until === null ? null : Number(row.lock_until),
  };
};

const mapAuditLogRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    actorUserId: row.actor_user_id ?? null,
    actorRole: isUserRole(row.actor_role) ? row.actor_role : "USER",
    action: row.action,
    targetType: row.target_type ?? null,
    targetId: row.target_id ?? null,
    details: parseJson(row.details_json, null),
    createdAt: row.created_at,
  };
};

const mapCatalogProductRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    brand: row.brand ?? undefined,
    barcode: row.barcode ?? undefined,
    category: row.category ?? undefined,
    imageUrl: row.image_url ?? undefined,
    unit: isUnit(row.unit) ? row.unit : "g",
    source: isSource(row.source) ? row.source : "Manual",
    nutrients: parseJson(row.nutrients_json, {}),
    facts: parseJson(row.facts_json, undefined),
    status: isProductModerationStatus(row.status) ? row.status : "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at ?? null,
    approvedByUserId: row.approved_by_user_id ?? null,
    rejectionReason: row.rejection_reason ?? null,
    version: Math.max(Number(row.version ?? 1), 1),
  };
};

const mapAssistantMessageRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    role: isAssistantMessageRole(row.role) ? row.role : "assistant",
    text: row.text,
    createdAt: row.created_at,
  };
};

const createSchema = (database) => {
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      avatar TEXT,
      age REAL NOT NULL,
      weight REAL NOT NULL,
      height REAL NOT NULL,
      gender TEXT NOT NULL,
      activity TEXT NOT NULL,
      goal TEXT NOT NULL,
      measurements_json TEXT,
      created_at TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      two_factor_enabled INTEGER NOT NULL DEFAULT 0,
      two_factor_required INTEGER NOT NULL DEFAULT 0,
      token_version INTEGER NOT NULL DEFAULT 0,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_version TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      user_id TEXT PRIMARY KEY,
      profile_json TEXT,
      meal_json TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      email TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      lock_until INTEGER
    );

    CREATE TABLE IF NOT EXISTS profile_states (
      user_id TEXT PRIMARY KEY,
      daily_calories REAL NOT NULL,
      goal TEXT NOT NULL,
      maintenance_calories REAL NOT NULL,
      adaptive_calories REAL,
      target_weight REAL,
      target_weight_start REAL,
      diet_style TEXT NOT NULL DEFAULT 'balanced',
      allergies_json TEXT NOT NULL DEFAULT '[]',
      excluded_ingredients_json TEXT NOT NULL DEFAULT '[]',
      adaptive_mode TEXT NOT NULL DEFAULT 'automatic',
      notifications_enabled INTEGER NOT NULL DEFAULT 0,
      meal_reminders_enabled INTEGER NOT NULL DEFAULT 1,
      calorie_alerts_enabled INTEGER NOT NULL DEFAULT 1,
      reminder_times_json TEXT NOT NULL DEFAULT '{"breakfast":"08:30","lunch":"13:00","dinner":"19:00","snack":"16:30"}',
      language_preference TEXT NOT NULL DEFAULT 'uk',
      motivation_json TEXT NOT NULL DEFAULT '{"points":0,"level":1,"completedTasks":0,"activeTasks":[],"history":[],"achievements":[],"lastTaskRefreshDate":null,"freeDayLastUsedAt":null,"paidDayLastUsedAt":null,"paidDayLastUsedMonth":null}',
      assistant_json TEXT NOT NULL DEFAULT '{"name":"Nova","role":"assistant","tone":"gentle","humorEnabled":true}',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS profile_weight_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      sort_index INTEGER NOT NULL,
      recorded_at TEXT NOT NULL,
      weight REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      sort_index INTEGER NOT NULL,
      product_json TEXT NOT NULL,
      quantity REAL NOT NULL,
      meal_type TEXT NOT NULL,
      eaten_at TEXT NOT NULL,
      origin TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_templates (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      sort_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_template_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL,
      sort_index INTEGER NOT NULL,
      product_json TEXT NOT NULL,
      quantity REAL NOT NULL,
      FOREIGN KEY (template_id) REFERENCES meal_templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_product_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      bucket_type TEXT NOT NULL,
      sort_index INTEGER NOT NULL,
      product_key TEXT NOT NULL,
      product_json TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS catalog_products (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT,
      barcode TEXT,
      category TEXT,
      image_url TEXT,
      unit TEXT NOT NULL DEFAULT 'g',
      source TEXT NOT NULL DEFAULT 'Manual',
      nutrients_json TEXT NOT NULL,
      facts_json TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      approved_at TEXT,
      approved_by_user_id TEXT,
      rejection_reason TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS catalog_product_versions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      editor_user_id TEXT,
      note TEXT,
      snapshot_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES catalog_products(id) ON DELETE CASCADE,
      FOREIGN KEY (editor_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS assistant_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
};

const createIndexes = (database) => {
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_profile_weight_history_user ON profile_weight_history(user_id, sort_index);
    CREATE INDEX IF NOT EXISTS idx_meal_entries_user ON meal_entries(user_id, sort_index);
    CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON meal_templates(user_id, sort_index);
    CREATE INDEX IF NOT EXISTS idx_meal_template_items_template ON meal_template_items(template_id, sort_index);
    CREATE INDEX IF NOT EXISTS idx_meal_product_collections_user ON meal_product_collections(user_id, bucket_type, sort_index);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_catalog_products_status ON catalog_products(status, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_catalog_products_owner ON catalog_products(owner_user_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_catalog_products_barcode ON catalog_products(barcode);
    CREATE INDEX IF NOT EXISTS idx_catalog_product_versions_product ON catalog_product_versions(product_id, version DESC);
    CREATE INDEX IF NOT EXISTS idx_assistant_messages_user ON assistant_messages(user_id, created_at DESC);
  `);
};

const ensureColumn = (database, tableName, columnName, definition) => {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const getMeta = (database, key) => {
  const row = database.prepare("SELECT value FROM meta WHERE key = ?").get(key);
  return row?.value ?? null;
};

const setMeta = (database, key, value) => {
  database
    .prepare(
      `
        INSERT INTO meta (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `
    )
    .run(key, value);
};

const getUserMetaKey = (userId, key) => `user:${userId}:${key}`;

const getUserMeta = (database, userId, key) => getMeta(database, getUserMetaKey(userId, key));

const setUserMeta = (database, userId, key, value) => {
  if (value === null || value === undefined || value === "") {
    return;
  }

  setMeta(database, getUserMetaKey(userId, key), String(value));
};

const countRows = (database, tableName) => {
  const row = database.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
  return Number(row?.count ?? 0);
};

const importLegacyUsers = (database, users) => {
  const statement = database.prepare(`
    INSERT OR REPLACE INTO users (
      id,
      email,
      name,
      avatar,
      age,
      weight,
      height,
      gender,
      activity,
      goal,
      measurements_json,
      created_at,
      role,
      two_factor_enabled,
      two_factor_required,
      token_version,
      password_hash,
      password_salt,
      password_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  users.forEach((user) => {
    statement.run(
      user.id,
      user.email,
      user.name,
      user.avatar ?? null,
      Number(user.age ?? 0),
      Number(user.weight ?? 0),
      Number(user.height ?? 0),
      user.gender ?? "male",
      user.activity ?? "moderate",
      user.goal ?? "maintain",
      user.measurements ? JSON.stringify(user.measurements) : null,
      user.createdAt ?? new Date().toISOString(),
      isUserRole(user.role) ? user.role : "USER",
      toBoolean(user.twoFactorEnabled, false) ? 1 : 0,
      toBoolean(user.twoFactorRequired, false) ? 1 : 0,
      Math.max(Number(user.tokenVersion ?? 0) || 0, 0),
      user.passwordHash ?? "",
      user.passwordSalt ?? "",
      user.passwordVersion ?? "pbkdf2-sha256"
    );
  });
};

const importLegacySessions = (database, sessions) => {
  const statement = database.prepare(`
    INSERT OR REPLACE INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);

  sessions.forEach((session) => {
    statement.run(
      session.token,
      session.userId,
      Number(session.expiresAt ?? 0),
      session.createdAt ?? new Date().toISOString()
    );
  });
};

const importLegacySnapshots = (database, snapshots) => {
  const statement = database.prepare(`
    INSERT OR REPLACE INTO snapshots (user_id, profile_json, meal_json, updated_at)
    VALUES (?, ?, ?, ?)
  `);

  Object.entries(snapshots).forEach(([userId, snapshot]) => {
    statement.run(
      userId,
      serializeJson(snapshot?.profile ?? null),
      serializeJson(snapshot?.meal ?? null),
      snapshot?.updatedAt ?? new Date().toISOString()
    );
  });
};

const importLegacyLoginAttempts = (database, loginAttempts) => {
  const statement = database.prepare(`
    INSERT OR REPLACE INTO login_attempts (email, count, lock_until)
    VALUES (?, ?, ?)
  `);

  Object.entries(loginAttempts).forEach(([email, attempt]) => {
    statement.run(email, Number(attempt?.count ?? 0), attempt?.lockUntil ?? null);
  });
};

const replaceProfileStateRows = (
  database,
  userId,
  profileState,
  user,
  updatedAt = new Date().toISOString()
) => {
  const normalized = normalizeProfileState(profileState, user);

  database
    .prepare(
      `
        INSERT INTO profile_states (
          user_id,
          daily_calories,
          goal,
          maintenance_calories,
          adaptive_calories,
          target_weight,
          target_weight_start,
          diet_style,
          allergies_json,
          excluded_ingredients_json,
          adaptive_mode,
          notifications_enabled,
          meal_reminders_enabled,
          calorie_alerts_enabled,
          reminder_times_json,
          language_preference,
          motivation_json,
          assistant_json,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          daily_calories = excluded.daily_calories,
          goal = excluded.goal,
          maintenance_calories = excluded.maintenance_calories,
          adaptive_calories = excluded.adaptive_calories,
          target_weight = excluded.target_weight,
          target_weight_start = excluded.target_weight_start,
          diet_style = excluded.diet_style,
          allergies_json = excluded.allergies_json,
          excluded_ingredients_json = excluded.excluded_ingredients_json,
          adaptive_mode = excluded.adaptive_mode,
          notifications_enabled = excluded.notifications_enabled,
          meal_reminders_enabled = excluded.meal_reminders_enabled,
          calorie_alerts_enabled = excluded.calorie_alerts_enabled,
          reminder_times_json = excluded.reminder_times_json,
          language_preference = excluded.language_preference,
          motivation_json = excluded.motivation_json,
          assistant_json = excluded.assistant_json,
          updated_at = excluded.updated_at
      `
    )
    .run(
      userId,
      normalized.dailyCalories,
      normalized.goal,
      normalized.maintenanceCalories,
      normalized.adaptiveCalories,
      normalized.targetWeight,
      normalized.targetWeightStart,
      normalized.dietStyle,
      serializeJson(normalized.allergies),
      serializeJson(normalized.excludedIngredients),
      normalized.adaptiveMode,
      normalized.notificationsEnabled ? 1 : 0,
      normalized.mealRemindersEnabled ? 1 : 0,
      normalized.calorieAlertsEnabled ? 1 : 0,
      serializeJson(normalized.reminderTimes),
      normalized.languagePreference,
      serializeJson(normalized.motivation),
      serializeJson(normalized.assistant),
      updatedAt
    );

  database.prepare("DELETE FROM profile_weight_history WHERE user_id = ?").run(userId);

  const insertHistory = database.prepare(`
    INSERT INTO profile_weight_history (user_id, sort_index, recorded_at, weight)
    VALUES (?, ?, ?, ?)
  `);

  normalized.weightHistory.forEach((item, index) => {
    insertHistory.run(userId, index, item.date, item.weight);
  });

  return normalized;
};

const createProductKey = (product) =>
  product?.barcode?.trim() ||
  `${String(product?.name ?? "")
    .trim()
    .toLowerCase()}-${String(product?.brand ?? "")
    .trim()
    .toLowerCase()}`;

const replaceMealStateRows = (database, userId, mealState) => {
  const normalized = normalizeMealState(mealState);

  database.prepare("DELETE FROM meal_entries WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM meal_templates WHERE user_id = ?").run(userId);
  database.prepare("DELETE FROM meal_product_collections WHERE user_id = ?").run(userId);

  const insertEntry = database.prepare(`
    INSERT INTO meal_entries (
      id,
      user_id,
      sort_index,
      product_json,
      quantity,
      meal_type,
      eaten_at,
      origin,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  normalized.items.forEach((item, index) => {
    insertEntry.run(
      item.id,
      userId,
      index,
      serializeJson(item.product),
      item.quantity,
      item.mealType,
      item.eatenAt,
      item.origin,
      item.eatenAt
    );
  });

  const insertTemplate = database.prepare(`
    INSERT INTO meal_templates (
      id,
      user_id,
      sort_index,
      name,
      meal_type,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertTemplateItem = database.prepare(`
    INSERT INTO meal_template_items (
      template_id,
      sort_index,
      product_json,
      quantity
    ) VALUES (?, ?, ?, ?)
  `);

  normalized.templates.forEach((template, index) => {
    insertTemplate.run(
      template.id,
      userId,
      index,
      template.name,
      template.mealType,
      template.createdAt
    );

    template.items.forEach((item, itemIndex) => {
      insertTemplateItem.run(
        template.id,
        itemIndex,
        serializeJson(item.product),
        item.quantity
      );
    });
  });

  const insertCollectionItem = database.prepare(`
    INSERT INTO meal_product_collections (
      user_id,
      bucket_type,
      sort_index,
      product_key,
      product_json
    ) VALUES (?, ?, ?, ?, ?)
  `);

  [
    ["saved", normalized.savedProducts],
    ["recent", normalized.recentProducts],
    ["barcode", normalized.personalBarcodeProducts],
  ].forEach(([bucketType, products]) => {
    products.forEach((product, index) => {
      insertCollectionItem.run(
        userId,
        bucketType,
        index,
        createProductKey(product),
        serializeJson(product)
      );
    });
  });

  return normalized;
};

const buildProfileStateFromRows = (database, userId, user = null) => {
  const row = database
    .prepare("SELECT * FROM profile_states WHERE user_id = ? LIMIT 1")
    .get(userId);

  if (!row) {
    return user ? createInitialProfileState(user) : null;
  }

  const weightHistory = database
    .prepare(
      `
        SELECT recorded_at, weight
        FROM profile_weight_history
        WHERE user_id = ?
        ORDER BY sort_index ASC, id ASC
      `
    )
    .all(userId)
    .map((item) => ({
      date: item.recorded_at,
      weight: Number(item.weight),
    }));

  return {
    dailyCalories: Number(row.daily_calories),
    goal: row.goal,
    weightHistory,
    maintenanceCalories: Number(row.maintenance_calories),
    adaptiveCalories:
      row.adaptive_calories === null ? null : Number(row.adaptive_calories),
    targetWeight: row.target_weight === null ? null : Number(row.target_weight),
    targetWeightStart:
      row.target_weight_start === null ? null : Number(row.target_weight_start),
    dietStyle: isDietStyle(row.diet_style) ? row.diet_style : "balanced",
    allergies: parseJson(row.allergies_json, []),
    excludedIngredients: parseJson(row.excluded_ingredients_json, []),
    adaptiveMode: isAdaptiveMode(row.adaptive_mode) ? row.adaptive_mode : "automatic",
    notificationsEnabled: Boolean(row.notifications_enabled),
    mealRemindersEnabled: Boolean(row.meal_reminders_enabled),
    calorieAlertsEnabled: Boolean(row.calorie_alerts_enabled),
    reminderTimes: normalizeReminderTimes(
      parseJson(row.reminder_times_json, {}),
      createInitialProfileState(user).reminderTimes
    ),
    languagePreference: isAppLanguage(row.language_preference) ? row.language_preference : "uk",
    motivation: normalizeMotivationState(
      parseJson(row.motivation_json, {}),
      createInitialProfileState(user).motivation
    ),
    assistant: normalizeAssistantCustomization(
      parseJson(row.assistant_json, {}),
      createInitialProfileState(user).assistant
    ),
  };
};

const buildMealStateFromRows = (database, userId) => {
  const items = database
    .prepare(
      `
        SELECT *
        FROM meal_entries
        WHERE user_id = ?
        ORDER BY sort_index ASC, created_at DESC
      `
    )
    .all(userId)
    .map((row) => ({
      id: row.id,
      product: normalizeProduct(parseJson(row.product_json, {}), "meal-entry"),
      quantity: Number(row.quantity),
      mealType: row.meal_type,
      eatenAt: row.eaten_at,
      origin: row.origin,
    }));

  const templateRows = database
    .prepare(
      `
        SELECT *
        FROM meal_templates
        WHERE user_id = ?
        ORDER BY sort_index ASC, created_at DESC
      `
    )
    .all(userId);

  const templateItemRows = database
    .prepare(
      `
        SELECT *
        FROM meal_template_items
        WHERE template_id IN (
          SELECT id FROM meal_templates WHERE user_id = ?
        )
        ORDER BY sort_index ASC, id ASC
      `
    )
    .all(userId);

  const itemsByTemplateId = new Map();

  templateItemRows.forEach((row) => {
    const collection = itemsByTemplateId.get(row.template_id) ?? [];
    collection.push({
      product: normalizeProduct(parseJson(row.product_json, {}), "template-item"),
      quantity: Number(row.quantity),
    });
    itemsByTemplateId.set(row.template_id, collection);
  });

  const templates = templateRows.map((row) => ({
    id: row.id,
    name: row.name,
    mealType: row.meal_type,
    createdAt: row.created_at,
    items: itemsByTemplateId.get(row.id) ?? [],
  }));

  const collectionRows = database
    .prepare(
      `
        SELECT *
        FROM meal_product_collections
        WHERE user_id = ?
        ORDER BY bucket_type ASC, sort_index ASC, id ASC
      `
    )
    .all(userId);

  const buckets = {
    saved: [],
    recent: [],
    barcode: [],
  };

  collectionRows.forEach((row) => {
    const product = normalizeProduct(
      parseJson(row.product_json, {}),
      `bucket-${row.bucket_type}`
    );

    if (row.bucket_type === "saved") {
      buckets.saved.push(product);
    } else if (row.bucket_type === "recent") {
      buckets.recent.push(product);
    } else if (row.bucket_type === "barcode") {
      buckets.barcode.push(product);
    }
  });

  return {
    items,
    templates,
    totalNutrients: calculateMealTotalNutrients(items),
    savedProducts: buckets.saved,
    recentProducts: buckets.recent,
    personalBarcodeProducts: buckets.barcode,
  };
};

const upsertSnapshotCache = (database, userId, snapshot, updatedAt = new Date().toISOString()) => {
  database
    .prepare(
      `
        INSERT INTO snapshots (user_id, profile_json, meal_json, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          profile_json = excluded.profile_json,
          meal_json = excluded.meal_json,
          updated_at = excluded.updated_at
      `
    )
    .run(
      userId,
      serializeJson(snapshot?.profile ?? null),
      serializeJson(snapshot?.meal ?? null),
      updatedAt
    );
};

const migrateLegacyJsonIfNeeded = async (database, legacyJsonPath) => {
  if (getMeta(database, "legacy_json_migrated_at")) {
    return;
  }

  try {
    await fs.access(legacyJsonPath);
  } catch {
    setMeta(database, "legacy_json_migrated_at", new Date().toISOString());
    setMeta(database, "legacy_json_migration_source", "none");
    return;
  }

  const raw = await fs.readFile(legacyJsonPath, "utf8");
  const legacy = parseJson(raw, {
    users: [],
    sessions: [],
    snapshots: {},
    loginAttempts: {},
  });

  const hasSqlData =
    countRows(database, "users") > 0 ||
    countRows(database, "sessions") > 0 ||
    countRows(database, "snapshots") > 0 ||
    countRows(database, "login_attempts") > 0;

  const hasLegacyData =
    (Array.isArray(legacy.users) && legacy.users.length > 0) ||
    (Array.isArray(legacy.sessions) && legacy.sessions.length > 0) ||
    (legacy.snapshots && Object.keys(legacy.snapshots).length > 0) ||
    (legacy.loginAttempts && Object.keys(legacy.loginAttempts).length > 0);

  if (!hasSqlData && hasLegacyData) {
    database.exec("BEGIN");

    try {
      importLegacyUsers(database, Array.isArray(legacy.users) ? legacy.users : []);
      importLegacySessions(database, Array.isArray(legacy.sessions) ? legacy.sessions : []);
      importLegacySnapshots(database, legacy.snapshots ?? {});
      importLegacyLoginAttempts(database, legacy.loginAttempts ?? {});
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }

  setMeta(database, "legacy_json_migrated_at", new Date().toISOString());
  setMeta(database, "legacy_json_migration_source", legacyJsonPath);
};

const migrateNormalizedStateIfNeeded = (database) => {
  if (getMeta(database, "normalized_state_v1_migrated_at")) {
    return;
  }

  const users = database.prepare("SELECT * FROM users").all().map(mapUserRow);

  database.exec("BEGIN");

  try {
    users.forEach((user) => {
      const snapshot =
        mapSnapshotRow(
          database
            .prepare("SELECT * FROM snapshots WHERE user_id = ? LIMIT 1")
            .get(user.id)
        ) ?? {
          profile: createInitialProfileState(user),
          meal: createInitialMealState(),
        };

      const normalizedProfile = replaceProfileStateRows(
        database,
        user.id,
        snapshot.profile,
        user,
        snapshot.updatedAt
      );
      const normalizedMeal = replaceMealStateRows(database, user.id, snapshot.meal);

      upsertSnapshotCache(
        database,
        user.id,
        {
          profile: normalizedProfile,
          meal: normalizedMeal,
        },
        snapshot.updatedAt
      );
    });

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  setMeta(database, "normalized_state_v1_migrated_at", new Date().toISOString());
};

export const createSqliteStorage = async ({
  dataDir,
  sqlitePath,
  legacyJsonPath,
  backupDir,
  backupIntervalMs,
  maxBackupFilesPerUser,
}) => {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  const database = new DatabaseSync(sqlitePath);
  createSchema(database);
  ensureColumn(database, "users", "role", "TEXT NOT NULL DEFAULT 'USER'");
  ensureColumn(database, "users", "two_factor_enabled", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "users", "two_factor_required", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "users", "token_version", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(database, "profile_states", "diet_style", "TEXT NOT NULL DEFAULT 'balanced'");
  ensureColumn(database, "profile_states", "allergies_json", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(
    database,
    "profile_states",
    "excluded_ingredients_json",
    "TEXT NOT NULL DEFAULT '[]'"
  );
  ensureColumn(
    database,
    "profile_states",
    "adaptive_mode",
    "TEXT NOT NULL DEFAULT 'automatic'"
  );
  ensureColumn(
    database,
    "profile_states",
    "notifications_enabled",
    "INTEGER NOT NULL DEFAULT 0"
  );
  ensureColumn(
    database,
    "profile_states",
    "meal_reminders_enabled",
    "INTEGER NOT NULL DEFAULT 1"
  );
  ensureColumn(
    database,
    "profile_states",
    "calorie_alerts_enabled",
    "INTEGER NOT NULL DEFAULT 1"
  );
  ensureColumn(
    database,
    "profile_states",
    "reminder_times_json",
    "TEXT NOT NULL DEFAULT '{\"breakfast\":\"08:30\",\"lunch\":\"13:00\",\"dinner\":\"19:00\",\"snack\":\"16:30\"}'"
  );
  ensureColumn(
    database,
    "profile_states",
    "language_preference",
    "TEXT NOT NULL DEFAULT 'uk'"
  );
  ensureColumn(
    database,
    "profile_states",
    "motivation_json",
    "TEXT NOT NULL DEFAULT '{\"points\":0,\"level\":1,\"completedTasks\":0,\"activeTasks\":[],\"history\":[],\"achievements\":[],\"lastTaskRefreshDate\":null,\"freeDayLastUsedAt\":null,\"paidDayLastUsedAt\":null,\"paidDayLastUsedMonth\":null}'"
  );
  ensureColumn(
    database,
    "profile_states",
    "assistant_json",
    "TEXT NOT NULL DEFAULT '{\"name\":\"Nova\",\"role\":\"assistant\",\"tone\":\"gentle\",\"humorEnabled\":true}'"
  );
  createIndexes(database);
  setMeta(database, "storage_engine", "sqlite");
  setMeta(database, "storage_path", sqlitePath);
  await migrateLegacyJsonIfNeeded(database, legacyJsonPath);
  migrateNormalizedStateIfNeeded(database);
  const backupWriteTracker = new Map();

  const pruneUserBackups = (userId) => {
    const userBackupDir = path.join(backupDir, userId);
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

  const getResolvedUser = (userId) =>
    mapUserRow(database.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(userId));

  const createCatalogProductVersion = ({
    id,
    productId,
    version,
    editorUserId = null,
    note = null,
    snapshot,
    createdAt,
  }) => {
    database
      .prepare(
        `
          INSERT INTO catalog_product_versions (
            id,
            product_id,
            version,
            editor_user_id,
            note,
            snapshot_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        productId,
        version,
        editorUserId,
        note,
        serializeJson(snapshot),
        createdAt
      );
  };

  const listAssistantMessagesByUserId = (userId, limit = 16) =>
    database
      .prepare(
        `
          SELECT *
          FROM assistant_messages
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        `
      )
      .all(userId, Math.max(Number(limit) || 0, 1))
      .map(mapAssistantMessageRow)
      .filter(Boolean)
      .reverse();

  const insertAssistantMessage = ({ id, userId, role, text, createdAt }) => {
    database
      .prepare(
        `
          INSERT INTO assistant_messages (
            id,
            user_id,
            role,
            text,
            created_at
          ) VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(
        id,
        userId,
        isAssistantMessageRole(role) ? role : "assistant",
        String(text ?? ""),
        createdAt
      );
  };

  const deleteAssistantMessagesByUserId = (userId) => {
    database.prepare("DELETE FROM assistant_messages WHERE user_id = ?").run(userId);
  };

  const pruneAssistantMessagesByUserId = (userId, keepLast = 16) => {
    database
      .prepare(
        `
          DELETE FROM assistant_messages
          WHERE user_id = ?
            AND id NOT IN (
              SELECT id
              FROM assistant_messages
              WHERE user_id = ?
              ORDER BY created_at DESC
              LIMIT ?
            )
        `
      )
      .run(userId, userId, Math.max(Number(keepLast) || 0, 1));
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

  const listCatalogProductsInternal = ({
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
    const rows = database
      .prepare("SELECT * FROM catalog_products ORDER BY updated_at DESC, created_at DESC")
      .all();

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

  const findCatalogDuplicateCandidatesInternal = ({
    name,
    barcode = "",
    excludeProductId = null,
    limit = 5,
  }) => {
    const normalizedName = String(name ?? "").trim().toLowerCase();
    const normalizedBarcode = String(barcode ?? "").replace(/\D/g, "");

    if (!normalizedName && !normalizedBarcode) {
      return [];
    }

    return listCatalogProductsInternal({
      includeUnapproved: true,
      statuses: ["pending", "approved", "rejected"],
      limit: 250,
    })
      .filter((product) => product.id !== excludeProductId)
      .filter((product) => {
        const productBarcode = String(product.barcode ?? "").replace(/\D/g, "");
        return (
          (normalizedBarcode && productBarcode && productBarcode === normalizedBarcode) ||
          product.name.trim().toLowerCase() === normalizedName
        );
      })
      .slice(0, Math.max(Number(limit) || 0, 1));
  };

  const commitMealState = (userId, resolvedUser, nextMealState) => {
    const normalizedMeal = replaceMealStateRows(database, userId, nextMealState);
    const updatedAt = new Date().toISOString();
    const snapshot = {
      profile: buildProfileStateFromRows(database, userId, resolvedUser),
      meal: normalizedMeal,
    };
    upsertSnapshotCache(database, userId, snapshot, updatedAt);
    return { normalizedMeal, snapshot, updatedAt };
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

  const getSnapshotMeta = (userId) => {
    const row = database
      .prepare("SELECT updated_at FROM snapshots WHERE user_id = ? LIMIT 1")
      .get(userId);
    const profileUpdatedAt = getUserMeta(database, userId, "profile-updated-at");
    const mealUpdatedAt = getUserMeta(database, userId, "meal-updated-at");
    const lastWriterDeviceId = getUserMeta(database, userId, "last-writer-device-id");

    return {
      updatedAt: row?.updated_at ?? null,
      profileUpdatedAt: profileUpdatedAt ?? row?.updated_at ?? null,
      mealUpdatedAt: mealUpdatedAt ?? row?.updated_at ?? null,
      backupEnabled: true,
      lastWriterDeviceId: lastWriterDeviceId ?? null,
    };
  };

  const assertNoStateConflict = (userId, syncContext = undefined) => {
    const normalizedSyncContext = normalizeSyncContext(syncContext);

    if (!normalizedSyncContext.baseVersion) {
      return normalizedSyncContext;
    }

    const meta = getSnapshotMeta(userId);

    if (meta.updatedAt && meta.updatedAt !== normalizedSyncContext.baseVersion) {
      throw new StateApiError(
        "STATE_CONFLICT",
        "Cloud data changed on another device. Pull the latest cloud state before retrying.",
        { meta }
      );
    }

    return normalizedSyncContext;
  };

  const updateSnapshotMeta = (
    userId,
    {
      updatedAt,
      profileUpdatedAt = undefined,
      mealUpdatedAt = undefined,
      deviceId = undefined,
    }
  ) => {
    setUserMeta(database, userId, "profile-updated-at", profileUpdatedAt);
    setUserMeta(database, userId, "meal-updated-at", mealUpdatedAt);
    setUserMeta(database, userId, "last-writer-device-id", deviceId);
    setUserMeta(database, userId, "last-snapshot-updated-at", updatedAt);
  };

  const withMealTransaction = (userId, mutator, syncContext = undefined) => {
    const resolvedUser = getResolvedUser(userId);

    if (!resolvedUser) {
      return null;
    }

    const normalizedSyncContext = assertNoStateConflict(userId, syncContext);
    database.exec("BEGIN");

    try {
      const currentMealState = buildMealStateFromRows(database, userId);
      const nextMealState = mutator(currentMealState, resolvedUser);
      const { normalizedMeal, snapshot, updatedAt } = commitMealState(
        userId,
        resolvedUser,
        nextMealState
      );
      updateSnapshotMeta(userId, {
        updatedAt,
        mealUpdatedAt: updatedAt,
        deviceId: normalizedSyncContext.deviceId,
      });
      database.exec("COMMIT");
      writeBackupSnapshot(userId, snapshot, "meal-state", updatedAt);
      return normalizedMeal;
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  };

  return {
    getEngineInfo: () => ({
      engine: "sqlite",
      sqlitePath,
      backupDir,
    }),

    close: () => {
      database.close();
    },

    cleanupExpiredSessions: (now = Date.now()) => {
      database.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
    },

    findUserByEmail: (email) =>
      mapUserRow(
        database.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").get(email)
      ),

    findUserById: (userId) =>
      mapUserRow(
        database.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(userId)
      ),

    hasUserWithRole: (role) => {
      if (!isUserRole(role)) {
        return false;
      }

      const row = database
        .prepare("SELECT COUNT(*) AS count FROM users WHERE role = ?")
        .get(role);

      return Number(row?.count ?? 0) > 0;
    },

    insertUser: (user) => {
      database
        .prepare(
          `
            INSERT INTO users (
              id,
              email,
              name,
              avatar,
              age,
              weight,
              height,
              gender,
              activity,
              goal,
              measurements_json,
              created_at,
              role,
              two_factor_enabled,
              two_factor_required,
              token_version,
              password_hash,
              password_salt,
              password_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          user.id,
          user.email,
          user.name,
          user.avatar ?? null,
          user.age,
          user.weight,
          user.height,
          user.gender,
          user.activity,
          user.goal,
          user.measurements ? JSON.stringify(user.measurements) : null,
          user.createdAt,
          isUserRole(user.role) ? user.role : "USER",
          toBoolean(user.twoFactorEnabled, false) ? 1 : 0,
          toBoolean(user.twoFactorRequired, false) ? 1 : 0,
          Math.max(Number(user.tokenVersion ?? 0) || 0, 0),
          user.passwordHash,
          user.passwordSalt,
          user.passwordVersion
        );

      return user;
    },

    listUsers: () =>
      database
        .prepare("SELECT * FROM users ORDER BY created_at ASC")
        .all()
        .map(mapUserRow)
        .filter(Boolean),

    updateUser: (user) => {
      database
        .prepare(
          `
            UPDATE users
            SET
              name = ?,
              avatar = ?,
              age = ?,
              weight = ?,
              height = ?,
              gender = ?,
              activity = ?,
              goal = ?,
              measurements_json = ?
            WHERE id = ?
          `
        )
        .run(
          user.name,
          user.avatar ?? null,
          user.age,
          user.weight,
          user.height,
          user.gender,
          user.activity,
          user.goal,
          user.measurements ? JSON.stringify(user.measurements) : null,
          user.id
        );

      return user;
    },

    incrementUserTokenVersion: (userId) => {
      const existingUser = getResolvedUser(userId);

      if (!existingUser) {
        return null;
      }

      database
        .prepare(
          `
            UPDATE users
            SET token_version = COALESCE(token_version, 0) + 1
            WHERE id = ?
          `
        )
        .run(userId);

      return getResolvedUser(userId);
    },

    updateUserRole: ({ userId, role, twoFactorRequired = undefined, twoFactorEnabled = undefined }) => {
      const existingUser = getResolvedUser(userId);

      if (!existingUser) {
        return null;
      }

      database
        .prepare(
          `
            UPDATE users
            SET
              role = ?,
              two_factor_required = ?,
              two_factor_enabled = ?
            WHERE id = ?
          `
        )
        .run(
          isUserRole(role) ? role : existingUser.role,
          twoFactorRequired === undefined
            ? existingUser.twoFactorRequired ? 1 : 0
            : twoFactorRequired
              ? 1
              : 0,
          twoFactorEnabled === undefined
            ? existingUser.twoFactorEnabled ? 1 : 0
            : twoFactorEnabled
              ? 1
              : 0,
          userId
        );

      return getResolvedUser(userId);
    },

    promoteUserByEmailToSuperAdmin: (email) => {
      const normalizedEmail = String(email ?? "").trim().toLowerCase();

      if (!normalizedEmail) {
        return null;
      }

      const user = mapUserRow(
        database.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").get(normalizedEmail)
      );

      if (!user || user.role === "SUPER_ADMIN") {
        return user;
      }

      database
        .prepare(
          `
            UPDATE users
            SET role = 'SUPER_ADMIN',
                two_factor_required = 1
            WHERE email = ?
          `
        )
        .run(normalizedEmail);

      return mapUserRow(
        database.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").get(normalizedEmail)
      );
    },

    deleteUser: (userId) => {
      database.prepare("DELETE FROM users WHERE id = ?").run(userId);
      removeUserBackups(userId);
    },

    listUserBackups: (userId) =>
      getUserBackupEntries(userId).map(({ fullPath, ...backup }) => backup),

    readUserBackup: (userId, backupId = undefined) => {
      const backup = readUserBackupPayload(userId, backupId);

      if (!backup) {
        return null;
      }

      const { fullPath, ...payload } = backup;
      void fullPath;
      return payload;
    },

    createAuditLog: ({
      id,
      actorUserId = null,
      actorRole = "USER",
      action,
      targetType = null,
      targetId = null,
      details = null,
      createdAt,
    }) => {
      database
        .prepare(
          `
            INSERT INTO audit_logs (
              id,
              actor_user_id,
              actor_role,
              action,
              target_type,
              target_id,
              details_json,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          id,
          actorUserId,
          isUserRole(actorRole) ? actorRole : "USER",
          action,
          targetType,
          targetId,
          serializeJson(details),
          createdAt
        );
    },

    listAuditLogs: (limit = 60) =>
      database
        .prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?")
        .all(Math.max(Number(limit) || 0, 1))
        .map(mapAuditLogRow)
        .filter(Boolean),

    listAssistantMessagesByUserId,

    insertAssistantMessage,

    deleteAssistantMessagesByUserId,

    pruneAssistantMessagesByUserId,

    countCatalogProductsByOwnerSince: (userId, sinceIso) => {
      const row = database
        .prepare(
          `
            SELECT COUNT(*) AS count
            FROM catalog_products
            WHERE owner_user_id = ? AND created_at >= ?
          `
        )
        .get(userId, sinceIso);

      return Number(row?.count ?? 0);
    },

    findCatalogProductById: (productId) =>
      mapCatalogProductRow(
        database.prepare("SELECT * FROM catalog_products WHERE id = ? LIMIT 1").get(productId)
      ),

    listCatalogProducts: (options = {}) => listCatalogProductsInternal(options),

    findCatalogDuplicateCandidates: (options = {}) =>
      findCatalogDuplicateCandidatesInternal(options),

    insertCatalogProduct: (product) => {
      database
        .prepare(
          `
            INSERT INTO catalog_products (
              id,
              owner_user_id,
              name,
              brand,
              barcode,
              category,
              image_url,
              unit,
              source,
              nutrients_json,
              facts_json,
              status,
              created_at,
              updated_at,
              approved_at,
              approved_by_user_id,
              rejection_reason,
              version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
        )
        .run(
          product.id,
          product.ownerUserId,
          product.name,
          product.brand ?? null,
          product.barcode ?? null,
          product.category ?? null,
          product.imageUrl ?? null,
          isUnit(product.unit) ? product.unit : "g",
          isSource(product.source) ? product.source : "Manual",
          serializeJson(product.nutrients ?? {}),
          serializeJson(product.facts ?? null),
          isProductModerationStatus(product.status) ? product.status : "pending",
          product.createdAt,
          product.updatedAt,
          product.approvedAt ?? null,
          product.approvedByUserId ?? null,
          product.rejectionReason ?? null,
          Math.max(Number(product.version ?? 1), 1)
        );

      return product;
    },

    updateCatalogProduct: (product) => {
      database
        .prepare(
          `
            UPDATE catalog_products
            SET
              name = ?,
              brand = ?,
              barcode = ?,
              category = ?,
              image_url = ?,
              unit = ?,
              source = ?,
              nutrients_json = ?,
              facts_json = ?,
              status = ?,
              updated_at = ?,
              approved_at = ?,
              approved_by_user_id = ?,
              rejection_reason = ?,
              version = ?
            WHERE id = ?
          `
        )
        .run(
          product.name,
          product.brand ?? null,
          product.barcode ?? null,
          product.category ?? null,
          product.imageUrl ?? null,
          isUnit(product.unit) ? product.unit : "g",
          isSource(product.source) ? product.source : "Manual",
          serializeJson(product.nutrients ?? {}),
          serializeJson(product.facts ?? null),
          isProductModerationStatus(product.status) ? product.status : "pending",
          product.updatedAt,
          product.approvedAt ?? null,
          product.approvedByUserId ?? null,
          product.rejectionReason ?? null,
          Math.max(Number(product.version ?? 1), 1),
          product.id
        );

      return mapCatalogProductRow(
        database.prepare("SELECT * FROM catalog_products WHERE id = ? LIMIT 1").get(product.id)
      );
    },

    createCatalogProductVersion,

    createSession: ({ token, userId, expiresAt }) => {
      database
        .prepare(
          "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
        )
        .run(token, userId, expiresAt, new Date().toISOString());

      return { token, userId, expiresAt };
    },

    findSessionByToken: (token) =>
      mapSessionRow(
        database.prepare("SELECT * FROM sessions WHERE token = ? LIMIT 1").get(token)
      ),

    deleteSessionByToken: (token) => {
      database.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    },

    deleteSessionsByUserId: (userId) => {
      database.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
    },

    getSnapshotByUserId: (userId, user = null) => {
      const resolvedUser =
        user ??
        mapUserRow(database.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(userId));

      if (!resolvedUser) {
        return null;
      }

      const meta = getSnapshotMeta(userId);

      return {
        profile: buildProfileStateFromRows(database, userId, resolvedUser),
        meal: buildMealStateFromRows(database, userId),
        updatedAt: meta.updatedAt,
        profileUpdatedAt: meta.profileUpdatedAt,
        mealUpdatedAt: meta.mealUpdatedAt,
        backupEnabled: meta.backupEnabled,
        lastWriterDeviceId: meta.lastWriterDeviceId,
      };
    },

    getSnapshotMetaByUserId: (userId) => getSnapshotMeta(userId),

    upsertSnapshot: (userId, snapshot, syncContext = undefined) => {
      const resolvedUser = mapUserRow(
        database.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(userId)
      );

      if (!resolvedUser) {
        return;
      }

      const updatedAt = snapshot?.updatedAt ?? new Date().toISOString();
      const normalizedSyncContext = assertNoStateConflict(userId, syncContext);

      database.exec("BEGIN");

      try {
        const normalizedProfile = replaceProfileStateRows(
          database,
          userId,
          snapshot?.profile,
          resolvedUser,
          updatedAt
        );
        const normalizedMeal = replaceMealStateRows(database, userId, snapshot?.meal);

        upsertSnapshotCache(
          database,
          userId,
          {
            profile: normalizedProfile,
            meal: normalizedMeal,
          },
          updatedAt
        );
        updateSnapshotMeta(userId, {
          updatedAt,
          profileUpdatedAt: updatedAt,
          mealUpdatedAt: updatedAt,
          deviceId: normalizedSyncContext.deviceId,
        });
        database.exec("COMMIT");
        writeBackupSnapshot(
          userId,
          {
            profile: normalizedProfile,
            meal: normalizedMeal,
          },
          "snapshot",
          updatedAt
        );
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },

    getProfileStateByUserId: (userId, user = null) => {
      const resolvedUser =
        user ??
        mapUserRow(database.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(userId));

      if (!resolvedUser) {
        return null;
      }

      return buildProfileStateFromRows(database, userId, resolvedUser);
    },

    upsertProfileState: (userId, profileState, syncContext = undefined) => {
      const resolvedUser = mapUserRow(
        database.prepare("SELECT * FROM users WHERE id = ? LIMIT 1").get(userId)
      );

      if (!resolvedUser) {
        return null;
      }

      const normalizedSyncContext = assertNoStateConflict(userId, syncContext);
      database.exec("BEGIN");

      try {
        const updatedAt = new Date().toISOString();
        const normalizedProfile = replaceProfileStateRows(
          database,
          userId,
          profileState,
          resolvedUser,
          updatedAt
        );
        const snapshot = {
          profile: normalizedProfile,
          meal: buildMealStateFromRows(database, userId),
        };
        upsertSnapshotCache(database, userId, snapshot, updatedAt);
        updateSnapshotMeta(userId, {
          updatedAt,
          profileUpdatedAt: updatedAt,
          deviceId: normalizedSyncContext.deviceId,
        });
        database.exec("COMMIT");
        writeBackupSnapshot(userId, snapshot, "profile-state", updatedAt);
        return normalizedProfile;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },

    getMealStateByUserId: (userId) => buildMealStateFromRows(database, userId),

    upsertMealState: (userId, mealState, syncContext = undefined) => {
      const resolvedUser = getResolvedUser(userId);

      if (!resolvedUser) {
        return null;
      }

      const normalizedSyncContext = assertNoStateConflict(userId, syncContext);
      database.exec("BEGIN");

      try {
        const normalizedMeal = replaceMealStateRows(database, userId, mealState);
        const updatedAt = new Date().toISOString();
        const snapshot = {
          profile: buildProfileStateFromRows(database, userId, resolvedUser),
          meal: normalizedMeal,
        };
        upsertSnapshotCache(database, userId, snapshot, updatedAt);
        updateSnapshotMeta(userId, {
          updatedAt,
          mealUpdatedAt: updatedAt,
          deviceId: normalizedSyncContext.deviceId,
        });
        database.exec("COMMIT");
        writeBackupSnapshot(userId, snapshot, "meal-state", updatedAt);
        return normalizedMeal;
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },

    addMealEntries: (userId, entries, syncContext = undefined) =>
      withMealTransaction(userId, (mealState) => {
        const normalizedEntries = normalizeMealEntries(entries);
        const nextMealState = {
          ...mealState,
          items: [...normalizedEntries, ...mealState.items],
        };

        normalizedEntries.forEach((entry) => {
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
                  item.barcode?.replace(/\D/g, "") !==
                  entry.product.barcode?.replace(/\D/g, "")
              ),
            ].slice(0, 240);
          }
        });

        nextMealState.totalNutrients = calculateMealTotalNutrients(nextMealState.items);
        return nextMealState;
      }, syncContext),

    removeMealEntry: (userId, entryId, syncContext = undefined) =>
      withMealTransaction(userId, (mealState) => {
        const nextMealState = {
          ...mealState,
          items: mealState.items.filter((item) => item.id !== entryId),
        };
        nextMealState.totalNutrients = calculateMealTotalNutrients(nextMealState.items);
        return nextMealState;
      }, syncContext),

    addMealTemplate: (userId, template, syncContext = undefined) =>
      withMealTransaction(userId, (mealState) => ({
        ...mealState,
        templates: [
          ...normalizeMealTemplates([template]),
          ...mealState.templates.filter((item) => item.id !== template.id),
        ],
      }), syncContext),

    deleteMealTemplate: (userId, templateId, syncContext = undefined) =>
      withMealTransaction(userId, (mealState) => ({
        ...mealState,
        templates: mealState.templates.filter((item) => item.id !== templateId),
      }), syncContext),

    upsertMealProduct: (userId, bucketType, product, syncContext = undefined) =>
      withMealTransaction(userId, (mealState) => {
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
                item.barcode?.replace(/\D/g, "") !==
                normalizedProduct.barcode?.replace(/\D/g, "")
            ),
          ].slice(0, 240);
        }

        return nextMealState;
      }, syncContext),

    removeMealProduct: (userId, bucketType, productKey, syncContext = undefined) =>
      withMealTransaction(userId, (mealState) => {
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

        return nextMealState;
      }, syncContext),

    getLoginAttempt: (email) =>
      mapLoginAttemptRow(
        database.prepare("SELECT * FROM login_attempts WHERE email = ? LIMIT 1").get(email)
      ),

    upsertLoginAttempt: ({ email, count, lockUntil }) => {
      database
        .prepare(
          `
            INSERT INTO login_attempts (email, count, lock_until)
            VALUES (?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
              count = excluded.count,
              lock_until = excluded.lock_until
          `
        )
        .run(email, count, lockUntil);
    },

    clearLoginAttempt: (email) => {
      database.prepare("DELETE FROM login_attempts WHERE email = ?").run(email);
    },
  };
};
