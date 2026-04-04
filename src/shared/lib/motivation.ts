import type {
  AchievementProgress,
  AssistantCustomization,
  MotivationHistoryItem,
  MotivationState,
  MotivationTask,
} from "../types/profile";
import type { Goal } from "../types/user";

const DAY_MS = 1000 * 60 * 60 * 24;

const toDateKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
};

const toMonthKey = (value: string | Date) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 7);
};

export const createDefaultAssistantCustomization = (): AssistantCustomization => ({
  name: "Nova",
  role: "assistant",
  tone: "gentle",
  humorEnabled: true,
});

export const createDefaultAchievements = (): AchievementProgress[] => [
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
