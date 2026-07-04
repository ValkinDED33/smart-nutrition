import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Product } from "@domain/products/types";
import type { AppDispatch, RootState } from "../../app/store";
import {
  playScanErrorSound,
  playScanSuccessSound,
} from "../../shared/lib/sound";
import { fetchProductByBarcode } from "../../shared/api/products";
import type { MealType } from "@domain/meal/types";
import { useLanguage } from "../../shared/language";
import { ProductCard } from "./ProductCard";
import { selectPersonalBarcodeProducts } from "./selectors";
import { getProductDisplayName } from "@domain/products/productDisplay";
import {
  PlatformApiError,
  submitCatalogSubmission,
} from "../../shared/api/platform";
import {
  getKnownProductCategoryOptions,
  getProductCategoryLabel,
} from "@domain/products/productCategory";
import { useAutoDismiss } from "../../shared/hooks/useAutoDismiss";
import { selectInputValue } from "../../shared/lib/inputSelection";
import {
  BARCODE_SCAN_NO_RESULT_TIMEOUT_MS,
  BARCODE_SCANNER_PREVIEW_ASPECT_RATIO,
  BARCODE_SCANNER_PREVIEW_MAX_HEIGHT_CSS,
  BARCODE_SCANNER_PREVIEW_MIN_HEIGHT_PX,
  MAX_MANUAL_PHOTO_BYTES,
  createBarcodeSearchUrls,
  createInitialBarcodeQuantity,
  createInitialCatalogSubmissionState,
  createManualCatalogSubmissionPayload,
  createManualBarcodeProduct,
  createManualDraft,
  isSafeManualImageDataUrl,
  isSupportedManualPhotoFile,
  normalizeBarcode,
  normalizeManualImageUrl,
  resolveCatalogNotice,
  resolveBarcodeScannerAvailability,
  type CatalogSubmissionState,
  type ManualDraft,
} from "./barcodeScannerModel";
import {
  addMealEntriesToCloud,
  rememberRecentMealProductInCloud,
  saveMealProductToCloud,
} from "./mealCloudSync";
import { createMealEntryDraft } from "./mealSaveModel";

interface Props {
  mealType: MealType;
}

type LookupState = "idle" | "success" | "not_found" | "error";

type TorchMediaTrackCapabilities = MediaTrackCapabilities & {
  torch?: boolean;
};

