import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import hotToast from "react-hot-toast";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addProduct, removeSavedProduct, saveProduct } from "./mealSlice";
import { selectSavedProducts } from "./selectors";
import type { AppDispatch, RootState } from "../../app/store";
import type { Product } from "@domain/products/types";
import type { MealType } from "@domain/meal/types";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "@domain/products/productDisplay";
import { getProductArtwork } from "@domain/products/productArtwork";
import { ProductNutritionFacts } from "./ProductNutritionFacts";
import {
  getProductCategoryKey,
  getProductCategoryLabel,
} from "@domain/products/productCategory";
import {
  formatProductPortion,
  getProductPortionPresets,
} from "@domain/products/productPortions";

interface Props {
  product: Product;
  mealType?: MealType;
  origin?: "manual" | "barcode" | "recipe";
  allowSave?: boolean;
  compact?: boolean;
}

const getProductKey = (product: Product) =>
  product.barcode?.trim() ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

export const ProductCard = ({
  product,
  mealType = "snack",
  origin = "manual",
  allowSave = true,
  compact = false,
}: Props) => {
  const [qty, setQty] = useState("");
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const savedProducts = useSelector((state: RootState) => selectSavedProducts(state));
  const { t, appLanguage } = useLanguage();
  const displayName = getProductDisplayName(product, appLanguage);
  const categoryKey = getProductCategoryKey(product);
  const categoryLabel = getProductCategoryLabel(categoryKey, appLanguage);
  const portionPresets = getProductPortionPresets(product.unit);
  const savedKey = getProductKey(product);
  const isSaved = savedProducts.some((item) => getProductKey(item) === savedKey);

  const handleAddQuantity = (quantity: number, clearInput = true) => {
    if (Number.isNaN(quantity) || quantity <= 0) {
      setQuantityError(t("meal.invalidQuantity"));
      return;
    }

    dispatch(addProduct({ product, quantity, mealType, origin }));
    hotToast.success(`${displayName}: +${formatProductPortion(quantity, product.unit)}`);
    setQuantityError(null);

    if (clearInput) {
      setQty("");
    }
  };

  const handleAdd = () => {
    if (!qty.trim()) {
      setQuantityError(t("meal.invalidQuantity"));
      return;
    }

    handleAddQuantity(Number(qty));
  };

  const handleToggleSave = () => {
    if (isSaved) {
      dispatch(removeSavedProduct(savedKey));
      hotToast.success(t("productCard.remove"));
      return;
    }

    dispatch(saveProduct(product));
    hotToast.success(t("productCard.save"));
  };

  const nutrients = product.nutrients;
  const parsedQuantity = Number(qty);
  const trackedQuantity =
    !Number.isNaN(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 100;
  const quantityFactor = trackedQuantity / 100;
  const estimatedCalories = nutrients.calories * quantityFactor;
  const estimatedProtein = nutrients.protein * quantityFactor;
  const estimatedFat = nutrients.fat * quantityFactor;
  const estimatedCarbs = nutrients.carbs * quantityFactor;

  return (
    <Card
      sx={{
        minWidth: 0,
        height: "auto",
        alignSelf: "start",
        overflow: "hidden",
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        boxShadow: "none",
        "& .MuiButton-root": {
          minWidth: 0,
        },
      }}
    >
      <Box
        component="img"
        src={getProductArtwork(product)}
        alt={displayName}
        sx={{
          display: "block",
          width: "100%",
          height: compact ? { xs: 84, sm: 98, md: 108 } : { xs: 132, sm: 142, md: 148 },
          objectFit: "cover",
          backgroundColor: "rgba(15, 23, 42, 0.06)",
        }}
      />
      <CardContent sx={{ p: { xs: compact ? 1.1 : 1.35, md: compact ? 1.25 : 1.6 } }}>
        <Stack spacing={compact ? 0.8 : 1.05}>
          <Stack direction="row" spacing={0.5} alignItems="flex-start" justifyContent="space-between">
            <Typography
              component="h3"
              variant="subtitle1"
              sx={{
                fontWeight: 900,
                lineHeight: 1.2,
                overflowWrap: "anywhere",
                fontSize: compact ? { xs: 15, md: 16 } : undefined,
              }}
            >
              {displayName}
            </Typography>
            {isSaved && <Typography sx={{ fontSize: "1.2rem" }}>⭐</Typography>}
          </Stack>

          <Chip
            label={categoryLabel}
            size="small"
            sx={{ alignSelf: "flex-start", fontWeight: 700 }}
          />

          {(product.brand || product.source) && (
            <Typography variant="body2" color="text.secondary">
              {[product.brand, product.source].filter(Boolean).join(" / ")}
            </Typography>
          )}

          <Typography variant={compact ? "body2" : "body1"}>
            {nutrients.calories.toFixed(0)} {t("common.kcal")} / {product.unit}
          </Typography>

          <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
            <Chip
              label={`P ${nutrients.protein.toFixed(1)} ${t("common.g")}`}
              size="small"
            />
            <Chip label={`F ${nutrients.fat.toFixed(1)} ${t("common.g")}`} size="small" />
            <Chip label={`C ${nutrients.carbs.toFixed(1)} ${t("common.g")}`} size="small" />
          </Stack>

          <TextField
            fullWidth
            size="small"
            type="number"
            label={`${t("meal.quantity")} (${product.unit})`}
            placeholder="100"
            value={qty}
            error={Boolean(quantityError)}
            helperText={quantityError}
            onFocus={(event) => event.target.select()}
            onChange={(event) => {
              setQty(event.target.value);
              setQuantityError(null);
            }}
            slotProps={{
              htmlInput: {
                inputMode: "decimal",
                min: 1,
                step: product.unit === "piece" ? 1 : 0.1,
              },
            }}
          />

          <Stack spacing={0.8}>
            {!compact ? (
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t("productCard.quickPortions")}
              </Typography>
            ) : null}
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {portionPresets.map((preset) => (
                <Button
                  key={preset}
                  size="small"
                  variant={parsedQuantity === preset ? "contained" : "outlined"}
                  onClick={() => {
                    setQty(String(preset));
                    setQuantityError(null);
                  }}
                  sx={{ minWidth: 54, px: 1 }}
                >
                  {formatProductPortion(preset, product.unit)}
                </Button>
              ))}
            </Stack>
          </Stack>

          <Box
            sx={{
              p: 1.2,
              borderRadius: 1,
              backgroundColor: "rgba(248,250,252,0.92)",
              border: "1px solid rgba(15, 23, 42, 0.06)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {trackedQuantity} {product.unit}: {estimatedCalories.toFixed(0)} {t("common.kcal")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("dashboard.protein")}: {estimatedProtein.toFixed(1)} {t("common.g")} /{" "}
              {t("dashboard.fat")}: {estimatedFat.toFixed(1)} {t("common.g")} /{" "}
              {t("dashboard.carbs")}: {estimatedCarbs.toFixed(1)} {t("common.g")}
            </Typography>
          </Box>

          {!compact ? (
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {portionPresets.slice(0, 3).map((preset) => (
                <Button
                  key={`quick-add-${preset}`}
                  size="small"
                  variant="outlined"
                  onClick={() => handleAddQuantity(preset, false)}
                  sx={{ minWidth: 72, px: 1 }}
                >
                  +{formatProductPortion(preset, product.unit)}
                </Button>
              ))}
            </Stack>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 138px), 1fr))",
              gap: 0.8,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              onClick={handleAdd}
              sx={{
                alignSelf: "stretch",
                minHeight: 40,
                px: 1,
                whiteSpace: "normal",
                lineHeight: 1.2,
              }}
            >
              {t("meal.add")}
            </Button>
            {allowSave && (
              <Button
                variant="outlined"
                fullWidth
                onClick={handleToggleSave}
                sx={{
                  alignSelf: "stretch",
                  minHeight: 40,
                  px: 1,
                  whiteSpace: "normal",
                  lineHeight: 1.2,
                }}
              >
                {isSaved ? "⭐ " + t("productCard.remove") : "☆ " + t("productCard.save")}
              </Button>
            )}
          </Box>

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
