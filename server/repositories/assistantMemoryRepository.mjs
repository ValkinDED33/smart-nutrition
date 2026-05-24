import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_PERSONALITY = {
  warmth: 0.9,
  humor: 0.4,
  strictness: 0.2,
  motivation: 0.8,
};

const DEFAULT_MEMORY = {
  assistantName: "Diana",
  personality: DEFAULT_PERSONALITY,
  communicationStyle: "supportive",
  goals: [],
  struggles: [],
  habits: [],
  motivationTriggers: [],
  lastMood: null,
  recentProblems: [],
};

const isRecord = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toText = (value, fallback = "") => {
  const nextValue = String(value ?? "").trim().replace(/\s+/g, " ");
  return nextValue || fallback;
};

const toOptionalText = (value) => {
  const nextValue = toText(value);
  return nextValue || null;
};

const toLimitedList = (value, limit = 8) => {
  const items = Array.isArray(value) ? value : value ? [value] : [];

  return [
    ...new Set(
      items
        .map((item) => toText(item))
        .filter(Boolean)
        .slice(0, limit)
    ),
  ];
};

const mergeLimitedLists = (...sources) =>
  toLimitedList(sources.flatMap((source) => (Array.isArray(source) ? source : source ? [source] : [])));

const toScore = (value, fallback) => {
  const nextValue = Number(value);

  if (!Number.isFinite(nextValue)) {
    return fallback;
  }

  return Math.min(Math.max(Number(nextValue.toFixed(2)), 0), 1);
};

export const normalizeAssistantPersonality = (value = {}) => {
  const record = isRecord(value) ? value : {};

  return {
    warmth: toScore(record.warmth, DEFAULT_PERSONALITY.warmth),
    humor: toScore(record.humor, DEFAULT_PERSONALITY.humor),
    strictness: toScore(record.strictness, DEFAULT_PERSONALITY.strictness),
    motivation: toScore(record.motivation, DEFAULT_PERSONALITY.motivation),
  };
};

export const normalizeAssistantMemory = (value = {}, fallback = DEFAULT_MEMORY) => {
  const record = isRecord(value) ? value : {};

  return {
    userId: toText(record.userId, fallback.userId),
    assistantName: toText(record.assistantName, fallback.assistantName),
    personality: normalizeAssistantPersonality(
      isRecord(record.personality) ? record.personality : fallback.personality
    ),
    communicationStyle: toText(record.communicationStyle, fallback.communicationStyle),
    goals: toLimitedList(record.goals ?? fallback.goals),
    struggles: toLimitedList(record.struggles ?? fallback.struggles),
    habits: toLimitedList(record.habits ?? fallback.habits),
    motivationTriggers: toLimitedList(
      record.motivationTriggers ?? fallback.motivationTriggers
    ),
    lastMood: toOptionalText(record.lastMood ?? fallback.lastMood),
    recentProblems: toLimitedList(record.recentProblems ?? fallback.recentProblems),
    updatedAt: toOptionalText(record.updatedAt) ?? new Date().toISOString(),
  };
};

export const createAssistantMemoryRepository = async ({ dataDir }) => {
  const filePath = path.join(dataDir, "assistant-memory.json");

  const readIndex = async () => {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw);
      return isRecord(parsed) ? parsed : {};
    } catch (error) {
      if (error?.code === "ENOENT") {
        return {};
      }

      throw error;
    }
  };

  const writeIndex = async (index) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  };

  return {
    findByUserId: async (userId) => {
      const normalizedUserId = toText(userId);

      if (!normalizedUserId) {
        return null;
      }

      const index = await readIndex();
      const record = index[normalizedUserId];

      return record
        ? normalizeAssistantMemory(record, { ...DEFAULT_MEMORY, userId: normalizedUserId })
        : null;
    },

    upsert: async (memory) => {
      const normalized = normalizeAssistantMemory(memory, {
        ...DEFAULT_MEMORY,
        userId: toText(memory?.userId),
      });

      if (!normalized.userId) {
        return null;
      }

      const index = await readIndex();
      const previous = index[normalized.userId]
        ? normalizeAssistantMemory(index[normalized.userId], {
            ...DEFAULT_MEMORY,
            userId: normalized.userId,
          })
        : null;
      const nextMemory = normalizeAssistantMemory(
        {
          ...previous,
          ...normalized,
          personality: {
            ...(previous?.personality ?? DEFAULT_PERSONALITY),
            ...normalized.personality,
          },
          goals: mergeLimitedLists(previous?.goals, normalized.goals),
          struggles: mergeLimitedLists(previous?.struggles, normalized.struggles),
          habits: mergeLimitedLists(previous?.habits, normalized.habits),
          motivationTriggers: mergeLimitedLists(
            previous?.motivationTriggers,
            normalized.motivationTriggers
          ),
          recentProblems: mergeLimitedLists(
            previous?.recentProblems,
            normalized.recentProblems
          ),
          updatedAt: new Date().toISOString(),
        },
        {
          ...DEFAULT_MEMORY,
          userId: normalized.userId,
        }
      );

      index[normalized.userId] = nextMemory;
      await writeIndex(index);

      return nextMemory;
    },

    deleteByUserId: async (userId) => {
      const normalizedUserId = toText(userId);

      if (!normalizedUserId) {
        return false;
      }

      const index = await readIndex();

      if (!index[normalizedUserId]) {
        return false;
      }

      delete index[normalizedUserId];
      await writeIndex(index);

      return true;
    },
  };
};
