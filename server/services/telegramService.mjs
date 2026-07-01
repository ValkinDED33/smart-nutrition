import crypto from "node:crypto";
import { Telegraf } from "telegraf";
import { AuthApiError, calculateMealTotalNutrients } from "../lib/domain.mjs";
import { createTelegramMedicationReminderRuntime } from "./telegramMedicationReminders.mjs";

const TELEGRAM_CONNECT_PURPOSE = "telegram_connect";
const TELEGRAM_START_RETRY_DELAY_MS = 60_000;
const TELEGRAM_CONNECT_COMPACT_PREFIX = "c1";
const TELEGRAM_CONNECT_GENERIC_PREFIX = "g1";
const TELEGRAM_CONNECT_SIGNATURE_LENGTH = 16;
const TELEGRAM_DEEP_LINK_MAX_PAYLOAD_LENGTH = 64;
const TELEGRAM_DEEP_LINK_PAYLOAD_PATTERN = /^[\w-]{1,64}$/;
const TELEGRAM_NOT_CONNECTED_MESSAGE =
  "Telegram ещё не подключён. Откройте профиль Smart Nutrition и нажмите Start по персональной ссылке.";
const TELEGRAM_BOT_COMMANDS = [
  { command: "menu", description: "Головне меню Smart Nutrition" },
  { command: "help", description: "Що вміє Smart Nutrition AI" },
  { command: "today", description: "Підсумок дня" },
  { command: "nutrition", description: "Харчування і нутрієнти" },
  { command: "water", description: "Вода сьогодні" },
  { command: "reminders", description: "Reminders / Tasks" },
  { command: "meds", description: "Активні нагадування про ліки" },
  { command: "add", description: "Додати нагадування автоматично" },
  { command: "addtask", description: "Додати задачу" },
  { command: "addmed", description: "Додати нагадування про ліки" },
  { command: "addwater", description: "Додати нагадування про воду" },
  { command: "addhabit", description: "Додати нагадування про звичку" },
  { command: "addsupplement", description: "Додати нагадування про добавку" },
  { command: "settime", description: "Змінити час нагадування" },
  { command: "profile", description: "Підключений акаунт" },
  { command: "disconnect", description: "Відключити Telegram" },
];

