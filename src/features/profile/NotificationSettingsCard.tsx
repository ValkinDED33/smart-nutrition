import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Button,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import {
  canUseWebNotifications,
  getSafeNotificationPermission,
  requestSafeNotificationPermission,
} from "@shared/lib/notifications";
import { updateNotificationPreferences } from "./profileSlice";
import { getProfileCloudActionCopy } from "./profileCloudActionCopy";
import { useProfileCloudAction } from "./useProfileCloudAction";

const notificationCopy = {
  uk: {
    title: "Сповіщення та звички",
    subtitle:
      "Налаштуйте делікатні нагадування про прийоми їжі та калорійні алерти. Браузер надсилатиме їх лише коли цей застосунок доступний.",
    unsupported: "Цей браузер не підтримує сповіщення.",
    permissionDefault: "Сповіщення ще не ввімкнені.",
    permissionGranted: "Сповіщення браузера ввімкнені.",
    permissionDenied: "Сповіщення заблоковані в браузері. Спочатку дозвольте їх у налаштуваннях браузера.",
    enableAction: "Увімкнути сповіщення браузера",
    notificationsEnabled: "Використовувати сповіщення браузера",
    mealRemindersEnabled: "Нагадування про їжу",
    calorieAlertsEnabled: "Калорійні алерти",
    breakfast: "Нагадування про сніданок",
    lunch: "Нагадування про обід",
    dinner: "Нагадування про вечерю",
    snack: "Нагадування про перекус",
    browserReady: "Браузер готовий",
    blocked: "Заблоковано",
    unsupportedChip: "Не підтримується",
    permissionNeeded: "Потрібен дозвіл",
    enabled: "Увімкнено",
    muted: "Без звуку",
    saving: "Зберігаю в хмарі...",
    saveError: "Не вдалося зберегти налаштування. Спробуйте ще раз.",
  },
  pl: {
    title: "Powiadomienia i nawyki",
    subtitle:
      "Ustaw łagodne przypomnienia o posiłkach i alerty kaloryczne. Przeglądarka wysyła je tylko wtedy, gdy ta aplikacja pozostaje dostępna.",
    unsupported: "Ta przeglądarka nie obsługuje powiadomień.",
    permissionDefault: "Powiadomienia nie są jeszcze włączone.",
    permissionGranted: "Powiadomienia przeglądarki są włączone.",
    permissionDenied: "Powiadomienia są zablokowane w przeglądarce. Najpierw odblokuj je w ustawieniach.",
    enableAction: "Włącz powiadomienia przeglądarki",
    notificationsEnabled: "Używaj powiadomień przeglądarki",
    mealRemindersEnabled: "Przypomnienia o posiłkach",
    calorieAlertsEnabled: "Alerty kaloryczne",
    breakfast: "Przypomnienie o śniadaniu",
    lunch: "Przypomnienie o obiedzie",
    dinner: "Przypomnienie o kolacji",
    snack: "Przypomnienie o przekąsce",
    browserReady: "Przeglądarka gotowa",
    blocked: "Zablokowane",
    unsupportedChip: "Brak wsparcia",
    permissionNeeded: "Potrzebna zgoda",
    enabled: "Włączone",
    muted: "Wyciszone",
    saving: "Zapisuję w chmurze...",
    saveError: "Nie udało się zapisać ustawień. Spróbuj ponownie.",
  },
  en: {
    title: "Notifications and habits",
    subtitle:
      "Set gentle meal reminders and calorie alerts. The browser will send them only while this app is available.",
    unsupported: "This browser does not support notifications.",
    permissionDefault: "Notifications are not enabled yet.",
    permissionGranted: "Browser notifications are enabled.",
    permissionDenied:
      "Notifications are blocked in the browser. Allow them in browser settings first.",
    enableAction: "Enable browser notifications",
    notificationsEnabled: "Use browser notifications",
    mealRemindersEnabled: "Meal reminders",
    calorieAlertsEnabled: "Calorie alerts",
    breakfast: "Breakfast reminder",
    lunch: "Lunch reminder",
    dinner: "Dinner reminder",
    snack: "Snack reminder",
    browserReady: "Browser ready",
    blocked: "Blocked",
    unsupportedChip: "Unsupported",
    permissionNeeded: "Permission needed",
    enabled: "Enabled",
    muted: "Muted",
    saving: "Saving to cloud...",
    saveError: "Could not save settings. Try again.",
  },
} as const;

type PermissionState = NotificationPermission | "unsupported";
type NotificationCopy = (typeof notificationCopy)[AppLanguage];
type ReminderTimeKey = keyof RootState["profile"]["reminderTimes"];

const getNotificationCopy = (language: AppLanguage): NotificationCopy => {
  switch (language) {
    case "pl":
      return notificationCopy.pl;
    case "en":
      return notificationCopy.en;
    case "uk":
    default:
      return notificationCopy.uk;
  }
};

const getReminderTimeValue = (
  reminderTimes: RootState["profile"]["reminderTimes"],
  key: ReminderTimeKey
) => {
  switch (key) {
    case "lunch":
      return reminderTimes.lunch;
    case "dinner":
      return reminderTimes.dinner;
    case "snack":
      return reminderTimes.snack;
    case "breakfast":
    default:
      return reminderTimes.breakfast;
  }
};

