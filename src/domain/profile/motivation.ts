import type {
  AchievementProgress,
  AssistantCustomization,
  MotivationHistoryItem,
  MotivationState,
  MotivationTask,
} from "@domain/profile/types";
import type { AppLanguage } from "@shared/types/i18n";
import type { Goal } from "@domain/user/types";
import {
  createDefaultAssistantOnboardingProfile,
  DEFAULT_ASSISTANT_NAME,
} from "../../core/assistant";

const DAY_MS = 1000 * 60 * 60 * 24;
const FIRST_STEP_ACHIEVEMENT_ID = "first-step";
const STEADY_RUN_ACHIEVEMENT_ID = "steady-run";

const toDateKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

const toMonthKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 7);
};

export const createDefaultAssistantCustomization = (): AssistantCustomization => ({
  name: DEFAULT_ASSISTANT_NAME,
  assistantName: DEFAULT_ASSISTANT_NAME,
  companionKind: "dragon",
  assistantAvatar: "dragon",
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
  onboarding: createDefaultAssistantOnboardingProfile(),
});

export const createDefaultAchievements = (): AchievementProgress[] => [
  {
    id: FIRST_STEP_ACHIEVEMENT_ID,
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
    id: STEADY_RUN_ACHIEVEMENT_ID,
    title: "Steady run",
    description: "Complete 15 motivation tasks.",
    unlockedAt: null,
    progress: 0,
    target: 15,
  },
];

const buildTaskId = (dateKey: string, suffix: string) => `${dateKey}-${suffix}`;

export const createMotivationTasks = ({
  date = new Date(),
  goal,
}: {
  date?: string | Date;
  goal: Goal;
}): MotivationTask[] => {
  const dateKey = toDateKey(date);
  const goalLabel =
    goal === "cut" ? "fat-loss" : goal === "bulk" ? "muscle-gain" : "maintenance";

  return [
    {
      id: buildTaskId(dateKey, "check-in"),
      title: "Check in with your day",
      description: "Open your plan and decide what matters most for today.",
      points: 15,
      category: "consistency",
      createdAt: `${dateKey}T06:00:00.000Z`,
      completedAt: null,
      skippedWithDayOffAt: null,
    },
    {
      id: buildTaskId(dateKey, "nutrition"),
      title: `Support your ${goalLabel} goal`,
      description: "Finish one nutrition-focused action that helps your current goal.",
      points: 25,
      category: "nutrition",
      createdAt: `${dateKey}T06:05:00.000Z`,
      completedAt: null,
      skippedWithDayOffAt: null,
    },
    {
      id: buildTaskId(dateKey, "reflection"),
      title: "Close the day with a small reflection",
      description: "Review progress and lock one tiny improvement for tomorrow.",
      points: 20,
      category: "reflection",
      createdAt: `${dateKey}T06:10:00.000Z`,
      completedAt: null,
      skippedWithDayOffAt: null,
    },
  ];
};

export const createDefaultMotivationState = (goal: Goal = "maintain"): MotivationState => ({
  points: 0,
  level: 1,
  completedTasks: 0,
  activeTasks: createMotivationTasks({ goal }),
  history: [],
  achievements: createDefaultAchievements(),
  lastTaskRefreshDate: toDateKey(new Date()),
  freeDayLastUsedAt: null,
  paidDayLastUsedAt: null,
  paidDayLastUsedMonth: null,
});

const uniqueDayCount = (history: MotivationHistoryItem[]) =>
  new Set(history.map((item) => item.completedAt.slice(0, 10))).size;

export const calculatePaidDayOffCost = (
  history: MotivationHistoryItem[],
  now: string | Date = new Date()
) => {
  const monthKey = toMonthKey(now);
  const monthItems = history.filter(
    (item) =>
      item.usedDayOff === null &&
      item.completedAt &&
      item.completedAt.slice(0, 7) === monthKey
  );

  if (monthItems.length === 0) {
    return 80;
  }

  const totalPoints = monthItems.reduce((sum, item) => sum + item.pointsEarned, 0);
  const days = Math.max(uniqueDayCount(monthItems), 1);
  return Math.max(Math.round((totalPoints / days) * 2), 40);
};

export const canUseFreeDay = (
  lastUsedAt: string | null,
  now: string | Date = new Date()
) => {
  if (!lastUsedAt) {
    return true;
  }

  return new Date(now).getTime() - new Date(lastUsedAt).getTime() >= DAY_MS * 7;
};

export const canUsePaidDay = (
  lastUsedMonth: string | null,
  now: string | Date = new Date()
) => lastUsedMonth !== toMonthKey(now);

const calculateLevel = (points: number) => Math.max(1, Math.floor(points / 120) + 1);

export const updateAchievements = (
  achievements: AchievementProgress[],
  points: number,
  completedTasks: number,
  now: string
) =>
  achievements.map((achievement) => {
    let progress = achievement.progress;

    if (achievement.id === "first-step") {
      progress = Math.min(completedTasks, achievement.target);
    } else if (achievement.id === "momentum") {
      progress = Math.min(completedTasks, achievement.target);
    } else if (achievement.id === "steady-run") {
      progress = Math.min(completedTasks, achievement.target);
    } else if (achievement.id === "century") {
      progress = Math.min(points, achievement.target);
    }

    return {
      ...achievement,
      progress,
      unlockedAt:
        progress >= achievement.target && achievement.unlockedAt === null
          ? now
          : achievement.unlockedAt,
    };
  });

