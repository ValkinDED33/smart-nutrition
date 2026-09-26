import assistantWorkerToolsData from "./assistantWorkerTools.json" with {
  type: "json",
};

const supportedLanguages = new Set(["uk", "pl", "en"]);

const normalizeLanguage = (language) => {
  const normalized = String(language ?? "").trim().toLowerCase();
  return supportedLanguages.has(normalized) ? normalized : "uk";
};

export const assistantWorkerTools = Object.freeze(
  assistantWorkerToolsData.map((tool) =>
    Object.freeze({
      ...tool,
      areas: Object.freeze([...(Array.isArray(tool.areas) ? tool.areas : [])]),
      duties: Object.freeze([...(Array.isArray(tool.duties) ? tool.duties : [])]),
      shortLabel: Object.freeze({ ...(tool.shortLabel ?? {}) }),
      title: Object.freeze({ ...(tool.title ?? {}) }),
      description: Object.freeze({ ...(tool.description ?? {}) }),
    })
  )
);

export const getAssistantWorkerToolText = (tool, language, field = "title") => {
  const normalizedLanguage = normalizeLanguage(language);
  const value = tool?.[field]?.[normalizedLanguage] ?? tool?.[field]?.uk ?? tool?.[field]?.en;
  return String(value ?? "").trim();
};

export const buildAssistantWorkerToolLines = (language = "uk") =>
  assistantWorkerTools.map((tool) => {
    const title = getAssistantWorkerToolText(tool, language, "title");
    const description = getAssistantWorkerToolText(tool, language, "description");

    return `• ${title} — ${description}.`;
  });
