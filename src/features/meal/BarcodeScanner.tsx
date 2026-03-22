import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Product } from "../../shared/types/product";
import type { AppDispatch } from "../../app/store";
import { playScanSound } from "../../shared/lib/sound";
import { fetchProductByBarcode } from "../../shared/api/products";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";
import { ProductCard } from "./ProductCard";
import { addProduct, rememberRecentProduct } from "./mealSlice";
import { getProductDisplayName } from "../../shared/lib/productDisplay";

interface Props {
  mealType: MealType;
}

export const BarcodeScanner = ({ mealType }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [scanning, setScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const { language } = useLanguage();

  const text =
    language === "pl"
      ? {
          title: "Skaner kodów kreskowych",
          subtitle:
            "Zeskanuj produkt lub wpisz kod ręcznie. Po znalezieniu produkt od razu trafi do dziennika i zostanie pokazany poniżej.",
          cameraHint:
            "Podaj zjedzoną ilość w gramach. Przy skanowaniu kamerą produkt dodaje się automatycznie po rozpoznaniu.",
          barcode: "Kod kreskowy",
          grams: "Ilość zjedzona (g)",
          search: "Znajdź i dodaj",
          start: "Uruchom skaner",
          stop: "Zatrzymaj skaner",
          added: "Dodano do dziennika",
          notFound: "Nie znaleziono produktu po tym kodzie",
          failed: "Błąd podczas wyszukiwania produktu",
          preview: "Ostatnio znaleziony produkt",
          cameraIdle: "Po uruchomieniu skanera pojawi się tutaj podgląd kamery.",
        }
      : {
          title: "Сканер штрихкодів",
          subtitle:
            "Відскануй продукт або введи код вручну. Після пошуку товар одразу потрапить у щоденник і з'явиться нижче.",
          cameraHint:
            "Вкажи, скільки грамів було з'їдено. При скануванні камерою продукт додається автоматично після розпізнавання.",
          barcode: "Штрихкод",
          grams: "З'їдено грамів",
          search: "Знайти і додати",
          start: "Запустити сканер",
          stop: "Зупинити сканер",
          added: "Додано до щоденника",
          notFound: "Продукт за цим кодом не знайдено",
          failed: "Помилка під час пошуку продукту",
          preview: "Останній знайдений продукт",
          cameraIdle: "Після запуску сканера тут з'явиться камера.",
        };

  const stopScanner = useCallback(() => {
    setScanning(false);
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const handleLookup = useCallback(
    async (rawBarcode: string, autoAdd = false) => {
      const normalizedBarcode = rawBarcode.replace(/\D/g, "");

      if (!normalizedBarcode) {
        setMessage(text.notFound);
        setFoundProduct(null);
        return;
      }

      setIsSearching(true);

      try {
        const product = await fetchProductByBarcode(normalizedBarcode);

        if (!product) {
          setFoundProduct(null);
          setMessage(text.notFound);
          return;
        }

        setFoundProduct(product);
        dispatch(rememberRecentProduct(product));

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
        setMessage(
          autoAdd ? `${text.added}: ${displayName}` : `${displayName}`
        );
      } catch (error) {
        console.error(error);
        setFoundProduct(null);
        setMessage(text.failed);
      } finally {
        setIsSearching(false);
      }
    },
    [dispatch, language, mealType, quantity, stopScanner, text.added, text.failed, text.notFound]
  );

  useEffect(() => {
    if (!scanning || !videoRef.current) {
      return;
    }

    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current, async (result) => {
        if (!result) {
          return;
        }

        const code = result.getText();
        if (code === lastScan) {
          return;
        }

        setLastScan(code);
        setBarcodeInput(code);
        playScanSound();
        await handleLookup(code, true);
        setTimeout(() => setLastScan(null), 1800);
      })
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch((error) => {
        console.error(error);
        setMessage(text.failed);
        setScanning(false);
      });

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [handleLookup, lastScan, scanning, text.failed]);

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
          {text.title}
        </Typography>

        <Typography color="text.secondary">{text.subtitle}</Typography>
        <Typography color="text.secondary" variant="body2">
          {text.cameraHint}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            label={text.barcode}
            value={barcodeInput}
            onChange={(event) => setBarcodeInput(event.target.value)}
          />
          <TextField
            type="number"
            label={text.grams}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            sx={{ width: { xs: "100%", md: 180 } }}
          />
          <Button
            variant="outlined"
            onClick={() => void handleLookup(barcodeInput, true)}
            disabled={isSearching}
            sx={{ width: { xs: "100%", md: 220 } }}
          >
            {text.search}
          </Button>
        </Stack>

        {scanning ? (
          <video
            ref={videoRef}
            style={{ width: "100%", borderRadius: 16, background: "#000", minHeight: 220 }}
            autoPlay
            muted
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
            <Typography color="text.secondary">{text.cameraIdle}</Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {!scanning ? (
            <Button
              variant="contained"
              onClick={() => setScanning(true)}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {text.start}
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="error"
              onClick={stopScanner}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {text.stop}
            </Button>
          )}
        </Box>

        {foundProduct ? (
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 800 }}>{text.preview}</Typography>
            <ProductCard product={foundProduct} mealType={mealType} origin="barcode" />
          </Stack>
        ) : null}
      </Stack>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={2500}
        onClose={() => setMessage(null)}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
