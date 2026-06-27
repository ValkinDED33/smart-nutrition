import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { addProduct } from "./mealSlice";
import {
  selectFavoriteProductIds,
  selectPersonalBarcodeProducts,
  selectRecentProducts,
  selectSavedProducts,
} from "./selectors";
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
import { CatalogContributionCard } from "@features/platform/CatalogContributionCard";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { getProductSuggestions } from "./productSuggestionModel";

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

const composerStatusCopy = {
  uk: {
    unavailable:
      "Онлайн-підбір інгредієнтів тимчасово недоступний. Це не порожня база — backend або зовнішній каталог не відповів.",
    retry: "Спробувати ще раз",
    noOptions: "Почніть писати назву продукту",
    searching: "Шукаю в онлайн-каталозі...",
    onlineHint: "Пишіть назву — варіанти підтягнуться з backend-каталогу та зовнішніх баз.",
    noMatch: "Не знайшли. Спробуйте іншу назву або додайте продукт у спільну базу нижче.",
    googleSearch: "Шукати в Google",
    addMissing: "Додати продукт в онлайн-базу",
    closeContribution: "Сховати форму",
    inlineSuggestions: "Варіанти з бази",
    choose: "Обрати",
  },
  pl: {
    unavailable:
      "Dobór składników online jest chwilowo niedostępny. To nie pusta baza — backend albo zewnętrzny katalog nie odpowiedział.",
    retry: "Spróbuj ponownie",
    noOptions: "Zacznij wpisywać nazwę produktu",
    searching: "Szukam w katalogu online...",
    onlineHint: "Wpisuj nazwę — propozycje przyjdą z katalogu backendu i baz zewnętrznych.",
    noMatch: "Nie znaleziono. Spróbuj innej nazwy albo dodaj produkt do wspólnej bazy niżej.",
    googleSearch: "Szukaj w Google",
    addMissing: "Dodaj produkt do bazy online",
    closeContribution: "Ukryj formularz",
    inlineSuggestions: "Propozycje z bazy",
    choose: "Wybierz",
  },
  en: {
    unavailable:
      "Online ingredient lookup is temporarily unavailable. This is not an empty database — the backend or external catalog did not respond.",
    retry: "Try again",
    noOptions: "Start typing a product name",
    searching: "Searching the online catalog...",
    onlineHint: "Type a name — suggestions come from the backend catalog and external databases.",
    noMatch: "No match yet. Try another name or add the product to the shared database below.",
    googleSearch: "Search Google",
    addMissing: "Add product to online database",
    closeContribution: "Hide form",
    inlineSuggestions: "Database suggestions",
    choose: "Choose",
  },
} as const;

