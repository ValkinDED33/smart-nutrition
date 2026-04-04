import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addProduct, removeSavedProduct, saveProduct } from "./mealSlice";
import { selectSavedProducts } from "./selectors";
import type { AppDispatch, RootState } from "../../app/store";
import type { Product } from "../../shared/types/product";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import { getProductArtwork } from "../../shared/lib/productArtwork";
import { ProductNutritionFacts } from "./ProductNutritionFacts";

interface Props {
  product: Product;
  mealType?: MealType;
  origin?: "manual" | "barcode" | "recipe";
  allowSave?: boolean;
}

const getProductKey = (product: Product) =>
  product.barcode?.trim() ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

export const ProductCard = ({
  product,
  mealType = "snack",
  origin = "manual",
  allowSave = true,
}: Props) => {
  const [qty, setQty] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const savedProducts = useSelector((state: RootState) => selectSavedProducts(state));
  const { t, language } = useLanguage();
  const displayName = getProductDisplayName(product, language);
  const savedKey = getProductKey(product);
  const isSaved = savedProducts.some((item) => getProductKey(item) === savedKey);

  const handleAdd = () => {
    const quantity = Number(qty);

    if (!qty || Number.isNaN(quantity) || quantity <= 0) {
      alert(t("meal.invalidQuantity"));
      return;
    }

    dispatch(addProduct({ product, quantity, mealType, origin }));
    setQty("");
  };

  const handleToggleSave = () => {
    if (isSaved) {
      dispatch(removeSavedProduct(savedKey));
      return;
    }

    dispatch(saveProduct(product));
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
      <Box
        component="img"
        src={getProductArtwork(product)}
        alt={displayName}
        sx={{
          display: "block",
          width: "100%",
          height: 168,
          objectFit: "cover",
          backgroundColor: "rgba(15, 23, 42, 0.06)",
        }}
      />
      <CardContent sx={{ height: "100%" }}>
        <Stack spacing={1.2} sx={{ height: "100%" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {displayName}
          </Typography>

          {(product.brand || product.source) && (
            <Typography variant="body2" color="text.secondary">
              {[product.brand, product.source].filter(Boolean).join(" / ")}
            </Typography>
          )}

          <Typography>
            {nutrients.calories.toFixed(0)} {t("common.kcal")} / {product.unit}
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
            label={`${t("meal.quantity")} (${product.unit})`}
            placeholder="100"
            value={qty}
            onFocus={(event) => event.target.select()}
            onChange={(event) => setQty(event.target.value)}
            inputProps={{ min: 1, step: product.unit === "piece" ? 1 : 0.1 }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: "auto" }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleAdd}
              sx={{ alignSelf: "stretch" }}
            >
              {t("meal.add")}
            </Button>
            {allowSave && (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleToggleSave}
                sx={{ alignSelf: "stretch" }}
              >
                {isSaved ? t("productCard.remove") : t("productCard.save")}
              </Button>
            )}
          </Stack>

          <Button
            variant="text"
            onClick={() => setDetailsOpen((current) => !current)}
            sx={{ alignSelf: "flex-start", px: 0.5 }}
          >
            {detailsOpen ? t("productCard.hide") : t("productCard.details")}
          </Button>

          <Collapse in={detailsOpen} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1.5 }} />
            <ProductNutritionFacts product={product} />
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
};
