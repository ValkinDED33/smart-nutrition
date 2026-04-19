import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });

const photoCopy = {
  uk: {
    title: "Р¤РѕС‚Рѕ СЃС‚СЂР°РІРё",
    subtitle:
      "Р—Р°РІР°РЅС‚Р°Р¶С‚Рµ С„РѕС‚Рѕ С„Р°Р№Р»РѕРј. РљР°РјРµСЂСѓ РґР»СЏ С†СЊРѕРіРѕ Р±Р»РѕРєСѓ РЅРµ РІРёРєРѕСЂРёСЃС‚РѕРІСѓС”РјРѕ.",
    upload: "Р—Р°РІР°РЅС‚Р°Р¶РёС‚Рё С„РѕС‚Рѕ СЃС‚СЂР°РІРё",
    uploaded: "Р¤РѕС‚Рѕ Р·Р°РІР°РЅС‚Р°Р¶РµРЅРѕ",
    recognizing: "Р РѕР·РїС–Р·РЅР°С”РјРѕ СЃС‚СЂР°РІСѓ...",
    manualFallback:
      "РђРІС‚РѕРІРёР·РЅР°С‡РµРЅРЅСЏ СЃС‚СЂР°РІРё С‰Рµ РІ СЂРѕР·СЂРѕР±С†С–. Р’Рё РјРѕР¶РµС‚Рµ РІРІРµСЃС‚Рё СЃС‚СЂР°РІСѓ РІСЂСѓС‡РЅСѓ С‡РµСЂРµР· РїРѕС€СѓРє РїСЂРѕРґСѓРєС‚С–РІ Р°Р±Рѕ РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂ РЅРёР¶С‡Рµ.",
    readError: "РќРµ РІРґР°Р»РѕСЃСЏ РїСЂРѕС‡РёС‚Р°С‚Рё С„РѕС‚Рѕ. РЎРїСЂРѕР±СѓР№С‚Рµ С–РЅС€РёР№ С„Р°Р№Р».",
    previewAlt: "РџСЂРµРІ'СЋ С„РѕС‚Рѕ СЃС‚СЂР°РІРё",
  },
  pl: {
    title: "ZdjД™cie posiЕ‚ku",
    subtitle:
      "Wgraj zdjД™cie plikiem. Kamera nie jest uЕјywana w tym bloku.",
    upload: "Wgraj zdjД™cie posiЕ‚ku",
    uploaded: "ZdjД™cie wgrane",
    recognizing: "Rozpoznajemy posiЕ‚ek...",
    manualFallback:
      "Autoidentyfikacja posiЕ‚ku jest jeszcze w przygotowaniu. MoЕјesz wpisaД‡ go rД™cznie przez wyszukiwarkД™ produktГіw albo kreator poniЕјej.",
    readError: "Nie udaЕ‚o siД™ odczytaД‡ zdjД™cia. SprГіbuj innego pliku.",
    previewAlt: "PodglД…d zdjД™cia posiЕ‚ku",
  },
} as const;

type Props = {
  mealType: MealType;
};

export const PhotoMealAssistant = ({ mealType }: Props) => {
  void mealType;

  const { language } = useLanguage();
  const copy = photoCopy[language];
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isRecognizing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsRecognizing(false);
    }, 1400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isRecognizing]);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    setError(null);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreviewUrl(dataUrl);
      setIsRecognizing(true);
    } catch {
      setError(copy.readError);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.8}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {error && <Alert severity="warning">{error}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="flex-start">
          <Button
            component="label"
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {copy.upload}
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={(event) => {
                void handleFileChange(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </Button>
          {previewUrl && <Chip label={copy.uploaded} color="success" variant="outlined" />}
          {previewUrl && isRecognizing && <Chip label={copy.recognizing} color="info" />}
        </Stack>

        {previewUrl && (
          <Box
            component="img"
            src={previewUrl}
            alt={copy.previewAlt}
            sx={{
              width: "100%",
              maxHeight: 300,
              objectFit: "cover",
              borderRadius: 4,
              border: "1px solid rgba(15,23,42,0.08)",
            }}
          />
        )}

        {previewUrl && !isRecognizing && (
          <Alert severity="info">{copy.manualFallback}</Alert>
        )}
      </Stack>
    </Paper>
  );
};
