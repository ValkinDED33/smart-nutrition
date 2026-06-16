import { calculateMealTotalNutrients } from "../lib/domain.mjs";
import { readJsonBody, sendError, sendJson } from "../lib/http.mjs";

const createDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

const normalizeWaterGoal = (waterState) =>
  Math.min(
    Math.max(
      Math.round(Number(waterState?.dailyWaterGoal ?? waterState?.dailyTargetMl ?? 2000) || 2000),
      2000
    ),
    3000
  );

const normalizeWaterApiState = (waterState, dateKey = createDateKey()) => {
  const dailyWaterGoal = normalizeWaterGoal(waterState);
  const consumedMl =
    waterState?.lastLoggedOn === dateKey
      ? Math.max(Math.round(Number(waterState?.consumedMl ?? 0) || 0), 0)
      : 0;
  const history = Array.isArray(waterState?.history) ? waterState.history : [];
  const historyEntry = {
    date: dateKey,
    consumedMl,
    targetMl: dailyWaterGoal,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...waterState,
    dailyWaterGoal,
    consumedMl,
    lastLoggedOn: dateKey,
    history: [
      historyEntry,
      ...history.filter((entry) => entry?.date !== dateKey),
    ].slice(0, 30),
  };
};

const toWaterTodayResponse = (waterState) => {
  const dailyWaterGoal = normalizeWaterGoal(waterState);
  const consumedMl = Math.max(Math.round(Number(waterState?.consumedMl ?? 0) || 0), 0);

  return {
    date: waterState?.lastLoggedOn ?? createDateKey(),
    consumedMl,
    dailyWaterGoal,
    remainingMl: Math.max(dailyWaterGoal - consumedMl, 0),
    progress: dailyWaterGoal > 0 ? Math.min(consumedMl / dailyWaterGoal, 1) : 0,
    glassSizeMl: Math.max(Math.round(Number(waterState?.glassSizeMl ?? 250) || 250), 100),
  };
};

const getTodayMealEntries = (mealState, dateKey = createDateKey()) =>
  (Array.isArray(mealState?.items) ? mealState.items : []).filter((item) =>
    String(item?.eatenAt ?? "").startsWith(dateKey)
  );

const summarizeMealEntries = (entries) => ({
  items: entries,
  totalNutrients: calculateMealTotalNutrients(entries),
});

const normalizeMealEntriesPayload = (body) => {
  if (Array.isArray(body?.entries)) {
    return body.entries;
  }

  if (Array.isArray(body)) {
    return body;
  }

  return [body];
};

const getWeightHistory = (profileState) =>
  Array.isArray(profileState?.weightHistory) ? profileState.weightHistory : [];

