import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addProduct } from "./mealSlice";
import { mockProducts } from "../../shared/lib/mockProducts";
import type { MealType } from "../../shared/types/meal";
import type { AppDispatch, RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import { productMatchesPreferences } from "../../shared/lib/preferences";

interface Props {
  mealType: MealType;
}

interface ComposerRow {
  id: string;
  productId: string;
  quantity: number;
}

const createRow = (productId = mockProducts[0]?.id ?? ""): ComposerRow => ({
  id:
    globalThis.crypto?.randomUUID?.() ??
    `composer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  productId,
  quantity: 100,
});

export const QuickMealComposer = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { language, t } = useLanguage();
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const availableProducts = mockProducts.filter((product) =>
    productMatchesPreferences(product, preferences)
  );
  const [rows, setRows] = useState<ComposerRow[]>([
    createRow(availableProducts[0]?.id ?? ""),
    { ...createRow(availableProducts[1]?.id ?? availableProducts[0]?.id ?? ""), quantity: 80 },
  ]);

  const normalizedRows = useMemo(
    () =>
      rows.map((row, index) => {
        if (availableProducts.some((product) => product.id === row.productId)) {
          return row;
        }

        return {
          ...row,
          productId: availableProducts[index]?.id ?? availableProducts[0]?.id ?? "",
        };
      }),
    [availableProducts, rows]
  );

  const totals = normalizedRows.reduce(
    (accumulator, row) => {
      const product = availableProducts.find((item) => item.id === row.productId);
      if (!product) return accumulator;

      const factor = row.quantity / 100;
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
    setRows((currentRows) => [...currentRows, createRow(availableProducts[0]?.id ?? "")]);
  };

  const handleSaveMeal = () => {
    normalizedRows.forEach((row) => {
      const product = availableProducts.find((item) => item.id === row.productId);
      if (!product || row.quantity <= 0) return;

      dispatch(
        addProduct({
          product,
          quantity: row.quantity,
          mealType,
          origin: "manual",
        })
      );
    });

    setRows([
      {
        ...createRow(),
        productId: availableProducts[0]?.id ?? "",
      },
    ]);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 5,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("composer.title")}
        </Typography>
        <Typography color="text.secondary">{t("composer.subtitle")}</Typography>

        {normalizedRows.map((row, index) => (
          <Stack
            key={row.id}
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              select
              fullWidth
              label={`${t("composer.ingredient")} ${index + 1}`}
              value={row.productId}
              onChange={(event) =>
                updateRow(row.id, { productId: event.target.value })
              }
            >
              {availableProducts.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {getProductDisplayName(product, language)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label={t("composer.quantity")}
              value={row.quantity}
              onChange={(event) =>
                updateRow(row.id, {
                  quantity: Math.max(0, Number(event.target.value)),
                })
              }
              sx={{ minWidth: { md: 160 } }}
            />

            <Button
              color="error"
              onClick={() => removeRow(row.id)}
              disabled={rows.length === 1}
              sx={{ alignSelf: { xs: "flex-end", md: "center" } }}
            >
              {t("composer.remove")}
            </Button>
          </Stack>
        ))}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="outlined" onClick={addRow}>
            {t("composer.addRow")}
          </Button>
          <Button variant="contained" onClick={handleSaveMeal}>
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
