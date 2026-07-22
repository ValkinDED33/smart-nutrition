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
import type { Product } from "@domain/products/types";
import {
  findCatalogDuplicateCandidates,
  listOwnCatalogSubmissions,
  submitCatalogSubmission,
} from "../../shared/api/platform";
import { selectInputValue } from "../../shared/lib/inputSelection";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { getKnownProductCategoryOptions } from "@domain/products/productCategory";
import {
  buildCatalogContributionPayload,
  canSubmitCatalogContribution,
  createCatalogContributionFormFromProduct,
  createInitialCatalogContributionForm,
  createInitialCatalogContributionSubmissionState,
  resolveCatalogContributionNotice,
  type CatalogContributionSubmissionState,
} from "./catalogContributionModel";

const catalogCopy = {
  uk: {
    title: "Користувацька база продуктів",
    subtitle:
      "Додайте відсутній продукт у каталог. Якщо модератор підтвердить запис, він стане доступним усім.",
    name: "Назва",
    category: "Категорія",
    categoryCustom: "Власна категорія",
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
    submitting: "Відправляю продукт у спільну базу...",
    accepted: "Спільна база прийняла продукт на модерацію.",
    failed: "Спільна база зараз не прийняла зміни.",
    retry: "Спробувати ще раз",
    backendUnavailable:
      "Хмарний каталог тимчасово недоступний, тому модерація зараз не зможе прийняти зміни.",
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
    categoryCustom: "Własna kategoria",
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
    submitting: "Wysyłam produkt do wspólnej bazy...",
    accepted: "Wspólna baza przyjęła produkt do moderacji.",
    failed: "Wspólna baza nie przyjęła teraz zmian.",
    retry: "Spróbuj ponownie",
    backendUnavailable:
      "Katalog w chmurze jest chwilowo niedostępny, więc moderacja nie może teraz przyjąć zmian.",
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
    categoryCustom: "Custom category",
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
    submitting: "Sending product to the shared catalog...",
    accepted: "Shared catalog accepted the product for moderation.",
    failed: "Shared catalog did not accept the changes right now.",
    retry: "Try again",
    backendUnavailable:
      "The cloud catalog is temporarily unavailable, so moderation cannot accept changes right now.",
    status: {
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
    },
  },
} as const;

type CatalogCopy = (typeof catalogCopy)[AppLanguage];

const getCatalogCopy = (language: AppLanguage): CatalogCopy => {
  switch (language) {
    case "pl":
      return catalogCopy.pl;
    case "en":
      return catalogCopy.en;
    case "uk":
    default:
      return catalogCopy.uk;
  }
};

const getSubmissionStatusLabel = (
  copy: CatalogCopy,
  status: CatalogProductItem["status"]
) => {
  switch (status) {
    case "approved":
      return copy.status.approved;
    case "rejected":
      return copy.status.rejected;
    case "pending":
    default:
      return copy.status.pending;
  }
};

const getSubmissionCategoryLabel = ({
  item,
  categoryOptions,
  copy,
}: {
  item: CatalogProductItem;
  categoryOptions: { key: string; label: string }[];
  copy: CatalogCopy;
}) => {
  const category = String(item.category ?? "").trim();
  const brand = String(item.brand ?? "").trim();

  if (category) {
    return (
      categoryOptions.find((option) => option.key === category)?.label || category
    );
  }

  return brand || copy.categoryCustom;
};

interface CatalogContributionCardProps {
  initialName?: string;
  initialProduct?: Product;
  compact?: boolean;
}