export const NotificationSettingsCard = () => {
  const {
    notificationsEnabled,
    mealRemindersEnabled,
    calorieAlertsEnabled,
    reminderTimes,
  } = useSelector((state: RootState) => state.profile);
  const { appLanguage } = useLanguage();
  const profileActionCopy = getProfileCloudActionCopy(appLanguage);
  const profileAction = useProfileCloudAction(profileActionCopy);
  const [permission, setPermission] = useState<PermissionState>(() =>
    getSafeNotificationPermission()
  );
  const copy = getNotificationCopy(appLanguage);

  useEffect(() => {
    if (typeof window === "undefined" || !canUseWebNotifications()) {
      return;
    }

    const syncPermission = () => {
      setPermission(getSafeNotificationPermission());
    };

    syncPermission();
    window.addEventListener("focus", syncPermission);
    document.addEventListener("visibilitychange", syncPermission);

    return () => {
      window.removeEventListener("focus", syncPermission);
      document.removeEventListener("visibilitychange", syncPermission);
    };
  }, []);

  const requestPermission = async () => {
    const nextPermission = await requestSafeNotificationPermission();
    setPermission(nextPermission);

    return nextPermission === "granted";
  };

  const handleNotificationsToggle = async (nextEnabled: boolean) => {
    if (!nextEnabled) {
      await profileAction.runProfileAction(
        updateNotificationPreferences({ notificationsEnabled: false })
      );
      return;
    }

    if (permission === "granted") {
      await profileAction.runProfileAction(
        updateNotificationPreferences({ notificationsEnabled: true })
      );
      return;
    }

    const granted = await requestPermission();

    if (granted) {
      await profileAction.runProfileAction(
        updateNotificationPreferences({ notificationsEnabled: true })
      );
    }
  };

  const permissionMessage =
    permission === "unsupported"
      ? copy.unsupported
      : permission === "granted"
        ? copy.permissionGranted
        : permission === "denied"
          ? copy.permissionDenied
          : copy.permissionDefault;

  const timeLabels = [
    { key: "breakfast", label: copy.breakfast },
    { key: "lunch", label: copy.lunch },
    { key: "dinner", label: copy.dinner },
    { key: "snack", label: copy.snack },
  ] as const;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.8}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={
              permission === "granted"
                ? copy.browserReady
                : permission === "denied"
                  ? copy.blocked
                  : permission === "unsupported"
                    ? copy.unsupportedChip
                    : copy.permissionNeeded
            }
            color={permission === "granted" ? "success" : "default"}
          />
          <Chip
            label={notificationsEnabled ? copy.enabled : copy.muted}
            variant={notificationsEnabled ? "filled" : "outlined"}
            color={notificationsEnabled ? "success" : "default"}
          />
        </Stack>

        <Alert
          severity={
            permission === "granted"
              ? "success"
              : permission === "denied" || permission === "unsupported"
                ? "warning"
                : "info"
          }
          sx={{ borderRadius: 3 }}
        >
          {permissionMessage}
        </Alert>

        {profileAction.saving ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {copy.saving}
          </Alert>
        ) : null}

        {profileAction.hasError ? (
          <Alert severity="error" sx={{ borderRadius: 3 }} onClose={profileAction.clearError}>
            {copy.saveError}
          </Alert>
        ) : null}

        {permission !== "granted" && permission !== "unsupported" && (
          <Button
            variant="contained"
            onClick={() => {
              void requestPermission();
            }}
            sx={{
              alignSelf: "flex-start",
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 800,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {copy.enableAction}
          </Button>
        )}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                disabled={permission === "unsupported" || profileAction.saving}
                onChange={(_, checked) => {
                  void handleNotificationsToggle(checked).catch(() => undefined);
                }}
              />
            }
            label={copy.notificationsEnabled}
          />
          <FormControlLabel
            control={
              <Switch
                checked={mealRemindersEnabled}
                disabled={!notificationsEnabled || profileAction.saving}
                onChange={(_, checked) => {
                  void profileAction.runProfileAction(
                    updateNotificationPreferences({ mealRemindersEnabled: checked })
                  ).catch(() => undefined);
                }}
              />
            }
            label={copy.mealRemindersEnabled}
          />
          <FormControlLabel
            control={
              <Switch
                checked={calorieAlertsEnabled}
                disabled={!notificationsEnabled || profileAction.saving}
                onChange={(_, checked) => {
                  void profileAction.runProfileAction(
                    updateNotificationPreferences({ calorieAlertsEnabled: checked })
                  ).catch(() => undefined);
                }}
              />
            }
            label={copy.calorieAlertsEnabled}
          />
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {timeLabels.map((item) => (
            <TextField
              key={item.key}
              fullWidth
              type="time"
              label={item.label}
              value={getReminderTimeValue(reminderTimes, item.key)}
              disabled={!notificationsEnabled || !mealRemindersEnabled || profileAction.saving}
              onChange={(event) => {
                void profileAction.runProfileAction(
                  updateNotificationPreferences({
                    reminderTimes: {
                      [item.key]: event.target.value,
                    },
                  })
                ).catch(() => undefined);
              }}
              InputLabelProps={{ shrink: true }}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
