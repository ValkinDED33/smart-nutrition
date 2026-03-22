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
import { addProduct } from "./mealSlice";
import type { AppDispatch } from "../../app/store";
import { playScanSound } from "../../shared/lib/sound";
import { fetchProductByBarcode } from "../../shared/api/products";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";

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
  const [quantity, setQuantity] = useState(100);
  const [barcodeInput, setBarcodeInput] = useState("");
  const { language } = useLanguage();

  const text =
    language === "pl"
      ? {
          title: "Skaner kodów kreskowych",
          subtitle:
            "Zeskanuj produkt ze sklepu i wpisz, ile gramów zostało zjedzone.",
          cameraHint:
            "Jeśli kamera nie działa, wpisz kod ręcznie i dodaj produkt bez skanera.",
          barcode: "Kod kreskowy",
          grams: "Zjedzona ilość (g)",
          search: "Znajdź produkt",
          start: "Uruchom skaner",
          stop: "Zatrzymaj skaner",
          added: "dodano do dziennika",
          notFound: "Nie znaleziono produktu po kodzie",
          failed: "Błąd podczas wyszukiwania produktu",
        }
      : {
          title: "Сканер штрихкодів",
          subtitle:
            "Відскануй магазинний продукт і вкажи, скільки грамів було з'їдено.",
          cameraHint:
            "Якщо камера не працює, введи код вручну і додай продукт без сканера.",
          barcode: "Штрихкод",
          grams: "З'їдено грамів",
          search: "Знайти продукт",
          start: "Запустити сканер",
          stop: "Зупинити сканер",
          added: "додано до щоденника",
          notFound: "Продукт за штрихкодом не знайдено",
          failed: "Помилка під час пошуку продукту",
        };

  const handleLookup = useCallback(
    async (rawBarcode: string) => {
      const normalizedBarcode = rawBarcode.replace(/\D/g, "");

      if (!normalizedBarcode) {
        setMessage(text.notFound);
        return;
      }

      setIsSearching(true);

      try {
        const product = await fetchProductByBarcode(normalizedBarcode);

        if (product) {
          dispatch(
            addProduct({
              product,
              quantity,
              mealType,
              origin: "barcode",
            })
          );
          setMessage(`${product.name} ${text.added}`);
          setBarcodeInput("");
        } else {
          setMessage(text.notFound);
        }
      } catch (error) {
        console.error(error);
        setMessage(text.failed);
      } finally {
        setIsSearching(false);
      }
    },
    [dispatch, mealType, quantity, text.added, text.failed, text.notFound]
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
        await handleLookup(code);
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

  const handleStop = () => {
    setScanning(false);
    controlsRef.current?.stop();
    controlsRef.current = null;
  };

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
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            sx={{ width: { xs: "100%", md: 220 } }}
          />
        </Stack>

        <Button
          variant="outlined"
          onClick={() => void handleLookup(barcodeInput)}
          disabled={isSearching}
          sx={{ width: { xs: "100%", sm: "auto" }, alignSelf: "flex-start" }}
        >
          {text.search}
        </Button>

        <video
          ref={videoRef}
          style={{ width: "100%", borderRadius: 16, background: "#000", minHeight: 220 }}
          autoPlay
          muted
        />

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
              onClick={handleStop}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {text.stop}
            </Button>
          )}
        </Box>
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
