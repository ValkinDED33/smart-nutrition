import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Product } from "../../shared/types/product";
import type { AppDispatch, RootState } from "../../app/store";
import {
  playScanErrorSound,
  playScanSuccessSound,
} from "../../shared/lib/sound";
import { fetchProductByBarcode } from "../../shared/api/products";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";
import { ProductCard } from "./ProductCard";
import { addProduct, rememberRecentProduct, saveProduct } from "./mealSlice";
import { selectPersonalBarcodeProducts } from "./selectors";
import { getProductDisplayName } from "../../shared/lib/productDisplay";
import { createEmptyNutrients } from "../../shared/lib/nutrients";

interface Props {
  mealType: MealType;
}

type LookupState = "idle" | "success" | "not_found" | "error";

type ManualDraft = {
  name: string;
  brand: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

const createManualDraft = (): ManualDraft => ({
  name: "",
  brand: "",
  calories: 0,
  protein: 0,
  fat: 0,
  carbs: 0,
});

const scannerCopy = {
  uk: {
    title: "Сканер штрихкодів",
    subtitle:
      "Скануйте продукт камерою або введіть код вручну. Якщо товар знайдеться, його можна одразу додати в щоденник.",
    cameraHint:
      "Тримайте штрихкод по центру кадру. Якщо товар не знайдеться, нижче з'являться інтернет-пошук і швидка ручна форма.",
    barcode: "Штрихкод",
    grams: "З'їдено грамів",
    search: "Знайти і додати",
    start: "Запустити сканер",
    stop: "Зупинити сканер",
    added: "Додано до щоденника",
    notFound: "Продукт за цим кодом не знайдено",
    failed: "Не вдалося перевірити штрихкод",
    preview: "Останній знайдений продукт",
    cameraIdle: "Після запуску сканера тут з'явиться камера.",
    cameraFailed:
      "Не вдалося запустити камеру. Перевірте доступ до камери або скористайтеся ручним пошуком.",
    fallbackTitle: "Товар не знайдено автоматично",
    fallbackBody:
      "Спробуйте пошук у браузері або заповніть базові макроси вручну, щоб усе одно додати продукт.",
    searchOnline: "Пошук в інтернеті",
    searchHint: "Результати відкриються в новій вкладці.",
    retailerSearch: "Сторінки мереж",
    retailerHint:
      "Спробуйте пошук на офіційних сторінках магазинів, де часто є картки товарів з описом і харчовою цінністю.",
    google: "Google",
    openFoodFacts: "OpenFoodFacts",
    auchan: "Auchan",
    biedronka: "Biedronka",
    manualOpen: "Заповнити вручну",
    manualClose: "Сховати форму",
    manualTitle: "Швидке ручне додавання",
    manualName: "Назва продукту",
    manualBrand: "Бренд",
    manualCalories: "Ккал на 100 г",
    manualProtein: "Білок на 100 г",
    manualFat: "Жири на 100 г",
    manualCarbs: "Вуглеводи на 100 г",
    manualAdd: "Створити і додати",
    manualAdded: "Ручний продукт додано",
    manualNameRequired: "Вкажіть назву продукту",
    detectedCode: "Розпізнаний код",
  },
  pl: {
    title: "Skaner kodów kreskowych",
    subtitle:
      "Zeskanuj produkt kamerą albo wpisz kod ręcznie. Jeśli znajdziemy produkt, możesz od razu dodać go do dziennika.",
    cameraHint:
      "Trzymaj kod na środku kadru. Jeśli produkt nie zostanie znaleziony, poniżej pojawi się wyszukiwanie internetowe i szybki formularz ręczny.",
    barcode: "Kod kreskowy",
    grams: "Ilość zjedzona (g)",
    search: "Znajdź i dodaj",
    start: "Uruchom skaner",
    stop: "Zatrzymaj skaner",
    added: "Dodano do dziennika",
    notFound: "Nie znaleziono produktu po tym kodzie",
    failed: "Nie udało się sprawdzić kodu kreskowego",
    preview: "Ostatnio znaleziony produkt",
    cameraIdle: "Po uruchomieniu skanera pojawi się tutaj podgląd kamery.",
    cameraFailed:
      "Nie udało się uruchomić kamery. Sprawdź dostęp do kamery albo skorzystaj z wyszukiwania ręcznego.",
    fallbackTitle: "Produkt nie został znaleziony automatycznie",
    fallbackBody:
      "Spróbuj wyszukiwania w przeglądarce albo wpisz podstawowe makro ręcznie, żeby mimo wszystko dodać produkt.",
    searchOnline: "Wyszukiwanie w internecie",
    searchHint: "Wyniki otworzą się w nowej karcie.",
    retailerSearch: "Strony sieci sklepów",
    retailerHint:
      "Sprawdź oficjalne strony sklepów, gdzie często są karty produktów z opisem i wartościami odżywczymi.",
    google: "Google",
    openFoodFacts: "OpenFoodFacts",
    auchan: "Auchan",
    biedronka: "Biedronka",
    manualOpen: "Wypełnij ręcznie",
    manualClose: "Ukryj formularz",
    manualTitle: "Szybkie dodanie ręczne",
    manualName: "Nazwa produktu",
    manualBrand: "Marka",
    manualCalories: "Kcal na 100 g",
    manualProtein: "Białko na 100 g",
    manualFat: "Tłuszcz na 100 g",
    manualCarbs: "Węglowodany na 100 g",
    manualAdd: "Utwórz i dodaj",
    manualAdded: "Ręczny produkt został dodany",
    manualNameRequired: "Podaj nazwę produktu",
    detectedCode: "Rozpoznany kod",
  },
} as const;

export const BarcodeScanner = ({ mealType }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScanRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const personalBarcodeProducts = useSelector(selectPersonalBarcodeProducts);
  const knownProducts = useSelector((state: RootState) => [
    ...state.meal.personalBarcodeProducts,
    ...state.meal.savedProducts,
    ...state.meal.recentProducts,
    ...state.meal.items.map((item) => item.product),
  ]);
  const [scanning, setScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDraft, setManualDraft] = useState<ManualDraft>(createManualDraft);
  const { language } = useLanguage();
  const copy = scannerCopy[language];

  const googleSearchUrl = useMemo(() => {
    const normalizedBarcode = barcodeInput.replace(/\D/g, "");
    if (!normalizedBarcode) {
      return "#";
    }

    return `https://www.google.com/search?q=${encodeURIComponent(
      `${normalizedBarcode} nutrition facts`
    )}`;
  }, [barcodeInput]);

  const openFoodFactsUrl = useMemo(() => {
    const normalizedBarcode = barcodeInput.replace(/\D/g, "");
    if (!normalizedBarcode) {
      return "#";
    }

    return `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      normalizedBarcode
    )}&search_simple=1&action=process`;
  }, [barcodeInput]);

  const auchanSearchUrl = useMemo(() => {
    const normalizedBarcode = barcodeInput.replace(/\D/g, "");
    if (!normalizedBarcode) {
      return "#";
    }

    return `https://www.google.com/search?q=${encodeURIComponent(
      `site:zakupy.auchan.pl ${normalizedBarcode}`
    )}`;
  }, [barcodeInput]);

  const biedronkaSearchUrl = useMemo(() => {
    const normalizedBarcode = barcodeInput.replace(/\D/g, "");
    if (!normalizedBarcode) {
      return "#";
    }

    return `https://www.google.com/search?q=${encodeURIComponent(
      `site:zakupy.biedronka.pl ${normalizedBarcode}`
    )}`;
  }, [barcodeInput]);

  const findKnownProductByBarcode = useCallback(
    (barcode: string) =>
      (personalBarcodeProducts.find(
        (product) => product.barcode?.replace(/\D/g, "") === barcode
      ) ??
        knownProducts.find(
          (product) => product.barcode?.replace(/\D/g, "") === barcode
        ) ??
        null),
    [knownProducts, personalBarcodeProducts]
  );

  const clearCooldown = useCallback(() => {
    if (!cooldownRef.current) {
      return;
    }

    clearTimeout(cooldownRef.current);
    cooldownRef.current = null;
  }, []);

  const resetScanLock = useCallback(() => {
    clearCooldown();
    lastScanRef.current = null;
    isProcessingRef.current = false;
  }, [clearCooldown]);

  const stopScanner = useCallback(() => {
    resetScanLock();
    controlsRef.current?.stop();
    controlsRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, [resetScanLock]);

  const resetLookupUi = useCallback(() => {
    setLookupState("idle");
    setFoundProduct(null);
    setShowManualForm(false);
  }, []);

  const handleLookup = useCallback(
    async (rawBarcode: string, autoAdd = false) => {
      const normalizedBarcode = rawBarcode.replace(/\D/g, "");

      if (!normalizedBarcode) {
        setLookupState("not_found");
        setFoundProduct(null);
        setShowManualForm(true);
        setMessage(copy.notFound);
        playScanErrorSound();
        return;
      }

      setIsSearching(true);
      setLookupState("idle");
      setFoundProduct(null);

      try {
        const knownProduct = findKnownProductByBarcode(normalizedBarcode);
        const product =
          knownProduct ?? (await fetchProductByBarcode(normalizedBarcode));

        if (!product) {
          setLookupState("not_found");
          setFoundProduct(null);
          setShowManualForm(true);
          setMessage(copy.notFound);
          playScanErrorSound();

          if (autoAdd) {
            stopScanner();
          }

          return;
        }

        setLookupState("success");
        setShowManualForm(false);
        setFoundProduct(product);
        dispatch(rememberRecentProduct(product));
        playScanSuccessSound();

        if (autoAdd) {
          dispatch(
            addProduct({
              product,
              quantity,
              mealType,
              origin: "barcode",
            })
          );
          stopScanner();
        }

        const displayName = getProductDisplayName(product, language);
        setMessage(autoAdd ? `${copy.added}: ${displayName}` : displayName);
      } catch (error) {
        console.error(error);
        setLookupState("error");
        setFoundProduct(null);
        setShowManualForm(true);
        setMessage(copy.failed);
        playScanErrorSound();

        if (autoAdd) {
          stopScanner();
        }
      } finally {
        setIsSearching(false);
      }
    },
    [copy, dispatch, findKnownProductByBarcode, language, mealType, quantity, stopScanner]
  );

  useEffect(() => {
    if (!scanning || !videoRef.current) {
      return;
    }

    let disposed = false;
    const videoElement = videoRef.current;
    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .decodeFromVideoDevice(undefined, videoElement, async (result) => {
        if (disposed || !result || isProcessingRef.current) {
          return;
        }

        const code = result.getText().trim();
        if (!code || code === lastScanRef.current) {
          return;
        }

        lastScanRef.current = code;
        isProcessingRef.current = true;
        setBarcodeInput(code);

        await handleLookup(code, true);

        if (disposed || !controlsRef.current) {
          resetScanLock();
          return;
        }

        clearCooldown();
        cooldownRef.current = setTimeout(() => {
          lastScanRef.current = null;
          isProcessingRef.current = false;
          cooldownRef.current = null;
        }, 1800);
      })
      .then((controls) => {
        if (disposed) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
      })
      .catch((error) => {
        if (disposed) {
          return;
        }

        console.error(error);
        setLookupState("error");
        setMessage(copy.cameraFailed);
        playScanErrorSound();
        setScanning(false);
        resetScanLock();
      });

    return () => {
      disposed = true;
      resetScanLock();
      controlsRef.current?.stop();
      controlsRef.current = null;
      videoElement.srcObject = null;
    };
  }, [clearCooldown, copy.cameraFailed, handleLookup, resetScanLock, scanning]);

  const handleStartScanner = () => {
    setMessage(null);
    resetLookupUi();
    resetScanLock();
    setScanning(true);
  };

  const handleBarcodeChange = (value: string) => {
    setBarcodeInput(value);

    if (lookupState !== "idle" || foundProduct) {
      resetLookupUi();
    }
  };

  const handleManualChange =
    (field: keyof ManualDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === "name" || field === "brand"
          ? event.target.value
          : Math.max(0, Number(event.target.value) || 0);

      setManualDraft((current) => ({
        ...current,
        [field]: nextValue,
      }));
    };

  const handleCreateManualProduct = () => {
    const name = manualDraft.name.trim();

    if (!name) {
      setMessage(copy.manualNameRequired);
      playScanErrorSound();
      return;
    }

    const nutrients = createEmptyNutrients();
    nutrients.calories = manualDraft.calories;
    nutrients.protein = manualDraft.protein;
    nutrients.fat = manualDraft.fat;
    nutrients.carbs = manualDraft.carbs;

    const normalizedBarcode = barcodeInput.replace(/\D/g, "");
    const product: Product = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `manual-barcode-${normalizedBarcode || Date.now()}`,
      name,
      brand: manualDraft.brand.trim() || undefined,
      barcode: normalizedBarcode || undefined,
      unit: "g",
      source: "Manual",
      nutrients,
    };

    setFoundProduct(product);
    setLookupState("success");
    setShowManualForm(false);
    dispatch(rememberRecentProduct(product));
    dispatch(saveProduct(product));
    dispatch(
      addProduct({
        product,
        quantity,
        mealType,
        origin: "manual",
      })
    );
    playScanSuccessSound();
    setMessage(`${copy.manualAdded}: ${name}`);
    setManualDraft(createManualDraft());
    stopScanner();
  };

  const showFallback = (lookupState === "not_found" || lookupState === "error") && barcodeInput;

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
          {copy.title}
        </Typography>

        <Typography color="text.secondary">{copy.subtitle}</Typography>
        <Typography color="text.secondary" variant="body2">
          {copy.cameraHint}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            label={copy.barcode}
            value={barcodeInput}
            onChange={(event) => handleBarcodeChange(event.target.value)}
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "[0-9]*",
              },
            }}
          />
          <TextField
            type="number"
            label={copy.grams}
            value={quantity}
            onChange={(event) =>
              setQuantity(Math.max(1, Number(event.target.value) || 1))
            }
            sx={{ width: { xs: "100%", md: 180 } }}
          />
          <Button
            variant="outlined"
            onClick={() => void handleLookup(barcodeInput, true)}
            disabled={isSearching}
            sx={{ width: { xs: "100%", md: 220 } }}
          >
            {copy.search}
          </Button>
        </Stack>

        {scanning ? (
          <video
            ref={videoRef}
            style={{
              width: "100%",
              borderRadius: 16,
              background: "#000",
              minHeight: 220,
            }}
            autoPlay
            muted
            playsInline
          />
        ) : (
          <Box
            sx={{
              minHeight: 220,
              borderRadius: 4,
              border: "1px dashed rgba(15, 23, 42, 0.18)",
              background:
                "linear-gradient(135deg, rgba(240,249,255,0.86) 0%, rgba(236,253,245,0.88) 100%)",
              display: "grid",
              placeItems: "center",
              px: 2,
              textAlign: "center",
            }}
          >
            <Typography color="text.secondary">{copy.cameraIdle}</Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {!scanning ? (
            <Button
              variant="contained"
              onClick={handleStartScanner}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {copy.start}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={stopScanner}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {copy.stop}
            </Button>
          )}
        </Box>

        {showFallback ? (
          <Alert severity={lookupState === "error" ? "error" : "warning"}>
            <AlertTitle>{copy.fallbackTitle}</AlertTitle>
            <Stack spacing={1.5}>
              <Typography variant="body2">{copy.fallbackBody}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {copy.detectedCode}: {barcodeInput}
              </Typography>

              <Stack spacing={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {copy.searchOnline}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.searchHint}
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="outlined"
                  component="a"
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.google}
                </Button>
                <Button
                  variant="outlined"
                  component="a"
                  href={openFoodFactsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.openFoodFacts}
                </Button>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {copy.retailerSearch}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.retailerHint}
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="outlined"
                  component="a"
                  href={auchanSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.auchan}
                </Button>
                <Button
                  variant="outlined"
                  component="a"
                  href={biedronkaSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.biedronka}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setShowManualForm((current) => !current)}
                >
                  {showManualForm ? copy.manualClose : copy.manualOpen}
                </Button>
              </Stack>
            </Stack>
          </Alert>
        ) : null}

        {showManualForm ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 4,
              borderColor: "rgba(15, 23, 42, 0.12)",
            }}
          >
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 800 }}>{copy.manualTitle}</Typography>

              <TextField
                fullWidth
                label={copy.manualName}
                value={manualDraft.name}
                onChange={handleManualChange("name")}
              />
              <TextField
                fullWidth
                label={copy.manualBrand}
                value={manualDraft.brand}
                onChange={handleManualChange("brand")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField
                  fullWidth
                  type="number"
                  label={copy.manualCalories}
                  value={manualDraft.calories}
                  onChange={handleManualChange("calories")}
                />
                <TextField
                  fullWidth
                  type="number"
                  label={copy.manualProtein}
                  value={manualDraft.protein}
                  onChange={handleManualChange("protein")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField
                  fullWidth
                  type="number"
                  label={copy.manualFat}
                  value={manualDraft.fat}
                  onChange={handleManualChange("fat")}
                />
                <TextField
                  fullWidth
                  type="number"
                  label={copy.manualCarbs}
                  value={manualDraft.carbs}
                  onChange={handleManualChange("carbs")}
                />
              </Stack>

              <Button variant="contained" onClick={handleCreateManualProduct}>
                {copy.manualAdd}
              </Button>
            </Stack>
          </Paper>
        ) : null}

        {foundProduct ? (
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 800 }}>{copy.preview}</Typography>
            <ProductCard product={foundProduct} mealType={mealType} origin="barcode" />
          </Stack>
        ) : null}
      </Stack>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2800}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={lookupState === "error" ? "error" : "info"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
