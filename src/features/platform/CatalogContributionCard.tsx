import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { CatalogProductItem } from "../../shared/types/platform";
import {
  PlatformApiError,
  listOwnCatalogSubmissions,
  submitCatalogSubmission,
} from "../../shared/api/platform";
import { useLanguage } from "../../shared/language";
import { getKnownProductCategoryOptions } from "../../shared/lib/productCategory";

const catalogCopy = {
  uk: {
    title: "Користувацька база продуктів",
    subtitle:
      "Додайте відсутній продукт у каталог. Якщо модератор підтвердить запис, він стане доступним усім.",
    name: "Назва",
    category: "Категорія",
    brand: "Бренд",
    barcode: "Штрихкод",
    imageUrl: "Фото / URL упаковки",
    calories: "Калорії",
    protein: "Білки",
    fat: "Жири",
    carbs: "Вуглеводи",
    submit: "Надіслати на модерацію",
    ownSubmissions: "Мої відправки",
    duplicates: "Можливі дублікати",
    submitted: "Продукт відправлено.",
    backendUnavailable:
      "Cloud backend недоступний, тому каталог і модерація зараз працювати не зможуть.",
    status: {
      pending: "Очікує",
      approved: "Підтверджено",
      rejected: "Відхилено",
    },
  },
  pl: {
    title: "Baza produktów użytkowników",
    subtitle:
      "Dodaj brakujący produkt do katalogu. Gdy moderator go zatwierdzi, będzie dostępny dla wszystkich.",
    name: "Nazwa",
    category: "Kategoria",
    brand: "Marka",
    barcode: "Kod kreskowy",
    imageUrl: "Zdjęcie / URL opakowania",
    calories: "Kalorie",
    protein: "Białko",
    fat: "Tłuszcz",
    carbs: "Węglowodany",
    submit: "Wyślij do moderacji",
    ownSubmissions: "Moje zgłoszenia",
    duplicates: "Możliwe duplikaty",
    submitted: "Produkt został wysłany.",
    backendUnavailable:
      "Backend cloud jest niedostępny, więc katalog i moderacja nie będą teraz działać.",
    status: {
      pending: "Oczekuje",
      approved: "Zatwierdzono",
      rejected: "Odrzucono",
    },
  },
} as const;

const initialForm = {
  name: "",
  category: "",
  brand: "",
  barcode: "",
  imageUrl: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
};

export const CatalogContributionCard = () => {
  const { language } = useLanguage();
  const copy = catalogCopy[language];
  const categoryOptions = useMemo(
    () => getKnownProductCategoryOptions(language),
    [language]
  );
  const [form, setForm] = useState(initialForm);
  const [submissions, setSubmissions] = useState<CatalogProductItem[]>([]);
  const [duplicates, setDuplicates] = useState<CatalogProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    try {
      const items = await listOwnCatalogSubmissions();
      setSubmissions(items);
      setError(null);
    } catch (nextError) {
      setSubmissions([]);
      setError(
        nextError instanceof PlatformApiError
          ? nextError.message
          : copy.backendUnavailable
      );
    }
  }, [copy.backendUnavailable]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.name.trim() &&
          form.calories.trim() &&
          form.protein.trim() &&
          form.fat.trim() &&
          form.carbs.trim()
      ),
    [form]
  );

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await submitCatalogSubmission({
        name: form.name.trim(),
        category: form.category.trim() || undefined,
        brand: form.brand.trim() || undefined,
        barcode: form.barcode.replace(/\D/g, "") || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carbs: Number(form.carbs),
      });

      setDuplicates(response.possibleDuplicates);
      setForm(initialForm);
      setSuccessMessage(copy.submitted);
      await loadSubmissions();
    } catch (nextError) {
      setError(
        nextError instanceof PlatformApiError
          ? nextError.message
          : copy.backendUnavailable
      );
    } finally {
      setLoading(false);
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
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {error && <Alert severity="warning">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          <TextField
            fullWidth
            label={copy.name}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <TextField
            fullWidth
            select
            label={copy.category}
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({ ...current, category: event.target.value }))
            }
          >
            <MenuItem value="">Manual</MenuItem>
            {categoryOptions.map((option) => (
              <MenuItem key={option.key} value={option.key}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label={copy.brand}
            value={form.brand}
            onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          <TextField
            fullWidth
            label={copy.barcode}
            value={form.barcode}
            onChange={(event) =>
              setForm((current) => ({ ...current, barcode: event.target.value }))
            }
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "[0-9]*",
              },
            }}
          />
          <TextField
            fullWidth
            label={copy.imageUrl}
            value={form.imageUrl}
            onChange={(event) =>
              setForm((current) => ({ ...current, imageUrl: event.target.value }))
            }
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          <TextField
            fullWidth
            type="number"
            label={copy.calories}
            value={form.calories}
            onChange={(event) =>
              setForm((current) => ({ ...current, calories: event.target.value }))
            }
          />
          <TextField
            fullWidth
            type="number"
            label={copy.protein}
            value={form.protein}
            onChange={(event) =>
              setForm((current) => ({ ...current, protein: event.target.value }))
            }
          />
          <TextField
            fullWidth
            type="number"
            label={copy.fat}
            value={form.fat}
            onChange={(event) => setForm((current) => ({ ...current, fat: event.target.value }))}
          />
          <TextField
            fullWidth
            type="number"
            label={copy.carbs}
            value={form.carbs}
            onChange={(event) =>
              setForm((current) => ({ ...current, carbs: event.target.value }))
            }
          />
        </Stack>

        <Button
          variant="contained"
          disabled={!canSubmit || loading}
          onClick={() => {
            void handleSubmit();
          }}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
        >
          {copy.submit}
        </Button>

        {duplicates.length > 0 && (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{copy.duplicates}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {duplicates.map((item) => (
                <Chip key={item.id} label={item.name} variant="outlined" />
              ))}
            </Stack>
          </Stack>
        )}

        <Stack spacing={1}>
          <Typography sx={{ fontWeight: 700 }}>{copy.ownSubmissions}</Typography>
          {submissions.map((item) => (
            <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
              <Stack direction="row" spacing={1} justifyContent="space-between" useFlexGap flexWrap="wrap">
                <Stack spacing={0.4}>
                  <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {item.category ?? item.brand ?? "Manual"}
                  </Typography>
                </Stack>
                <Chip
                  label={copy.status[item.status]}
                  color={
                    item.status === "approved"
                      ? "success"
                      : item.status === "rejected"
                        ? "error"
                        : "default"
                  }
                  size="small"
                />
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
