import { useDispatch, useSelector } from "react-redux";
import { Alert, Button, Stack } from "@mui/material";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { getLocalDateKey } from "../../shared/lib/date";
import type { AppDispatch, RootState } from "../../app/store";
import { addMealEntriesToCloud } from "./mealCloudSync";
import { useMealActionFeedback } from "./useMealActionFeedback";
import type { AppLanguage } from "../../shared/types/i18n";

const createId = (prefix: string) =>
  globalThis.crypto?.randomUUID?.() ??
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const repeaterCopy = {
  uk: {
    saving: "Повторюю вчорашній день і зберігаю в хмару...",
    confirmed: "Вчорашні записи додано до поточного дня і підтверджено backend.",
    failed: "Не вдалося повторити вчорашній день.",
    retry: "Спробувати ще раз",
  },
  pl: {
    saving: "Powtarzam wczorajszy dzień i zapisuję w chmurze...",
    confirmed: "Wczorajsze wpisy dodano do dzisiejszego dnia i potwierdzono przez backend.",
    failed: "Nie udało się powtórzyć wczorajszego dnia.",
    retry: "Spróbuj ponownie",
  },
  en: {
    saving: "Repeating yesterday and saving to cloud...",
    confirmed: "Yesterday's entries were added to today and confirmed by the backend.",
    failed: "Could not repeat yesterday.",
    retry: "Try again",
  },
} as const;

type RepeaterCopy = (typeof repeaterCopy)[AppLanguage];

const getRepeaterCopy = (language: AppLanguage): RepeaterCopy => {
  switch (language) {
    case "pl":
      return repeaterCopy.pl;
    case "en":
      return repeaterCopy.en;
    case "uk":
    default:
      return repeaterCopy.uk;
  }
};

export const YesterdayRepeater = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const meal = useSelector((state: RootState) => state.meal);
  const { appLanguage, t } = useLanguage();
  const copy = getRepeaterCopy(appLanguage);
  const {
    notice,
    runMealAction,
    retryMealAction,
    clearFeedback,
    isSavingAction,
  } = useMealActionFeedback({
    saving: {
      add: copy.saving,
      edit: copy.saving,
      delete: copy.saving,
      repeat: copy.saving,
      saveTemplate: copy.saving,
      applyTemplate: copy.saving,
      saveProduct: copy.saving,
    },
    confirmed: {
      add: copy.confirmed,
      edit: copy.confirmed,
      delete: copy.confirmed,
      repeat: copy.confirmed,
      saveTemplate: copy.confirmed,
      applyTemplate: copy.confirmed,
      saveProduct: copy.confirmed,
    },
    failed: {
      add: copy.failed,
      edit: copy.failed,
      delete: copy.failed,
      repeat: copy.failed,
      saveTemplate: copy.failed,
      applyTemplate: copy.failed,
      saveProduct: copy.failed,
    },
    retry: copy.retry,
  });

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  const yesterdayItems = items.filter((item) => getLocalDateKey(item.eatenAt) === yesterdayKey);
  const hasYesterdayData = yesterdayItems.length > 0;

  const handleRepeatYesterday = async () => {
    if (!hasYesterdayData) return;

    const newEntries = yesterdayItems.map((item) => ({
      ...item,
      id: createId("meal"),
      eatenAt: new Date().toISOString(),
    }));

    await runMealAction({
      actionId: "repeat-yesterday",
      kind: "repeat",
      action: () => addMealEntriesToCloud(dispatch, meal, newEntries),
    });
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      {notice ? (
        <Alert
          severity={notice.severity}
          action={
            notice.retryable ? (
              <Button
                color="inherit"
                size="small"
                onClick={() => void retryMealAction()}
                sx={{ textTransform: "none", fontWeight: 800 }}
              >
                {copy.retry}
              </Button>
            ) : undefined
          }
          onClose={clearFeedback}
        >
          {notice.text}
        </Alert>
      ) : null}
      <Button
        variant="outlined"
        onClick={() => {
          void handleRepeatYesterday();
        }}
        disabled={!hasYesterdayData || isSavingAction("repeat-yesterday")}
        fullWidth
      >
        {t("meal.repeatYesterday")}
      </Button>
    </Stack>
  );
};
