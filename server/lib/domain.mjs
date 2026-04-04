import crypto from "node:crypto";

const activityMultiplier = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const nutrientKeys = [
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

export class AuthApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export class StateApiError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const base64UrlEncode = (value) => Buffer.from(value).toString("base64url");

const parseBase64UrlJson = (value) => {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
};

export const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

export const sanitizeName = (name) => String(name || "").trim().replace(/\s+/g, " ");

export const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

export const createSessionToken = ({ userId, expiresAt, secret, kind = "access" }) => {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(expiresAt / 1000),
      iat: Math.floor(Date.now() / 1000),
      kind,
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

  const parsedPayload = parseBase64UrlJson(payload);

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
  };
};

export const getBearerToken = (request) => {
  const header = request.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
};

export const derivePasswordHash = (password, salt, iterations) =>
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

export const verifyPassword = (user, password, iterations) =>
  derivePasswordHash(password, user.passwordSalt, iterations) === user.passwordHash;

export const calculateMaintenanceCalories = ({ gender, weight, height, age, activity }) => {
  const bmr =
    gender === "male"
      ? 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age
      : 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;

  return Math.round(bmr * activityMultiplier[activity]);
};

export const applyGoalDelta = (maintenanceCalories, goal) => {
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
    languagePreference: "uk",
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
    assistant: {
      name: "Nova",
      role: "assistant",
      tone: "gentle",
      humorEnabled: true,
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

export const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  age: user.age,
  weight: user.weight,
  height: user.height,
  gender: user.gender,
  activity: user.activity,
  goal: user.goal,
  measurements: user.measurements,
});
