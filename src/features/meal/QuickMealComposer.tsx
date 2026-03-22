import { useState } from "react";
import { useDispatch } from "react-redux";
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
import type { AppDispatch } from "../../app/store";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "../../shared/lib/productDisplay";

interface Props {
  mealType: MealType;
}

interface ComposerRow {
  id: string;
  productId: string;
  quantity: number;
}

const createRow = (): ComposerRow => ({
  id:
    globalThis.crypto?.randomUUID?.() ??
    `composer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  productId: mockProducts[0]?.id ?? "",
  quantity: 100,
});

const copy = {
  uk: {
    title: "Швидкий конструктор страви",
    subtitle:
      "Додай одразу кілька інгредієнтів: сир, м'ясо, помідор, яйце або будь-яку іншу комбінацію.",
    ingredient: "Інгредієнт",
    quantity: "Кількість",
    addRow: "Додати інгредієнт",
    saveMeal: "Записати прийом їжі",
    summary: "Разом",
    kcal: "ккал",
    remove: "Видалити",
  },
  pl: {
    title: "Szybki kreator posiłku",
    subtitle:
      "Dodaj od razu kilka składników: ser, mięso, pomidor, jajko albo dowolną inną kombinację.",
    ingredient: "Składnik",
    quantity: "Ilość",
    addRow: "Dodaj składnik",
    saveMeal: "Zapisz posiłek",
    summary: "Razem",
    kcal: "kcal",
    remove: "Usuń",
  },
} as const;

export const QuickMealComposer = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { language } = useLanguage();
  const text = copy[language];
  const [rows, setRows] = useState<ComposerRow[]>([
    createRow(),
    { ...createRow(), productId: mockProducts[1]?.id ?? "", quantity: 80 },
  ]);

  const totals = rows.reduce(
    (accumulator, row) => {
      const product = mockProducts.find((item) => item.id === row.productId);
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
    setRows((currentRows) => [...currentRows, createRow()]);
  };

  const handleSaveMeal = () => {
    rows.forEach((row) => {
      const product = mockProducts.find((item) => item.id === row.productId);
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

    setRows([createRow()]);
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
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.subtitle}</Typography>

        {rows.map((row, index) => (
          <Stack
            key={row.id}
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              select
              fullWidth
              label={`${text.ingredient} ${index + 1}`}
              value={row.productId}
              onChange={(event) =>
                updateRow(row.id, { productId: event.target.value })
              }
            >
              {mockProducts.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {getProductDisplayName(product, language)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label={text.quantity}
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
              {text.remove}
            </Button>
          </Stack>
        ))}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="outlined" onClick={addRow}>
            {text.addRow}
          </Button>
          <Button variant="contained" onClick={handleSaveMeal}>
            {text.saveMeal}
          </Button>
        </Stack>

        <Typography color="text.secondary">
          {text.summary}: {totals.calories.toFixed(0)} {text.kcal} - P{" "}
          {totals.protein.toFixed(1)} g - F {totals.fat.toFixed(1)} g - C{" "}
          {totals.carbs.toFixed(1)} g
        </Typography>
      </Stack>
    </Paper>
  );
};
