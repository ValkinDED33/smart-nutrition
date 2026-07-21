import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Camera, Mic, Plus, ScanBarcode, Search, Sparkles, Star } from "lucide-react";
import type { MealType } from "@domain/meal/types";
import type { Product } from "@domain/products/types";
import {
  getProductDisplayName,
  getProductSourceLabel,
} from "@domain/products/productDisplay";
import { getProductPortionPresets, formatProductPortion } from "@domain/products/productPortions";
import { productMatchesPreferences } from "@domain/user/preferences";
import type { AppDispatch, RootState } from "../../app/store";
import { searchProducts } from "../../shared/api/products";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { useLanguage } from "../../shared/language";
import {
  createInitialFoodCommandQuantity,
  createNutritionGoogleSearchUrl,
  isFoodCommandUnitCompatible,
  parseFoodCommandText,
  shouldShowQuickSearchDeadEnd,
} from "./foodCommandCenterModel";
import { getProductSuggestions } from "./productSuggestionModel";
import {
  selectPersonalBarcodeProducts,
  selectRecentProducts,
  selectSavedProducts,
} from "./selectors";
import {
  addProductIntakeToCloud,
  rememberRecentMealProductInCloud,
} from "./mealCloudSync";

type FoodCommandTarget =
  | "search"
  | "photo"
  | "barcode"
  | "composer"
  | "favorites"
  | "catalog";

interface FoodCommandCenterProps {
  mealType: MealType;
  initialQuery?: string;
  onOpenTarget: (target: FoodCommandTarget) => void;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  readonly 0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const getSpeechRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const speechWindow = window as Window &
    Partial<{
      SpeechRecognition: SpeechRecognitionConstructor;
      webkitSpeechRecognition: SpeechRecognitionConstructor;
    }>;

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
};

