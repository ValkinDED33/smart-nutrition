import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addProduct } from "./mealSlice";
import type { AppDispatch } from "../../app/store";
import type { Product } from "../../shared/types/product";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";

interface Props {
  product: Product;
  mealType?: MealType;
  origin?: "manual" | "barcode" | "recipe";
}

export const ProductCard = ({
  product,
  mealType = "snack",
  origin = "manual",
}: Props) => {
  const [qty, setQty] = useState<number>(100);
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLanguage();

  const handleAdd = () => {
    if (qty <= 0) {
      alert(t("meal.invalidQuantity"));
      return;
    }

    dispatch(addProduct({ product, quantity: qty, mealType, origin }));
    setQty(100);
  };

  const nutrients = product.nutrients;

  return (
    <Card
      sx={{
        minWidth: 0,
        height: "100%",
        borderRadius: 5,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ height: "100%" }}>
        <Stack spacing={1.2} sx={{ height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {product.name}
          </Typography>

          <Typography>
            {nutrients.calories.toFixed(0)} {t("common.kcal")} / {product.unit ?? "g"}
          </Typography>

          <Typography variant="body2">
            {t("dashboard.protein")}: {nutrients.protein.toFixed(1)} {t("common.g")} /{" "}
            {t("dashboard.fat")}: {nutrients.fat.toFixed(1)} {t("common.g")} /{" "}
            {t("dashboard.carbs")}: {nutrients.carbs.toFixed(1)} {t("common.g")}
          </Typography>

          <TextField
            fullWidth
            size="small"
            type="number"
            label={`${t("meal.quantity")} (${product.unit ?? "g"})`}
            value={qty}
            onChange={(event) => setQty(Math.max(0, Number(event.target.value)))}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleAdd}
            sx={{ mt: "auto", alignSelf: "stretch" }}
          >
            {t("meal.add")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
