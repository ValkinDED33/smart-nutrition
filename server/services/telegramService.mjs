import crypto from "node:crypto";
import { Telegraf } from "telegraf";
import { AuthApiError, calculateMealTotalNutrients } from "../lib/domain.mjs";

const TELEGRAM_CONNECT_PURPOSE = "telegram_connect";

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

const signPayload = (encodedPayload, secret) =>
  crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");

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
    "",
    "Команди:",
    "/today — короткий статус дня",
    "/water — вода",
    "/nutrition — калорії та нутрієнти",
    "/profile — статус підключення",
    "/disconnect — відключити Telegram",
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

export const verifyTelegramConnectToken = ({
  token,
  secret,
  now = Date.now(),
}) => {
  if (typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);

  if (!timingSafeEqualString(signature, expectedSignature)) {
    return null;
  }

  let payload = null;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    !payload ||
    payload.purpose !== TELEGRAM_CONNECT_PURPOSE ||
    typeof payload.sub !== "string" ||
    typeof payload.exp !== "number" ||
    payload.exp * 1000 <= now
  ) {
    return null;
  }

  return {
    userId: payload.sub,
    expiresAt: payload.exp * 1000,
  };
};

export const createTelegramService = ({
  config,
  authRepository,
  stateService = null,
  logger = console,
  TelegrafClass = Telegraf,
} = {}) => {
  const botUsername = normalizeBotUsername(config?.telegramBotUsername);
  const botToken = toTrimmedString(config?.telegramBotToken) || null;
  const configured = Boolean(botToken && botUsername);
  let bot = null;
  let launchPromise = null;
  let launched = false;

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
    const chatId = ctx.chat?.id === undefined ? null : String(ctx.chat.id);
    const user = chatId ? await getUserByTelegramChatId(chatId) : null;

    if (!user) {
      await ctx.reply("Telegram ще не підключено. Підключіть його з профілю Smart Nutrition.");
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

  const registerBotHandlers = (nextBot) => {
    nextBot.start(async (ctx) => {
      const payloadToken = toTrimmedString(ctx.startPayload);
      const chatId = ctx.chat?.id === undefined ? null : String(ctx.chat.id);

      if (!payloadToken) {
        await ctx.reply(
          "Откройте подключение Telegram из профиля Smart Nutrition и нажмите Start по персональной ссылке."
        );
        return;
      }

      const verifiedToken = verifyTelegramConnectToken({
        token: payloadToken,
        secret: config.jwtSecret,
      });

      if (!verifiedToken) {
        await ctx.reply("Ссылка подключения истекла или недействительна. Создайте новую в профиле.");
        return;
      }

      const user = await authRepository.findUserById(verifiedToken.userId);

      if (!user || !chatId) {
        await ctx.reply("Не удалось найти аккаунт Smart Nutrition для этой ссылки.");
        return;
      }

      const updatedUser = await authRepository.updateUserTelegramConnection?.({
        userId: user.id,
        telegramChatId: chatId,
        telegramConnectedAt: new Date().toISOString(),
      });

      await writeAuditLog({
        user: updatedUser ?? user,
        action: "telegram.connected",
        details: { provider: "telegram" },
      });

      await ctx.reply("Telegram успешно подключён к Smart Nutrition.");
    });

    nextBot.command("help", async (ctx) => {
      await ctx.reply(buildTelegramAssistantCapabilitiesMessage());
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
        await ctx.reply("Telegram ещё не подключён. Подключите его из профиля Smart Nutrition.");
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

  const start = async () => {
    if (!configured) {
      logger.info?.("[telegram] integration disabled");
      return { ok: true, skipped: true };
    }

    if (launchPromise) {
      return launchPromise;
    }

    launchPromise = getBot()
      .launch()
      .then(() => {
        launched = true;
        logger.info?.("[telegram] bot polling started", {
          provider: "telegram",
          botUsername,
        });
        return { ok: true, skipped: false };
      })
      .catch((error) => {
        launched = false;
        launchPromise = null;
        logger.warn?.("[telegram] bot polling failed", {
          provider: "telegram",
          code: toSafeErrorCode(error),
          message: toSafeErrorMessage(error),
        });
        return {
          ok: false,
          skipped: false,
          code: "TELEGRAM_START_FAILED",
        };
      });

    return launchPromise;
  };

  const stop = (reason = "Smart Nutrition API shutdown") => {
    if (bot && launched) {
      bot.stop(reason);
      launched = false;
    }
  };

  const getStatus = () => ({
    configured,
    provider: "telegram",
    botUsername: configured ? botUsername : null,
    polling: launched,
    connectTokenTtlMs: config?.telegramConnectTokenTtlMs ?? null,
  });

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