const commandCopy = {
  uk: {
    title: "Додати їжу",
    subtitle:
      "Один швидкий вхід: напишіть продукт, додайте улюблене або відкрийте фото/скан.",
    searchLabel: "Що ви їли?",
    searchPlaceholder: "Наприклад: chicken breast, рис, йогурт",
    quickModes: "Швидкі режими",
    photo: "Фото",
    barcode: "Сканер",
    composer: "Конструктор",
    favorites: "Обране",
    searching: "Шукаю в онлайн-базі...",
    empty: "Почніть вводити назву — я підтягну варіанти з онлайн-каталогу.",
    unavailable:
      "Онлайн-пошук зараз недоступний: каталог тимчасово не відповів. Можна повторити в повному пошуку або додати продукт у спільну базу.",
    noMatch:
      "Не знайшов у результатах каталогу. Відкрийте повний пошук, перевірте Google або додайте продукт у спільну базу.",
    added: "Додано до поточного прийому їжі",
    grams: "г",
    openSearch: "Повний пошук",
    googleSearch: "Google",
    addToCatalog: "Форма каталогу",
    source: "джерело",
    recent: "Недавнє",
    saved: "Збережене",
    voice: "Голос",
    listening: "Слухаю...",
    voiceUnavailable: "Голосове введення недоступне у цьому браузері.",
    commandReady: "Зрозумів команду",
    commandNeedsMatch: "Знайдіть продукт у каталозі, потім я збережу його у прийом їжі.",
    commandUnitMismatch:
      "Одиниці у команді не збігаються з одиницями продукту. Перевірте кількість перед збереженням.",
    addCommand: "Додати команду",
    saveFailed: "Не вдалося зберегти їжу. Спробуйте ще раз.",
  },
  pl: {
    title: "Dodaj jedzenie",
    subtitle:
      "Jedno szybkie wejście: wpisz produkt, dodaj ulubione albo otwórz zdjęcie/skaner.",
    searchLabel: "Co jadłeś?",
    searchPlaceholder: "Np. chicken breast, ryż, jogurt",
    quickModes: "Szybkie tryby",
    photo: "Zdjęcie",
    barcode: "Skaner",
    composer: "Konstruktor",
    favorites: "Ulubione",
    searching: "Szukam w bazie online...",
    empty: "Zacznij wpisywać nazwę — pobiorę propozycje z katalogu online.",
    unavailable:
      "Wyszukiwanie online jest teraz niedostępne: katalog chwilowo nie odpowiedział. Możesz spróbować w pełnym wyszukiwaniu albo dodać produkt do wspólnej bazy.",
    noMatch:
      "Nie znalazłem tego w wynikach katalogu. Otwórz pełne wyszukiwanie, sprawdź Google albo dodaj produkt do wspólnej bazy.",
    added: "Dodano do bieżącego posiłku",
    grams: "g",
    openSearch: "Pełne wyszukiwanie",
    googleSearch: "Google",
    addToCatalog: "Formularz katalogu",
    source: "źródło",
    recent: "Ostatnie",
    saved: "Zapisane",
    voice: "Głos",
    listening: "Słucham...",
    voiceUnavailable: "Wprowadzanie głosowe jest niedostępne w tej przeglądarce.",
    commandReady: "Rozumiem polecenie",
    commandNeedsMatch: "Znajdź produkt w katalogu, a potem zapiszę go do posiłku.",
    commandUnitMismatch:
      "Jednostki w poleceniu nie pasują do jednostek produktu. Sprawdź ilość przed zapisem.",
    addCommand: "Dodaj z polecenia",
    saveFailed: "Nie udało się zapisać jedzenia. Spróbuj ponownie.",
  },
  en: {
    title: "Add food",
    subtitle:
      "One fast entry: type a product, add a favorite, or open photo/barcode logging.",
    searchLabel: "What did you eat?",
    searchPlaceholder: "For example: chicken breast, rice, yogurt",
    quickModes: "Quick modes",
    photo: "Photo",
    barcode: "Scanner",
    composer: "Builder",
    favorites: "Favorites",
    searching: "Searching the online database...",
    empty: "Start typing a name — I will pull options from the online catalog.",
    unavailable:
      "Online search is unavailable right now: the catalog did not respond. You can retry in full search or add the product to the shared database.",
    noMatch:
      "I did not find this in the catalog results. Open full search, check Google, or add it to the shared database.",
    added: "Added to the current meal",
    grams: "g",
    openSearch: "Full search",
    googleSearch: "Google",
    addToCatalog: "Catalog form",
    source: "source",
    recent: "Recent",
    saved: "Saved",
    voice: "Voice",
    listening: "Listening...",
    voiceUnavailable: "Voice input is unavailable in this browser.",
    commandReady: "Command understood",
    commandNeedsMatch: "Find the product in the catalog, then I will save it to the meal.",
    commandUnitMismatch:
      "The command unit does not match the product unit. Check the amount before saving.",
    addCommand: "Add command",
    saveFailed: "Could not save food. Please try again.",
  },
} as const;

const normalizeQuery = (value: string) => value.trim().replace(/\s+/g, " ");

const getCommandCopy = (language: keyof typeof commandCopy) => {
  if (language === "pl") return commandCopy.pl;
  if (language === "en") return commandCopy.en;

  return commandCopy.uk;
};

const getProductKey = (product: Product) =>
  product.barcode?.trim() ||
  `${product.name.trim().toLowerCase()}-${product.brand?.trim().toLowerCase() ?? ""}`;