export const createStateController = ({
  stateService,
  platformService,
  photoAnalysisService,
  bodyLimitBytes,
  getSyncContext,
  broadcastStateMeta,
}) => {
  const sendSavedMeta = async (response, user) => {
    await broadcastStateMeta(user);
    sendJson(response, 200, { ok: true, meta: await stateService.getSnapshotMeta(user) });
  };

  const getStatsSummary = async (user) => {
    const profileState = await stateService.getProfileState(user);
    const waterState = normalizeWaterApiState(await stateService.getWaterState(user));
    const mealState = await stateService.getMealState(user);
    const todayMeals = getTodayMealEntries(mealState);
    const mealSummary = summarizeMealEntries(todayMeals);
    const weightHistory = getWeightHistory(profileState);
    const latestWeight = weightHistory.at(-1)?.weight ?? user.weight ?? null;

    return {
      date: createDateKey(),
      calories: {
        consumed: Math.round(mealSummary.totalNutrients.calories ?? 0),
        goal: Math.round(Number(profileState?.dailyCalories ?? 0) || 0),
        remaining: Math.max(
          Math.round(Number(profileState?.dailyCalories ?? 0) || 0) -
            Math.round(mealSummary.totalNutrients.calories ?? 0),
          0
        ),
      },
      water: toWaterTodayResponse(waterState),
      meals: {
        count: todayMeals.length,
        totalNutrients: mealSummary.totalNutrients,
      },
      weight: {
        current: latestWeight,
        historyCount: weightHistory.length,
      },
    };
  };

  const getStatsTrends = async (user) => {
    const profileState = await stateService.getProfileState(user);
    const waterState = await stateService.getWaterState(user);
    const mealState = await stateService.getMealState(user);
    const mealCaloriesByDate = new Map();

    (Array.isArray(mealState?.items) ? mealState.items : []).forEach((entry) => {
      const date = String(entry?.eatenAt ?? "").slice(0, 10);

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return;
      }

      const calories = Number(entry?.product?.nutrients?.calories ?? 0) *
        (Number(entry?.quantity ?? 0) / 100);
      mealCaloriesByDate.set(date, (mealCaloriesByDate.get(date) ?? 0) + calories);
    });

    return {
      water: Array.isArray(waterState?.history) ? waterState.history : [],
      weight: getWeightHistory(profileState),
      calories: [...mealCaloriesByDate.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([date, calories]) => ({
          date,
          calories: Math.round(calories),
        })),
    };
  };

  return {
    getWaterToday: async ({ response, auth }) => {
      const waterState = normalizeWaterApiState(await stateService.getWaterState(auth.user));
      sendJson(response, 200, toWaterTodayResponse(waterState));
    },

    addWater: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      const amountMl = Math.max(
        Math.round(Number(body?.amountMl ?? body?.ml ?? body?.value ?? 250) || 250),
        0
      );
      const currentWaterState = normalizeWaterApiState(await stateService.getWaterState(auth.user));
      const nextWaterState = normalizeWaterApiState({
        ...currentWaterState,
        consumedMl: currentWaterState.consumedMl + amountMl,
      });

      await stateService.saveWaterState(auth.user, nextWaterState, getSyncContext(request));
      await broadcastStateMeta(auth.user);
      sendJson(response, 201, toWaterTodayResponse(nextWaterState));
    },

    getWaterHistory: async ({ response, auth }) => {
      const waterState = normalizeWaterApiState(await stateService.getWaterState(auth.user));
      sendJson(response, 200, { items: waterState.history });
    },

    getTodayMeals: async ({ response, auth }) => {
      const mealState = await stateService.getMealState(auth.user);
      sendJson(response, 200, summarizeMealEntries(getTodayMealEntries(mealState)));
    },

    addMeals: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.addMealEntries(
        auth.user,
        { entries: normalizeMealEntriesPayload(body) },
        getSyncContext(request)
      );
      await broadcastStateMeta(auth.user);
      sendJson(
        response,
        201,
        summarizeMealEntries(getTodayMealEntries(await stateService.getMealState(auth.user)))
      );
    },

    searchProducts: async ({ response, auth, url }) => {
      sendJson(response, 200, {
        items: await platformService.listVisibleCatalogProducts(auth.user, {
          status: url.searchParams.get("status"),
          search: url.searchParams.get("q") ?? url.searchParams.get("search") ?? "",
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
    },

    getWeightHistory: async ({ response, auth }) => {
      sendJson(response, 200, {
        items: getWeightHistory(await stateService.getProfileState(auth.user)),
      });
    },

    addWeight: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      const weight = Number(body?.weight);

      if (!Number.isFinite(weight) || weight <= 0) {
        sendError(response, 400, "INVALID_WEIGHT", "Weight must be a positive number.");
        return;
      }

      const profileState = await stateService.getProfileState(auth.user);
      const nextEntry = {
        date:
          typeof body?.date === "string" && body.date.trim()
            ? body.date.trim()
            : new Date().toISOString(),
        weight,
      };
      const nextProfileState = {
        ...profileState,
        weightHistory: [...getWeightHistory(profileState), nextEntry].slice(-180),
      };

      await stateService.saveProfileState(auth.user, nextProfileState, getSyncContext(request));
      await broadcastStateMeta(auth.user);
      sendJson(response, 201, nextEntry);
    },

    getStatsSummary: async ({ response, auth }) => {
      sendJson(response, 200, await getStatsSummary(auth.user));
    },

    getStatsTrends: async ({ response, auth }) => {
      sendJson(response, 200, await getStatsTrends(auth.user));
    },

    getAccess: ({ response, auth }) => {
      sendJson(response, 200, platformService.getAccessOverview(auth.user));
    },

    getSnapshot: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getSnapshot(auth.user));
    },

    getSnapshotMeta: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getSnapshotMeta(auth.user));
    },

    saveSnapshot: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.saveSnapshot(auth.user, body, getSyncContext(request));
      await sendSavedMeta(response, auth.user);
    },

    getProfileState: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getProfileState(auth.user));
    },

    saveProfileState: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.saveProfileState(auth.user, body, getSyncContext(request));
      await sendSavedMeta(response, auth.user);
    },

    getMealState: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getMealState(auth.user));
    },

    saveMealState: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.saveMealState(auth.user, body, getSyncContext(request));
      await sendSavedMeta(response, auth.user);
    },

    getWaterState: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getWaterState(auth.user));
    },

    saveWaterState: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.saveWaterState(auth.user, body, getSyncContext(request));
      await sendSavedMeta(response, auth.user);
    },

    getFridgeState: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getFridgeState(auth.user));
    },

    saveFridgeState: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.saveFridgeState(auth.user, body, getSyncContext(request));
      await sendSavedMeta(response, auth.user);
    },

    getCommunityState: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getCommunityState(auth.user));
    },

    saveCommunityState: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.saveCommunityState(auth.user, body, getSyncContext(request));
      await sendSavedMeta(response, auth.user);
    },

    getCompanionState: async ({ response, auth }) => {
      sendJson(response, 200, await stateService.getCompanionState(auth.user));
    },

    saveCompanionState: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.saveCompanionState(auth.user, body, getSyncContext(request));
      await sendSavedMeta(response, auth.user);
    },

    addMealEntries: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.addMealEntries(auth.user, body, getSyncContext(request));
      await broadcastStateMeta(auth.user);
      sendJson(response, 201, { ok: true, meta: await stateService.getSnapshotMeta(auth.user) });
    },

    deleteMealEntry: async ({ request, response, auth, params }) => {
      await stateService.removeMealEntry(
        auth.user,
        decodeURIComponent(params.entryId),
        getSyncContext(request)
      );
      await sendSavedMeta(response, auth.user);
    },

    addMealTemplate: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.addMealTemplate(auth.user, body, getSyncContext(request));
      await broadcastStateMeta(auth.user);
      sendJson(response, 201, { ok: true, meta: await stateService.getSnapshotMeta(auth.user) });
    },

    deleteMealTemplate: async ({ request, response, auth, params }) => {
      await stateService.deleteMealTemplate(
        auth.user,
        decodeURIComponent(params.templateId),
        getSyncContext(request)
      );
      await sendSavedMeta(response, auth.user);
    },

    upsertMealProduct: async ({ request, response, auth, params }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      await stateService.upsertMealProduct(
        auth.user,
        params.bucket,
        body,
        getSyncContext(request)
      );
      await sendSavedMeta(response, auth.user);
    },

    removeMealProduct: async ({ request, response, auth, params }) => {
      await stateService.removeMealProduct(
        auth.user,
        params.bucket,
        decodeURIComponent(params.productKey),
        getSyncContext(request)
      );
      await sendSavedMeta(response, auth.user);
    },

    analyzePhoto: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      sendJson(
        response,
        200,
        await photoAnalysisService.analyzePhoto(
          await stateService.getProfileState(auth.user),
          body
        )
      );
    },

    listFoods: async ({ response, auth, url }) => {
      sendJson(response, 200, {
        items: await platformService.listVisibleCatalogProducts(auth.user, {
          status: url.searchParams.get("status"),
          search: url.searchParams.get("search") ?? "",
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
    },

    listOwnFoodSubmissions: async ({ response, auth, url }) => {
      sendJson(response, 200, {
        items: await platformService.listOwnCatalogProducts(auth.user, {
          status: url.searchParams.get("status"),
          search: url.searchParams.get("search") ?? "",
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
    },

    findFoodDuplicates: async ({ response, auth, url }) => {
      sendJson(response, 200, {
        items: await platformService.findCatalogDuplicates(auth.user, {
          name: url.searchParams.get("name") ?? "",
          barcode: url.searchParams.get("barcode") ?? "",
          limit: url.searchParams.get("limit") ?? undefined,
        }),
      });
    },

    submitFoodSubmission: async ({ request, response, auth }) => {
      const body = await readJsonBody(request, bodyLimitBytes);
      sendJson(response, 201, await platformService.submitCatalogProduct(auth.user, body));
    },
  };
};
