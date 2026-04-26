export const createStateRepository = (storage) => ({
  getSnapshotByUserId: (userId, user) => storage.getSnapshotByUserId(userId, user),
  getSnapshotMetaByUserId: (userId) => storage.getSnapshotMetaByUserId(userId),
  upsertSnapshot: (userId, snapshot, syncContext) =>
    storage.upsertSnapshot(userId, snapshot, syncContext),
  getProfileStateByUserId: (userId, user) => storage.getProfileStateByUserId(userId, user),
  upsertProfileState: (userId, profileState, syncContext) =>
    storage.upsertProfileState(userId, profileState, syncContext),
  getMealStateByUserId: (userId) => storage.getMealStateByUserId(userId),
  upsertMealState: (userId, mealState, syncContext) =>
    storage.upsertMealState(userId, mealState, syncContext),
  getWaterStateByUserId: (userId) => storage.getWaterStateByUserId(userId),
  upsertWaterState: (userId, waterState, syncContext) =>
    storage.upsertWaterState(userId, waterState, syncContext),
  getFridgeStateByUserId: (userId) => storage.getFridgeStateByUserId(userId),
  upsertFridgeState: (userId, fridgeState, syncContext) =>
    storage.upsertFridgeState(userId, fridgeState, syncContext),
  getCommunityStateByUserId: (userId) => storage.getCommunityStateByUserId(userId),
  upsertCommunityState: (userId, communityState, syncContext) =>
    storage.upsertCommunityState(userId, communityState, syncContext),
  addMealEntries: (userId, entries, syncContext) =>
    storage.addMealEntries(userId, entries, syncContext),
  removeMealEntry: (userId, entryId, syncContext) =>
    storage.removeMealEntry(userId, entryId, syncContext),
  addMealTemplate: (userId, template, syncContext) =>
    storage.addMealTemplate(userId, template, syncContext),
  deleteMealTemplate: (userId, templateId, syncContext) =>
    storage.deleteMealTemplate(userId, templateId, syncContext),
  upsertMealProduct: (userId, bucketType, product, syncContext) =>
    storage.upsertMealProduct(userId, bucketType, product, syncContext),
  removeMealProduct: (userId, bucketType, productKey, syncContext) =>
    storage.removeMealProduct(userId, bucketType, productKey, syncContext),
});
