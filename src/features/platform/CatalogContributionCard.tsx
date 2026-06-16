import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  Collapse,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { CatalogProductItem } from "../../shared/types/platform";
import {
  PlatformApiError,
  findCatalogDuplicateCandidates,
  listOwnCatalogSubmissions,
  submitCatalogSubmission,
} from "../../shared/api/platform";
import { useLanguage } from "../../shared/language";
import { getKnownProductCategoryOptions } from "@domain/products/productCategory";

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
    showSubmissions: "Показати мої відправки",
    hideSubmissions: "Сховати відправки",
    optionalDetails: "Бренд, штрихкод і фото",
    hideOptionalDetails: "Сховати додаткове",
    duplicates: "Можливі дублікати",
    duplicateAssistant:
      "це блюдо вже є. Краще використати готове або перевірити дубль перед створенням нового.",
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
    showSubmissions: "Pokaż moje zgłoszenia",
    hideSubmissions: "Ukryj zgłoszenia",
    optionalDetails: "Marka, kod kreskowy i zdjęcie",
    hideOptionalDetails: "Ukryj dodatkowe",
    duplicates: "Możliwe duplikaty",
    duplicateAssistant:
      "to danie już istnieje. Lepiej użyć gotowego wpisu albo sprawdzić duplikat przed utworzeniem nowego.",
    submitted: "Produkt został wysłany.",
    backendUnavailable:
      "Backend cloud jest niedostępny, więc katalog i moderacja nie będą teraz działać.",
    status: {
      pending: "Oczekuje",
      approved: "Zatwierdzono",
      rejected: "Odrzucono",
    },
  },
  en: {
    title: "User product database",
    subtitle:
      "Add a missing product to the catalog. If a moderator approves it, it becomes available to everyone.",
    name: "Name",
    category: "Category",
    brand: "Brand",
    barcode: "Barcode",
    imageUrl: "Photo / package URL",
    calories: "Calories",
    protein: "Protein",
    fat: "Fat",
    carbs: "Carbs",
    submit: "Send for moderation",
    ownSubmissions: "My submissions",
    showSubmissions: "Show my submissions",
    hideSubmissions: "Hide submissions",
    optionalDetails: "Brand, barcode, and photo",
    hideOptionalDetails: "Hide optional",
    duplicates: "Possible duplicates",
    duplicateAssistant:
      "this dish already exists. It is better to use the existing item or check the duplicate before creating a new one.",
    submitted: "Product was submitted.",
    backendUnavailable:
      "Cloud backend is unavailable, so catalog and moderation will not work right now.",
    status: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
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

const createInitialForm = (initialName = "") => ({
  ...initialForm,
  name: initialName.trim(),
});

interface CatalogContributionCardProps {
  initialName?: string;
  compact?: boolean;
}

export const CatalogContributionCard = ({
  initialName = "",
  compact = false,
}: CatalogContributionCardProps) => {
  const { appLanguage } = useLanguage();
  const copy = catalogCopy[appLanguage];
  const categoryOptions = useMemo(
    () => getKnownProductCategoryOptions(appLanguage),
    [appLanguage]
  );
  const [form, setForm] = useState(() => createInitialForm(initialName));
  const [submissions, setSubmissions] = useState<CatalogProductItem[]>([]);
  const [duplicates, setDuplicates] = useState<CatalogProductItem[]>([]);
  const [showOptionalDetails, setShowOptionalDetails] = useState(!compact);
  const [showSubmissions, setShowSubmissions] = useState(!compact);
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
    queueMicrotask(() => {
      void loadSubmissions();
    });
  }, [loadSubmissions]);

  useEffect(() => {
    const name = form.name.trim();

    if (name.length < 3) {
      const timer = window.setTimeout(() => setDuplicates([]), 0);

      return () => window.clearTimeout(timer);
    }

    let active = true;
    const timer = window.setTimeout(() => {
      void findCatalogDuplicateCandidates({
        name,
        barcode: form.barcode.replace(/\D/g, ""),
      })
        .then((items) => {
          if (active) {
            setDuplicates(items);
          }
        })
        .catch(() => {
          if (active) {
            setDuplicates([]);
          }
        });
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [form.barcode, form.name]);

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
        p: { xs: compact ? 1.5 : 2.5, md: compact ? 2 : 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={compact ? 1.5 : 2}>
        <Stack spacing={0.6}>
          <Typography
            component="h2"
            variant="h6"
            sx={{ fontWeight: 800, fontSize: { xs: compact ? 17 : 20, md: 20 } }}
          >
            {copy.title}
          </Typography>
          <Typography color="text.secondary" variant={compact ? "body2" : "body1"}>
            {copy.subtitle}
          </Typography>
        </Stack>

        {error && <Alert severity="warning">{error}</Alert>}
        {successMessage && <Alert severity="success">{successMessage}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          <TextField
            fullWidth
            label={copy.name}
            size={compact ? "small" : "medium"}
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <TextField
            fullWidth
            select
            label={copy.category}
            size={compact ? "small" : "medium"}
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
        </Stack>

        <Button
          variant="text"
          onClick={() => setShowOptionalDetails((current) => !current)}
          sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800, px: 0 }}
        >
          {showOptionalDetails ? copy.hideOptionalDetails : copy.optionalDetails}
        </Button>

        <Collapse in={showOptionalDetails} timeout="auto" unmountOnExit>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <TextField
              fullWidth
              label={copy.brand}
              size={compact ? "small" : "medium"}
              value={form.brand}
              onChange={(event) =>
                setForm((current) => ({ ...current, brand: event.target.value }))
              }
            />
            <TextField
              fullWidth
              label={copy.barcode}
              size={compact ? "small" : "medium"}
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
              size={compact ? "small" : "medium"}
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, imageUrl: event.target.value }))
              }
            />
          </Stack>
        </Collapse>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
          <TextField
            fullWidth
            type="number"
            label={copy.calories}
            size={compact ? "small" : "medium"}
            value={form.calories}
            onChange={(event) =>
              setForm((current) => ({ ...current, calories: event.target.value }))
            }
          />
          <TextField
            fullWidth
            type="number"
            label={copy.protein}
            size={compact ? "small" : "medium"}
            value={form.protein}
            onChange={(event) =>
              setForm((current) => ({ ...current, protein: event.target.value }))
            }
          />
          <TextField
            fullWidth
            type="number"
            label={copy.fat}
            size={compact ? "small" : "medium"}
            value={form.fat}
            onChange={(event) => setForm((current) => ({ ...current, fat: event.target.value }))}
          />
          <TextField
            fullWidth
            type="number"
            label={copy.carbs}
            size={compact ? "small" : "medium"}
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
          sx={{
            alignSelf: { xs: "stretch", sm: "flex-start" },
            textTransform: "none",
            fontWeight: 700,
          }}
        >
          {copy.submit}
        </Button>

        {duplicates.length > 0 && (
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>{copy.duplicates}</Typography>
            <Alert severity="info">{copy.duplicateAssistant}</Alert>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {duplicates.map((item) => (
                <Chip key={item.id} label={item.name} variant="outlined" />
              ))}
            </Stack>
          </Stack>
        )}

        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 700 }}>{copy.ownSubmissions}</Typography>
            {compact ? (
              <Button
                size="small"
                variant="text"
                onClick={() => setShowSubmissions((current) => !current)}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                {showSubmissions ? copy.hideSubmissions : copy.showSubmissions}
              </Button>
            ) : null}
          </Stack>
          <Collapse in={showSubmissions} timeout="auto" unmountOnExit>
            <Stack spacing={1}>
              {submissions.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="space-between"
                    useFlexGap
                    flexWrap="wrap"
                  >
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
              {submissions.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  -
                </Typography>
              ) : null}
            </Stack>
          </Collapse>
        </Stack>
      </Stack>
    </Paper>
  );
};