export const refreshMotivationState = (
  state: MotivationState,
  goal: Goal,
  now: string | Date = new Date()
): MotivationState => {
  const dateKey = toDateKey(now);

  if (state.lastTaskRefreshDate === dateKey) {
    return state;
  }

  return {
    ...state,
    activeTasks: createMotivationTasks({ date: now, goal }),
    lastTaskRefreshDate: dateKey,
  };
};

export const completeMotivationTaskState = (
  state: MotivationState,
  taskId: string,
  completedAt: string = new Date().toISOString()
): MotivationState => {
  const task = state.activeTasks.find((item) => item.id === taskId);

  if (!task || task.completedAt || task.skippedWithDayOffAt) {
    return state;
  }

  const nextPoints = state.points + task.points;
  const nextCompletedTasks = state.completedTasks + 1;
  const nextHistory: MotivationHistoryItem[] = [
    {
      taskId: task.id,
      title: task.title,
      pointsEarned: task.points,
      completedAt,
      skipped: false,
      usedDayOff: null,
    },
    ...state.history,
  ].slice(0, 120);

  return {
    ...state,
    points: nextPoints,
    level: calculateLevel(nextPoints),
    completedTasks: nextCompletedTasks,
    activeTasks: state.activeTasks.map((item) =>
      item.id === taskId ? { ...item, completedAt } : item
    ),
    history: nextHistory,
    achievements: updateAchievements(
      state.achievements,
      nextPoints,
      nextCompletedTasks,
      completedAt
    ),
  };
};

const skipTasksWithDayOff = (
  state: MotivationState,
  usedAt: string,
  usedDayOff: "free" | "paid"
) => {
  const openTasks = state.activeTasks.filter(
    (item) => !item.completedAt && !item.skippedWithDayOffAt
  );

  if (openTasks.length === 0) {
    return state;
  }

  return {
    ...state,
    activeTasks: state.activeTasks.map((item) =>
      item.completedAt || item.skippedWithDayOffAt
        ? item
        : { ...item, skippedWithDayOffAt: usedAt }
    ),
    history: [
      ...openTasks.map<MotivationHistoryItem>((item) => ({
        taskId: item.id,
        title: item.title,
        pointsEarned: 0,
        completedAt: usedAt,
        skipped: true,
        usedDayOff,
      })),
      ...state.history,
    ].slice(0, 120),
  };
};

export const applyFreeDayState = (
  state: MotivationState,
  usedAt: string = new Date().toISOString()
) => ({
  ...skipTasksWithDayOff(state, usedAt, "free"),
  freeDayLastUsedAt: usedAt,
});

export const applyPaidDayState = (
  state: MotivationState,
  cost: number,
  usedAt: string = new Date().toISOString()
) => {
  const next = skipTasksWithDayOff(state, usedAt, "paid");
  const nextPoints = Math.max(next.points - cost, 0);

  return {
    ...next,
    points: nextPoints,
    level: calculateLevel(nextPoints),
    paidDayLastUsedAt: usedAt,
    paidDayLastUsedMonth: toMonthKey(usedAt),
    achievements: updateAchievements(
      next.achievements,
      nextPoints,
      next.completedTasks,
      usedAt
    ),
  };
};

export const resetMotivationState = (goal: Goal = "maintain") =>
  createDefaultMotivationState(goal);

const goalLabelByLanguage = {
  uk: {
    cut: "схуднення",
    maintain: "підтримка",
    bulk: "набір маси",
  },
  pl: {
    cut: "redukcja",
    maintain: "utrzymanie",
    bulk: "masa",
  },
  en: {
    cut: "fat loss",
    maintain: "maintenance",
    bulk: "muscle gain",
  },
} as const;

const getGoalLabel = (
  labels: (typeof goalLabelByLanguage)[AppLanguage],
  goal: Goal
) => {
  switch (goal) {
    case "cut":
      return labels.cut;
    case "bulk":
      return labels.bulk;
    case "maintain":
    default:
      return labels.maintain;
  }
};

