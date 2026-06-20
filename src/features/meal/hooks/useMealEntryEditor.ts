import { useCallback, useEffect, useMemo, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../app/store";
import { searchProducts } from "../../../shared/api/products";
import { productMatchesPreferences } from "@domain/user/preferences";
import {
  getProductPortionPresets,
} from "@domain/products/productPortions";
import type { MealEntry, MealType } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import { removeProduct, updateMealEntry } from "../mealSlice";
import { selectRecentProducts, selectSavedProducts } from "../selectors";
import { uniqueProductsByIdentity } from "../productIdentity";

const selectProductPreferences = (state: RootState) => ({
  dietStyle: state.profile.dietStyle,
  allergies: state.profile.allergies,
  excludedIngredients: state.profile.excludedIngredients,
  adaptiveMode: state.profile.adaptiveMode,
});

export const useMealEntryEditor = (entry: MealEntry) => {
  const dispatch = useDispatch<AppDispatch>();
  const savedProducts = useSelector(selectSavedProducts);
  const recentProducts = useSelector(selectRecentProducts);
  const preferences = useSelector(selectProductPreferences, shallowEqual);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number | "">(entry.quantity);
  const [mealType, setMealType] = useState<MealType>(entry.mealType);
  const [selectedProduct, setSelectedProduct] = useState<Product>(entry.product);
  const normalizedSearchQuery = searchQuery.trim();

  useEffect(() => {
    if (!open || !normalizedSearchQuery) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const nextResults = await searchProducts(normalizedSearchQuery);

        if (!cancelled) {
          setSearchResults(nextResults);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedSearchQuery, open]);

  const resetDraft = useCallback(() => {
    setQuantity(entry.quantity);
    setMealType(entry.mealType);
    setSelectedProduct(entry.product);
    setSearchQuery("");
    setSearchResults([]);
  }, [entry]);

  const openEditor = useCallback(() => {
    resetDraft();
    setOpen(true);
  }, [resetDraft]);

  const closeEditor = useCallback(() => {
    setOpen(false);
  }, []);

  const updateQuantityInput = useCallback((value: string) => {
    const parsedValue = Number(value);
    setQuantity(
      value === "" || !Number.isFinite(parsedValue)
        ? ""
        : Math.max(1, parsedValue)
    );
  }, []);

  const candidateProducts = useMemo(() => {
    const searchableResults = normalizedSearchQuery ? searchResults : [];

    return uniqueProductsByIdentity([
      entry.product,
      ...recentProducts,
      ...savedProducts,
      ...searchableResults,
    ])
      .filter((product) => productMatchesPreferences(product, preferences))
      .slice(0, 8);
  }, [
    entry.product,
    normalizedSearchQuery,
    preferences,
    recentProducts,
    savedProducts,
    searchResults,
  ]);

  const saveEditor = useCallback(() => {
    if (typeof quantity !== "number" || quantity <= 0) {
      return;
    }

    dispatch(
      updateMealEntry({
        id: entry.id,
        product: selectedProduct,
        quantity,
        mealType,
      })
    );
    setOpen(false);
  }, [dispatch, entry.id, mealType, quantity, selectedProduct]);

  const removeEntry = useCallback(() => {
    dispatch(removeProduct(entry.id));
  }, [dispatch, entry.id]);

  return {
    candidateProducts,
    closeEditor,
    entryCalories: (entry.product.nutrients.calories * entry.quantity) / 100,
    mealType,
    open,
    openEditor,
    portionPresets: getProductPortionPresets(selectedProduct.unit),
    quantity,
    removeEntry,
    saveEditor,
    searchQuery,
    selectedProduct,
    setMealType,
    setQuantity,
    setSearchQuery,
    setSelectedProduct,
    updateQuantityInput,
  };
};
