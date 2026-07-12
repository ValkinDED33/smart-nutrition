import { describe, expect, it, vi } from "vitest";
import { createStateService } from "./stateService.mjs";

const createStateRepositoryFixture = () => ({
  getSnapshotByUserId: vi.fn(),
  getSnapshotMetaByUserId: vi.fn(),
  upsertSnapshot: vi.fn(),
  getProfileStateByUserId: vi.fn(),
  upsertProfileState: vi.fn(),
  getMealStateByUserId: vi.fn(),
  upsertMealState: vi.fn(),
  getWaterStateByUserId: vi.fn(),
  upsertWaterState: vi.fn(),
  getFridgeStateByUserId: vi.fn(),
  upsertFridgeState: vi.fn(),
  getCommunityStateByUserId: vi.fn(),
  upsertCommunityState: vi.fn(),
  getCompanionStateByUserId: vi.fn(),
  upsertCompanionState: vi.fn(),
  addMealEntries: vi.fn(),
  removeMealEntry: vi.fn(),
  addMealTemplate: vi.fn(),
  deleteMealTemplate: vi.fn(),
  upsertMealProduct: vi.fn(),
  removeMealProduct: vi.fn(),
});

const createProduct = (overrides = {}) => ({
  id: "product-yogurt",
  name: "Greek yogurt",
  unit: "g",
  source: "Manual",
  status: "personal",
  barcode: "590123",
  nutrients: {
    calories: 92,
    protein: 10,
    fat: 2,
    carbs: 4,
  },
  ...overrides,
});

const createMealState = (entries = [], savedProducts = []) => ({
  items: entries,
  templates: [],
  totalNutrients: {},
  savedProducts,
  recentProducts: entries.map((entry) => entry.product),
  personalBarcodeProducts: entries.map((entry) => entry.product).filter((product) => product.barcode),
});

