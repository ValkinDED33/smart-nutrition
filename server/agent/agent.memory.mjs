const toList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const appendUnique = (items, value, limit = 8) => [
  ...new Set(
    [...toList(items), ...toList(value)]
      .map((item) => String(item ?? "").trim())
      .filter(Boolean)
  ),
].slice(-limit);

export const buildAgentMemoryPatch = ({ user, intent, toolResult }) => {
  if (!toolResult?.ok) {
    return {
      userId: user?.id,
      recentProblems: [`assistant_agent_${intent.intent}_failed`],
    };
  }

  if (toolResult.type === "water_added") {
    return {
      userId: user?.id,
      habits: ["logs water through assistant"],
      motivationTriggers: ["instant hydration feedback"],
      lastMood: "engaged",
    };
  }

  if (toolResult.type === "medication_reminder_created") {
    return {
      userId: user?.id,
      habits: ["uses medication reminders"],
      motivationTriggers: ["timely health reminders"],
      lastMood: "focused",
    };
  }

  if (toolResult.type === "meal_added") {
    return {
      userId: user?.id,
      habits: ["logs meals through assistant"],
      motivationTriggers: ["instant meal feedback"],
      lastMood: "engaged",
    };
  }

  if (toolResult.type === "product_search") {
    return {
      userId: user?.id,
      habits: ["asks assistant to search foods"],
      lastMood: "curious",
    };
  }

  if (toolResult.type === "day_status" || toolResult.type === "nutrition_status") {
    return {
      userId: user?.id,
      habits: ["asks assistant for nutrition status"],
      lastMood: "curious",
    };
  }

  if (toolResult.type === "water_status") {
    return {
      userId: user?.id,
      habits: ["checks hydration status"],
      lastMood: "curious",
    };
  }

  return {
    userId: user?.id,
    habits: [],
  };
};

export const mergeAgentMemoryPatch = (previousMemory = {}, patch = {}) => ({
  ...previousMemory,
  ...patch,
  goals: appendUnique(previousMemory.goals, patch.goals).filter(Boolean),
  struggles: appendUnique(previousMemory.struggles, patch.struggles).filter(Boolean),
  habits: appendUnique(previousMemory.habits, patch.habits).filter(Boolean),
  motivationTriggers: appendUnique(
    previousMemory.motivationTriggers,
    patch.motivationTriggers
  ).filter(Boolean),
  recentProblems: appendUnique(
    previousMemory.recentProblems,
    patch.recentProblems
  ).filter(Boolean),
});
