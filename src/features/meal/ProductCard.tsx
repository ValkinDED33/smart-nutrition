import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addProduct } from "./mealSlice";
import type { AppDispatch } from "../../app/store";
import type { Product } from "../../shared/types/product";
import { useLanguage } from "../../shared/i18n/I18nProvider";

interface Props {
  product: Product;
}

export const ProductCard = ({ product }: Props) => {
  const [qty, setQty] = useState<number>(100);
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLanguage();

  const handleAdd = () => {
    if (qty <= 0) {
      alert(t("meal.invalidQuantity"));
      return;
    }

    dispatch(addProduct({ product, quantity: qty }));
    setQty(100);
  };

  const n = product.nutrients;

  return (
    <Card
      sx={{
        minWidth: 200,
        borderRadius: 5,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "none",
      }}
    >
      <CardContent>
        <Stack spacing={1.2}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {product.name}
          </Typography>

          <Typography>
            {n.calories.toFixed(0)} {t("common.kcal")} / {product.unit ?? "g"}
          </Typography>

          <Typography variant="body2">
            {t("dashboard.protein")}: {n.protein.toFixed(1)} {t("common.g")} /{" "}
            {t("dashboard.fat")}: {n.fat.toFixed(1)} {t("common.g")} /{" "}
            {t("dashboard.carbs")}: {n.carbs.toFixed(1)} {t("common.g")}
          </Typography>

          <TextField
            type="number"
            label={`${t("meal.quantity")} (${product.unit ?? "g"})`}
            value={qty}
            onChange={(e) => setQty(Math.max(0, Number(e.target.value)))}
            size="small"
          />

          <Button variant="contained" onClick={handleAdd} sx={{ alignSelf: "flex-start" }}>
            {t("meal.add")}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
