import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import type { AppDispatch, RootState } from "../../app/store";
import { useLanguage } from "../../shared/language";
import { updateNotificationPreferences } from "./profileSlice";

const notificationCopy = {
  uk: {
    title: "Notifications & habits",
    subtitle:
      "Set gentle meal reminders and calorie alerts. The browser only sends them when you keep this app available.",
    unsupported: "This browser does not support notifications.",
    permissionDefault: "Notifications are not enabled yet.",
    permissionGranted: "Browser notifications are enabled.",
    permissionDenied: "Notifications are blocked in this browser. Allow them in browser settings first.",
    enableAction: "Enable browser notifications",
    notificationsEnabled: "Use browser notifications",
    mealRemindersEnabled: "Meal reminders",
    calorieAlertsEnabled: "Calorie alerts",
    breakfast: "Breakfast reminder",
    lunch: "Lunch reminder",
    dinner: "Dinner reminder",
    snack: "Snack reminder",
  },
  pl: {
    title: "Powiadomienia i nawyki",
    subtitle:
      "Ustaw lagodne przypomnienia o posilkach i alerty kaloryczne. Przegladarka wysyla je tylko wtedy, gdy ta aplikacja pozostaje dostepna.",
    unsupported: "Ta przegladarka nie obsluguje powiadomien.",
    permissionDefault: "Powiadomienia nie sa jeszcze wlaczone.",
    permissionGranted: "Powiadomienia przegladarki sa wlaczone.",
    permissionDenied: "Powiadomienia sa zablokowane w przegladarce. Najpierw odblokuj je w ustawieniach.",
    enableAction: "Wlacz powiadomienia",
    notificationsEnabled: "Uzywaj powiadomien przegladarki",
    mealRemindersEnabled: "Przypomnienia o posilkach",
    calorieAlertsEnabled: "Alerty kaloryczne",
    breakfast: "Przypomnienie o sniadaniu",
    lunch: "Przypomnienie o lunchu",
    dinner: "Przypomnienie o kolacji",
    snack: "Przypomnienie o przekasce",
  },
} as const;

type PermissionState = NotificationPermission | "unsupported";

export const NotificationSettingsCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    notificationsEnabled,
    mealRemindersEnabled,
    calorieAlertsEnabled,
    reminderTimes,
  } = useSelector((state: RootState) => state.profile);
  const { language } = useLanguage();
  const [permission, setPermission] = useState<PermissionState>(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported"
  );
  const copy = notificationCopy[language];

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return false;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    return nextPermission === "granted";
  };

  const handleNotificationsToggle = async (nextEnabled: boolean) => {
    if (!nextEnabled) {
      dispatch(updateNotificationPreferences({ notificationsEnabled: false }));
      return;
    }

    if (permission === "granted") {
      dispatch(updateNotificationPreferences({ notificationsEnabled: true }));
      return;
    }

    const granted = await requestPermission();

    if (granted) {
      dispatch(updateNotificationPreferences({ notificationsEnabled: true }));
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

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            label={
              permission === "granted"
                ? "Browser ready"
                : permission === "denied"
                  ? "Blocked"
                  : permission === "unsupported"
                    ? "Unsupported"
                    : "Permission needed"
            }
            color={permission === "granted" ? "success" : "default"}
          />
          <Chip
            label={notificationsEnabled ? "Enabled" : "Muted"}
            variant={notificationsEnabled ? "filled" : "outlined"}
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
                disabled={permission === "unsupported"}
                onChange={(_, checked) => {
                  void handleNotificationsToggle(checked);
                }}
              />
            }
            label={copy.notificationsEnabled}
          />
          <FormControlLabel
            control={
              <Switch
                checked={mealRemindersEnabled}
                disabled={!notificationsEnabled}
                onChange={(_, checked) => {
                  dispatch(
                    updateNotificationPreferences({ mealRemindersEnabled: checked })
                  );
                }}
              />
            }
            label={copy.mealRemindersEnabled}
          />
          <FormControlLabel
            control={
              <Switch
                checked={calorieAlertsEnabled}
                disabled={!notificationsEnabled}
                onChange={(_, checked) => {
                  dispatch(
                    updateNotificationPreferences({ calorieAlertsEnabled: checked })
                  );
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
              value={reminderTimes[item.key]}
              disabled={!notificationsEnabled || !mealRemindersEnabled}
              onChange={(event) => {
                dispatch(
                  updateNotificationPreferences({
                    reminderTimes: {
                      [item.key]: event.target.value,
                    },
                  })
                );
              }}
              InputLabelProps={{ shrink: true }}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};