export const FoodCommandCenter = ({
  mealType,
  initialQuery = "",
  onOpenTarget,
}: FoodCommandCenterProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const meal = useSelector((state: RootState) => state.meal);
  const savedProducts = useSelector(selectSavedProducts);
  const recentProducts = useSelector(selectRecentProducts);
  const personalBarcodeProducts = useSelector(selectPersonalBarcodeProducts);
  const preferences = useSelector((state: RootState) => ({
    dietStyle: state.profile.dietStyle,
    allergies: state.profile.allergies,
    excludedIngredients: state.profile.excludedIngredients,
    adaptiveMode: state.profile.adaptiveMode,
  }));
  const { appLanguage } = useLanguage();
  const copy = getCommandCopy(appLanguage);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | "">(createInitialFoodCommandQuantity);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const previousInitialQueryRef = useRef(initialQuery);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const normalizedQuery = normalizeQuery(query);
  const parsedCommand = useMemo(
    () => parseFoodCommandText(normalizedQuery),
    [normalizedQuery]
  );
  const commandSuggestionQuery = parsedCommand?.query ?? normalizedQuery;

  useEffect(() => {
    const normalizedInitialQuery = normalizeQuery(initialQuery);

    if (
      initialQuery === previousInitialQueryRef.current ||
      !normalizedInitialQuery
    ) {
      return;
    }

    previousInitialQueryRef.current = initialQuery;
    setQuery(normalizedInitialQuery);
    setDebouncedQuery(normalizedInitialQuery);
    setSelectedProduct(null);
  }, [initialQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(commandSuggestionQuery);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [commandSuggestionQuery]);

  useEffect(
    () => () => {
      speechRecognitionRef.current?.stop();
    },
    []
  );

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const productQuery = useQuery({
    queryKey: ["food-command-products", debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const suggestions = useMemo(
    () =>
      getProductSuggestions({
        query: commandSuggestionQuery,
        onlineProducts: productQuery.data ?? [],
        savedProducts,
        recentProducts,
        personalBarcodeProducts,
        includeStarterCatalog: !commandSuggestionQuery,
        limit: commandSuggestionQuery ? 8 : 6,
      }).filter((product) => productMatchesPreferences(product, preferences)),
    [
      commandSuggestionQuery,
      personalBarcodeProducts,
      preferences,
      productQuery.data,
      recentProducts,
      savedProducts,
    ]
  );

  const quickProducts = useMemo(() => {
    const seen = new Set<string>();
    const items: Array<{ product: Product; source: string }> = [];

    [
      ...savedProducts.map((product) => ({ product, source: copy.saved })),
      ...recentProducts.map((product) => ({ product, source: copy.recent })),
    ].forEach((item) => {
      const key = getProductKey(item.product);

      if (seen.has(key) || !productMatchesPreferences(item.product, preferences)) {
        return;
      }

      seen.add(key);
      items.push(item);
    });

    return items.slice(0, 5);
  }, [copy.recent, copy.saved, preferences, recentProducts, savedProducts]);

  const selectedQuantity =
    typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0
      ? quantity
      : null;
  const commandProduct = parsedCommand ? suggestions[0] ?? null : null;
  const commandUnitIsCompatible =
    parsedCommand !== null && commandProduct !== null
      ? isFoodCommandUnitCompatible(parsedCommand.unit, commandProduct.unit)
      : false;
  const selectedPortions = getProductPortionPresets(selectedProduct?.unit ?? "g");
  const isSearching =
    commandSuggestionQuery.length >= 2 &&
    (commandSuggestionQuery !== debouncedQuery || productQuery.isFetching);
  const hasQuickSearchDeadEnd = shouldShowQuickSearchDeadEnd({
    query: commandSuggestionQuery,
    isSearching,
    isError: productQuery.isError,
    suggestionCount: suggestions.length,
  });
  const googleSearchUrl = createNutritionGoogleSearchUrl(commandSuggestionQuery);

  const addSelectedProduct = async (
    product = selectedProduct,
    amount = selectedQuantity,
    targetMealType = mealType
  ) => {
    if (!product || amount === null) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      const result = await addProductIntakeToCloud(dispatch, {
        source: "search",
        product,
        barcode: product.barcode,
        quantity: amount,
        mealType: targetMealType,
        idempotencyKey: `command-${targetMealType}-${product.barcode || product.id}-${
          globalThis.crypto?.randomUUID?.() ?? Date.now()
        }`,
        options: {
          saveToLibrary: false,
          submitToCatalog: false,
        },
      });

      if (!result.outcomes?.mealAdded) {
        throw new Error("Backend did not confirm the meal entry.");
      }

      setSelectedProduct(product);
      setQuery(getProductDisplayName(product, appLanguage));
      setFeedback(
        `${copy.added}: ${getProductDisplayName(product, appLanguage)} +${formatProductPortion(
          amount,
          product.unit
        )}`
      );
    } catch {
      setActionError(copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const chooseProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuery(getProductDisplayName(product, appLanguage));
    void rememberRecentMealProductInCloud(dispatch, meal, product).catch(() => {
      setActionError(copy.saveFailed);
    });
  };

  const addParsedCommand = () => {
    if (!parsedCommand || !commandProduct || !commandUnitIsCompatible) {
      return;
    }

    setSelectedProduct(commandProduct);
    setQuantity(parsedCommand.quantity);
    void addSelectedProduct(
      commandProduct,
      parsedCommand.quantity,
      parsedCommand.mealType ?? mealType
    );
  };

  const startVoiceInput = () => {
    const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();

    if (!SpeechRecognitionConstructor) {
      setActionError(copy.voiceUnavailable);
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang =
      appLanguage === "pl" ? "pl-PL" : appLanguage === "en" ? "en-US" : "uk-UA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (transcript) {
        setQuery(transcript);
        setSelectedProduct(null);
      }
    };
    recognition.onerror = (event) => {
      setActionError(event.message || event.error || copy.voiceUnavailable);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    speechRecognitionRef.current = recognition;
    setActionError(null);
    setIsListening(true);
    recognition.start();
  };

  return (
    <Paper
      className="sn-premium-panel"
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.2} alignItems="flex-start">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              color: "#0f766e",
              bgcolor: "rgba(20,184,166,0.1)",
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} />
          </Box>
          <Stack spacing={0.4} sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="h5" sx={{ fontWeight: 950 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) auto 150px auto",
            },
            gap: 1,
            alignItems: "start",
          }}
        >
          <TextField
            fullWidth
            value={query}
            label={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedProduct(null);
            }}
            InputProps={{
              startAdornment: <Search size={18} style={{ marginRight: 8, opacity: 0.7 }} />,
              endAdornment: isSearching ? <CircularProgress size={18} /> : null,
            }}
            slotProps={{
              htmlInput: {
                inputMode: "search",
                enterKeyHint: "search",
              },
            }}
          />
          <Button
            variant={isListening ? "contained" : "outlined"}
            startIcon={<Mic size={18} />}
            onClick={startVoiceInput}
            data-food-command-voice-action="speech-recognition"
            sx={{ minHeight: 56, px: 2.4 }}
          >
            {isListening ? copy.listening : copy.voice}
          </Button>
          <TextField
            type="text"
            label={selectedProduct ? `${selectedProduct.unit}` : copy.grams}
            value={quantity}
            slotProps={{
              htmlInput: {
                inputMode: "decimal",
                enterKeyHint: "done",
              },
            }}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            onChange={(event) => {
              const value = event.target.value;
              const nextValue = Number(value);
              setQuantity(
                value === "" || !Number.isFinite(nextValue)
                  ? ""
                  : Math.max(0, nextValue)
              );
            }}
          />
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => void addSelectedProduct()}
            disabled={!selectedProduct || selectedQuantity === null || isSaving}
            sx={{ minHeight: 56, px: 2.4 }}
          >
            {copy.title}
          </Button>
        </Box>

        {parsedCommand ? (
          <Alert
            severity={commandProduct && commandUnitIsCompatible ? "success" : "info"}
            action={
              <Button
                color="inherit"
                size="small"
                disabled={!commandProduct || !commandUnitIsCompatible || isSaving}
                onClick={addParsedCommand}
                data-food-command-intake-action="typed-command"
                sx={{ fontWeight: 800, textTransform: "none" }}
              >
                {copy.addCommand}
              </Button>
            }
          >
            <strong>{copy.commandReady}:</strong> {parsedCommand.query},{" "}
            {formatProductPortion(parsedCommand.quantity, parsedCommand.unit)}
            {commandProduct && !commandUnitIsCompatible
              ? ` · ${copy.commandUnitMismatch}`
              : !commandProduct
                ? ` · ${copy.commandNeedsMatch}`
                : ""}
          </Alert>
        ) : null}

        {selectedProduct ? (
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            {selectedPortions.map((portion) => (
              <Chip
                key={portion}
                label={formatProductPortion(portion, selectedProduct.unit)}
                clickable
                color={quantity === portion ? "primary" : "default"}
                variant={quantity === portion ? "filled" : "outlined"}
                onClick={() => setQuantity(portion)}
              />
            ))}
            <Chip
              label={`${copy.source}: ${getProductSourceLabel(
                selectedProduct.source,
                appLanguage
              )}`}
              variant="outlined"
            />
          </Stack>
        ) : null}

        {normalizedQuery.length < 2 ? (
          <Typography color="text.secondary">{copy.empty}</Typography>
        ) : null}

        {productQuery.isError ? (
          <Alert
            severity="warning"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => onOpenTarget("search")}
                sx={{ fontWeight: 800 }}
              >
                {copy.openSearch}
              </Button>
            }
          >
            {copy.unavailable}
          </Alert>
        ) : null}

        {actionError ? (
          <Alert severity="error" onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        ) : null}

        {suggestions.length > 0 ? (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {suggestions.map((product) => (
              <Chip
                key={getProductKey(product)}
                label={getProductDisplayName(product, appLanguage)}
                clickable
                color={
                  selectedProduct && getProductKey(selectedProduct) === getProductKey(product)
                    ? "primary"
                    : "default"
                }
                variant={
                  selectedProduct && getProductKey(selectedProduct) === getProductKey(product)
                    ? "filled"
                    : "outlined"
                }
                onClick={() => chooseProduct(product)}
              />
            ))}
          </Stack>
        ) : null}

        {hasQuickSearchDeadEnd ? (
          <Alert
            severity="info"
            action={
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => onOpenTarget("search")}
                  sx={{ fontWeight: 800, textTransform: "none" }}
                >
                  {copy.openSearch}
                </Button>
                <Button
                  color="inherit"
                  component="a"
                  href={googleSearchUrl}
                  rel="noreferrer"
                  size="small"
                  target="_blank"
                  sx={{ fontWeight: 800, textTransform: "none" }}
                >
                  {copy.googleSearch}
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => onOpenTarget("catalog")}
                  sx={{ fontWeight: 800, textTransform: "none" }}
                >
                  {copy.addToCatalog}
                </Button>
              </Stack>
            }
          >
            {copy.noMatch}
          </Alert>
        ) : null}

        {quickProducts.length > 0 && !normalizedQuery ? (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 800 }}>{copy.recent}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {quickProducts.map(({ product, source }) => (
                <Chip
                  key={`${source}-${getProductKey(product)}`}
                  label={`${getProductDisplayName(product, appLanguage)} · ${source}`}
                  clickable
                  variant="outlined"
                  onClick={() => chooseProduct(product)}
                />
              ))}
            </Stack>
          </Stack>
        ) : null}

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800 }}>{copy.quickModes}</Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Camera size={18} />}
              onClick={() => onOpenTarget("photo")}
              data-food-command-target="photo"
            >
              {copy.photo}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ScanBarcode size={18} />}
              onClick={() => onOpenTarget("barcode")}
              data-food-command-target="barcode"
            >
              {copy.barcode}
            </Button>
            <Button
              variant="outlined"
              onClick={() => onOpenTarget("composer")}
              data-food-command-target="composer"
            >
              {copy.composer}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Star size={18} />}
              onClick={() => onOpenTarget("favorites")}
              data-food-command-target="favorites"
            >
              {copy.favorites}
            </Button>
            <Button
              variant="text"
              onClick={() => onOpenTarget("search")}
              data-food-command-target="search"
            >
              {copy.openSearch}
            </Button>
          </Stack>
        </Stack>

        {feedback ? <Alert severity="success">{feedback}</Alert> : null}
      </Stack>
    </Paper>
  );
};