describe("stateService", () => {
  it("persists water, fridge, community, and companion when saving a full snapshot", async () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });
    const user = { id: "user-1" };
    const snapshot = {
      profile: { dailyCalories: 2100 },
      meal: { items: [] },
      water: { consumedMl: 1250, dailyWaterGoal: 2300 },
      fridge: { items: [{ id: "fridge-1" }] },
      community: { score: 180, posts: [{ id: "post-1" }] },
      companion: { level: 2, xp: 130, coins: 12, achievements: [] },
    };

    await service.saveSnapshot(user, snapshot);

    expect(stateRepository.upsertSnapshot).toHaveBeenCalledTimes(1);
    expect(stateRepository.upsertSnapshot).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        profile: snapshot.profile,
        meal: snapshot.meal,
        water: snapshot.water,
        fridge: snapshot.fridge,
        community: snapshot.community,
        companion: snapshot.companion,
      }),
      undefined
    );
  });

  it("rejects incomplete full snapshots instead of normalizing them into empty state", async () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });

    await expect(
      service.saveSnapshot(
        { id: "user-1" },
        {
          profile: { dailyCalories: 2100 },
          meal: { items: [] },
          water: { consumedMl: 0 },
          fridge: { items: [] },
          community: { score: 0 },
        }
      )
    ).rejects.toThrow(/Companion state payload is required/);
    expect(stateRepository.upsertSnapshot).not.toHaveBeenCalled();
  });

  it("rejects invalid granular profile and meal payloads", async () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });
    const user = { id: "user-1" };

    await expect(service.saveProfileState(user, null)).rejects.toThrow(/Profile state/);
    await expect(service.saveMealState(user, [])).rejects.toThrow(/Meal state/);
    await expect(service.saveCompanionState(user, null)).rejects.toThrow(/Companion state/);
    expect(stateRepository.upsertProfileState).not.toHaveBeenCalled();
    expect(stateRepository.upsertMealState).not.toHaveBeenCalled();
    expect(stateRepository.upsertCompanionState).not.toHaveBeenCalled();
  });

  it("adds product intake through one canonical backend-confirmed result", async () => {
    const product = createProduct();
    const stateRepository = createStateRepositoryFixture();
    const entries = [];
    stateRepository.addMealEntries.mockImplementation(async (_userId, nextEntries) => {
      nextEntries.forEach((entry) => {
        if (!entries.some((item) => item.id === entry.id)) {
          entries.unshift(entry);
        }
      });
      return createMealState(entries);
    });
    stateRepository.getMealStateByUserId.mockImplementation(async () => createMealState(entries));
    const service = createStateService({ stateRepository });

    const result = await service.addProductIntake(
      { id: "user-1" },
      {
        source: "barcode",
        product,
        quantity: 150,
        mealType: "lunch",
        idempotencyKey: "scan-1",
        options: { saveToLibrary: false },
      }
    );

    expect(result.ok).toBe(true);
    expect(result.entry).toMatchObject({
      id: "meal-intake-scan-1",
      quantity: 150,
      mealType: "lunch",
      product: expect.objectContaining({ id: product.id }),
    });
    expect(result.entry.product).toMatchObject({
      status: "personal",
    });
    expect(result.meal.items).toHaveLength(1);
    expect(result.outcomes).toMatchObject({
      mealAdded: true,
      librarySaved: false,
      catalogAccepted: false,
      catalogFailedRetryable: false,
    });
  });

  it("keeps meal success explicit when catalog submission fails", async () => {
    const product = createProduct();
    const stateRepository = createStateRepositoryFixture();
    const entries = [];
    const savedProducts = [];
    stateRepository.addMealEntries.mockImplementation(async (_userId, nextEntries) => {
      entries.unshift(...nextEntries);
      return createMealState(entries, savedProducts);
    });
    stateRepository.upsertMealProduct.mockImplementation(async (_userId, _bucket, nextProduct) => {
      savedProducts.unshift(nextProduct);
      return createMealState(entries, savedProducts);
    });
    stateRepository.getMealStateByUserId.mockImplementation(async () =>
      createMealState(entries, savedProducts)
    );
    const service = createStateService({ stateRepository });

    const result = await service.addProductIntake(
      { id: "user-1" },
      {
        source: "manual",
        product,
        quantity: 100,
        mealType: "snack",
        idempotencyKey: "manual-1",
        options: { saveToLibrary: true, submitToCatalog: true },
      },
      {
        submitCatalog: vi.fn(async () => {
          throw new Error("Catalog unavailable");
        }),
      }
    );

    expect(result.outcomes).toMatchObject({
      mealAdded: true,
      librarySaved: true,
      catalogAccepted: false,
      catalogFailedRetryable: true,
    });
    expect(result.catalog).toMatchObject({
      requested: true,
      failed: true,
      retryable: true,
      message: "Catalog unavailable",
    });
  });

  it("rejects product intake when provider resolution finds nothing", async () => {
    const stateRepository = createStateRepositoryFixture();
    const service = createStateService({ stateRepository });

    await expect(
      service.addProductIntake(
        { id: "user-1" },
        {
          source: "barcode",
          barcode: "590123",
          quantity: 100,
          mealType: "snack",
          idempotencyKey: "missing-1",
        },
        {
          resolveProduct: vi.fn(async () => null),
        }
      )
    ).rejects.toMatchObject({ code: "PRODUCT_NOT_FOUND" });
    expect(stateRepository.addMealEntries).not.toHaveBeenCalled();
  });

  it("uses the same entry id for idempotent retries", async () => {
    const product = createProduct();
    const stateRepository = createStateRepositoryFixture();
    const entries = [];
    stateRepository.addMealEntries.mockImplementation(async (_userId, nextEntries) => {
      nextEntries.forEach((entry) => {
        if (!entries.some((item) => item.id === entry.id)) {
          entries.unshift(entry);
        }
      });
      return createMealState(entries);
    });
    stateRepository.getMealStateByUserId.mockImplementation(async () => createMealState(entries));
    const service = createStateService({ stateRepository });
    const request = {
      source: "search",
      product,
      quantity: 100,
      mealType: "dinner",
      idempotencyKey: "retry-key",
    };

    await service.addProductIntake({ id: "user-1" }, request);
    const retry = await service.addProductIntake({ id: "user-1" }, request);

    expect(retry.meal.items).toHaveLength(1);
    expect(retry.meal.items[0].id).toBe("meal-intake-retry-key");
  });

  it("does not use stale client meal state to build the confirmed meal response", async () => {
    const product = createProduct();
    const serverEntry = {
      id: "server-existing",
      product: createProduct({ id: "server-product", name: "Server product" }),
      quantity: 50,
      mealType: "breakfast",
      eatenAt: "2026-07-04T08:00:00.000Z",
      origin: "manual",
    };
    const stateRepository = createStateRepositoryFixture();
    const entries = [serverEntry];
    stateRepository.addMealEntries.mockImplementation(async (_userId, nextEntries) => {
      entries.unshift(...nextEntries);
      return createMealState(entries);
    });
    stateRepository.getMealStateByUserId.mockImplementation(async () => createMealState(entries));
    const service = createStateService({ stateRepository });

    const result = await service.addProductIntake(
      { id: "user-1" },
      {
        source: "manual",
        product,
        quantity: 100,
        mealType: "snack",
        idempotencyKey: "canonical-only",
        meal: { items: [] },
      }
    );

    expect(result.meal.items.map((item) => item.id)).toEqual([
      "meal-intake-canonical-only",
      "server-existing",
    ]);
  });
});
