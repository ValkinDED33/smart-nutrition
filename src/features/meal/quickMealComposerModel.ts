import type { Product } from "@domain/products/types";
import type { MealEntry, MealType } from "@domain/meal/types";

export interface QuickMealComposerRow {
  id: string;
  product: Product | null;
  productQuery: string;
  quantity: number | "";
}

export type QuickMealSaveState =
  | { status: "idle" }
  | { status: "saving"; entries: MealEntry[] }
  | { status: "saved"; entryCount: number }
  | { status: "failed"; message: string; entries: MealEntry[] };

export interface QuickMealSaveNotice {
  severity: "success" | "warning" | "info";
  text: string;
  retryable?: boolean;
}

const createComposerRowId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `composer-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const createQuickMealComposerRow = (
  product: Product | null = null,
  id = createComposerRowId()
): QuickMealComposerRow => ({
  id,
  product,
  productQuery: product?.name ?? "",
  quantity: "",
});

export const hasValidComposerMealRows = (rows: QuickMealComposerRow[]) =>
  rows.some((row) => row.product && typeof row.quantity === "number" && row.quantity > 0);

export const createInitialQuickMealSaveState = (): QuickMealSaveState => ({
  status: "idle",
});

export const buildQuickMealEntryDrafts = (
  rows: QuickMealComposerRow[],
  mealType: MealType,
  createEntry: (input: {
    product: Product;
    quantity: number;
    mealType: MealType;
    origin: MealEntry["origin"];
  }) => MealEntry
): MealEntry[] =>
  rows
    .map((row) => {
      const quantity = typeof row.quantity === "string" ? 0 : row.quantity;

      if (!row.product || quantity <= 0) {
        return null;
      }

      return createEntry({
        product: row.product,
        quantity,
        mealType,
        origin: "manual",
      });
    })
    .filter((entry): entry is MealEntry => entry !== null);

export const resolveQuickMealSaveNotice = (
  state: QuickMealSaveState,
  copy: {
    saving: string;
    saved: string;
    failed: string;
    retry: string;
  }
): QuickMealSaveNotice | null => {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "saving") {
    return {
      severity: "info",
      text: copy.saving,
    };
  }

  if (state.status === "saved") {
    return {
      severity: "success",
      text: copy.saved.replace("{count}", String(state.entryCount)),
    };
  }

  return {
    severity: "warning",
    text: `${copy.failed} ${copy.retry}`,
    retryable: true,
  };
};
