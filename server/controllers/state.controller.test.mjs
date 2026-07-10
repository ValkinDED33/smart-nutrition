import { Readable } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { createStateController } from "./state.controller.mjs";

class MemoryResponse {
  statusCode = 200;
  headers = {};
  body = "";

  writeHead(statusCode, headers = {}) {
    this.statusCode = statusCode;
    this.headers = { ...this.headers, ...headers };
  }

  end(body = "") {
    this.body = String(body);
  }
}

const createJsonRequest = (body) => {
  const request = Readable.from([Buffer.from(JSON.stringify(body))]);
  request.headers = { "content-type": "application/json" };
  return request;
};

const createMealState = () => ({
  items: [
    {
      id: "entry-server-1",
      product: { id: "product-1", name: "Server oatmeal" },
      quantity: 120,
    },
  ],
  templates: [],
  savedProducts: [{ id: "saved-server-1", name: "Server yogurt" }],
  recentProducts: [],
  personalBarcodeProducts: [],
  totalNutrients: { calories: 180 },
});

const createStateService = (mealState) => ({
  addMealEntries: vi.fn(async () => undefined),
  upsertMealProduct: vi.fn(async () => undefined),
  getMealState: vi.fn(async () => mealState),
  getSnapshotMeta: vi.fn(async () => ({
    updatedAt: "2026-07-10T10:00:00.000Z",
    mealUpdatedAt: "2026-07-10T10:00:00.000Z",
  })),
});

const createController = (stateService) =>
  createStateController({
    stateService,
    platformService: {},
    photoAnalysisService: {},
    bodyLimitBytes: 1024,
    getSyncContext: () => ({ source: "test" }),
    broadcastStateMeta: vi.fn(async () => undefined),
  });

describe("state controller meal mutation contracts", () => {
  it("returns the canonical backend meal state after adding meal entries", async () => {
    const mealState = createMealState();
    const stateService = createStateService(mealState);
    const response = new MemoryResponse();

    await createController(stateService).addMealEntries({
      request: createJsonRequest({
        entries: [{ product: { id: "product-1", name: "Oatmeal" }, quantity: 100 }],
      }),
      response,
      auth: { user: { id: "user-1" } },
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({
      ok: true,
      meal: mealState,
      meta: {
        updatedAt: "2026-07-10T10:00:00.000Z",
        mealUpdatedAt: "2026-07-10T10:00:00.000Z",
      },
    });
    expect(stateService.addMealEntries).toHaveBeenCalledWith(
      { id: "user-1" },
      { entries: [{ product: { id: "product-1", name: "Oatmeal" }, quantity: 100 }] },
      { source: "test" }
    );
  });

  it("returns the canonical backend meal state after saving a meal product", async () => {
    const mealState = createMealState();
    const stateService = createStateService(mealState);
    const response = new MemoryResponse();

    await createController(stateService).upsertMealProduct({
      request: createJsonRequest({ id: "product-1", name: "Yogurt" }),
      response,
      auth: { user: { id: "user-1" } },
      params: { bucket: "saved" },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      ok: true,
      meal: mealState,
      meta: {
        updatedAt: "2026-07-10T10:00:00.000Z",
        mealUpdatedAt: "2026-07-10T10:00:00.000Z",
      },
    });
    expect(stateService.upsertMealProduct).toHaveBeenCalledWith(
      { id: "user-1" },
      "saved",
      { id: "product-1", name: "Yogurt" },
      { source: "test" }
    );
  });
});
