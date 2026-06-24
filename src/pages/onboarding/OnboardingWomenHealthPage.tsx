import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useLanguage } from "../../shared/language";
import type { WomenHealthMode } from "@domain/profile/types";
import {
  cardSx,
  parseOnboardingNumber,
  sanitizeOnboardingIntegerInput,
  selectOnboardingInputValue,
  shellSx,
  stepPaths,
  type OnboardingStepProps,
} from "./types";

const copy = {
  uk: {
    title: "Чи потрібен режим жіночого здоров'я?",
    body:
      "Якщо ви готуєтесь до вагітності або вже вагітні, помічник буде обережніше працювати з харчуванням, ліками, водою і нагадуваннями.",
    none: "Не потрібно",
    trying: "Готуюся до вагітності",
    pregnant: "Вагітна",
    postpartum: "Після пологів",
    week: "Орієнтовний тиждень",
    dueDate: "Орієнтовна дата пологів",
    lastPeriod: "Дата останньої менструації",
    confirmed: "Є підтвердження / план від лікаря",
    notes: "Що важливо пам'ятати?",
    notesPlaceholder: "Наприклад: не радити добавки без лікаря",
    safety:
      "Помічник не змінює дозування, не призначає ліки і не замінює лікаря. Він лише нагадує та допомагає структурувати день.",
  },
  pl: {
    title: "Czy potrzebujesz trybu zdrowia kobiet?",
    body:
      "Jeśli przygotowujesz się do ciąży albo jesteś w ciąży, asystent będzie ostrożniej prowadził żywienie, leki, wodę i przypomnienia.",
    none: "Nie dotyczy",
    trying: "Przygotowuję się do ciąży",
    pregnant: "Jestem w ciąży",
    postpartum: "Po porodzie",
    week: "Orientacyjny tydzień",
    dueDate: "Przewidywany termin porodu",
    lastPeriod: "Data ostatniej miesiączki",
    confirmed: "Mam potwierdzenie / plan od lekarza",
    notes: "Co warto pamiętać?",
    notesPlaceholder: "Np. nie sugerować suplementów bez lekarza",
    safety:
      "Asystent nie zmienia dawek, nie przepisuje leków i nie zastępuje lekarza. Pomaga tylko przypominać i porządkować dzień.",
  },
  en: {
    title: "Do you need women health mode?",
    body:
      "If you are preparing for pregnancy or already pregnant, the assistant will handle nutrition, medication, water, and reminders more carefully.",
    none: "Not needed",
    trying: "Preparing for pregnancy",
    pregnant: "Pregnant",
    postpartum: "Postpartum",
    week: "Estimated week",
    dueDate: "Estimated due date",
    lastPeriod: "Last period start date",
    confirmed: "Doctor confirmation / plan exists",
    notes: "What should I remember?",
    notesPlaceholder: "For example: do not suggest supplements without clinician",
    safety:
      "The assistant does not change dosages, prescribe medication, or replace a clinician. It only reminds and helps structure the day.",
  },
} as const;

const modeOptions: Array<{ id: WomenHealthMode; labelKey: keyof typeof copy.uk }> = [
  { id: "none", labelKey: "none" },
  { id: "trying_to_conceive", labelKey: "trying" },
  { id: "pregnant", labelKey: "pregnant" },
  { id: "postpartum", labelKey: "postpartum" },
];

export const OnboardingWomenHealthPage = ({
  state,
  updateState,
}: OnboardingStepProps) => {
  const navigate = useNavigate();
  const { appLanguage, t } = useLanguage();
  const text = copy[appLanguage];
  const isPregnant = state.womenHealthMode === "pregnant";
  const usesCycleContext =
    state.womenHealthMode === "pregnant" ||
    state.womenHealthMode === "trying_to_conceive";
  const weekValue = useMemo(
    () => (state.pregnancyWeek ? String(state.pregnancyWeek) : ""),
    [state.pregnancyWeek]
  );

  const updateMode = (mode: WomenHealthMode) => {
    updateState({
      womenHealthMode: mode,
      pregnancyWeek: mode === "pregnant" ? state.pregnancyWeek : null,
      dueDate: mode === "pregnant" ? state.dueDate : "",
      lastPeriodStartDate:
        mode === "pregnant" || mode === "trying_to_conceive"
          ? state.lastPeriodStartDate
          : "",
      doctorConfirmed:
        mode === "pregnant" || mode === "trying_to_conceive"
          ? state.doctorConfirmed
          : false,
      womenHealthNotes: mode === "none" ? "" : state.womenHealthNotes,
    });
  };

  return (
    <Box sx={shellSx}>
      <Paper elevation={0} sx={cardSx}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography component="h1" variant="h4" sx={{ fontWeight: 900 }}>
              {text.title}
            </Typography>
            <Typography color="text.secondary">{text.body}</Typography>
          </Stack>

          <Stack spacing={1.2}>
            {modeOptions.map((option) => (
              <Button
                key={option.id}
                variant={state.womenHealthMode === option.id ? "contained" : "outlined"}
                size="large"
                onClick={() => updateMode(option.id)}
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: 1,
                  textTransform: "none",
                  fontWeight: 900,
                }}
              >
                {text[option.labelKey]}
              </Button>
            ))}
          </Stack>

          {isPregnant && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <TextField
                fullWidth
                type="text"
                label={text.week}
                value={weekValue}
                onChange={(event) => {
                  const safeValue = sanitizeOnboardingIntegerInput(event.target.value, 2);
                  const parsed = parseOnboardingNumber(safeValue);
                  updateState({
                    pregnancyWeek:
                      parsed === null ? null : Math.max(1, Math.min(42, Math.round(parsed))),
                  });
                }}
                onFocus={(event) => selectOnboardingInputValue(event.target)}
                onClick={(event) => selectOnboardingInputValue(event.currentTarget)}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    enterKeyHint: "next",
                  },
                }}
              />
              <TextField
                fullWidth
                type="date"
                label={text.dueDate}
                value={state.dueDate}
                InputLabelProps={{ shrink: true }}
                onChange={(event) => updateState({ dueDate: event.target.value })}
              />
            </Stack>
          )}

          {usesCycleContext && (
            <Stack spacing={1.2}>
              <TextField
                fullWidth
                type="date"
                label={text.lastPeriod}
                value={state.lastPeriodStartDate}
                InputLabelProps={{ shrink: true }}
                onChange={(event) =>
                  updateState({ lastPeriodStartDate: event.target.value })
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={state.doctorConfirmed}
                    onChange={(event) =>
                      updateState({ doctorConfirmed: event.target.checked })
                    }
                  />
                }
                label={text.confirmed}
              />
            </Stack>
          )}

          {state.womenHealthMode !== "none" && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              label={text.notes}
              placeholder={text.notesPlaceholder}
              value={state.womenHealthNotes}
              onChange={(event) =>
                updateState({ womenHealthNotes: event.target.value.slice(0, 220) })
              }
            />
          )}

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {text.safety}
          </Alert>

          <Stack direction="row" spacing={1.2}>
            <Button
              variant="outlined"
              onClick={() => navigate(stepPaths.gender)}
              sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
            >
              {t("onboarding.back")}
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate(stepPaths.height)}
              sx={{ flex: 1, borderRadius: 999, textTransform: "none", fontWeight: 900 }}
            >
              {t("onboarding.next")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
