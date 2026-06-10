import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addProduct } from "./mealSlice";
import { selectFavoriteProductIds } from "./selectors";
import { searchProducts } from "../../shared/api/products";
import type { MealType } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import type { AppDispatch, RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "@domain/products/productDisplay";
import { productMatchesPreferences } from "@domain/user/preferences";
import {
  formatProductPortion,
  getProductPortionPresets,
} from "@domain/products/productPortions";

interface Props {
  mealType: MealType;
}

interface ComposerRow {
  id: string;
  product: Product | null;
  productQuery: string;
  quantity: number | "";
}

const createRow = (product: Product | null = null): ComposerRow => ({
  id:
    globalThis.crypto?.randomUUID?.() ??
    `composer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  product,
  productQuery: "",
  quantity: 100,
});

export const QuickMealComposer = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { appLanguage, t } = useLanguage();
  const favorites = useSelector(selectFavoriteProductIds);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const [activeSearchText, setActiveSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const productsQuery = useQuery({
    queryKey: ["composer-products", debouncedSearchText],
    queryFn: () => searchProducts(debouncedSearchText),
  });
  const availableProducts = useMemo(
    () =>
      (productsQuery.data ?? []).filter((product) =>
        productMatchesPreferences(product, preferences)
      ),
    [preferences, productsQuery.data]
  );
  const [rows, setRows] = useState<ComposerRow[]>([
    createRow(),
    { ...createRow(), quantity: 80 },
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchText(activeSearchText.trim());
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [activeSearchText]);

  const totals = rows.reduce(
    (accumulator, row) => {
      const product = row.product;
      if (!product) return accumulator;

      const quantity = typeof row.quantity === "string" ? 0 : row.quantity;
      const factor = quantity / 100;
      accumulator.calories += product.nutrients.calories * factor;
      accumulator.protein += product.nutrients.protein * factor;
      accumulator.fat += product.nutrients.fat * factor;
      accumulator.carbs += product.nutrients.carbs * factor;
      return accumulator;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  const updateRow = (id: string, patch: Partial<ComposerRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const removeRow = (id: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== id));
  };

  const addRow = () => {
    setRows((currentRows) => [...currentRows, createRow()]);
  };

  const handleSaveMeal = () => {
    rows.forEach((row) => {
      const product = row.product;
      const quantity = typeof row.quantity === "string" ? 0 : row.quantity;
      if (!product || quantity <= 0) return;

      dispatch(
        addProduct({
          product,
          quantity,
          mealType,
          origin: "manual",
        })
      );
    });

    setRows([
      {
        ...createRow(),
      },
    ]);
  };

  const hasValidMealRows = rows.some(
    (row) => row.product && typeof row.quantity === "number" && row.quantity > 0
  );

  const getProductLabel = (product: Product) => {
    const name = getProductDisplayName(product, appLanguage);
    const brand = product.brand?.trim();

    return brand && !name.toLowerCase().includes(brand.toLowerCase())
      ? `${brand} ${name}`
      : name;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("composer.title")}
        </Typography>
        <Typography color="text.secondary">{t("composer.subtitle")}</Typography>

        {rows.map((row, index) => {
          const selectedProduct = row.product;
          const portionPresets = getProductPortionPresets(selectedProduct?.unit ?? "g");

          return (
            <Stack
              key={row.id}
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Autocomplete
                fullWidth
                autoHighlight
                loading={productsQuery.isFetching}
                options={availableProducts}
                value={selectedProduct}
                inputValue={row.productQuery}
                filterOptions={(options) => options}
                getOptionLabel={(product) => getProductLabel(product)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onInputChange={(_, value, reason) => {
                  updateRow(row.id, {
                    productQuery: value,
                    product:
                      reason === "clear" || reason === "input" || value.trim() === ""
                        ? null
                        : row.product,
                  });
                  setActiveSearchText(value);
                }}
                onChange={(_, product) => {
                  updateRow(row.id, {
                    product,
                    productQuery: product ? getProductLabel(product) : "",
                  });
                }}
                renderOption={(props, product) => {
                  const isFavorited = favorites.has(
                    product.barcode?.trim() ||
                    `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`
                  );

                  return (
                    <li {...props} key={product.barcode?.trim() || product.id}>
                      {isFavorited ? "⭐ " : ""}
                      {getProductLabel(product)}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t("composer.ingredient")} ${index + 1}`}
                    placeholder={t("productSearch.placeholder")}
                    autoComplete="off"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {productsQuery.isFetching ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <TextField
                type="number"
                label={t("composer.quantity")}
                value={row.quantity}
                onChange={(event) => {
                  const value = event.target.value;
                  updateRow(row.id, {
                    quantity: value === "" ? "" : Math.max(0, Number(value)),
                  });
                }}
                sx={{ minWidth: { md: 140 } }}
              />

              <Stack
                direction="row"
                spacing={0.75}
                useFlexGap
                flexWrap="wrap"
                sx={{ minWidth: { md: 220 } }}
              >
                {portionPresets.map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    variant={row.quantity === preset ? "contained" : "outlined"}
                    onClick={() => updateRow(row.id, { quantity: preset })}
                    sx={{ minWidth: 48 }}
                  >
                    {formatProductPortion(preset, selectedProduct?.unit ?? "g")}
                  </Button>
                ))}
              </Stack>

              <Button
                color="error"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                sx={{ alignSelf: { xs: "flex-end", md: "center" } }}
              >
                {t("composer.remove")}
              </Button>
            </Stack>
          );
        })}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="outlined" onClick={addRow}>
            {t("composer.addRow")}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveMeal}
            disabled={!hasValidMealRows}
          >
            {t("composer.saveMeal")}
          </Button>
        </Stack>

        <Typography color="text.secondary">
          {t("composer.summary")}: {totals.calories.toFixed(0)} {t("common.kcal")} - P{" "}
          {totals.protein.toFixed(1)} {t("common.g")} - F {totals.fat.toFixed(1)}{" "}
          {t("common.g")} - C {totals.carbs.toFixed(1)} {t("common.g")}
        </Typography>
      </Stack>
    </Paper>
  );
};