export const CatalogContributionCard = ({
  initialName = "",
  initialProduct,
  compact = false,
}: CatalogContributionCardProps) => {
  const { appLanguage } = useLanguage();
  const copy = getCatalogCopy(appLanguage);
  const categoryOptions = useMemo(
    () => getKnownProductCategoryOptions(appLanguage),
    [appLanguage]
  );
  const [form, setForm] = useState(() =>
    initialProduct
      ? createCatalogContributionFormFromProduct(initialProduct, initialName)
      : createInitialCatalogContributionForm(initialName)
  );
  const [submissions, setSubmissions] = useState<CatalogProductItem[]>([]);
  const [duplicates, setDuplicates] = useState<CatalogProductItem[]>([]);
  const [showOptionalDetails, setShowOptionalDetails] = useState(!compact);
  const [showSubmissions, setShowSubmissions] = useState(!compact);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] =
    useState<CatalogContributionSubmissionState>(
      createInitialCatalogContributionSubmissionState
    );
  const submissionNotice = useMemo(
    () => resolveCatalogContributionNotice(submissionState, copy),
    [copy, submissionState]
  );

  const loadSubmissions = useCallback(async () => {
    try {
      const items = await listOwnCatalogSubmissions();
      setSubmissions(items);
      setLoadError(null);
    } catch {
      setSubmissions([]);
      setLoadError(copy.backendUnavailable);
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

  const canSubmit = useMemo(() => canSubmitCatalogContribution(form), [form]);

  const submitCatalogPayload = useCallback(
    async (payload: NonNullable<ReturnType<typeof buildCatalogContributionPayload>>) => {
      setSubmissionState({ status: "submitting", payload });

      try {
        const response = await submitCatalogSubmission(payload);

        setDuplicates(response.possibleDuplicates);
        setForm(createInitialCatalogContributionForm());
        setSubmissionState({ status: "accepted" });
        await loadSubmissions();
      } catch {
        setSubmissionState({
          status: "failed",
          payload,
          message: copy.retry,
        });
      }
    },
    [copy.retry, loadSubmissions]
  );

  const handleSubmit = async () => {
    const payload = buildCatalogContributionPayload(form);

    if (!payload) {
      return;
    }

    await submitCatalogPayload(payload);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: compact ? 1.5 : 2.5, md: compact ? 2 : 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
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

        {loadError && (
          <Alert severity="warning" onClose={() => setLoadError(null)}>
            {loadError}
          </Alert>
        )}
        {submissionNotice ? (
          <Alert
            severity={submissionNotice.severity}
            action={
              submissionNotice.retryable && submissionState.status === "failed" ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => void submitCatalogPayload(submissionState.payload)}
                  sx={{ fontWeight: 800, textTransform: "none" }}
                >
                  {copy.retry}
                </Button>
              ) : undefined
            }
          >
            {submissionNotice.text}
          </Alert>
        ) : null}

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
            <MenuItem value="">{copy.categoryCustom}</MenuItem>
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
            type="text"
            label={copy.calories}
            size={compact ? "small" : "medium"}
            value={form.calories}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            onChange={(event) =>
              setForm((current) => ({ ...current, calories: event.target.value }))
            }
          />
          <TextField
            fullWidth
            type="text"
            label={copy.protein}
            size={compact ? "small" : "medium"}
            value={form.protein}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            onChange={(event) =>
              setForm((current) => ({ ...current, protein: event.target.value }))
            }
          />
          <TextField
            fullWidth
            type="text"
            label={copy.fat}
            size={compact ? "small" : "medium"}
            value={form.fat}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "next" } }}
            onChange={(event) => setForm((current) => ({ ...current, fat: event.target.value }))}
          />
          <TextField
            fullWidth
            type="text"
            label={copy.carbs}
            size={compact ? "small" : "medium"}
            value={form.carbs}
            onFocus={(event) => selectInputValue(event.target)}
            onClick={(event) => selectInputValue(event.currentTarget)}
            slotProps={{ htmlInput: { inputMode: "decimal", enterKeyHint: "done" } }}
            onChange={(event) =>
              setForm((current) => ({ ...current, carbs: event.target.value }))
            }
          />
        </Stack>

        <Button
          variant="contained"
          disabled={!canSubmit || submissionState.status === "submitting"}
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
                        {getSubmissionCategoryLabel({ item, categoryOptions, copy })}
                      </Typography>
                    </Stack>
                    <Chip
                      label={getSubmissionStatusLabel(copy, item.status)}
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