const taskCopyByLanguage = {
  uk: {
    "check-in": {
      title: "Звіртесь із днем",
      description: "Відкрийте план і визначте, що сьогодні найважливіше.",
    },
    nutrition: (goal: Goal) => ({
      title: `Підтримайте мету: ${getGoalLabel(goalLabelByLanguage.uk, goal)}`,
      description: "Закрийте одну харчову дію, яка прямо підтримує вашу поточну мету.",
    }),
    reflection: {
      title: "Закрийте день короткою рефлексією",
      description: "Перегляньте прогрес і зафіксуйте одну маленьку правку на завтра.",
    },
  },
  pl: {
    "check-in": {
      title: "Zrób krótki check-in dnia",
      description: "Otwórz plan i zdecyduj, co dziś ma największe znaczenie.",
    },
    nutrition: (goal: Goal) => ({
      title: `Wesprzyj cel: ${getGoalLabel(goalLabelByLanguage.pl, goal)}`,
      description: "Domknij jedno działanie żywieniowe, które realnie wspiera obecny cel.",
    }),
    reflection: {
      title: "Zamknij dzień krótką refleksją",
      description: "Sprawdź progres i zapisz jedną małą korektę na jutro.",
    },
  },
  en: {
    "check-in": {
      title: "Check in with your day",
      description: "Open your plan and decide what matters most today.",
    },
    nutrition: (goal: Goal) => ({
      title: `Support your goal: ${getGoalLabel(goalLabelByLanguage.en, goal)}`,
      description: "Complete one nutrition action that directly supports your current goal.",
    }),
    reflection: {
      title: "Close the day with a short reflection",
      description: "Review progress and save one tiny adjustment for tomorrow.",
    },
  },
} as const;

const achievementCopyByLanguage = {
  uk: {
    firstStep: {
      title: "Перший крок",
      description: "Закрийте своє перше мотиваційне завдання.",
    },
    momentum: {
      title: "Імпульс",
      description: "Закрийте 5 мотиваційних завдань.",
    },
    century: {
      title: "Сотня",
      description: "Наберіть 100 балів.",
    },
    steadyRun: {
      title: "Стабільний ритм",
      description: "Закрийте 15 мотиваційних завдань.",
    },
  },
  pl: {
    firstStep: {
      title: "Pierwszy krok",
      description: "Zamknij swoje pierwsze zadanie motywacyjne.",
    },
    momentum: {
      title: "Momentum",
      description: "Zamknij 5 zadań motywacyjnych.",
    },
    century: {
      title: "Setka",
      description: "Zdobądź 100 punktów.",
    },
    steadyRun: {
      title: "Stabilny rytm",
      description: "Zamknij 15 zadań motywacyjnych.",
    },
  },
  en: {
    firstStep: {
      title: "First step",
      description: "Complete your first motivation task.",
    },
    momentum: {
      title: "Momentum",
      description: "Complete 5 motivation tasks.",
    },
    century: {
      title: "Century",
      description: "Earn 100 points.",
    },
    steadyRun: {
      title: "Steady rhythm",
      description: "Complete 15 motivation tasks.",
    },
  },
} as const;

type MotivationTaskCopyKey = "check-in" | "nutrition" | "reflection";

const getTaskCopyForLanguage = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return taskCopyByLanguage.pl;
    case "en":
      return taskCopyByLanguage.en;
    case "uk":
    default:
      return taskCopyByLanguage.uk;
  }
};

const getTaskCopy = ({
  language,
  taskKey,
  goal,
}: {
  language: AppLanguage;
  taskKey: MotivationTaskCopyKey;
  goal: Goal;
}) => {
  const copy = getTaskCopyForLanguage(language);

  switch (taskKey) {
    case "nutrition":
      return copy.nutrition(goal);
    case "reflection":
      return copy.reflection;
    case "check-in":
    default:
      return copy["check-in"];
  }
};

const getAchievementCopyForLanguage = (language: AppLanguage) => {
  switch (language) {
    case "pl":
      return achievementCopyByLanguage.pl;
    case "en":
      return achievementCopyByLanguage.en;
    case "uk":
    default:
      return achievementCopyByLanguage.uk;
  }
};

const getAchievementCopyById = ({
  language,
  achievementId,
}: {
  language: AppLanguage;
  achievementId: string;
}) => {
  const copy = getAchievementCopyForLanguage(language);

  switch (achievementId) {
    case FIRST_STEP_ACHIEVEMENT_ID:
      return copy.firstStep;
    case "momentum":
      return copy.momentum;
    case "century":
      return copy.century;
    case STEADY_RUN_ACHIEVEMENT_ID:
      return copy.steadyRun;
    default:
      return null;
  }
};

const resolveTaskKey = (taskId: string): MotivationTaskCopyKey | null => {
  if (taskId.endsWith("-check-in")) {
    return "check-in";
  }

  if (taskId.endsWith("-nutrition")) {
    return "nutrition";
  }

  if (taskId.endsWith("-reflection")) {
    return "reflection";
  }

  return null;
};

export const getLocalizedMotivationTaskCopy = ({
  language,
  taskId,
  goal,
  fallbackTitle,
  fallbackDescription = "",
}: {
  language: AppLanguage;
  taskId: string;
  goal: Goal;
  fallbackTitle: string;
  fallbackDescription?: string;
}) => {
  const taskKey = resolveTaskKey(taskId);

  if (!taskKey) {
    return {
      title: fallbackTitle,
      description: fallbackDescription,
    };
  }

  return getTaskCopy({ language, taskKey, goal });
};

export const getLocalizedAchievementCopy = ({
  language,
  achievementId,
  fallbackTitle,
  fallbackDescription = "",
}: {
  language: AppLanguage;
  achievementId: string;
  fallbackTitle: string;
  fallbackDescription?: string;
}) => {
  return getAchievementCopyById({ language, achievementId }) ?? {
    title: fallbackTitle,
    description: fallbackDescription,
  };
};