type TorchMediaTrackConstraintSet = MediaTrackConstraintSet & {
  torch?: boolean;
};

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
    cameraUnavailableTitle: "Камера недоступна в цьому браузері",
    cameraUnavailableBody:
      "Можна ввести штрихкод вручну або одразу додати продукт у спільну базу без сканування.",
    lowLightTitle: "Погане світло?",
    lowLightBody:
      "Підсвітіть упаковку, протріть камеру і тримайте код рівно в рамці. Якщо телефон підтримує ліхтарик, увімкніть його нижче.",
    torchOn: "Увімкнути світло",
    torchOff: "Вимкнути світло",
    torchUnavailable: "Ліхтарик недоступний у цьому браузері.",
    fallbackTitle: "Товар не знайдено автоматично",
    fallbackBody:
      "Спробуйте пошук у браузері або заповніть базові макроси вручну, щоб усе одно додати продукт.",
    searchOnline: "Пошук в інтернеті",
    searchHint: "Результати відкриються в новій вкладці.",
    retailerSearch: "Сторінки мереж",
    retailerHint:
      "Спробуйте пошук на офіційних сторінках магазинів, де часто є картки товарів з описом і харчовою цінністю.",
    google: "Google",
    auchan: "Auchan",
    biedronka: "Biedronka",
    manualOpen: "Заповнити вручну",
    manualClose: "Сховати форму",
    manualTitle: "Швидке ручне додавання",
    manualName: "Назва продукту",
    manualBrand: "Бренд",
    manualCategory: "Категорія",
    manualCategoryEmpty: "Без категорії",
    manualImageUrl: "Фото / URL упаковки",
    manualPhoto: "Додати фото упаковки",
    manualPhotoTooLarge: "Фото завелике. Виберіть файл до 1.2 MB.",
    manualPhotoInvalid: "Підтримуються тільки JPEG, PNG або WebP.",
    manualCalories: "Ккал на 100 г",
    manualProtein: "Білок на 100 г",
    manualFat: "Жири на 100 г",
    manualCarbs: "Вуглеводи на 100 г",
    manualAdd: "Створити і додати",
    manualAdded: "Продукт додано до прийому їжі та вашої бібліотеки",
    catalogSubmitting: "Відправляю продукт у спільну базу...",
    catalogConfirmed: "Спільна база прийняла продукт на модерацію.",
    catalogFailed:
      "Продукт збережено у вас, але спільна база зараз не прийняла зміни.",
    catalogRetry: "Спробувати ще раз",
    manualNameRequired: "Вкажіть назву продукту",
    detectedCode: "Розпізнаний код",
    scanHistory: "Історія сканів",
    scanHistoryEmpty: "Після сканування продукти з'являться тут.",
    useHistoryItem: "Використати",
    noResultTitle: "Код поки не розпізнано",
    noResultBody:
      "Можна спробувати ще раз із кращим світлом або перейти до ручного введення без втрати прогресу.",
    enterManually: "Ввести код вручну",
    addManually: "Додати продукт вручну",
    retryScanner: "Повторити сканування",
    soundOn: "Звук увімкнено",
    soundOff: "Звук вимкнено",
    muteSound: "Вимкнути звук сканера",
    unmuteSound: "Увімкнути звук сканера",
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
    cameraUnavailableTitle: "Kamera jest niedostępna w tej przeglądarce",
    cameraUnavailableBody:
      "Możesz wpisać kod ręcznie albo od razu dodać produkt do wspólnej bazy bez skanowania.",
    lowLightTitle: "Słabe światło?",
    lowLightBody:
      "Doświetl opakowanie, przetrzyj kamerę i trzymaj kod równo w ramce. Jeśli telefon obsługuje latarkę, włącz ją poniżej.",
    torchOn: "Włącz światło",
    torchOff: "Wyłącz światło",
    torchUnavailable: "Latarka nie jest dostępna w tej przeglądarce.",
    fallbackTitle: "Produkt nie został znaleziony automatycznie",
    fallbackBody:
      "Spróbuj wyszukiwania w przeglądarce albo wpisz podstawowe makro ręcznie, żeby mimo wszystko dodać produkt.",
    searchOnline: "Wyszukiwanie w internecie",
    searchHint: "Wyniki otworzą się w nowej karcie.",
    retailerSearch: "Strony sieci sklepów",
    retailerHint:
      "Sprawdź oficjalne strony sklepów, gdzie często są karty produktów z opisem i wartościami odżywczymi.",
    google: "Google",
    auchan: "Auchan",
    biedronka: "Biedronka",
    manualOpen: "Wypełnij ręcznie",
    manualClose: "Ukryj formularz",
    manualTitle: "Szybkie dodanie ręczne",
    manualName: "Nazwa produktu",
    manualBrand: "Marka",
    manualCategory: "Kategoria",
    manualCategoryEmpty: "Bez kategorii",
    manualImageUrl: "Zdjęcie / URL opakowania",
    manualPhoto: "Dodaj zdjęcie opakowania",
    manualPhotoTooLarge: "Zdjęcie jest zbyt duże. Wybierz plik do 1.2 MB.",
    manualPhotoInvalid: "Obsługiwane są tylko JPEG, PNG albo WebP.",
    manualCalories: "Kcal na 100 g",
    manualProtein: "Białko na 100 g",
    manualFat: "Tłuszcz na 100 g",
    manualCarbs: "Węglowodany na 100 g",
    manualAdd: "Utwórz i dodaj",
    manualAdded: "Produkt dodano do posiłku i Twojej biblioteki",
    catalogSubmitting: "Wysyłam produkt do wspólnej bazy...",
    catalogConfirmed: "Wspólna baza przyjęła produkt do moderacji.",
    catalogFailed:
      "Produkt został zapisany u Ciebie, ale wspólna baza nie przyjęła teraz zmian.",
    catalogRetry: "Spróbuj ponownie",
    manualNameRequired: "Podaj nazwę produktu",
    detectedCode: "Rozpoznany kod",
    scanHistory: "Historia skanów",
    scanHistoryEmpty: "Po skanowaniu produkty pojawią się tutaj.",
    useHistoryItem: "Użyj",
    noResultTitle: "Kod nie został jeszcze rozpoznany",
    noResultBody:
      "Możesz spróbować ponownie przy lepszym świetle albo przejść do ręcznego wpisania bez utraty postępu.",
    enterManually: "Wpisz kod ręcznie",
    addManually: "Dodaj produkt ręcznie",
    retryScanner: "Skanuj ponownie",
    soundOn: "Dźwięk włączony",
    soundOff: "Dźwięk wyciszony",
    muteSound: "Wycisz dźwięk skanera",
    unmuteSound: "Włącz dźwięk skanera",
  },
  en: {
    title: "Barcode scanner",
    subtitle:
      "Scan a product with the camera or enter the code manually. If the item is found, you can add it to the diary right away.",
    cameraHint:
      "Keep the barcode centered in the frame. If the product is not found, online search and a quick manual form will appear below.",
    barcode: "Barcode",
    grams: "Grams eaten",
    search: "Find and add",
    start: "Start scanner",
    stop: "Stop scanner",
    added: "Added to diary",
    notFound: "No product found for this code",
    failed: "Could not check barcode",
    preview: "Last found product",
    cameraIdle: "Camera preview will appear here after starting the scanner.",
    cameraFailed:
      "Could not start the camera. Check camera access or use manual search.",
    cameraUnavailableTitle: "Camera is unavailable in this browser",
    cameraUnavailableBody:
      "You can enter the barcode manually or add the product to the shared database without scanning.",
    lowLightTitle: "Bad lighting?",
    lowLightBody:
      "Light the package, clean the camera, and keep the code straight in the frame. If the phone supports torch, turn it on below.",
    torchOn: "Turn light on",
    torchOff: "Turn light off",
    torchUnavailable: "Torch is unavailable in this browser.",
    fallbackTitle: "Product was not found automatically",
    fallbackBody:
      "Try browser search or fill basic macros manually so you can still add the product.",
    searchOnline: "Search online",
    searchHint: "Results will open in a new tab.",
    retailerSearch: "Retailer pages",
    retailerHint:
      "Try official store pages where product cards often include descriptions and nutrition values.",
    google: "Google",
    auchan: "Auchan",
    biedronka: "Biedronka",
    manualOpen: "Fill manually",
    manualClose: "Hide form",
    manualTitle: "Quick manual add",
    manualName: "Product name",
    manualBrand: "Brand",
    manualCategory: "Category",
    manualCategoryEmpty: "No category",
    manualImageUrl: "Photo / package URL",
    manualPhoto: "Add package photo",
    manualPhotoTooLarge: "Photo is too large. Choose a file up to 1.2 MB.",
    manualPhotoInvalid: "Only JPEG, PNG, or WebP are supported.",
    manualCalories: "Kcal per 100 g",
    manualProtein: "Protein per 100 g",
    manualFat: "Fat per 100 g",
    manualCarbs: "Carbs per 100 g",
    manualAdd: "Create and add",
    manualAdded: "Product added to the meal and your library",
    catalogSubmitting: "Sending product to the shared catalog...",
    catalogConfirmed: "Shared catalog accepted the product for moderation.",
    catalogFailed:
      "Product is saved for you, but the shared catalog did not accept it right now.",
    catalogRetry: "Try again",
    manualNameRequired: "Enter product name",
    detectedCode: "Detected code",
    scanHistory: "Scan history",
    scanHistoryEmpty: "Products will appear here after scanning.",
    useHistoryItem: "Use",
    noResultTitle: "No barcode detected yet",
    noResultBody:
      "Try again with better light or switch to manual entry without losing progress.",
    enterManually: "Enter barcode manually",
    addManually: "Add product manually",
    retryScanner: "Retry scanner",
    soundOn: "Sound on",
    soundOff: "Sound muted",
    muteSound: "Mute scanner sound",
    unmuteSound: "Enable scanner sound",
  },
} as const;

