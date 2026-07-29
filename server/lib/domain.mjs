import crypto from "node:crypto";
import { decodeJwt, decodeProtectedHeader } from "jose";

const activityMultiplier = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const nutrientKeys = [
  "calories",
  "protein",
  "fat",
  "saturatedFat",
  "monounsaturatedFat",
  "polyunsaturatedFat",
  "transFat",
  "omega3",
  "omega6",
  "omega9",
  "cholesterol",
  "carbs",
  "sugars",
  "fiber",
  "starch",
  "glucose",
  "fructose",
  "sucrose",
  "lactose",
  "water",
  "sodium",
  "potassium",
  "vitaminA",
  "vitaminB",
  "vitaminB1",
  "vitaminB2",
  "vitaminB3",
  "vitaminB5",
  "vitaminB6",
  "vitaminB7",
  "vitaminB9",
  "vitaminB12",
  "vitaminC",
  "vitaminD",
  "vitaminE",
  "vitaminK",
  "calcium",
  "iron",
  "magnesium",
  "zinc",
  "phosphorus",
  "iodine",
  "selenium",
  "copper",
];

const appLanguages = new Set(["uk", "pl", "en"]);

const normalizeAppLanguage = (value, fallback = "uk") =>
  appLanguages.has(value) ? value : fallback;

export class AuthApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export class PlatformApiError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class AssistantApiError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class StateApiError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const userRoles = [
  "USER",
  "VERIFIED_USER",
  "HELPER",
  "NUTRITIONIST",
  "MODERATOR",
  "ADMIN",
  "OWNER",
  "SUPER_ADMIN",
];

export const isUserRole = (value) => userRoles.includes(value);

export const isOwnerRole = (role) => role === "OWNER" || role === "SUPER_ADMIN";

const roleRank = {
  USER: 0,
  VERIFIED_USER: 0,
  HELPER: 1,
  NUTRITIONIST: 2,
  MODERATOR: 3,
  ADMIN: 4,
  OWNER: 5,
  SUPER_ADMIN: 5,
};

export const hasRoleAtLeast = (role, minimumRole) =>
  Number(roleRank[role] ?? -1) >= Number(roleRank[minimumRole] ?? 999);

const base64UrlEncode = (value) => Buffer.from(value).toString("base64url");

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const sanitizeName = (name) => String(name || "").trim().replace(/\s+/g, " ");

export const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

export const createOpaqueToken = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("base64url");

export const hashOneTimeToken = (token, secret) =>
  crypto.createHash("sha256").update(`${secret}:${String(token ?? "")}`).digest("hex");