export const QuickMealComposer = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { appLanguage, t } = useLanguage();
  const copy = composerStatusCopy[appLanguage];
  const favorites = useSelector(selectFavoriteProductIds);
  const savedProducts = useSelector(selectSavedProducts);
  const recentProducts = useSelector(selectRecentProducts);
  const personalBarcodeProducts = useSelector(selectPersonalBarcodeProducts);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const [rows, setRows] = useState<ComposerRow[]>(() => [
    createRow(),
    { ...createRow(), quantity: 80 },
  ]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [contributionOpen, setContributionOpen] = useState(false);
  const activeRow = rows.find((row) => row.id === activeRowId) ?? rows[0] ?? null;
  const activeSearchText = activeRow?.productQuery.trim() ?? "";
  const shouldLookupProducts = debouncedSearchText.trim().length >= 2;
  const productsQuery = useQuery({
    queryKey: ["composer-products", debouncedSearchText],
    queryFn: () => searchProducts(debouncedSearchText),
    enabled: shouldLookupProducts,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
  const lookupFailed = shouldLookupProducts && productsQuery.isError;
  const availableProducts = useMemo(
    () =>
      getProductSuggestions({
        query: activeSearchText,
        onlineProducts: productsQuery.data ?? [],
        savedProducts,
        recentProducts,
        personalBarcodeProducts,
        limit: 12,
      }).filter((product) => productMatchesPreferences(product, preferences)),
    [
      activeSearchText,
      personalBarcodeProducts,
      preferences,
      productsQuery.data,
      recentProducts,
      savedProducts,
    ]
  );
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
    const nextRow = createRow();
    setRows((currentRows) => [...currentRows, nextRow]);
    setActiveRowId(nextRow.id);
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

    const nextRow = createRow();
    setRows([nextRow]);
    setActiveRowId(nextRow.id);
  };

  const hasValidMealRows = rows.some(
    (row) => row.product && typeof row.quantity === "number" && row.quantity > 0
  );
  const hasOnlineLookupResult = (productsQuery.data ?? []).length > 0;
  const canOfferContribution =
    activeSearchText.length >= 3 &&
    !productsQuery.isFetching &&
    !lookupFailed &&
    !hasOnlineLookupResult &&
    availableProducts.length === 0;
  const googleSearchUrl =
    activeSearchText.length >= 3
      ? `https://www.google.com/search?q=${encodeURIComponent(
          `${activeSearchText} nutrition facts calories protein`
        )}`
      : "#";

  const getProductLabel = (product: Product) => {
    const name = getProductDisplayName(product, appLanguage);
    const brand = product.brand?.trim();

    return brand && !name.toLowerCase().includes(brand.toLowerCase())
      ? `${brand} ${name}`
      : name;
  };

  const selectProductForRow = (rowId: string, product: Product) => {
    updateRow(rowId, {
      product,
      productQuery: getProductLabel(product),
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("composer.title")}
        </Typography>
        <Typography color="text.secondary">{t("composer.subtitle")}</Typography>

        {lookupFailed ? (
          <Alert
            severity="warning"
            action={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    void productsQuery.refetch();
                  }}
                  sx={{ textTransform: "none", fontWeight: 800 }}
                >
                  {copy.retry}
                </Button>
                {activeSearchText.length >= 3 ? (
                  <Button
                    color="inherit"
                    component="a"
                    href={googleSearchUrl}
                    rel="noreferrer"
                    size="small"
                    target="_blank"
                    sx={{ textTransform: "none", fontWeight: 800 }}
                  >
                    {copy.googleSearch}
                  </Button>
                ) : null}
              </Stack>
            }
          >
            {copy.unavailable}
          </Alert>
        ) : null}

        {rows.map((row, index) => {
          const selectedProduct = row.product;
          const portionPresets = getProductPortionPresets(selectedProduct?.unit ?? "g");
          const isActiveRow = activeRow?.id === row.id;
          const rowQuery = row.productQuery.trim();
          const rowOptions = isActiveRow ? availableProducts : [];
          const noOptionsText = lookupFailed
            ? copy.unavailable
            : productsQuery.isFetching
              ? copy.searching
              : rowQuery.length >= 2
                ? copy.noMatch
                : copy.noOptions;
          const helperText = lookupFailed
            ? copy.unavailable
            : selectedProduct
              ? `${selectedProduct.source} • ${Math.round(
                  selectedProduct.nutrients.calories
                )} ${t("common.kcal")} / 100 ${selectedProduct.unit}`
              : copy.onlineHint;

          return (
            <Paper
              key={row.id}
              variant="outlined"
              sx={{
                p: { xs: 1.25, md: 1.5 },
                borderRadius: 1,
                borderColor: isActiveRow ? "primary.main" : "var(--sn-border-soft)",
                bgcolor: isActiveRow ? "var(--sn-accent-soft)" : "var(--sn-surface-elevated)",
              }}
            >
              <Stack spacing={1.25}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.5}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Autocomplete
                    fullWidth
                    autoHighlight
                    clearOnBlur={false}
                    freeSolo
                    handleHomeEndKeys
                    loading={shouldLookupProducts && productsQuery.isFetching}
                    openOnFocus
                    options={rowOptions}
                    selectOnFocus
                    noOptionsText={noOptionsText}
                    value={selectedProduct}
                    inputValue={row.productQuery}
                    filterOptions={(options) => options}
                    getOptionLabel={(product) =>
                      typeof product === "string" ? product : getProductLabel(product)
                    }
                    isOptionEqualToValue={(option, value) =>
                      typeof value !== "string" && option.id === value.id
                    }
                    onOpen={() => setActiveRowId(row.id)}
                    onInputChange={(_, value, reason) => {
                      setActiveRowId(row.id);
                      if (reason === "input" || reason === "clear") {
                        setContributionOpen(false);
                      }
                      updateRow(row.id, {
                        productQuery: value,
                        product:
                          reason === "clear" || reason === "input" || value.trim() === ""
                            ? null
                            : row.product,
                      });
                    }}
                    onChange={(_, product) => {
                      setActiveRowId(row.id);
                      updateRow(row.id, {
                        product: typeof product === "string" ? null : product,
                        productQuery:
                          typeof product === "string"
                            ? product
                            : product
                              ? getProductLabel(product)
                              : "",
                      });
                    }}
                    slotProps={{
                      popper: { sx: { zIndex: 1700 } },
                      paper: {
                        sx: {
                          borderRadius: 1,
                          boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
                        },
                      },
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
                        helperText={helperText}
                        inputProps={{
                          ...params.inputProps,
                          inputMode: "search",
                          enterKeyHint: "search",
                        }}
                        onFocus={() => setActiveRowId(row.id)}
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
                    type="text"
                    label={t("composer.quantity")}
                    value={row.quantity}
                    slotProps={{
                      htmlInput: { inputMode: "decimal", enterKeyHint: "done" },
                    }}
                    onFocus={(event) => selectInputValue(event.target)}
                    onClick={(event) => selectInputValue(event.currentTarget)}
                    onChange={(event) => {
                      const value = event.target.value;
                      const parsedValue = Number(value);
                      updateRow(row.id, {
                        quantity:
                          value === "" || !Number.isFinite(parsedValue)
                            ? ""
                            : Math.max(0, parsedValue),
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

                {isActiveRow && rowQuery.length >= 2 && rowOptions.length > 0 ? (
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {copy.inlineSuggestions}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
                        gap: 0.8,
                      }}
                    >
                      {rowOptions.slice(0, 8).map((product) => (
                        <Button
                          key={product.barcode?.trim() || product.id}
                          variant="outlined"
                          onClick={() => selectProductForRow(row.id, product)}
                          sx={{
                            justifyContent: "flex-start",
                            textAlign: "left",
                            minHeight: 56,
                            px: 1.2,
                            textTransform: "none",
                          }}
                        >
                          <Stack spacing={0.3} sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 900, overflowWrap: "anywhere" }}
                            >
                              {getProductLabel(product)}
                            </Typography>
                            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                              <Chip
                                size="small"
                                label={`${Math.round(product.nutrients.calories)} ${t(
                                  "common.kcal"
                                )}`}
                              />
                              <Chip size="small" label={product.source} variant="outlined" />
                            </Stack>
                          </Stack>
                        </Button>
                      ))}
                    </Box>
                  </Stack>
                ) : null}
              </Stack>
            </Paper>
          );
        })}

        {canOfferContribution ? (
          <Alert
            severity="info"
            action={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  color="inherit"
                  component="a"
                  href={googleSearchUrl}
                  rel="noreferrer"
                  size="small"
                  target="_blank"
                  sx={{ textTransform: "none", fontWeight: 900 }}
                >
                  {copy.googleSearch}
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setContributionOpen((current) => !current)}
                  sx={{ textTransform: "none", fontWeight: 900 }}
                >
                  {contributionOpen ? copy.closeContribution : copy.addMissing}
                </Button>
              </Stack>
            }
          >
            {copy.noMatch}
          </Alert>
        ) : null}

        <Collapse in={contributionOpen && canOfferContribution} timeout="auto" unmountOnExit>
          <CatalogContributionCard key={activeSearchText} compact initialName={activeSearchText} />
        </Collapse>

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