const TELEGRAM_MAIN_MENU_KEYBOARD = {
  reply_markup: {
    keyboard: [
      [{ text: "/today" }, { text: "/reminders" }],
      [{ text: "/water" }, { text: "/nutrition" }],
      [{ text: "/addtask" }, { text: "/addmed" }],
      [{ text: "/profile" }, { text: "/help" }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    input_field_placeholder: "Напишіть дію або оберіть кнопку",
  },
};

const toTrimmedString = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const toSafeErrorCode = (error) =>
  String(error?.code ?? error?.name ?? "TELEGRAM_ERROR")
    .replace(/[^\w.-]+/g, "_")
    .slice(0, 80);

const toSafeErrorMessage = (error) =>
  String(error?.message ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);

const base64UrlEncodeJson = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

const base64UrlEncodeString = (value) =>
  Buffer.from(String(value)).toString("base64url");

const base64UrlDecodeString = (value) =>
  Buffer.from(String(value), "base64url").toString("utf8");

const signPayload = (encodedPayload, secret) =>
  crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");

const signCompactPayload = (payload, secret) =>
  crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
    .slice(0, TELEGRAM_CONNECT_SIGNATURE_LENGTH);

const timingSafeEqualString = (left, right) => {
  const leftBuffer = Buffer.from(String(left ?? ""));
  const rightBuffer = Buffer.from(String(right ?? ""));

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const normalizeBotUsername = (value) =>
  toTrimmedString(value, "SmartNutritionBot").replace(/^@+/, "") || "SmartNutritionBot";

const maskTelegramPayload = (value) => {
  const payload = toTrimmedString(value);

  if (!payload) {
    return { length: 0, preview: "" };
  }

  return {
    length: payload.length,
    preview:
      payload.length <= 18
        ? payload
        : `${payload.slice(0, 8)}...${payload.slice(-6)}`,
  };
};

const maskTelegramChatId = (value) => {
  const chatId = toTrimmedString(value === null || value === undefined ? "" : String(value));

  if (!chatId) {
    return { present: false };
  }

  return {
    present: true,
    length: chatId.length,
    suffix: chatId.slice(-4),
  };
};

const getTelegramChatIdFromContext = (ctx) => {
  const chatId =
    ctx?.chat?.id ??
    ctx?.callbackQuery?.message?.chat?.id ??
    ctx?.update?.callback_query?.message?.chat?.id ??
    ctx?.message?.chat?.id ??
    ctx?.update?.message?.chat?.id ??
    null;

  return chatId === null || chatId === undefined ? null : String(chatId);
};

const toCompactUserId = (userId) => {
  const match = /^user-([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/i.exec(
    String(userId ?? "")
  );

  return match ? match.slice(1).join("").toLowerCase() : null;
};

const fromCompactUserId = (value) => {
  const normalized = String(value ?? "").toLowerCase();

  if (!/^[0-9a-f]{32}$/.test(normalized)) {
    return null;
  }

  return `user-${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(
    12,
    16
  )}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
};

const toBase36ExpiresAt = (value) =>
  Math.floor(Number(value) / 1000).toString(36);

const fromBase36ExpiresAt = (value) => {
  const seconds = Number.parseInt(String(value ?? ""), 36);

  return Number.isFinite(seconds) ? seconds * 1000 : NaN;
};

const createTelegramSafeConnectToken = ({ userId, secret, expiresAt }) => {
  const compactUserId = toCompactUserId(userId);
  const expiresAtBase36 = toBase36ExpiresAt(expiresAt);

  if (compactUserId) {
    const payload = `${compactUserId}_${expiresAtBase36}`;
    const signature = signCompactPayload(
      `${TELEGRAM_CONNECT_COMPACT_PREFIX}_${payload}`,
      secret
    );
    return `${TELEGRAM_CONNECT_COMPACT_PREFIX}_${payload}_${signature}`;
  }

  const encodedUserId = base64UrlEncodeString(userId);
  const payload = `${encodedUserId}_${expiresAtBase36}`;
  const signature = signCompactPayload(
    `${TELEGRAM_CONNECT_GENERIC_PREFIX}_${payload}`,
    secret
  );
  const token = `${TELEGRAM_CONNECT_GENERIC_PREFIX}_${payload}_${signature}`;

  return TELEGRAM_DEEP_LINK_PAYLOAD_PATTERN.test(token) ? token : null;
};

const extractTelegramStartPayload = (ctx) => {
  const candidates = [
    ["payload", ctx?.payload],
    ["startPayload", ctx?.startPayload],
  ];

  for (const [source, value] of candidates) {
    const payload = toTrimmedString(value);

    if (payload) {
      return { payload, source };
    }
  }

  const text = toTrimmedString(ctx?.message?.text ?? ctx?.update?.message?.text);
  const match = /^\/start(?:@\w+)?(?:\s+(.+))?$/i.exec(text);
  const payload = toTrimmedString(match?.[1]);

  return payload ? { payload, source: "message.text" } : { payload: "", source: "none" };
};

const verifyCompactTelegramConnectToken = ({ token, secret, now }) => {
  const parts = String(token ?? "").split("_");

  if (parts.length < 4) {
    return {
      ok: false,
      reason: "invalid_compact_shape",
    };
  }

  const prefix = parts[0];
  const signature = parts.at(-1);
  const expiresAtBase36 = parts.at(-2);
  const encodedUserId = parts.slice(1, -2).join("_");
  const expectedSignature = signCompactPayload(
    `${prefix}_${encodedUserId}_${expiresAtBase36}`,
    secret
  );

  if (!timingSafeEqualString(signature, expectedSignature)) {
    return {
      ok: false,
      reason: "signature_mismatch",
      decoded: { prefix },
    };
  }

  const expiresAt = fromBase36ExpiresAt(expiresAtBase36);

  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return {
      ok: false,
      reason: "expired",
      decoded: { prefix, expiresAt: Number.isFinite(expiresAt) ? expiresAt : null },
    };
  }

  const userId =
    prefix === TELEGRAM_CONNECT_COMPACT_PREFIX
      ? fromCompactUserId(encodedUserId)
      : base64UrlDecodeString(encodedUserId);

  if (!userId) {
    return {
      ok: false,
      reason: "invalid_user_id",
      decoded: { prefix, expiresAt },
    };
  }

  return {
    ok: true,
    userId,
    expiresAt,
    decoded: {
      prefix,
      userId,
      expiresAt,
      purpose: TELEGRAM_CONNECT_PURPOSE,
    },
  };
};

const formatNumber = (value, digits = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue.toFixed(digits) : "0";
};

const formatPercent = (current, target) => {
  const currentNumber = Number(current) || 0;
  const targetNumber = Number(target) || 0;

  if (targetNumber <= 0) {
    return "0%";
  }

  return `${Math.min(Math.round((currentNumber / targetNumber) * 100), 999)}%`;
};

const getDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const getTodayMealEntries = (mealState = {}, now = new Date()) => {
  const todayKey = getDateKey(now);
  const items = Array.isArray(mealState.items) ? mealState.items : [];

  return items.filter((item) => getDateKey(item?.eatenAt ?? 0) === todayKey);
};

export const buildTelegramAssistantCapabilitiesMessage = () =>
  [
    "Я можу допомагати зі Smart Nutrition:",
    "",
    "🥗 Харчування — денник їжі, продукти, рецепти, фото/штрихкод.",
    "💧 Вода — ціль, прогрес і нагадування.",
    "🧬 Нутрієнти — калорії, білки, жири, вуглеводи, клітковина та мікроелементи.",
    "📈 Прогрес — вага, тренди, звіти й пояснення змін.",
    "🤖 Асистент — персональні підказки з урахуванням онбордингу.",
    "🎮 Companion — рівень, XP, досягнення.",
    "💊 Ліки — нагадування, кнопки “прийняла/пізніше/пропустити” і журнал.",
    "",
    "Команди:",
    "/today — короткий статус дня",
    "/water — вода",
    "/nutrition — калорії та нутрієнти",
    "/meds — активні нагадування про ліки",
    "/reminders — усі активні нагадування",
    "/addmed <текст> — створити нагадування про ліки",
    "/addtask <текст> — створити звичайне нагадування",
    "/profile — статус підключення",
    "/disconnect — відключити Telegram",
  ].join("\n");

export const buildTelegramMainMenuMessage = (user = null) =>
  [
    `Smart Nutrition поруч${user?.name ? `, ${user.name}` : ""}.`,
    "",
    "Що можна зробити зараз:",
    "📊 /today — швидкий підсумок дня",
    "⏰ /reminders — нагадування і задачі з кнопками керування",
    "💧 /water — вода сьогодні",
    "🧬 /nutrition — калорії, БЖВ і нутрієнти",
    "➕ /addtask — додати задачу за часом",
    "💊 /addmed — додати нагадування про ліки",
    "",
    "Можна писати людською мовою: “нагадуй пити магній о 22:00” або “що у мене по напоминаниям”.",
  ].join("\n");

export const buildTelegramDailySummary = (snapshot = {}, now = new Date()) => {
  const profile = snapshot?.profile ?? {};
  const meal = snapshot?.meal ?? {};
  const water = snapshot?.water ?? {};
  const entries = getTodayMealEntries(meal, now);
  const nutrients = calculateMealTotalNutrients(entries);
  const waterConsumed = Number(water.consumedMl) || 0;
  const waterTarget = Number(water.dailyWaterGoal) || 0;
  const calorieTarget = Number(profile.dailyCalories) || 0;
  const fiber = Number(nutrients.fiber) || 0;

  return [
    "Стан на сьогодні:",
    "",
    `🥗 Їжа: ${entries.length} запис(ів)`,
    `🔥 Калорії: ${formatNumber(nutrients.calories)} / ${formatNumber(calorieTarget)} ккал (${formatPercent(nutrients.calories, calorieTarget)})`,
    `🥩 Білок: ${formatNumber(nutrients.protein, 1)} г`,
    `🥑 Жири: ${formatNumber(nutrients.fat, 1)} г`,
    `🍚 Вуглеводи: ${formatNumber(nutrients.carbs, 1)} г`,
    `🌾 Клітковина: ${formatNumber(fiber, 1)} г`,
    `💧 Вода: ${formatNumber(waterConsumed)} / ${formatNumber(waterTarget)} мл (${formatPercent(waterConsumed, waterTarget)})`,
    "",
    entries.length === 0
      ? "Перший корисний крок — додати перший прийом їжі або випити склянку води."
      : "Я бачу день і можу підказати наступний крок по воді, білку або калоріях.",
  ].join("\n");
};

export const buildTelegramWaterSummary = (snapshot = {}) => {
  const water = snapshot?.water ?? {};
  const consumed = Number(water.consumedMl) || 0;
  const target = Number(water.dailyWaterGoal) || 0;
  const glassSize = Number(water.glassSizeMl) || 250;
  const remaining = Math.max(target - consumed, 0);

  return [
    "Вода сьогодні:",
    "",
    `💧 Випито: ${formatNumber(consumed)} мл`,
    `🎯 Ціль: ${formatNumber(target)} мл`,
    `📊 Прогрес: ${formatPercent(consumed, target)}`,
    remaining > 0
      ? `Ще приблизно ${formatNumber(remaining)} мл, це близько ${Math.ceil(remaining / glassSize)} склян(ок).`
      : "Ціль по воді вже закрита. Красиво тримаєш ритм.",
  ].join("\n");
};

export const buildTelegramNutritionSummary = (snapshot = {}, now = new Date()) => {
  const profile = snapshot?.profile ?? {};
  const entries = getTodayMealEntries(snapshot?.meal ?? {}, now);
  const nutrients = calculateMealTotalNutrients(entries);
  const calorieTarget = Number(profile.dailyCalories) || 0;

  return [
    "Нутрієнти сьогодні:",
    "",
    `🔥 Калорії: ${formatNumber(nutrients.calories)} / ${formatNumber(calorieTarget)} ккал`,
    `🥩 Білок: ${formatNumber(nutrients.protein, 1)} г`,
    `🥑 Жири: ${formatNumber(nutrients.fat, 1)} г`,
    `🍚 Вуглеводи: ${formatNumber(nutrients.carbs, 1)} г`,
    `🍬 Цукри: ${formatNumber(nutrients.sugars, 1)} г`,
    `🌾 Клітковина: ${formatNumber(nutrients.fiber, 1)} г`,
    `🧂 Натрій: ${formatNumber(nutrients.sodium, 0)} мг`,
    `🦴 Кальцій: ${formatNumber(nutrients.calcium, 0)} мг`,
    `🩸 Залізо: ${formatNumber(nutrients.iron, 1)} мг`,
  ].join("\n");
};

export const createTelegramConnectToken = ({
  userId,
  secret,
  ttlMs,
  now = Date.now(),
}) => {
  const expiresAt = now + ttlMs;
  const compactToken = createTelegramSafeConnectToken({ userId, secret, expiresAt });

  if (compactToken) {
    return {
      token: compactToken,
      expiresAt,
    };
  }

  const encodedPayload = base64UrlEncodeJson({
    sub: userId,
    purpose: TELEGRAM_CONNECT_PURPOSE,
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000),
    nonce: crypto.randomBytes(16).toString("base64url"),
  });
  const signature = signPayload(encodedPayload, secret);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt,
  };
};

export const verifyTelegramConnectTokenDetailed = ({
  token,
  secret,
  now = Date.now(),
}) => {
  if (typeof token !== "string" || !token.trim()) {
    return {
      ok: false,
      reason: "missing_token",
    };
  }

  if (
    token.startsWith(`${TELEGRAM_CONNECT_COMPACT_PREFIX}_`) ||
    token.startsWith(`${TELEGRAM_CONNECT_GENERIC_PREFIX}_`)
  ) {
    return verifyCompactTelegramConnectToken({ token, secret, now });
  }

  if (!token.includes(".")) {
    return {
      ok: false,
      reason: "invalid_legacy_shape",
    };
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return {
      ok: false,
      reason: "invalid_legacy_parts",
    };
  }

  const expectedSignature = signPayload(encodedPayload, secret);

  if (!timingSafeEqualString(signature, expectedSignature)) {
    return {
      ok: false,
      reason: "signature_mismatch",
    };
  }

  let payload = null;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return {
      ok: false,
      reason: "decode_failed",
    };
  }

  if (
    !payload ||
    payload.purpose !== TELEGRAM_CONNECT_PURPOSE ||
    typeof payload.sub !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp * 1000 <= now
  ) {
    return {
      ok: false,
      reason:
        payload?.exp * 1000 <= now ? "expired" : "invalid_legacy_payload",
      decoded: {
        userId: typeof payload?.sub === "string" ? payload.sub : null,
        expiresAt: typeof payload?.exp === "number" ? payload.exp * 1000 : null,
        purpose: payload?.purpose ?? null,
      },
    };
  }

  return {
    ok: true,
    userId: payload.sub,
    expiresAt: payload.exp * 1000,
    decoded: {
      userId: payload.sub,
      expiresAt: payload.exp * 1000,
      purpose: payload.purpose,
    },
  };
};

export const verifyTelegramConnectToken = (payload) => {
  const result = verifyTelegramConnectTokenDetailed(payload);

  return result.ok
    ? {
        userId: result.userId,
        expiresAt: result.expiresAt,
      }
    : null;
};

export const createTelegramService = ({
  config,
  authRepository,
  stateService = null,
  reminderService = null,
  medicationReminderService = null,
  assistantAgent = null,
  logger = console,
  TelegrafClass = Telegraf,
} = {}) => {
  const reminders = reminderService ?? medicationReminderService;
  const botUsername = normalizeBotUsername(config?.telegramBotUsername);
  const botToken = toTrimmedString(config?.telegramBotToken) || null;
  const configured = Boolean(botToken && botUsername);
  let bot = null;
  let launchPromise = null;
  let launched = false;
  let startRetryTimeout = null;
  let isStopping = false;
  let lastStartAttemptAt = null;
  let lastStartedAt = null;
  let lastStartError = null;
  let medicationReminderRuntime = null;

  const getBot = () => {
    if (!configured) {
      return null;
    }

    if (bot) {
      return bot;
    }

    bot = new TelegrafClass(botToken);
    registerBotHandlers(bot);
    return bot;
  };

  const writeAuditLog = async ({ user, action, details = null }) => {
    await authRepository?.createAuditLog?.({
      id: `audit-${crypto.randomUUID()}`,
      actorUserId: user?.id ?? null,
      actorRole: user?.role ?? "USER",
      action,
      targetType: "user",
      targetId: user?.id ?? null,
      details,
      createdAt: new Date().toISOString(),
    });
  };

  const getUserByTelegramChatId = async (telegramChatId) =>
    authRepository?.findUserByTelegramChatId?.(String(telegramChatId)) ?? null;

  const getCurrentUserRecord = async (currentUser) => {
    if (!currentUser?.id) {
      return currentUser;
    }

    return (await authRepository.findUserById?.(currentUser.id)) ?? currentUser;
  };

  const getConnectedUser = async (ctx) => {
    const chatId = getTelegramChatIdFromContext(ctx);
    const user = chatId ? await getUserByTelegramChatId(chatId) : null;

    if (!user) {
      await ctx.reply(TELEGRAM_NOT_CONNECTED_MESSAGE);
      return null;
    }

    return user;
  };

  const replyWithSnapshot = async (ctx, buildMessage) => {
    const user = await getConnectedUser(ctx);

    if (!user) {
      return;
    }

    if (!stateService?.getSnapshot) {
      await ctx.reply("Дані профілю тимчасово недоступні. Спробуйте трохи пізніше.");
      return;
    }

    const snapshot = await stateService.getSnapshot(user);
    await ctx.reply(buildMessage(snapshot));
  };

  const replyWithMainMenu = async (ctx, user = null) => {
    await ctx.reply(buildTelegramMainMenuMessage(user), TELEGRAM_MAIN_MENU_KEYBOARD);
  };

  const getMedicationReminderRuntime = () => {
    if (!medicationReminderRuntime) {
      medicationReminderRuntime = createTelegramMedicationReminderRuntime({
        configured,
        authRepository,
        reminderService: reminders,
        getConnectedUser,
        writeAuditLog,
        sendTelegramMessage,
        logger,
      });
    }

    return medicationReminderRuntime;
  };

  const registerBotHandlers = (nextBot) => {
    nextBot.start(async (ctx) => {
      const { payload: payloadToken, source: payloadSource } =
        extractTelegramStartPayload(ctx);
      const chatId = ctx.chat?.id === undefined ? null : String(ctx.chat.id);

      logger.info?.("[telegram] connect payload received", {
        provider: "telegram",
        chatId: maskTelegramChatId(chatId),
        source: payloadSource,
        hasPayload: Boolean(payloadToken),
        payload: maskTelegramPayload(payloadToken),
      });

      if (!payloadToken) {
        const connectedUser = chatId ? await getUserByTelegramChatId(chatId) : null;

        if (connectedUser) {
          await ctx.reply(
            [
              `Telegram уже подключён к Smart Nutrition: ${connectedUser.name}.`,
              "",
              buildTelegramAssistantCapabilitiesMessage(),
            ].join("\n")
          );
          await replyWithMainMenu(ctx, connectedUser);
          return;
        }

        await ctx.reply(
          [
            "Чтобы подключить Telegram, нужен персональный линк из профиля Smart Nutrition.",
            "",
            "Откройте Smart Nutrition → Профиль → Безопасность / Акаунт і дані → Підключити Telegram.",
            "Обычный /start без персональной ссылки не подключает аккаунт.",
          ].join("\n")
        );
        return;
      }

      const verifiedToken = verifyTelegramConnectTokenDetailed({
        token: payloadToken,
        secret: config.jwtSecret,
      });

      logger.info?.("[telegram] connect payload verification result", {
        provider: "telegram",
        ok: Boolean(verifiedToken.ok),
        reason: verifiedToken.reason ?? null,
        decoded: verifiedToken.decoded
          ? {
              prefix: verifiedToken.decoded.prefix ?? "legacy",
              purpose: verifiedToken.decoded.purpose ?? null,
              userId: verifiedToken.decoded.userId ?? null,
              expiresAt: verifiedToken.decoded.expiresAt
                ? new Date(verifiedToken.decoded.expiresAt).toISOString()
                : null,
            }
          : null,
      });

      if (!verifiedToken.ok) {
        await ctx.reply("Ссылка подключения истекла или недействительна. Создайте новую в профиле.");
        return;
      }

      const user = await authRepository.findUserById(verifiedToken.userId);

      logger.info?.("[telegram] connect user lookup result", {
        provider: "telegram",
        userId: verifiedToken.userId,
        found: Boolean(user),
        chatId: maskTelegramChatId(chatId),
      });

      if (!user || !chatId) {
        await ctx.reply("Не удалось найти аккаунт Smart Nutrition для этой ссылки.");
        return;
      }

      const updatedUser = await authRepository.updateUserTelegramConnection?.({
        userId: user.id,
        telegramChatId: chatId,
        telegramConnectedAt: new Date().toISOString(),
      });
      const telegramPersisted =
        String(updatedUser?.telegramChatId ?? "") === chatId ||
        String(updatedUser?.telegramId ?? "") === chatId;

      logger.info?.("[telegram] connect database update result", {
        provider: "telegram",
        userId: user.id,
        linkedUserId: updatedUser?.id ?? null,
        chatId: maskTelegramChatId(chatId),
        updated: Boolean(updatedUser),
        persisted: telegramPersisted,
        connectedAt: updatedUser?.telegramConnectedAt ?? null,
      });

      if (!updatedUser || !telegramPersisted) {
        logger.warn?.("[telegram] connect database update failed", {
          provider: "telegram",
          userId: user.id,
          chatId: maskTelegramChatId(chatId),
          updated: Boolean(updatedUser),
          persisted: telegramPersisted,
        });
        await ctx.reply(
          "Не удалось сохранить подключение Telegram. Попробуйте создать новую ссылку в профиле."
        );
        return;
      }

      await writeAuditLog({
        user: updatedUser,
        action: "telegram.connected",
        details: { provider: "telegram" },
      });

      await ctx.reply("Telegram connected ✅");
      await replyWithMainMenu(ctx, updatedUser);
    });

    nextBot.command("menu", async (ctx) => {
      const user = await getConnectedUser(ctx);

      if (!user) {
        return;
      }

      await replyWithMainMenu(ctx, user);
    });

    nextBot.command("help", async (ctx) => {
      await ctx.reply(buildTelegramAssistantCapabilitiesMessage(), TELEGRAM_MAIN_MENU_KEYBOARD);
    });

    nextBot.command("today", async (ctx) => {
      await replyWithSnapshot(ctx, (snapshot) => buildTelegramDailySummary(snapshot));
    });

    nextBot.command("water", async (ctx) => {
      await replyWithSnapshot(ctx, buildTelegramWaterSummary);
    });

    nextBot.command("nutrition", async (ctx) => {
      await replyWithSnapshot(ctx, (snapshot) => buildTelegramNutritionSummary(snapshot));
    });

    nextBot.command("profile", async (ctx) => {
      const chatId = ctx.chat?.id === undefined ? null : String(ctx.chat.id);
      const user = chatId ? await getUserByTelegramChatId(chatId) : null;

      if (!user) {
        await ctx.reply(TELEGRAM_NOT_CONNECTED_MESSAGE);
        return;
      }

      await ctx.reply(`Подключён аккаунт Smart Nutrition: ${user.name}`);
    });

    nextBot.command("disconnect", async (ctx) => {
      const chatId = ctx.chat?.id === undefined ? null : String(ctx.chat.id);

      if (!chatId) {
        await ctx.reply("Не удалось определить Telegram чат.");
        return;
      }

      const user = await authRepository.disconnectTelegramChat?.(chatId);

      if (user) {
        await writeAuditLog({
          user,
          action: "telegram.disconnected",
          details: { provider: "telegram", source: "bot" },
        });
      }

      await ctx.reply("Telegram отключён от Smart Nutrition.");
    });

    getMedicationReminderRuntime().registerHandlers(nextBot);

    nextBot.on("text", async (ctx) => {
      const message = toTrimmedString(ctx.message?.text);

      if (!message || message.startsWith("/")) {
        return;
      }

      if (/^(меню|menu|главное меню|головне меню)$/iu.test(message)) {
        const user = await getConnectedUser(ctx);

        if (user) {
          await replyWithMainMenu(ctx, user);
        }

        return;
      }

      const user = await getConnectedUser(ctx);

      if (!user) {
        return;
      }

      const agentResult = await assistantAgent?.run?.({
        user,
        message,
        context: {
          interactionChannel: "telegram",
          language: "uk",
        },
      });

      if (agentResult?.handled) {
        await ctx.reply(agentResult.text);
        return;
      }

      await ctx.reply(
        [
          "Я на зв'язку. Можу швидко виконувати дії по Smart Nutrition.",
          "",
          "Приклади:",
          "💧 Я випив 300 мл води",
          "💊 Нагадуй пити Вітамін D щодня о 09:00",
          "📊 Що по воді?",
          "",
          "Для списку команд: /help",
        ].join("\n")
      );
    });

    nextBot.catch((error) => {
      logger.warn?.("[telegram] bot handler failed", {
        provider: "telegram",
        code: toSafeErrorCode(error),
        message: toSafeErrorMessage(error),
      });
    });
  };

  const createConnectLink = async (currentUser) => {
    if (!configured) {
      throw new AuthApiError(
        "TELEGRAM_NOT_CONFIGURED",
        "Telegram integration is not configured."
      );
    }

    const user = await getCurrentUserRecord(currentUser);
    const { token, expiresAt } = createTelegramConnectToken({
      userId: user.id,
      secret: config.jwtSecret,
      ttlMs: config.telegramConnectTokenTtlMs,
    });

    logger.info?.("[telegram] connect link created", {
      provider: "telegram",
      userId: user.id,
      botUsername,
      token: maskTelegramPayload(token),
      telegramSafePayload: TELEGRAM_DEEP_LINK_PAYLOAD_PATTERN.test(token),
      maxPayloadLength: TELEGRAM_DEEP_LINK_MAX_PAYLOAD_LENGTH,
      expiresAt: new Date(expiresAt).toISOString(),
    });

    return {
      configured: true,
      connected: Boolean(user.telegramChatId),
      connectedAt: user.telegramConnectedAt ?? null,
      botUsername,
      url: `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  };

  const getConnectionStatus = async (currentUser) => {
    const user = await getCurrentUserRecord(currentUser);

    return {
      configured,
      provider: "telegram",
      botUsername: configured ? botUsername : null,
      connected: Boolean(user?.telegramChatId),
      connectedAt: user?.telegramConnectedAt ?? null,
    };
  };

  const disconnectUser = async (currentUser) => {
    const updatedUser =
      (await authRepository.disconnectUserTelegram?.(currentUser.id)) ?? currentUser;

    await writeAuditLog({
      user: updatedUser,
      action: "telegram.disconnected",
      details: { provider: "telegram", source: "web" },
    });

    return getConnectionStatus(updatedUser);
  };

  const sendTelegramMessage = async (chatId, text, extra = undefined) => {
    if (!configured) {
      return {
        ok: false,
        code: "TELEGRAM_NOT_CONFIGURED",
      };
    }

    try {
      await getBot().telegram.sendMessage(String(chatId), String(text), extra);
      return { ok: true };
    } catch (error) {
      logger.warn?.("[telegram] send failed", {
        provider: "telegram",
        code: toSafeErrorCode(error),
        message: toSafeErrorMessage(error),
      });

      return {
        ok: false,
        code: "TELEGRAM_SEND_FAILED",
      };
    }
  };

  const clearStartRetry = () => {
    if (startRetryTimeout) {
      clearTimeout(startRetryTimeout);
      startRetryTimeout = null;
    }
  };

  const markPollingStopped = () => {
    launched = false;
    launchPromise = null;
    getMedicationReminderRuntime().stop();
  };

  const scheduleStartRetry = () => {
    if (!configured || isStopping || launched || startRetryTimeout) {
      return;
    }

    startRetryTimeout = setTimeout(() => {
      startRetryTimeout = null;
      void start();
    }, TELEGRAM_START_RETRY_DELAY_MS);
    startRetryTimeout.unref?.();
  };

  const configureBotCommands = async (currentBot) => {
    try {
      await currentBot.telegram?.setMyCommands?.(TELEGRAM_BOT_COMMANDS);
    } catch (error) {
      logger.warn?.("[telegram] set commands failed", {
        provider: "telegram",
        code: toSafeErrorCode(error),
        message: toSafeErrorMessage(error),
      });
    }
  };

  const handlePollingStarted = () => {
    launched = true;
    lastStartedAt = new Date().toISOString();
    lastStartError = null;
    getMedicationReminderRuntime().start();
    logger.info?.("[telegram] bot polling started", {
      provider: "telegram",
      botUsername,
    });
  };

  const start = async () => {
    if (!configured) {
      logger.info?.("[telegram] integration disabled");
      return { ok: true, skipped: true };
    }

    if (launched) {
      return { ok: true, skipped: true, polling: true };
    }

    if (launchPromise) {
      return { ok: true, skipped: true, starting: true };
    }

    isStopping = false;
    clearStartRetry();
    lastStartAttemptAt = new Date().toISOString();

    const currentBot = getBot();
    await configureBotCommands(currentBot);

    launchPromise = currentBot
      .launch({ dropPendingUpdates: false }, handlePollingStarted)
      .then(() => {
        if (!isStopping) {
          markPollingStopped();
          logger.warn?.("[telegram] bot polling stopped unexpectedly", {
            provider: "telegram",
            botUsername,
          });
          scheduleStartRetry();
        }
      })
      .catch((error) => {
        markPollingStopped();
        lastStartError = {
          code: toSafeErrorCode(error),
          message: toSafeErrorMessage(error),
        };
        logger.warn?.("[telegram] bot polling failed", {
          provider: "telegram",
          code: lastStartError.code,
          message: lastStartError.message,
        });
        scheduleStartRetry();
      });

    return { ok: true, skipped: false, starting: true };
  };

  const stop = (reason = "Smart Nutrition API shutdown") => {
    isStopping = true;
    clearStartRetry();
    getMedicationReminderRuntime().stop();

    if (bot && launched) {
      bot.stop(reason);
      launched = false;
    }
  };

  const getStatus = () => {
    const reminderRuntimeStatus = getMedicationReminderRuntime().getStatus();

    return {
      configured,
      provider: "telegram",
      botUsername: configured ? botUsername : null,
      polling: launched,
      starting: Boolean(launchPromise && !launched),
      retryScheduled: Boolean(startRetryTimeout),
      lastStartAttemptAt,
      lastStartedAt,
      lastStartError,
      connectTokenTtlMs: config?.telegramConnectTokenTtlMs ?? null,
      reminders: reminderRuntimeStatus,
      medicationReminders: reminderRuntimeStatus,
    };
  };

  return {
    isConfigured: () => configured,
    getStatus,
    createConnectLink,
    getConnectionStatus,
    disconnectUser,
    sendTelegramMessage,
    start,
    stop,
  };
};