const strongPasswordPattern =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-\\/\][+=~`]).{10,}$/;

const isStrongPassword = (password) =>
  strongPasswordPattern.test(String(password ?? ""));

export const assertPasswordPolicy = (password) => {
  if (!isStrongPassword(password)) {
    throw new AuthApiError(
      "WEAK_PASSWORD",
      "Password must be at least 10 characters and include upper, lower, digit, and symbol."
    );
  }
};

export const createSessionToken = ({
  userId,
  expiresAt,
  secret,
  kind = "access",
  tokenVersion = 0,
}) => {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(expiresAt / 1000),
      iat: Math.floor(Date.now() / 1000),
      kind,
      ver: Math.max(Number(tokenVersion) || 0, 0),
    })
  );
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
};

export const verifySessionToken = (token, secret) => {
  if (typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const [header, payload, signature] = parts;

  try {
    const protectedHeader = decodeProtectedHeader(token);

    if (protectedHeader.alg !== "HS256" || protectedHeader.typ !== "JWT") {
      return null;
    }
  } catch {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  let parsedPayload;

  try {
    parsedPayload = decodeJwt(token);
  } catch {
    return null;
  }

  if (
    !parsedPayload ||
    typeof parsedPayload.sub !== "string" ||
    typeof parsedPayload.exp !== "number"
  ) {
    return null;
  }

  return {
    userId: parsedPayload.sub,
    expiresAt: parsedPayload.exp * 1000,
    kind:
      parsedPayload.kind === "refresh" ||
      parsedPayload.kind === "access"
        ? parsedPayload.kind
        : "legacy",
    tokenVersion:
      Number.isInteger(parsedPayload.ver) && parsedPayload.ver >= 0
        ? parsedPayload.ver
        : 0,
  };
};

export const getBearerToken = (request) => {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
};

export const readCookieValue = (request, name) => {
  const rawHeader = request.headers.cookie;

  if (typeof rawHeader !== "string" || !rawHeader.trim()) {
    return null;
  }

  const prefix = `${encodeURIComponent(name)}=`;

  const matchedCookie = rawHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  if (!matchedCookie) {
    return null;
  }

  try {
    return decodeURIComponent(matchedCookie.slice(prefix.length));
  } catch {
    return matchedCookie.slice(prefix.length);
  }
};

const derivePasswordHash = (password, salt, iterations) =>
  crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("base64");

export const createPasswordRecord = (password, iterations) => {
  const passwordSalt = crypto.randomBytes(16).toString("base64");
  const passwordHash = derivePasswordHash(password, passwordSalt, iterations);

  return {
    passwordHash,
    passwordSalt,
    passwordVersion: "pbkdf2-sha256",
  };
};

export const verifyPassword = (user, password, iterations) => {
  const nextPasswordHash = derivePasswordHash(password, user.passwordSalt, iterations);
  const expectedHash = Buffer.from(String(user.passwordHash ?? ""));
  const actualHash = Buffer.from(nextPasswordHash);

  return (
    expectedHash.length === actualHash.length &&
    crypto.timingSafeEqual(expectedHash, actualHash)
  );
};

const calculateMaintenanceCalories = ({ gender, weight, height, age, activity }) => {
  const bmr =
    gender === "male"
      ? 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
      : 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;

  return Math.round(bmr * activityMultiplier[activity]);
};

const applyGoalDelta = (maintenanceCalories, goal) => {
  if (goal === "cut") return Math.max(maintenanceCalories - 300, 1200);
  if (goal === "bulk") return maintenanceCalories + 250;
  return maintenanceCalories;
};

export const createEmptyNutrients = () =>
  nutrientKeys.reduce((accumulator, key) => {
    accumulator[key] = 0;
    return accumulator;
  }, {});

export const calculateMealTotalNutrients = (items = []) => {
  const totals = createEmptyNutrients();

  items.forEach((item) => {
    const factor = Number(item?.quantity ?? 0) / 100;
    const nutrients = item?.product?.nutrients ?? {};

    nutrientKeys.forEach((key) => {
      totals[key] += Number(nutrients[key] ?? 0) * factor;
    });
  });

  return totals;
};

const createInitialAssistantCustomization = () => ({
  name: "",
  assistantName: "",
  companionKind: "robot",
  assistantAvatar: "robot",
  preferredCompanionRenderMode: "2d",
  role: "assistant",
  tone: "gentle",
  assistantPersonality: "gentle",
  assistantMood: "idle",
  assistantMemory: {
    goals: [],
    preferences: [],
    conversationHighlights: [],
    lastSyncedAt: null,
  },
  humorEnabled: true,
  widgetEnabled: true,
  proactiveHintsEnabled: true,
  onboarding: {
    preferredName: "",
    primaryGoalNote: "",
    goalSelections: [],
    mainFriction: "unknown",
    mainFrictions: [],
    motivationStyle: "gentle",
    motivationStyles: ["gentle"],
    supportNote: "",
    completedAt: null,
  },
});

export const createInitialProfileState = (userInput) => {
  const maintenanceCalories = calculateMaintenanceCalories(userInput);
  const targetCalories = applyGoalDelta(maintenanceCalories, userInput.goal);
  const dateKey = new Date().toISOString().slice(0, 10);

  return {
    dailyCalories: targetCalories,
    goal: userInput.goal,
    weightHistory: [
      {
        date: new Date().toISOString(),
        weight: userInput.weight,
      },
      ],
      measurementHistory: [],
      progressPhotos: [],
      weeklyCheckIn: {
      enabled: true,
      remindIntervalDays: 7,
      lastRecordedAt: null,
    },
    maintenanceCalories,
    adaptiveCalories: targetCalories,
    targetWeight: null,
    targetWeightStart: null,
    dietStyle: "balanced",
    allergies: [],
    excludedIngredients: [],
    adaptiveMode: "automatic",
    notificationsEnabled: false,
    mealRemindersEnabled: true,
    calorieAlertsEnabled: true,
    reminderTimes: {
      breakfast: "08:30",
      lunch: "13:00",
      dinner: "19:00",
      snack: "16:30",
    },
    languagePreference: normalizeAppLanguage(userInput.languagePreference),
    motivation: {
      points: 0,
      level: 1,
      completedTasks: 0,
      activeTasks: [
        {
          id: `${dateKey}-check-in`,
          title: "Check in with your day",
          description: "Open your plan and decide what matters most for today.",
          points: 15,
          category: "consistency",
          createdAt: `${dateKey}T06:00:00.000Z`,
          completedAt: null,
          skippedWithDayOffAt: null,
        },
        {
          id: `${dateKey}-nutrition`,
          title: "Support your nutrition goal",
          description: "Finish one action that supports your current goal.",
          points: 25,
          category: "nutrition",
          createdAt: `${dateKey}T06:05:00.000Z`,
          completedAt: null,
          skippedWithDayOffAt: null,
        },
        {
          id: `${dateKey}-reflection`,
          title: "Close the day with a reflection",
          description: "Review progress and lock one improvement for tomorrow.",
          points: 20,
          category: "reflection",
          createdAt: `${dateKey}T06:10:00.000Z`,
          completedAt: null,
          skippedWithDayOffAt: null,
        },
      ],
      history: [],
      achievements: [
        {
          id: "first-step",
          title: "First step",
          description: "Complete your first motivation task.",
          unlockedAt: null,
          progress: 0,
          target: 1,
        },
        {
          id: "momentum",
          title: "Momentum",
          description: "Complete 5 motivation tasks.",
          unlockedAt: null,
          progress: 0,
          target: 5,
        },
        {
          id: "century",
          title: "Century",
          description: "Earn 100 points.",
          unlockedAt: null,
          progress: 0,
          target: 100,
        },
        {
          id: "steady-run",
          title: "Steady run",
          description: "Complete 15 motivation tasks.",
          unlockedAt: null,
          progress: 0,
          target: 15,
        },
      ],
      lastTaskRefreshDate: dateKey,
      freeDayLastUsedAt: null,
      paidDayLastUsedAt: null,
      paidDayLastUsedMonth: null,
    },
    premium: {
      plan: "free",
      status: "inactive",
      startedAt: null,
      trialEndsAt: null,
      renewsAt: null,
      cancelledAt: null,
    },
    assistant: createInitialAssistantCustomization(),
    personalDetails: {
      bloodGroup: "unknown",
      eyeColor: "unknown",
      relationshipStatus: "prefer_not",
      supportSystem: "self",
      petCompanion: "none",
    },
    familyLifecycleMode: "personal",
    womenHealth: {
      mode: "none",
      pregnancyWeek: null,
      dueDate: null,
      lastPeriodStartDate: null,
      doctorConfirmed: false,
      notes: "",
      symptomHistory: [],
      updatedAt: null,
    },
    partnerSharing: {
      invites: [],
      links: [],
    },
  };
};

export const createInitialMealState = () => ({
  items: [],
  templates: [],
  totalNutrients: createEmptyNutrients(),
  savedProducts: [],
  recentProducts: [],
  personalBarcodeProducts: [],
});

export const createInitialWaterState = () => ({
  dailyWaterGoal: 2000,
  consumedMl: 0,
  glassSizeMl: 250,
  lastLoggedOn: new Date().toISOString().slice(0, 10),
  targetMode: "automatic",
  history: [
    {
      date: new Date().toISOString().slice(0, 10),
      consumedMl: 0,
      targetMl: 2000,
      updatedAt: new Date().toISOString(),
    },
  ],
  reminders: {
    enabled: false,
    intervalMinutes: 120,
    startTime: "09:00",
    endTime: "21:00",
    lastReminderAt: null,
  },
});

export const createInitialFridgeState = () => ({
  items: [],
});

const communitySeeds = {
  uk: {
    messages: [
      "Зібрала білковий сніданок на завтра. Хочеш рецепт?",
      "Так, надішли, будь ласка.",
    ],
    roomMessages: [
      "Сьогодні роблю легку вечерю і тримаю воду по 250 мл чекпоінтами.",
      "Якщо вага стоїть, спершу дивимося середній тиждень, воду і точність записів.",
    ],
    posts: [
      {
        title: "Білковий сніданок у банці",
        body: "Грецький йогурт, вівсянка, банан і чіа. Зручно підготувати ввечері.",
        ingredients: ["грецький йогурт", "вівсянка", "банан", "чіа"],
      },
      {
        title: "Як я повернула ритм води",
        body: "Перейшла на чекпоінти по 250 мл, і воду стало набагато легше відстежувати.",
        ingredients: [],
      },
      {
        title: "Чеклист тижня без прогресу",
        body: "Перед новим зниженням калорій перевірте точність записів, воду, сон і середню активність.",
        ingredients: [],
      },
    ],
    comment: "Додав ягоди замість банана, теж чудово вийшло.",
    progress: [
      { label: "Вага", value: "-2.4 кг" },
      { label: "Ритм води", value: "7 днів" },
    ],
    coach: "Коуч Smart Nutrition",
  },
  pl: {
    messages: [
      "Przygotowałam białkowe śniadanie na jutro. Chcesz przepis?",
      "Tak, podeślij proszę.",
    ],
    roomMessages: [
      "Dzisiaj robię lekką kolację i pilnuję wody punktami po 250 ml.",
      "Jeśli waga stoi, najpierw sprawdzamy średni tydzień, wodę i dokładność zapisów.",
    ],
    posts: [
      {
        title: "Białkowe śniadanie w słoiku",
        body: "Jogurt grecki, płatki owsiane, banan i chia. Wygodne do przygotowania wieczorem.",
        ingredients: ["jogurt grecki", "płatki owsiane", "banan", "chia"],
      },
      {
        title: "Jak wróciłam do rytmu picia wody",
        body: "Przeszłam na punkty po 250 ml i woda stała się dużo łatwiejsza do śledzenia.",
        ingredients: [],
      },
      {
        title: "Checklista tygodnia bez postępu",
        body: "Zanim znów obetniesz kalorie, sprawdź dokładność wpisów, wodę, sen i średnią aktywność.",
        ingredients: [],
      },
    ],
    comment: "Dodałem jagody zamiast banana, też wyszło świetnie.",
    progress: [
      { label: "Waga", value: "-2.4 kg" },
      { label: "Rytm wody", value: "7 dni" },
    ],
    coach: "Coach Smart Nutrition",
  },
  en: {
    messages: [
      "I prepared a high-protein breakfast for tomorrow. Want the recipe?",
      "Yes, please send it.",
    ],
    roomMessages: [
      "Today I am making a light dinner and tracking water in 250 ml checkpoints.",
      "If weight stalls, check the weekly average, water, and logging accuracy first.",
    ],
    posts: [
      {
        title: "High-protein breakfast jar",
        body: "Greek yogurt, oats, banana, and chia. Simple prep for busy mornings.",
        ingredients: ["Greek yogurt", "oats", "banana", "chia"],
      },
      {
        title: "How I rebuilt my water rhythm",
        body: "I switched to 250 ml checkpoints and water finally became easier to track.",
        ingredients: [],
      },
      {
        title: "Plateau week checklist",
        body: "Before cutting calories again, verify logging accuracy, water, sleep, and average steps.",
        ingredients: [],
      },
    ],
    comment: "I added berries instead of banana, and it worked really well too.",
    progress: [
      { label: "Weight", value: "-2.4 kg" },
      { label: "Water rhythm", value: "7 days" },
    ],
    coach: "Smart Nutrition Coach",
  },
};

export const createInitialCommunityState = (languagePreference = "uk") => {
  const seed = communitySeeds[normalizeAppLanguage(languagePreference)];

  return {
  friends: [
    {
      id: "friend-anna",
      name: "Anna",
      handle: "@anna.fit",
      status: "online",
      lastActiveAt: "2026-04-25T18:30:00.000Z",
    },
    {
      id: "friend-oleh",
      name: "Oleh",
      handle: "@oleh.mealprep",
      status: "offline",
      lastActiveAt: "2026-04-24T21:10:00.000Z",
    },
  ],
  messages: [
    {
      id: "message-1",
      friendId: "friend-anna",
      author: "friend",
      text: seed.messages[0],
      createdAt: "2026-04-25T18:31:00.000Z",
    },
    {
      id: "message-2",
      friendId: "friend-anna",
      author: "self",
      text: seed.messages[1],
      createdAt: "2026-04-25T18:34:00.000Z",
    },
  ],
  roomMessages: [
    {
      id: "room-message-1",
      authorName: "Marta",
      text: seed.roomMessages[0],
      createdAt: "2026-04-25T17:20:00.000Z",
    },
    {
      id: "room-message-2",
      authorName: seed.coach,
      text: seed.roomMessages[1],
      createdAt: "2026-04-25T17:28:00.000Z",
    },
  ],
  posts: [
    {
      id: "post-1",
      type: "recipe",
      title: seed.posts[0].title,
      body: seed.posts[0].body,
      ingredients: seed.posts[0].ingredients,
      authorName: "Anna",
      status: "approved",
      moderationReason: null,
      reviewedAt: "2026-04-25T08:12:00.000Z",
      reviewedBy: seed.coach,
      publishedAt: "2026-04-25T08:12:00.000Z",
      createdAt: "2026-04-25T08:10:00.000Z",
      likes: 14,
    },
    {
      id: "post-2",
      type: "experience",
      title: seed.posts[1].title,
      body: seed.posts[1].body,
      ingredients: seed.posts[1].ingredients,
      authorName: "Marta",
      status: "approved",
      moderationReason: null,
      reviewedAt: "2026-04-24T11:48:00.000Z",
      reviewedBy: seed.coach,
      publishedAt: "2026-04-24T11:48:00.000Z",
      createdAt: "2026-04-24T11:45:00.000Z",
      likes: 9,
    },
    {
      id: "post-3",
      type: "advice",
      title: seed.posts[2].title,
      body: seed.posts[2].body,
      ingredients: seed.posts[2].ingredients,
      authorName: seed.coach,
      status: "approved",
      moderationReason: null,
      reviewedAt: "2026-04-23T09:03:00.000Z",
      reviewedBy: "Admin",
      publishedAt: "2026-04-23T09:03:00.000Z",
      createdAt: "2026-04-23T09:00:00.000Z",
      likes: 18,
    },
  ],
  comments: [
    {
      id: "comment-1",
      postId: "post-1",
      authorName: "Oleh",
      text: seed.comment,
      createdAt: "2026-04-25T09:05:00.000Z",
    },
  ],
  progressCards: [
    {
      id: "progress-1",
      authorName: "Anna",
      metricLabel: seed.progress[0].label,
      metricValue: seed.progress[0].value,
      caption:
        languagePreference === "pl"
          ? "Trzy tygodnie bez ostrych zakazów, tylko stabilne białko i woda."
          : languagePreference === "en"
            ? "Three weeks without strict bans, just steady protein and water."
            : "Три тижні без жорстких заборон, просто стабільний білок і вода.",
      createdAt: "2026-04-25T12:00:00.000Z",
      likes: 16,
    },
    {
      id: "progress-2",
      authorName: "Marta",
      metricLabel: seed.progress[1].label,
      metricValue: seed.progress[1].value,
      caption:
        languagePreference === "pl"
          ? "Szklanki po 250 ml wreszcie zrobiły z tej czynności jasny nawyk."
          : languagePreference === "en"
            ? "250 ml glasses finally made the habit easy to understand."
            : "Склянки по 250 мл нарешті зробили звичку зрозумілою.",
      createdAt: "2026-04-24T18:40:00.000Z",
      likes: 11,
    },
  ],
  favoritePostIds: ["post-1"],
  score: 180,
  };
};

const createInitialCompanionState = () => {
  const now = new Date().toISOString();

  return {
    level: 1,
    xp: 0,
    coins: 0,
    relationshipLevel: 1,
    achievements: [],
    ownedItemIds: [],
    equippedItemIds: [],
    createdAt: now,
    updatedAt: now,
  };
};

const companionLevelThresholds = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 900,
  6: 1400,
  7: 2000,
  8: 2800,
  9: 3700,
  10: 4800,
};

const normalizeInteger = (value, fallback = 0, min = 0) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? Math.max(Math.floor(numberValue), min)
    : fallback;
};

const normalizeStringIdList = (value) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        ),
      ]
    : [];

const getCompanionLevelForXp = (xp) =>
  Object.entries(companionLevelThresholds).reduce(
    (level, [candidateLevel, threshold]) =>
      xp >= threshold ? Number(candidateLevel) : level,
    1
  );

const normalizeCompanionAchievement = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const id = typeof value.id === "string" ? value.id.trim().slice(0, 80) : "";

  if (!id) {
    return null;
  }

  return {
    id,
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title.trim().slice(0, 120)
        : id,
    description:
      typeof value.description === "string" && value.description.trim()
        ? value.description.trim().slice(0, 240)
        : undefined,
    icon:
      typeof value.icon === "string" && value.icon.trim()
        ? value.icon.trim().slice(0, 40)
        : undefined,
    category:
      ["start", "nutrition", "hydration", "progress", "companion"].includes(value.category)
        ? value.category
        : undefined,
    xpBonus: normalizeInteger(value.xpBonus, 0),
    coinBonus: normalizeInteger(value.coinBonus, 0),
    unlockedAt:
      typeof value.unlockedAt === "string" && value.unlockedAt.trim()
        ? value.unlockedAt
        : undefined,
  };
};

export const normalizeCompanionState = (value) => {
  const fallback = createInitialCompanionState();
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const xp = normalizeInteger(record.xp, fallback.xp);
  const ownedItemIds = normalizeStringIdList(record.ownedItemIds);

  return {
    level: getCompanionLevelForXp(xp),
    xp,
    coins: normalizeInteger(record.coins, fallback.coins),
    relationshipLevel: normalizeInteger(
      record.relationshipLevel,
      fallback.relationshipLevel,
      1
    ),
    achievements: Array.isArray(record.achievements)
      ? record.achievements
          .map((achievement) => normalizeCompanionAchievement(achievement))
          .filter(Boolean)
      : fallback.achievements,
    ownedItemIds,
    equippedItemIds: normalizeStringIdList(record.equippedItemIds).filter((itemId) =>
      ownedItemIds.includes(itemId)
    ),
    createdAt:
      typeof record.createdAt === "string" && record.createdAt.trim()
        ? record.createdAt
        : fallback.createdAt,
    updatedAt:
      typeof record.updatedAt === "string" && record.updatedAt.trim()
        ? record.updatedAt
        : fallback.updatedAt,
  };
};

export const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: Boolean(user.emailVerified),
  verificationChannel: "email",
  avatar: user.avatar,
  age: user.age,
  weight: user.weight,
  height: user.height,
  gender: user.gender,
  activity: user.activity,
  goal: user.goal,
  measurements: user.measurements,
  role: isUserRole(user.role) ? user.role : "USER",
  communityStatus: user.communityStatus,
  reputationScore: Number.isFinite(Number(user.reputationScore))
    ? Math.max(Number(user.reputationScore), 0)
    : undefined,
  isBanned: Boolean(user.bannedAt),
  bannedAt: user.bannedAt ?? null,
  bannedReason: user.bannedReason ?? null,
  twoFactorEnabled: Boolean(user.twoFactorEnabled),
  twoFactorRequired: Boolean(user.twoFactorRequired),
});
