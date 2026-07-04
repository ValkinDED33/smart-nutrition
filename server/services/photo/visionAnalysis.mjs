const maxVisionResponseLength = 16_000;
const maxVisionTimeoutMs = 18_000;

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);

const normalizeVisionText = (value, { fallback = "" } = {}) => {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text ? text.slice(0, 240) : fallback;
};

const normalizeNutritionPer100g = (value) => ({
  calories: clamp(value?.calories, 0, 900),
  protein: clamp(value?.protein, 0, 100),
  fat: clamp(value?.fat, 0, 100),
  carbs: clamp(value?.carbs, 0, 100),
});

const toPortionRangeGrams = (quantityGrams) => {
  const quantity = Math.max(Math.round(Number(quantityGrams) || 100), 5);
  const min = Math.max(Math.round((quantity * 0.75) / 5) * 5, 5);
  const max = Math.max(Math.round((quantity * 1.25) / 5) * 5, min + 5);

  return { min, max };
};

const normalizeVisionSuggestion = (item, index = 0) => {
  const name = normalizeVisionText(item?.name, { fallback: `Visible item ${index + 1}` });
  const minRaw = Number(item?.portionRangeGrams?.min ?? item?.quantityGrams);
  const maxRaw = Number(item?.portionRangeGrams?.max ?? item?.quantityGrams);
  const fallbackQuantity = Number.isFinite(maxRaw)
    ? maxRaw
    : Number.isFinite(minRaw)
      ? minRaw
      : 100;
  const portionRangeGrams = toPortionRangeGrams(fallbackQuantity);
  const min = Number.isFinite(minRaw)
    ? Math.max(Math.round(minRaw / 5) * 5, 5)
    : portionRangeGrams.min;
  const max = Number.isFinite(maxRaw)
    ? Math.max(Math.round(maxRaw / 5) * 5, min + 5)
    : portionRangeGrams.max;

  return {
    name,
    originalName: name,
    quantityGrams: Math.round((min + max) / 2),
    portionRangeGrams: { min, max },
    confidence: clamp(item?.confidence, 0.05, 0.86),
    reason: normalizeVisionText(item?.reason, {
      fallback: "Visible candidate from AI photo analysis; user confirmation required.",
    }),
    uncertain: Boolean(item?.uncertain ?? Number(item?.confidence) < 0.7),
    estimatedNutritionPer100g: normalizeNutritionPer100g(item?.estimatedNutritionPer100g),
  };
};

const createVisionInterpretation = (interpretation, index = 0) => {
  const items = Array.isArray(interpretation?.items) ? interpretation.items : [];

  return {
    id:
      normalizeVisionText(interpretation?.id, { fallback: `vision-${index + 1}` })
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64) || `vision-${index + 1}`,
    title: normalizeVisionText(interpretation?.title, {
      fallback: `Photo interpretation ${index + 1}`,
    }),
    confidence: clamp(interpretation?.confidence, 0.05, 0.86),
    reason: normalizeVisionText(interpretation?.reason, {
      fallback: "AI vision candidate; user confirmation required.",
    }),
    items: items.slice(0, 5).map((item, itemIndex) => normalizeVisionSuggestion(item, itemIndex)),
  };
};

const extractJsonObject = (value) => {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start < 0 || end <= start) {
    return null;
  }

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
};

const extractProviderText = (payload) => {
  if (typeof payload?.choices?.[0]?.message?.content === "string") {
    return payload.choices[0].message.content;
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }

  const parts = payload?.candidates?.[0]?.content?.parts;

  if (Array.isArray(parts)) {
    return parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("\n")
      .trim();
  }

  return "";
};

const getGoogleNativeGenerateContentUrl = (provider) => {
  const assistantUrl = new URL(provider.baseUrl);
  let apiPrefix = assistantUrl.pathname.replace(/\/+$/, "");

  if (apiPrefix.endsWith("/openai")) {
    apiPrefix = apiPrefix.slice(0, -"/openai".length);
  }

  if (apiPrefix.endsWith("/models")) {
    apiPrefix = apiPrefix.slice(0, -"/models".length);
  }

  return `${assistantUrl.origin}${apiPrefix}/models/${encodeURIComponent(
    provider.model
  )}:generateContent`;
};

const selectVisionProvider = (config) => {
  const providers = Array.isArray(config?.assistantProviders) ? config.assistantProviders : [];
  return (
    providers.find((provider) => provider.id === "google") ??
    providers.find((provider) => provider.id === "openrouter") ??
    providers.find((provider) => provider.id === "openai") ??
    providers.find((provider) => provider.id === "custom") ??
    null
  );
};