const scannerPreviewSx = {
  position: "relative",
  overflow: "hidden",
  borderRadius: 1,
  border: "1px solid var(--sn-border-soft)",
  background:
    "linear-gradient(135deg, var(--sn-surface-glass) 0%, rgba(15, 118, 110, 0.10) 100%)",
  aspectRatio: BARCODE_SCANNER_PREVIEW_ASPECT_RATIO,
  minHeight: {
    xs: BARCODE_SCANNER_PREVIEW_MIN_HEIGHT_PX,
    sm: BARCODE_SCANNER_PREVIEW_MIN_HEIGHT_PX + 20,
  },
  maxHeight: {
    xs: BARCODE_SCANNER_PREVIEW_MAX_HEIGHT_CSS,
    sm: 420,
  },
  width: "100%",
  display: "grid",
  placeItems: "center",
} as const;

export const BarcodeScanner = ({ mealType }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noResultSoundPlayedRef = useRef(false);
  const lastScanRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);
  const dispatch = useDispatch<AppDispatch>();
  const meal = useSelector((state: RootState) => state.meal);
  const personalBarcodeProducts = useSelector(selectPersonalBarcodeProducts);
  const knownProducts = useSelector((state: RootState) => [
    ...state.meal.personalBarcodeProducts,
    ...state.meal.savedProducts,
    ...state.meal.recentProducts,
    ...state.meal.items.map((item) => item.product),
  ]);
  const [scanning, setScanning] = useState(false);
  const [scanTimedOut, setScanTimedOut] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState<number | "">(createInitialBarcodeQuantity);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [lookupState, setLookupState] = useState<LookupState>("idle");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDraft, setManualDraft] = useState<ManualDraft>(createManualDraft);
  const [catalogSubmissionState, setCatalogSubmissionState] =
    useState<CatalogSubmissionState>(createInitialCatalogSubmissionState);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannerSoundEnabled, setScannerSoundEnabled] = useState(true);
  const { appLanguage } = useLanguage();
  const copy = scannerCopy[appLanguage];
  const categoryOptions = useMemo(
    () => getKnownProductCategoryOptions(appLanguage),
    [appLanguage]
  );
  const catalogNotice = useMemo(
    () => resolveCatalogNotice(catalogSubmissionState, copy),
    [catalogSubmissionState, copy]
  );
  const cameraAvailability = useMemo(
    () =>
      resolveBarcodeScannerAvailability({
        hasMediaDevices: Boolean(globalThis.navigator?.mediaDevices?.getUserMedia),
        isSecureContext: globalThis.isSecureContext !== false,
      }),
    []
  );

  useAutoDismiss(Boolean(message), 2800, () => setMessage(null));

  const playScannerSuccess = useCallback(() => {
    if (scannerSoundEnabled) {
      playScanSuccessSound();
    }
  }, [scannerSoundEnabled]);

  const playScannerFailure = useCallback(() => {
    if (scannerSoundEnabled) {
      playScanErrorSound();
    }
  }, [scannerSoundEnabled]);

  const scanHistory = useMemo(() => {
    const seen = new Set<string>();

    return personalBarcodeProducts
      .filter((product) => Boolean(normalizeBarcode(product.barcode ?? "")))
      .filter((product) => {
        const barcode = normalizeBarcode(product.barcode ?? "");

        if (!barcode || seen.has(barcode)) {
          return false;
        }

        seen.add(barcode);
        return true;
      })
      .slice(0, 6);
  }, [personalBarcodeProducts]);

  const barcodeSearchUrls = useMemo(
    () => createBarcodeSearchUrls(barcodeInput),
    [barcodeInput]
  );
  const selectedQuantity =
    typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0
      ? quantity
      : null;

  const findKnownProductByBarcode = useCallback(
    (barcode: string) =>
      (personalBarcodeProducts.find(
        (product) => normalizeBarcode(product.barcode ?? "") === barcode
      ) ??
        knownProducts.find(
          (product) => normalizeBarcode(product.barcode ?? "") === barcode
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

  const clearNoResultTimeout = useCallback(() => {
    if (!noResultTimeoutRef.current) {
      return;
    }

    clearTimeout(noResultTimeoutRef.current);
    noResultTimeoutRef.current = null;
  }, []);

  const resetScanLock = useCallback(() => {
    clearCooldown();
    clearNoResultTimeout();
    lastScanRef.current = null;
    isProcessingRef.current = false;
    noResultSoundPlayedRef.current = false;
  }, [clearCooldown, clearNoResultTimeout]);

  const getVideoTrack = useCallback(() => {
    const stream = videoRef.current?.srcObject;

    if (!(stream instanceof MediaStream)) {
      return null;
    }

    return stream.getVideoTracks()[0] ?? null;
  }, []);

  const refreshTorchAvailability = useCallback(() => {
    const track = getVideoTrack();
    const capabilities = track?.getCapabilities?.() as
      | TorchMediaTrackCapabilities
      | undefined;

    setTorchAvailable(Boolean(capabilities?.torch));
  }, [getVideoTrack]);

  const toggleTorch = useCallback(async () => {
    const track = getVideoTrack();

    if (!track) {
      return;
    }

    const nextEnabled = !torchEnabled;

    try {
      await track.applyConstraints({
        advanced: [{ torch: nextEnabled } as TorchMediaTrackConstraintSet],
      });
      setTorchEnabled(nextEnabled);
      setTorchAvailable(true);
    } catch (error) {
      console.error(error);
      setTorchAvailable(false);
      setTorchEnabled(false);
    }
  }, [getVideoTrack, torchEnabled]);

  const stopScanner = useCallback(() => {
    resetScanLock();
    controlsRef.current?.stop();
    controlsRef.current = null;
    setTorchAvailable(false);
    setTorchEnabled(false);
    setScanTimedOut(false);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, [resetScanLock]);

  const resetLookupUi = useCallback(() => {
    setLookupState("idle");
    setFoundProduct(null);
    setShowManualForm(false);
    setCatalogSubmissionState(createInitialCatalogSubmissionState());
  }, []);

  const submitManualProductToCatalog = useCallback(
    async (payload: Parameters<typeof submitCatalogSubmission>[0]) => {
      setCatalogSubmissionState({ status: "submitting", payload });

      try {
        await submitCatalogSubmission(payload);
        setCatalogSubmissionState({ status: "confirmed" });
      } catch (error) {
        setCatalogSubmissionState({
          status: "failed",
          payload,
          message:
            error instanceof PlatformApiError ? error.message : copy.catalogRetry,
        });
      }
    },
    [copy.catalogRetry]
  );

  const handleLookup = useCallback(
    async (rawBarcode: string, autoAdd = false) => {
      const normalizedBarcode = normalizeBarcode(rawBarcode);

      if (!normalizedBarcode) {
        setLookupState("not_found");
        setFoundProduct(null);
        setShowManualForm(true);
        setMessage(copy.notFound);
        playScannerFailure();
        return;
      }

      setIsSearching(true);
      setLookupState("idle");
      setFoundProduct(null);
      setSaveError(null);

      try {
        const knownProduct = findKnownProductByBarcode(normalizedBarcode);
        const product =
          knownProduct ?? (await fetchProductByBarcode(normalizedBarcode));

        if (!product) {
          setLookupState("not_found");
          setFoundProduct(null);
          setShowManualForm(true);
          setMessage(copy.notFound);
          playScannerFailure();

          if (autoAdd) {
            stopScanner();
          }

          return;
        }

        setLookupState("success");
        setShowManualForm(false);
        setFoundProduct(product);
        const nextMeal = await rememberRecentMealProductInCloud(dispatch, meal, product);
        playScannerSuccess();

        if (autoAdd) {
          if (selectedQuantity === null) {
            setMessage(copy.grams);
            playScannerFailure();
            return;
          }

          await addMealEntriesToCloud(dispatch, nextMeal, [
            createMealEntryDraft({
              product,
              quantity: selectedQuantity,
              mealType,
              origin: "barcode",
            }),
          ]);
          stopScanner();
        }

        const displayName = getProductDisplayName(product, appLanguage);
        setMessage(autoAdd ? `${copy.added}: ${displayName}` : displayName);
      } catch (error) {
        console.error(error);
        setSaveError(
          error instanceof Error ? error.message : "Could not save meal to cloud."
        );
        setLookupState("error");
        setFoundProduct(null);
        setShowManualForm(true);
        setMessage(copy.failed);
        playScannerFailure();

        if (autoAdd) {
          stopScanner();
        }
      } finally {
        setIsSearching(false);
      }
    },
    [
      appLanguage,
      copy,
      dispatch,
      findKnownProductByBarcode,
      meal,
      mealType,
      playScannerFailure,
      playScannerSuccess,
      selectedQuantity,
      stopScanner,
    ]
  );

  useEffect(() => {
    if (!scanning || !videoRef.current) {
      return;
    }

    let disposed = false;
    const videoElement = videoRef.current;
    const codeReader = new BrowserMultiFormatReader();

    clearNoResultTimeout();
    noResultTimeoutRef.current = setTimeout(() => {
      if (!disposed) {
        setScanTimedOut(true);

        if (!noResultSoundPlayedRef.current) {
          noResultSoundPlayedRef.current = true;
          playScannerFailure();
        }
      }
    }, BARCODE_SCAN_NO_RESULT_TIMEOUT_MS);

    codeReader
      .decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoElement,
        async (result) => {
        if (disposed || !result || isProcessingRef.current) {
          return;
        }

        const code = result.getText().trim();
        if (!code || code === lastScanRef.current) {
          return;
        }

        lastScanRef.current = code;
        isProcessingRef.current = true;
        setScanTimedOut(false);
        clearNoResultTimeout();
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
        }, 900);
      }
      )
      .then((controls) => {
        if (disposed) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        window.setTimeout(refreshTorchAvailability, 250);
      })
      .catch((error) => {
        if (disposed) {
          return;
        }

        console.warn("Barcode scanner camera start failed", {
          name: error instanceof Error ? error.name : "unknown",
        });
        setLookupState("error");
        setMessage(copy.cameraFailed);
        setShowManualForm(true);
        playScannerFailure();
        setScanning(false);
        clearNoResultTimeout();
        resetScanLock();
      });

    return () => {
      disposed = true;
      resetScanLock();
      clearNoResultTimeout();
      controlsRef.current?.stop();
      controlsRef.current = null;
      videoElement.srcObject = null;
    };
  }, [
    clearCooldown,
    clearNoResultTimeout,
    copy.cameraFailed,
    handleLookup,
    playScannerFailure,
    refreshTorchAvailability,
    resetScanLock,
    scanning,
  ]);

  const handleStartScanner = () => {
    if (!cameraAvailability.available) {
      setLookupState("error");
      setMessage(copy.cameraUnavailableTitle);
      setShowManualForm(true);
      playScannerFailure();
      return;
    }

    setMessage(null);
    resetLookupUi();
    resetScanLock();
    setScanTimedOut(false);
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
      const rawValue = event.target.value;
      const parsedValue = Number(rawValue);
      const nextValue =
        field === "name" ||
        field === "brand" ||
        field === "category" ||
        field === "imageUrl"
          ? rawValue
          : rawValue === "" || !Number.isFinite(parsedValue)
            ? ""
            : Math.max(0, parsedValue);

      setManualDraft((current) => ({
        ...current,
        [field]: nextValue,
      }));
    };

  const handleManualPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isSupportedManualPhotoFile(file)) {
      setMessage(
        file.size > MAX_MANUAL_PHOTO_BYTES
          ? copy.manualPhotoTooLarge
          : copy.manualPhotoInvalid
      );
      playScannerFailure();
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (
        typeof reader.result === "string" &&
        isSafeManualImageDataUrl(reader.result)
      ) {
        setManualDraft((current) => ({ ...current, imageUrl: reader.result as string }));
        return;
      }

      setMessage(copy.manualPhotoInvalid);
      playScannerFailure();
    });
    reader.addEventListener("error", () => {
      setMessage(copy.manualPhotoInvalid);
      playScannerFailure();
    });
    reader.readAsDataURL(file);
  };

  const handleCreateManualProduct = async () => {
    const name = manualDraft.name.trim();

    if (!name) {
      setMessage(copy.manualNameRequired);
      playScannerFailure();
      return;
    }

    if (selectedQuantity === null) {
      setMessage(copy.grams);
      playScannerFailure();
      return;
    }

    setCatalogSubmissionState(createInitialCatalogSubmissionState());
    const normalizedBarcodeForId = normalizeBarcode(barcodeInput);
    const manualProduct = createManualBarcodeProduct({
      barcodeInput,
      draft: manualDraft,
      id:
        globalThis.crypto?.randomUUID?.() ??
        `manual-barcode-${normalizedBarcodeForId || Date.now()}`,
    });
    const { catalogImageUrl, category, normalizedBarcode, product } = manualProduct;

    setSaveError(null);

    try {
      let nextMeal = await rememberRecentMealProductInCloud(dispatch, meal, product);
      nextMeal = await saveMealProductToCloud(dispatch, nextMeal, product);
      await addMealEntriesToCloud(dispatch, nextMeal, [
        createMealEntryDraft({
          product,
          quantity: selectedQuantity,
          mealType,
          origin: "manual",
        }),
      ]);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
      playScannerFailure();
      return;
    }

    setFoundProduct(product);
    setLookupState("success");
    setShowManualForm(false);
    playScannerSuccess();
    setMessage(`${copy.manualAdded}: ${name}`);
    setManualDraft(createManualDraft());
    stopScanner();

    void submitManualProductToCatalog(
      createManualCatalogSubmissionPayload({
        catalogImageUrl,
        category,
        draft: manualDraft,
        name,
        normalizedBarcode,
        product,
      })
    );
  };

  const showFallback = (lookupState === "not_found" || lookupState === "error") && barcodeInput;
  const manualImagePreviewUrl = normalizeManualImageUrl(manualDraft.imageUrl);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
        scrollMarginBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {copy.title}
        </Typography>

        <Typography color="text.secondary">{copy.subtitle}</Typography>
        <Typography color="text.secondary" variant="body2">
          {copy.cameraHint}
        </Typography>

        {saveError ? (
          <Alert severity="error" onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        ) : null}

        {!cameraAvailability.available ? (
          <Alert severity="warning">
            <AlertTitle>{copy.cameraUnavailableTitle}</AlertTitle>
            <Stack spacing={1}>
              <Typography variant="body2">{copy.cameraUnavailableBody}</Typography>
              <Button
                variant="outlined"
                onClick={() => setShowManualForm(true)}
                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800 }}
              >
                {copy.manualOpen}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            label={copy.barcode}
            value={barcodeInput}
            onChange={(event) => handleBarcodeChange(event.target.value)}
            slotProps={{
              htmlInput: {
                enterKeyHint: "search",
                inputMode: "numeric",
                pattern: "[0-9]*",
              },
            }}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
          />
          <TextField
            type="text"
            label={copy.grams}
            value={quantity}
            slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            onChange={(event) => {
              const value = event.target.value;
              const nextQuantity = Number(value);
              setQuantity(
                value === "" || !Number.isFinite(nextQuantity)
                  ? ""
                  : Math.max(0, nextQuantity)
              );
            }}
            sx={{ width: { xs: "100%", md: 180 } }}
          />
          <Button
            variant="outlined"
            onClick={() => void handleLookup(barcodeInput, true)}
            disabled={isSearching || selectedQuantity === null}
            sx={{ width: { xs: "100%", md: 220 } }}
          >
            {copy.search}
          </Button>
        </Stack>

        <Box sx={scannerPreviewSx}>
          {scanning ? (
            <>
              <video
                ref={videoRef}
                style={{
                  display: "block",
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  maxHeight: "100%",
                  objectFit: "cover",
                }}
                autoPlay
                muted
                playsInline
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: { xs: 22, sm: 34 },
                  border: "2px solid rgba(255,255,255,0.92)",
                  borderRadius: 3,
                  boxShadow: "0 0 0 999px rgba(2, 6, 23, 0.38)",
                  pointerEvents: "none",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: 12,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  color: "#ffffff",
                  textAlign: "center",
                  fontWeight: 800,
                  bgcolor: "rgba(2, 6, 23, 0.68)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {copy.cameraHint}
              </Typography>
            </>
          ) : (
            <Stack
              spacing={1}
              alignItems="center"
              sx={{ px: 2, textAlign: "center" }}
            >
              <Typography sx={{ fontWeight: 800 }}>
                {copy.cameraIdle}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {copy.cameraHint}
              </Typography>
            </Stack>
          )}
        </Box>

        {scanTimedOut ? (
          <Alert severity="warning">
            <AlertTitle>{copy.noResultTitle}</AlertTitle>
            <Stack spacing={1.2}>
              <Typography variant="body2">{copy.noResultBody}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    resetScanLock();
                    setScanTimedOut(false);
                    noResultTimeoutRef.current = setTimeout(() => {
                      setScanTimedOut(true);
                    }, BARCODE_SCAN_NO_RESULT_TIMEOUT_MS);
                  }}
                >
                  {copy.retryScanner}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    stopScanner();
                    setShowManualForm(false);
                  }}
                >
                  {copy.enterManually}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    stopScanner();
                    setShowManualForm(true);
                  }}
                >
                  {copy.addManually}
                </Button>
              </Stack>
            </Stack>
          </Alert>
        ) : null}

        {scanning ? (
          <Alert severity="info">
            <AlertTitle>{copy.lowLightTitle}</AlertTitle>
            <Stack spacing={1}>
              <Typography variant="body2">{copy.lowLightBody}</Typography>
              {torchAvailable ? (
                <Button
                  variant="outlined"
                  onClick={() => {
                    void toggleTorch();
                  }}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {torchEnabled ? copy.torchOff : copy.torchOn}
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {copy.torchUnavailable}
                </Typography>
              )}
            </Stack>
          </Alert>
        ) : null}

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
          <Button
            variant="text"
            onClick={() => setScannerSoundEnabled((current) => !current)}
            aria-pressed={scannerSoundEnabled}
            sx={{
              width: { xs: "100%", sm: "auto" },
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            {scannerSoundEnabled ? copy.muteSound : copy.unmuteSound}
          </Button>
          <Chip
            size="small"
            label={scannerSoundEnabled ? copy.soundOn : copy.soundOff}
            color={scannerSoundEnabled ? "success" : "default"}
            variant={scannerSoundEnabled ? "filled" : "outlined"}
            sx={{ alignSelf: "center" }}
          />
        </Box>

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 800 }}>{copy.scanHistory}</Typography>
          {scanHistory.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              {copy.scanHistoryEmpty}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {scanHistory.map((product) => {
                const barcode = normalizeBarcode(product.barcode ?? "");
                const category = product.category ?? product.facts?.foodGroup;

                return (
                  <Paper
                    key={barcode}
                    variant="outlined"
                    sx={{ p: 1.25, borderRadius: 3 }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Stack spacing={0.4}>
                        <Typography sx={{ fontWeight: 700 }}>
                          {getProductDisplayName(product, appLanguage)}
                        </Typography>
                        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                          <Chip label={barcode} size="small" />
                          {category ? (
                            <Chip
                              label={getProductCategoryLabel(category, appLanguage)}
                              size="small"
                              variant="outlined"
                            />
                          ) : null}
                        </Stack>
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => {
                          setBarcodeInput(barcode);
                          setFoundProduct(product);
                          setLookupState("success");
                          void rememberRecentMealProductInCloud(
                            dispatch,
                            meal,
                            product
                          ).catch((error) => {
                            setSaveError(
                              error instanceof Error
                                ? error.message
                                : "Could not save meal to cloud."
                            );
                          });
                        }}
                      >
                        {copy.useHistoryItem}
                      </Button>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>

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
                  href={barcodeSearchUrls.google}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.google}
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
                  href={barcodeSearchUrls.auchan}
                  target="_blank"
                  rel="noreferrer"
                >
                  {copy.auchan}
                </Button>
                <Button
                  variant="outlined"
                  component="a"
                  href={barcodeSearchUrls.biedronka}
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

        {catalogNotice ? (
          <Alert
            severity={catalogNotice.severity}
            action={
              catalogNotice.retryable &&
              catalogSubmissionState.status === "failed" ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() =>
                    void submitManualProductToCatalog(catalogSubmissionState.payload)
                  }
                  sx={{ fontWeight: 800, textTransform: "none" }}
                >
                  {copy.catalogRetry}
                </Button>
              ) : undefined
            }
          >
            {catalogNotice.text}
          </Alert>
        ) : null}

        {showManualForm ? (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
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
              <TextField
                fullWidth
                select
                label={copy.manualCategory}
                value={manualDraft.category}
                onChange={handleManualChange("category")}
              >
                <MenuItem value="">{copy.manualCategoryEmpty}</MenuItem>
                {categoryOptions.map((option) => (
                  <MenuItem key={option.key} value={option.key}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label={copy.manualImageUrl}
                value={manualDraft.imageUrl}
                onChange={handleManualChange("imageUrl")}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button
                  component="label"
                  variant="outlined"
                  sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
                >
                  {copy.manualPhoto}
                  <input
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={handleManualPhotoChange}
                  />
                </Button>
                {manualImagePreviewUrl ? (
                  <Box
                    component="img"
                    src={manualImagePreviewUrl}
                    alt={manualDraft.name || copy.manualImageUrl}
                    sx={{
                      width: { xs: "100%", sm: 136 },
                      height: 92,
                      objectFit: "cover",
                      borderRadius: 2,
                      border: "1px solid rgba(15, 23, 42, 0.12)",
                    }}
                  />
                ) : null}
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField
                  fullWidth
                  type="text"
                  label={copy.manualCalories}
                  value={manualDraft.calories}
                  slotProps={{
                    htmlInput: { inputMode: "decimal", enterKeyHint: "next" },
                  }}
                  onFocus={(event) => selectInputValue(event.target)}
                  onClick={(event) => selectInputValue(event.currentTarget)}
                  onChange={handleManualChange("calories")}
                />
                <TextField
                  fullWidth
                  type="text"
                  label={copy.manualProtein}
                  value={manualDraft.protein}
                  slotProps={{
                    htmlInput: { inputMode: "decimal", enterKeyHint: "next" },
                  }}
                  onFocus={(event) => selectInputValue(event.target)}
                  onClick={(event) => selectInputValue(event.currentTarget)}
                  onChange={handleManualChange("protein")}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField
                  fullWidth
                  type="text"
                  label={copy.manualFat}
                  value={manualDraft.fat}
                  slotProps={{
                    htmlInput: { inputMode: "decimal", enterKeyHint: "next" },
                  }}
                  onFocus={(event) => selectInputValue(event.target)}
                  onClick={(event) => selectInputValue(event.currentTarget)}
                  onChange={handleManualChange("fat")}
                />
                <TextField
                  fullWidth
                  type="text"
                  label={copy.manualCarbs}
                  value={manualDraft.carbs}
                  slotProps={{
                    htmlInput: { inputMode: "decimal", enterKeyHint: "done" },
                  }}
                  onFocus={(event) => selectInputValue(event.target)}
                  onClick={(event) => selectInputValue(event.currentTarget)}
                  onChange={handleManualChange("carbs")}
                />
              </Stack>

              <Button
                variant="contained"
                onClick={() => void handleCreateManualProduct()}
                disabled={!manualDraft.name.trim() || selectedQuantity === null}
              >
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

        {message ? (
          <Alert
            onClose={() => setMessage(null)}
            severity={lookupState === "error" ? "error" : "info"}
            variant="filled"
          >
            {message}
          </Alert>
        ) : null}
      </Stack>
    </Paper>
  );
};
