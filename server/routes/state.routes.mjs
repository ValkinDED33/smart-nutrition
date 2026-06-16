const matchPath = (pattern) => (pathname) => {
  const match = pathname.match(pattern);

  if (!match) {
    return null;
  }

  return match.groups ?? {};
};

export const createStateRoutes = ({ stateController } = {}) =>
  stateController
    ? [
        { method: "GET", pathname: "/api/water/today", handler: stateController.getWaterToday },
        { method: "POST", pathname: "/api/water", handler: stateController.addWater },
        { method: "GET", pathname: "/api/water/history", handler: stateController.getWaterHistory },
        { method: "GET", pathname: "/api/meals/today", handler: stateController.getTodayMeals },
        { method: "POST", pathname: "/api/meals", handler: stateController.addMeals },
        { method: "GET", pathname: "/api/products/search", handler: stateController.searchProducts },
        { method: "GET", pathname: "/api/weight/history", handler: stateController.getWeightHistory },
        { method: "POST", pathname: "/api/weight", handler: stateController.addWeight },
        { method: "GET", pathname: "/api/stats/summary", handler: stateController.getStatsSummary },
        { method: "GET", pathname: "/api/stats/trends", handler: stateController.getStatsTrends },
        { method: "GET", pathname: "/api/access", handler: stateController.getAccess },
        { method: "GET", pathname: "/api/state", handler: stateController.getSnapshot },
        { method: "PUT", pathname: "/api/state", handler: stateController.saveSnapshot },
        { method: "GET", pathname: "/api/state/meta", handler: stateController.getSnapshotMeta },
        { method: "GET", pathname: "/api/profile-state", handler: stateController.getProfileState },
        { method: "PUT", pathname: "/api/profile-state", handler: stateController.saveProfileState },
        { method: "GET", pathname: "/api/meal-state", handler: stateController.getMealState },
        { method: "PUT", pathname: "/api/meal-state", handler: stateController.saveMealState },
        { method: "GET", pathname: "/api/water-state", handler: stateController.getWaterState },
        { method: "PUT", pathname: "/api/water-state", handler: stateController.saveWaterState },
        { method: "GET", pathname: "/api/fridge-state", handler: stateController.getFridgeState },
        { method: "PUT", pathname: "/api/fridge-state", handler: stateController.saveFridgeState },
        { method: "GET", pathname: "/api/community-state", handler: stateController.getCommunityState },
        { method: "PUT", pathname: "/api/community-state", handler: stateController.saveCommunityState },
        { method: "GET", pathname: "/api/companion-state", handler: stateController.getCompanionState },
        { method: "PUT", pathname: "/api/companion-state", handler: stateController.saveCompanionState },
        { method: "POST", pathname: "/api/meal-entries", handler: stateController.addMealEntries },
        {
          method: "DELETE",
          match: matchPath(/^\/api\/meal-entries\/(?<entryId>[^/]+)$/),
          handler: stateController.deleteMealEntry,
        },
        { method: "POST", pathname: "/api/meal-templates", handler: stateController.addMealTemplate },
        {
          method: "DELETE",
          match: matchPath(/^\/api\/meal-templates\/(?<templateId>[^/]+)$/),
          handler: stateController.deleteMealTemplate,
        },
        {
          method: "POST",
          match: matchPath(/^\/api\/meal-products\/(?<bucket>saved|recent)$/),
          handler: stateController.upsertMealProduct,
        },
        {
          method: "DELETE",
          match: matchPath(/^\/api\/meal-products\/(?<bucket>saved|recent)\/(?<productKey>[^/]+)$/),
          handler: stateController.removeMealProduct,
        },
        { method: "POST", pathname: "/api/photo-analysis", handler: stateController.analyzePhoto },
        { method: "GET", pathname: "/api/foods", handler: stateController.listFoods },
        { method: "GET", pathname: "/api/foods/submissions", handler: stateController.listOwnFoodSubmissions },
        { method: "POST", pathname: "/api/foods/submissions", handler: stateController.submitFoodSubmission },
        { method: "GET", pathname: "/api/foods/duplicates", handler: stateController.findFoodDuplicates },
      ]
    : [];
