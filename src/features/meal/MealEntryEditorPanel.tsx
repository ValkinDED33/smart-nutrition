import {
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { MealEntry, MealType } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import { getProductDisplayName } from "@domain/products/productDisplay";
import { useLanguage } from "../../shared/language";
import {
  formatProductPortion,
} from "@domain/products/productPortions";
import { useMealEntryEditor } from "./hooks/useMealEntryEditor";
import { createProductKey } from "./productIdentity";
import type { AppLanguage } from "@shared/types/i18n";

interface Props {
  entry: MealEntry;
}

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
    noMatches: "Не знайдено відповідних продуктів у каталозі або онлайн-базах.",
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
    noMatches: "Nie znaleziono pasujących produktów w katalogu ani bazach online.",
  },
  en: {
    edit: "Edit",
    editTitle: "Edit entry",
    mealType: "Meal type",
    replaceProduct: "Replace product",
    replacePlaceholder: "Search by name, brand, or alias",
    selected: "Selected",
    select: "Use",
    cancel: "Cancel",
    save: "Save",
    quickPortions: "Quick portions",
    noMatches: "No matching products found in catalog or online databases.",
  },
} as const;

const CandidateProductCard = ({
  active,
  appLanguage,
  product,
  selectLabel,
  selectedLabel,
  unitLabel,
  onSelect,
}: {
  active: boolean;
  appLanguage: AppLanguage;
  product: Product;
  selectLabel: string;
  selectedLabel: string;
  unitLabel: string;
  onSelect: () => void;
}) => (
  <Paper
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
          {getProductDisplayName(product, appLanguage)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {product.nutrients.calories.toFixed(0)} {unitLabel} / {product.unit}
        </Typography>
      </Stack>
      <Button variant={active ? "contained" : "outlined"} onClick={onSelect}>
        {active ? selectedLabel : selectLabel}
      </Button>
    </Stack>
  </Paper>
);

export const MealEntryEditorPanel = ({ entry }: Props) => {
  const { appLanguage, t } = useLanguage();
  const copy = editorCopy[appLanguage];
  const editor = useMealEntryEditor(entry);

  const mealLabels: Record<MealType, string> = {
    breakfast: t("mealType.breakfast"),
    lunch: t("mealType.lunch"),
    dinner: t("mealType.dinner"),
    snack: t("mealType.snack"),
  };

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button onClick={editor.openEditor}>{copy.edit}</Button>
        <Button color="error" onClick={editor.removeEntry}>
          {t("mealBuilder.remove")}
        </Button>
      </Stack>

      {editor.open && (
        <Paper
          variant="outlined"
          sx={{
            mt: 1,
            p: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            borderColor: "rgba(15, 118, 110, 0.28)",
            backgroundColor: "rgba(240,253,250,0.55)",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Typography sx={{ fontWeight: 900 }}>{copy.editTitle}</Typography>
              <Button onClick={editor.closeEditor} size="small">
                {copy.cancel}
              </Button>
            </Stack>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
              <Stack spacing={0.5}>
                <Typography sx={{ fontWeight: 700 }}>
                  {getProductDisplayName(entry.product, appLanguage)}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {entry.quantity} {entry.product.unit} - {editor.entryCalories.toFixed(0)}{" "}
                  {t("common.kcal")}
                </Typography>
              </Stack>
            </Paper>

            <TextField
              type="number"
              label={`${t("meal.quantity")} (${editor.selectedProduct.unit})`}
              value={editor.quantity}
              onChange={(event) => editor.updateQuantityInput(event.target.value)}
              inputProps={{ min: 1, step: editor.selectedProduct.unit === "piece" ? 1 : 0.1 }}
            />

            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {copy.quickPortions}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {editor.portionPresets.map((preset) => (
                  <Button
                    key={preset}
                    size="small"
                    variant={editor.quantity === preset ? "contained" : "outlined"}
                    onClick={() => editor.setQuantity(preset)}
                  >
                    {formatProductPortion(preset, editor.selectedProduct.unit)}
                  </Button>
                ))}
              </Stack>
            </Stack>

            <TextField
              select
              label={copy.mealType}
              value={editor.mealType}
              onChange={(event) => editor.setMealType(event.target.value as MealType)}
            >
              {Object.entries(mealLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={copy.replaceProduct}
              value={editor.searchQuery}
              onChange={(event) => editor.setSearchQuery(event.target.value)}
              placeholder={copy.replacePlaceholder}
            />

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }}>
                {copy.selected}: {getProductDisplayName(editor.selectedProduct, appLanguage)}
              </Typography>
              {editor.candidateProducts.length === 0 ? (
                <Typography color="text.secondary">{copy.noMatches}</Typography>
              ) : (
                editor.candidateProducts.map((product) => {
                  const active =
                    createProductKey(product) === createProductKey(editor.selectedProduct);

                  return (
                    <CandidateProductCard
                      key={createProductKey(product)}
                      active={active}
                      appLanguage={appLanguage}
                      product={product}
                      selectLabel={copy.select}
                      selectedLabel={copy.selected}
                      unitLabel={t("common.kcal")}
                      onSelect={() => editor.setSelectedProduct(product)}
                    />
                  );
                })
              )}
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" useFlexGap flexWrap="wrap">
              <Button onClick={editor.closeEditor}>{copy.cancel}</Button>
              <Button
                variant="contained"
                onClick={editor.saveEditor}
                disabled={typeof editor.quantity !== "number" || editor.quantity <= 0}
              >
                {copy.save}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </>
  );
};