const buildVisionPrompt = ({ mealType, dietStyle, blockedTokens }) => `
You are Smart Nutrition photo meal analyzer. Return ONLY valid JSON.

Safety and honesty rules:
- Identify only visible food. Do not invent hidden ingredients.
- Put uncertain or hidden ingredients in uncertainIngredients and hiddenIngredientQuestions.
- Portion estimates must be ranges in grams, never exact grams unless a package label is visible.
- Give top 3 possible meal interpretations.
- Confidence is honest from 0 to 1. Never use 0.99/99.9 style certainty.
- If confidence is below 0.70, user confirmation is required.
- If confidence is below 0.35, output suggestions only, not finalized products.
- Mention sauces, oils, fillings, toppings, drinks, and sides as questions if not visible.
- Avoid blocked ingredients if visible alternatives exist: ${blockedTokens.join(", ") || "none"}.

Context:
- mealType: ${mealType}
- dietStyle: ${dietStyle}

JSON schema:
{
  "dishName": "short visible dish name or photo meal",
  "summary": "AI estimate, please confirm...",
  "confidence": 0.42,
  "uncertainIngredients": ["possible sauce"],
  "hiddenIngredientQuestions": ["Is there oil or sauce not visible?"],
  "interpretations": [
    {
      "id": "candidate-1",
      "title": "Chicken rice bowl",
      "confidence": 0.52,
      "reason": "visible rice and sliced protein",
      "items": [
        {
          "name": "Rice cooked",
          "portionRangeGrams": { "min": 120, "max": 200 },
          "confidence": 0.6,
          "reason": "visible white grain base",
          "uncertain": false,
          "estimatedNutritionPer100g": { "calories": 130, "protein": 2.7, "fat": 0.3, "carbs": 28 }
        }
      ]
    }
  ]
}
`;

const callGoogleVisionProvider = async ({ provider, prompt, normalizedPhoto, signal }) => {
  const response = await fetch(getGoogleNativeGenerateContentUrl(provider), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-goog-api-key": provider.apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: normalizedPhoto.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1_800,
        responseMimeType: "application/json",
      },
    }),
    signal,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`VISION_PROVIDER_FAILED_${response.status}`);
  }

  return extractProviderText(payload);
};

const callOpenAiCompatibleVisionProvider = async ({ provider, prompt, normalizedPhoto, signal }) => {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
  };

  if (provider.id === "openrouter") {
    if (provider.httpReferer) {
      headers["HTTP-Referer"] = provider.httpReferer;
    }

    if (provider.title) {
      headers["X-Title"] = provider.title;
    }
  }

  const response = await fetch(`${provider.baseUrl}${provider.apiPath}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.1,
      max_tokens: 1_800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You return strict JSON for Smart Nutrition photo meal analysis. Never claim certainty. User confirmation is mandatory.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${normalizedPhoto.base64}`,
              },
            },
          ],
        },
      ],
    }),
    signal,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`VISION_PROVIDER_FAILED_${response.status}`);
  }

  return extractProviderText(payload);
};

export const normalizeVisionAnalysis = (payload) => {
  const interpretations = (Array.isArray(payload?.interpretations) ? payload.interpretations : [])
    .map(createVisionInterpretation)
    .filter((interpretation) => interpretation.items.length > 0)
    .slice(0, 3);

  if (interpretations.length === 0) {
    return null;
  }

  const confidence = clamp(
    payload?.confidence ?? Math.max(...interpretations.map((item) => item.confidence)),
    0.05,
    0.86
  );
  const items = interpretations[0].items;
  const summary = normalizeVisionText(payload?.summary, {
    fallback: "Visible food candidates were detected from the photo.",
  });

  return {
    dishName: normalizeVisionText(payload?.dishName, {
      fallback: interpretations[0].title || "Photo meal estimate",
    }),
    summary: /^AI estimate, please confirm/i.test(summary)
      ? summary
      : `AI estimate, please confirm. ${summary}`,
    confidence,
    estimatedPortions: 1,
    cautions: [
      "AI estimate, please confirm before saving.",
      "Portions are ranges; exact grams are not visible from the photo alone.",
      "Hidden sauces, oils, fillings, and drinks must be added manually.",
    ],
    uncertainIngredients: Array.isArray(payload?.uncertainIngredients)
      ? payload.uncertainIngredients.map((item) => normalizeVisionText(item)).filter(Boolean)
      : items.filter((item) => item.uncertain).map((item) => item.name),
    hiddenIngredientQuestions: Array.isArray(payload?.hiddenIngredientQuestions)
      ? payload.hiddenIngredientQuestions.map((item) => normalizeVisionText(item)).filter(Boolean)
      : [
          "Are there sauces, oil, butter, cheese, or dressing not clearly visible?",
          "Is anything inside a wrap, sandwich, bowl, or covered part of the meal?",
        ],
    interpretations,
    manualReviewRequired: true,
    items,
  };
};

export const tryAnalyzeWithVisionProvider = async ({
  config,
  normalizedPhoto,
  mealType,
  dietStyle,
  blockedTokens,
}) => {
  const provider = selectVisionProvider(config);

  if (!provider) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    Math.min(Number(provider.timeoutMs) || maxVisionTimeoutMs, maxVisionTimeoutMs)
  );

  try {
    const prompt = buildVisionPrompt({ mealType, dietStyle, blockedTokens });
    const text =
      provider.id === "google"
        ? await callGoogleVisionProvider({
            provider,
            prompt,
            normalizedPhoto,
            signal: controller.signal,
          })
        : await callOpenAiCompatibleVisionProvider({
            provider,
            prompt,
            normalizedPhoto,
            signal: controller.signal,
          });
    const payload = extractJsonObject(text.slice(0, maxVisionResponseLength));
    return normalizeVisionAnalysis(payload);
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};
