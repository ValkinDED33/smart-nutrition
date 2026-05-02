import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import type { MealEntry, MealType } from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import { searchProducts } from "../../shared/api/products";
import { selectRecentProducts, selectSavedProducts } from "./selectors";
import { productMatchesPreferences } from "../../shared/lib/preferences";
import { removeProduct, updateMealEntry } from "./mealSlice";
import { useLanguage } from "../../shared/language";
import { searchLocalProducts } from "../../shared/lib/mockProducts";
import {
  formatProductPortion,
  getProductPortionPresets,
} from "../../shared/lib/productPortions";

interface Props {
  entry: MealEntry;
}

const createProductKey = (product: Product) =>
  product.barcode?.trim() ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

const editorCopy = {
  uk: {
    edit: "Редагувати",
    editTitle: "Редагування запису",
    mealType: "Тип прийому їжі",
    replaceProduct: "Замінити продукт",
    replacePlaceholder: "Пошук за назвою, брендом або аліасом",
    selected: "Обрано",
    select: "Використати",
    cancel: "Скасувати",
    save: "Зберегти",
    quickPortions: "Швидкі порції",
    noMatches: "Не знайдено відповідних локальних або віддалених продуктів.",
  },
  pl: {
    edit: "Edytuj",
    editTitle: "Edycja wpisu",
    mealType: "Typ posiłku",
    replaceProduct: "Zamień produkt",
    replacePlaceholder: "Szukaj po nazwie, marce lub aliasie",
    selected: "Wybrano",
    select: "Użyj",
    cancel: "Anuluj",
    save: "Zapisz",
    quickPortions: "Szybkie porcje",
    noMatches: "Nie znaleziono pasujących produktów lokalnych ani zdalnych.",
  },
} as const;

export const MealEntryEditorDialog = ({ entry }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { language, t } = useLanguage();
  const copy = editorCopy[language];
  const savedProducts = useSelector(selectSavedProducts);
  const recentProducts = useSelector(selectRecentProducts);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState<number | "">(entry.quantity);
  const [mealType, setMealType] = useState<MealType>(entry.mealType);
  const [selectedProduct, setSelectedProduct] = useState<Product>(entry.product);
  const portionPresets = getProductPortionPresets(selectedProduct.unit);

  useEffect(() => {
    if (!open || !searchQuery.trim()) {
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const nextResults = await searchProducts(searchQuery);

      if (!cancelled) {
        setSearchResults(nextResults);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, searchQuery]);

  const handleOpen = () => {
    setQuantity(entry.quantity);
    setMealType(entry.mealType);
    setSelectedProduct(entry.product);
    setSearchQuery("");
    setSearchResults([]);
    setOpen(true);
  };

  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };

  const localSearchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    return searchLocalProducts(searchQuery, 10).filter((product) =>
      productMatchesPreferences(product, preferences)
    );
  }, [preferences, searchQuery]);

  const candidateProducts = useMemo(() => {
    const merged = new Map<string, Product>();
    const searchableResults = searchQuery.trim() ? searchResults : [];

    [
      entry.product,
      ...localSearchResults,
      ...recentProducts,
      ...savedProducts,
      ...searchableResults,
    ].forEach((product) => {
      if (!productMatchesPreferences(product, preferences)) {
        return;
      }

      const key = createProductKey(product);

      if (!merged.has(key)) {
        merged.set(key, product);
      }
    });

    return [...merged.values()].slice(0, 8);
  }, [
    entry.product,
    localSearchResults,
    preferences,
    recentProducts,
    savedProducts,
    searchQuery,
    searchResults,
  ]);

  const handleSave = () => {
    if (!quantity || quantity <= 0) {
      return;
    }

    dispatch(
      updateMealEntry({
        id: entry.id,
        product: selectedProduct,
        quantity: typeof quantity === "string" ? 1 : quantity,
        mealType,
      })
    );
    setOpen(false);
  };

  const entryCalories = (entry.product.nutrients.calories * entry.quantity) / 100;

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button onClick={handleOpen}>{copy.edit}</Button>
        <Button color="error" onClick={() => dispatch(removeProduct(entry.id))}>
          {t("mealBuilder.remove")}
        </Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{copy.editTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
              <Stack spacing={0.5}>
                <Typography sx={{ fontWeight: 700 }}>
                  {getProductDisplayName(entry.product, language)}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {entry.quantity} {entry.product.unit} - {entryCalories.toFixed(0)} {t("common.kcal")}
                </Typography>
              </Stack>
            </Paper>

            <TextField
              type="number"
              label={`${t("meal.quantity")} (${selectedProduct.unit})`}
              value={quantity}
              onChange={(event) => {
                const value = event.target.value;
                setQuantity(value === "" ? "" : Math.max(1, Number(value) || 1));
              }}
              inputProps={{ min: 1, step: selectedProduct.unit === "piece" ? 1 : 0.1 }}
            />

            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {copy.quickPortions}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {portionPresets.map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    variant={quantity === preset ? "contained" : "outlined"}
                    onClick={() => setQuantity(preset)}
                  >
                    {formatProductPortion(preset, selectedProduct.unit)}
                  </Button>
                ))}
              </Stack>
            </Stack>

            <TextField
              select
              label={copy.mealType}
              value={mealType}
              onChange={(event) => setMealType(event.target.value as MealType)}
            >
              {Object.entries(mealLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={copy.replaceProduct}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={copy.replacePlaceholder}
            />

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>
                {copy.selected}: {getProductDisplayName(selectedProduct, language)}
              </Typography>
              {candidateProducts.length === 0 ? (
                <Typography color="text.secondary">{copy.noMatches}</Typography>
              ) : (
                candidateProducts.map((product) => {
                  const active = createProductKey(product) === createProductKey(selectedProduct);

                  return (
                    <Paper
                      key={createProductKey(product)}
                      variant="outlined"
                      sx={{
                        p: 1.25,
                        borderRadius: 3,
                        borderColor: active ? "primary.main" : "rgba(15, 23, 42, 0.12)",
                      }}
                    >
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                      >
                        <Stack spacing={0.3}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {getProductDisplayName(product, language)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {product.nutrients.calories.toFixed(0)} {t("common.kcal")} / {product.unit}
                          </Typography>
                        </Stack>
                        <Button
                          variant={active ? "contained" : "outlined"}
                          onClick={() => setSelectedProduct(product)}
                        >
                          {active ? copy.selected : copy.select}
                        </Button>
                      </Stack>
                    </Paper>
                  );
                })
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpen(false)}>{copy.cancel}</Button>
          <Button variant="contained" onClick={handleSave}>
            {copy.save}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
