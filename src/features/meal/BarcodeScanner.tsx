import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";

import { useDispatch } from "react-redux";
import { addProduct } from "./mealSlice";
import type { AppDispatch } from "../../app/store";
import { playScanSound } from "../../shared/lib/sound";
import { fetchProductByBarcode } from "../../shared/api/products";
import { Button, Snackbar, Alert, Box } from "@mui/material";
import type { Product } from "../../shared/types/product";

export const BarcodeScanner = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning) return;

    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current!, async (result) => {
        if (!result) return;

        const code = result.getText();
        if (code === lastScan) return;

        setLastScan(code);
        playScanSound();

        try {
          const product: Product | null = await fetchProductByBarcode(code);

          if (product) {
            // TS: обов'язково обгорнути product у поле product
            dispatch(addProduct({ product, quantity: 100 }));
            setMessage(`Продукт "${product.name}" додано`);
          } else {
            setMessage("Продукт не знайдено");
          }
        } catch (error) {
          console.error(error);
          setMessage("Помилка при пошуку продукту");
        }

        // Скидання останнього сканування через 2 сек
        setTimeout(() => setLastScan(null), 2000);
      })
      .then((controls) => {
        controlsRef.current = controls;
      });

    return () => {
      // зупинка сканування при демонтіванні
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [scanning, dispatch, lastScan]);

  const handleStart = () => setScanning(true);

  const handleStop = () => {
    setScanning(false);
    controlsRef.current?.stop();
    controlsRef.current = null;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <video
        ref={videoRef}
        style={{ width: "100%", borderRadius: 12, background: "#000" }}
        autoPlay
        muted
      />

      <Box sx={{ display: "flex", gap: 2 }}>
        {!scanning ? (
          <Button variant="contained" onClick={handleStart}>
            Почати сканування
          </Button>
        ) : (
          <Button variant="outlined" color="error" onClick={handleStop}>
            Зупинити
          </Button>
        )}
      </Box>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3000}
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
    </Box>
  );
};
