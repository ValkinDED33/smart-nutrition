import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Bell,
  Check,
  Clock,
  Droplets,
  HeartPulse,
  ListChecks,
  Pause,
  Pencil,
  Play,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage } from "@shared/language";
import { SectionCard } from "@shared/ui";
import {
  createRemoteReminder,
  deleteRemoteReminder,
  listRemoteReminders,
  updateRemoteReminderSchedule,
  updateRemoteReminderAction,
  type ReminderAction,
  type ReminderItem,
  type ReminderType,
} from "@shared/api/reminders";
import {
  formatReminderDateTime,
  formatReminderScheduleLabel,
  getReminderAdherenceSummary,
  getReminderPrimaryAction,
  isMedicationLikeReminderType,
  reminderTypeOptions,
  sortReminders,
  toReminderType,
  upsertReminderItem,
} from "./reminderManagementModel";
import { dispatchReminderUpserted, subscribeToReminderUpserts } from "./reminderEvents";

const reminderCopy = {
  uk: {
    title: "Нагадування асистента",
    subtitle:
      "Керуйте задачами й ліками, які асистент веде через сайт і Telegram. Дані зберігаються у хмарному акаунті.",
    typeLabel: "Тип",
    task: "Задача",
    medication: "Ліки",
    medicationCourse: "Курс ліків",
    pregnancySupplement: "Вагітність",
    water: "Вода",
    habit: "Звичка",
    textLabel: "Що нагадати",
    textPlaceholder: "Наприклад: Подзвонити лікарю о 10:00",
    medicationPlaceholder:
      "Наприклад: Вітамін D з обідом о 13:00, якщо є жири в їжі",
    medicationCoursePlaceholder: "Наприклад: Амоксиклав 875 мг, 08:00 і 20:00, 7 днів",
    pregnancySupplementPlaceholder:
      "Наприклад: Фолієва кислота за планом лікаря щодня о 09:00",
    waterPlaceholder: "Наприклад: Склянка води щодня о 09:00, 13:00 і 18:00",
    habitPlaceholder: "Наприклад: 10 хв прогулянки щодня о 19:00",
    create: "Створити",
    creating: "Створюємо...",
    refresh: "Оновити",
    empty: "Активних нагадувань поки немає.",
    loading: "Завантажуємо нагадування...",
    loadError: "Не вдалося завантажити нагадування.",
    createError:
      "Не вдалося створити нагадування. Перевірте, чи є час у тексті: о 10:00, 21:00 або щодня о 09:00.",
    actionError: "Не вдалося оновити нагадування.",
    created: "Нагадування створено.",
    updated: "Нагадування оновлено.",
    deleted: "Нагадування видалено.",
    done: "Зроблено",
    taken: "Прийнято",
    waterLogged: "Випито",
    snooze: "Через 15 хв",
    skip: "Пропустити",
    pause: "Пауза",
    resume: "Увімкнути",
    editTime: "Змінити час",
    saveTime: "Зберегти",
    cancel: "Скасувати",
    delete: "Видалити",
    confirmDelete: "Так, видалити",
    deleteConfirm: "Точно видалити?",
    timePlaceholder: "Наприклад: 22:00 або о 9 ранку",
    noSchedule: "Очікує події",
    scheduleAfterMeal: (mealType: string) => `Після прийому їжі: ${mealType}`,
    scheduleWindow: (from: string, to: string) => `вікно ${from}-${to}`,
    scheduleOffset: (minutes: number) => `через ${minutes} хв`,
    mealLabels: {
      breakfast: "сніданок",
      lunch: "обід",
      dinner: "вечеря",
      snack: "перекус",
    },
    afterMealEditText: {
      breakfast: "після сніданку",
      lunch: "після обіду",
      dinner: "після вечері",
      snack: "після перекусу",
    },
    statusActive: "Активне",
    statusPaused: "Пауза",
    oneTime: "Один раз",
    daily: "Щодня",
    next: "Наступне",
    dose: "Доза",
    portion: "Порція",
    adherence: "Історія",
    completionRate: (rate: number) => `${rate}% виконано`,
    eventCounts: (completed: number, skipped: number, snoozed: number) =>
      `Прийнято/зроблено: ${completed} · пропущено: ${skipped} · перенесено: ${snoozed}`,
    noEvents: "Дій ще не було.",
    lastAction: (label: string) => `Останнє: ${label}`,
    actionLabels: {
      taken: "прийнято",
      done: "зроблено",
      skipped: "пропущено",
      snoozed: "перенесено",
    },
  },
  pl: {
    title: "Przypomnienia asystenta",
    subtitle:
      "Zarządzaj zadaniami i lekami, które asystent prowadzi przez stronę i Telegram. Dane są zapisane w chmurze konta.",
    typeLabel: "Typ",
    task: "Zadanie",
    medication: "Leki",
    medicationCourse: "Kurs leków",
    pregnancySupplement: "Ciąża",
    water: "Woda",
    habit: "Nawyk",
    textLabel: "Co przypomnieć",
    textPlaceholder: "Np. Zadzwonić do lekarza o 10:00",
    medicationPlaceholder:
      "Np. Witamina D z obiadem o 13:00, jeśli posiłek zawiera tłuszcze",
    medicationCoursePlaceholder: "Np. Amoksiklav 875 mg, 08:00 i 20:00, 7 dni",
    pregnancySupplementPlaceholder:
      "Np. Kwas foliowy według planu lekarza codziennie o 09:00",
    waterPlaceholder: "Np. Szklanka wody codziennie o 09:00, 13:00 i 18:00",
    habitPlaceholder: "Np. 10 min spaceru codziennie o 19:00",
    create: "Utwórz",
    creating: "Tworzymy...",
    refresh: "Odśwież",
    empty: "Nie ma jeszcze aktywnych przypomnień.",
    loading: "Ładujemy przypomnienia...",
    loadError: "Nie udało się załadować przypomnień.",
    createError:
      "Nie udało się utworzyć przypomnienia. Sprawdź, czy tekst zawiera czas: o 10:00, 21:00 albo codziennie o 09:00.",
    actionError: "Nie udało się zaktualizować przypomnienia.",
    created: "Przypomnienie utworzone.",
    updated: "Przypomnienie zaktualizowane.",
    deleted: "Przypomnienie usunięte.",
    done: "Zrobione",
    taken: "Przyjęte",
    waterLogged: "Wypite",
    snooze: "Za 15 min",
    skip: "Pomiń",
    pause: "Pauza",
    resume: "Wznów",
    editTime: "Zmień czas",
    saveTime: "Zapisz",
    cancel: "Anuluj",
    delete: "Usuń",
    confirmDelete: "Tak, usuń",
    deleteConfirm: "Na pewno usunąć?",
    timePlaceholder: "Np. 22:00 albo o 9 rano",
    noSchedule: "Czeka na zdarzenie",
    scheduleAfterMeal: (mealType: string) => `Po posiłku: ${mealType}`,
    scheduleWindow: (from: string, to: string) => `okno ${from}-${to}`,
    scheduleOffset: (minutes: number) => `po ${minutes} min`,
    mealLabels: {
      breakfast: "śniadanie",
      lunch: "obiad",
      dinner: "kolacja",
      snack: "przekąska",
    },
    afterMealEditText: {
      breakfast: "po śniadaniu",
      lunch: "po obiedzie",
      dinner: "po kolacji",
      snack: "po przekąsce",
    },
    statusActive: "Aktywne",
    statusPaused: "Pauza",
    oneTime: "Jednorazowo",
    daily: "Codziennie",
    next: "Następne",
    dose: "Dawka",
    portion: "Porcja",
    adherence: "Historia",
    completionRate: (rate: number) => `${rate}% wykonane`,
    eventCounts: (completed: number, skipped: number, snoozed: number) =>
      `Przyjęte/zrobione: ${completed} · pominięte: ${skipped} · przesunięte: ${snoozed}`,
    noEvents: "Nie ma jeszcze działań.",
    lastAction: (label: string) => `Ostatnio: ${label}`,
    actionLabels: {
      taken: "przyjęte",
      done: "zrobione",
      skipped: "pominięte",
      snoozed: "przesunięte",
    },
  },
  en: {
    title: "Assistant reminders",
    subtitle:
      "Manage tasks and medication reminders that the assistant runs through the website and Telegram. Data stays in your cloud account.",
    typeLabel: "Type",
    task: "Task",
    medication: "Medication",
    medicationCourse: "Medication course",
    pregnancySupplement: "Pregnancy supplement",
    water: "Water",
    habit: "Habit",
    textLabel: "What to remind",
    textPlaceholder: "Example: Call the doctor at 10:00",
    medicationPlaceholder:
      "Example: Vitamin D with lunch at 13:00 if the meal has fats",
    medicationCoursePlaceholder: "Example: Amoxiclav 875 mg, 08:00 and 20:00, 7 days",
    pregnancySupplementPlaceholder:
      "Example: Folic acid by clinician plan daily at 09:00",
    waterPlaceholder: "Example: A glass of water daily at 09:00, 13:00 and 18:00",
    habitPlaceholder: "Example: 10 min walk daily at 19:00",
    create: "Create",
    creating: "Creating...",
    refresh: "Refresh",
    empty: "No active reminders yet.",
    loading: "Loading reminders...",
    loadError: "Could not load reminders.",
    createError:
      "Could not create the reminder. Make sure the text includes a time: at 10:00, 21:00, or daily at 09:00.",
    actionError: "Could not update the reminder.",
    created: "Reminder created.",
    updated: "Reminder updated.",
    deleted: "Reminder deleted.",
    done: "Done",
    taken: "Taken",
    waterLogged: "Logged",
    snooze: "In 15 min",
    skip: "Skip",
    pause: "Pause",
    resume: "Resume",
    editTime: "Edit time",
    saveTime: "Save",
    cancel: "Cancel",
    delete: "Delete",
    confirmDelete: "Yes, delete",
    deleteConfirm: "Delete this reminder?",
    timePlaceholder: "Example: 22:00 or at 9 in the morning",
    noSchedule: "Waiting for event",
    scheduleAfterMeal: (mealType: string) => `After meal: ${mealType}`,
    scheduleWindow: (from: string, to: string) => `window ${from}-${to}`,
    scheduleOffset: (minutes: number) => `after ${minutes} min`,
    mealLabels: {
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snack: "snack",
    },
    afterMealEditText: {
      breakfast: "after breakfast",
      lunch: "after lunch",
      dinner: "after dinner",
      snack: "after snack",
    },
    statusActive: "Active",
    statusPaused: "Paused",
    oneTime: "One time",
    daily: "Daily",
    next: "Next",
    dose: "Dose",
    portion: "Serving",
    adherence: "History",
    completionRate: (rate: number) => `${rate}% completed`,
    eventCounts: (completed: number, skipped: number, snoozed: number) =>
      `Taken/done: ${completed} · skipped: ${skipped} · snoozed: ${snoozed}`,
    noEvents: "No actions yet.",
    lastAction: (label: string) => `Last: ${label}`,
    actionLabels: {
      taken: "taken",
      done: "done",
      skipped: "skipped",
      snoozed: "snoozed",
    },
  },
} as const;

const localeByLanguage = {
  uk: "uk-UA",
  pl: "pl-PL",
  en: "en-US",
} as const;

const getReminderCopy = (language: keyof typeof reminderCopy) => {
  if (language === "pl") return reminderCopy.pl;
  if (language === "en") return reminderCopy.en;

  return reminderCopy.uk;
};

const getReminderLocale = (language: keyof typeof localeByLanguage) => {
  if (language === "pl") return localeByLanguage.pl;
  if (language === "en") return localeByLanguage.en;

  return localeByLanguage.uk;
};

const getReminderTypeLabel = (
  copy: (typeof reminderCopy)[keyof typeof reminderCopy],
  reminderType: ReminderType
) => {
  if (reminderType === "medication") return copy.medication;
  if (reminderType === "medication_course") return copy.medicationCourse;
  if (reminderType === "pregnancy_supplement") return copy.pregnancySupplement;
  if (reminderType === "water") return copy.water;
  if (reminderType === "habit") return copy.habit;

  return copy.task;
};

const getReminderPlaceholder = (
  copy: (typeof reminderCopy)[keyof typeof reminderCopy],
  reminderType: ReminderType
) => {
  if (reminderType === "medication") return copy.medicationPlaceholder;
  if (reminderType === "medication_course") return copy.medicationCoursePlaceholder;
  if (reminderType === "pregnancy_supplement") return copy.pregnancySupplementPlaceholder;
  if (reminderType === "water") return copy.waterPlaceholder;
  if (reminderType === "habit") return copy.habitPlaceholder;

  return copy.textPlaceholder;
};

const getReminderIcon = (reminderType: ReminderType) => {
  if (reminderType === "water") {
    return <Droplets size={14} />;
  }

  if (reminderType === "pregnancy_supplement") {
    return <HeartPulse size={14} />;
  }

  if (isMedicationLikeReminderType(reminderType)) {
    return <Bell size={14} />;
  }

  return <ListChecks size={14} />;
};

const getReminderQuantityLabel = (
  copy: (typeof reminderCopy)[keyof typeof reminderCopy],
  reminderType: ReminderType
) => {
  if (isMedicationLikeReminderType(reminderType)) {
    return copy.dose;
  }

  if (reminderType === "water") {
    return copy.portion;
  }

  return "";
};

const getReminderPrimaryActionLabel = (
  copy: (typeof reminderCopy)[keyof typeof reminderCopy],
  reminderType: ReminderType
) => {
  if (isMedicationLikeReminderType(reminderType)) {
    return copy.taken;
  }

  if (reminderType === "water") {
    return copy.waterLogged;
  }

  return copy.done;
};

const getReminderActionLabel = (
  copy: (typeof reminderCopy)[keyof typeof reminderCopy],
  action: string
) => {
  if (action === "taken") return copy.actionLabels.taken;
  if (action === "done") return copy.actionLabels.done;
  if (action === "skipped") return copy.actionLabels.skipped;
  if (action === "snoozed") return copy.actionLabels.snoozed;

  return action;
};

const ReminderManagementCard = () => {
  const { appLanguage } = useLanguage();
  const copy = getReminderCopy(appLanguage);
  const locale = getReminderLocale(appLanguage);
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [type, setType] = useState<ReminderType>("task");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyReminderId, setBusyReminderId] = useState<string | null>(null);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const sortedItems = useMemo(() => sortReminders(items), [items]);
  const trimmedText = text.trim();
  const canCreate = trimmedText.length >= 6 && !creating;

  const loadReminders = async () => {
    setLoading(true);
    setNotice(null);

    try {
      setItems(await listRemoteReminders({ activeOnly: false }));
    } catch {
      setNotice({ type: "error", text: copy.loadError });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void listRemoteReminders({ activeOnly: false })
      .then((reminders) => {
        if (active) {
          setItems(reminders);
        }
      })
      .catch(() => {
        if (active) {
          setNotice({ type: "error", text: copy.loadError });
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [copy.loadError]);

  useEffect(
    () =>
      subscribeToReminderUpserts((item) => {
        setItems((current) => upsertReminderItem(current, item));
      }),
    []
  );

  const handleCreate = async () => {
    if (!canCreate) {
      return;
    }

    setCreating(true);
    setNotice(null);

    try {
      const item = await createRemoteReminder({ type, text: trimmedText });
      setItems((current) => upsertReminderItem(current, item));
      dispatchReminderUpserted(item);
      setText("");
      setNotice({ type: "success", text: copy.created });
    } catch {
      setNotice({ type: "error", text: copy.createError });
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (
    reminder: ReminderItem,
    action: ReminderAction,
    options: { minutes?: number } = {}
  ) => {
    setBusyReminderId(reminder.id);
    setNotice(null);

    try {
      const item = await updateRemoteReminderAction(reminder.id, action, options);
      setItems((current) => upsertReminderItem(current, item));
      dispatchReminderUpserted(item);
      setNotice({ type: "success", text: copy.updated });
    } catch {
      setNotice({ type: "error", text: copy.actionError });
    } finally {
      setBusyReminderId(null);
    }
  };

  const startEditing = (reminder: ReminderItem) => {
    setEditingReminderId(reminder.id);
    setEditingText(
      reminder.trigger?.kind === "after_meal"
        ? copy.afterMealEditText[reminder.trigger.mealType]
        : reminder.times.join(", ")
    );
    setConfirmingDeleteId(null);
    setNotice(null);
  };

  const cancelEditing = () => {
    setEditingReminderId(null);
    setEditingText("");
  };

  const handleSaveSchedule = async (reminder: ReminderItem) => {
    const scheduleText = editingText.trim();

    if (!scheduleText) {
      setNotice({ type: "error", text: copy.actionError });
      return;
    }

    setBusyReminderId(reminder.id);
    setNotice(null);

    try {
      const item = await updateRemoteReminderSchedule(reminder.id, scheduleText);
      setItems((current) => upsertReminderItem(current, item));
      dispatchReminderUpserted(item);
      cancelEditing();
      setNotice({ type: "success", text: copy.updated });
    } catch {
      setNotice({ type: "error", text: copy.actionError });
    } finally {
      setBusyReminderId(null);
    }
  };

  const handleDelete = async (reminder: ReminderItem) => {
    setBusyReminderId(reminder.id);
    setNotice(null);

    try {
      await deleteRemoteReminder(reminder.id);
      setItems((current) => current.filter((entry) => entry.id !== reminder.id));
      setNotice({ type: "success", text: copy.deleted });
    } catch {
      setNotice({ type: "error", text: copy.actionError });
    } finally {
      setBusyReminderId(null);
      setConfirmingDeleteId(null);
    }
  };

  return (
    <SectionCard
      title={copy.title}
      description={copy.subtitle}
      tone="info"
      action={
        <Button
          variant="outlined"
          size="small"
          startIcon={<Clock size={16} />}
          onClick={() => {
            void loadReminders();
          }}
          disabled={loading}
          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
        >
          {copy.refresh}
        </Button>
      }
    >
      <Stack spacing={2}>
        {notice && <Alert severity={notice.type}>{notice.text}</Alert>}

        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "180px minmax(0, 1fr) auto" },
            gap: 1.2,
            alignItems: "stretch",
          }}
        >
          <TextField
            select
            label={copy.typeLabel}
            value={type}
            onChange={(event) => {
              setType(toReminderType(event.target.value));
            }}
          >
            {reminderTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {getReminderTypeLabel(copy, option)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={copy.textLabel}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={getReminderPlaceholder(copy, type)}
            inputProps={{
              autoComplete: "off",
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!canCreate}
            startIcon={<Plus size={18} />}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 900,
              px: 2.4,
              background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
            }}
          >
            {creating ? copy.creating : copy.create}
          </Button>
        </Box>

        {loading ? (
          <Typography color="text.secondary">{copy.loading}</Typography>
        ) : sortedItems.length === 0 ? (
          <Alert severity="info" icon={<Bell size={18} />}>
            {copy.empty}
          </Alert>
        ) : (
          <Stack spacing={1.2}>
            {sortedItems.map((reminder) => {
              const isBusy = busyReminderId === reminder.id;
              const isEditing = editingReminderId === reminder.id;
              const isConfirmingDelete = confirmingDeleteId === reminder.id;
              const primaryAction: ReminderAction = getReminderPrimaryAction(reminder.type);
              const primaryActionLabel = getReminderPrimaryActionLabel(copy, reminder.type);
              const quantityLabel = getReminderQuantityLabel(copy, reminder.type);
              const adherence = getReminderAdherenceSummary(reminder);
              const lastActionLabel = adherence.lastEvent
                ? getReminderActionLabel(copy, adherence.lastEvent.action)
                : null;
              const scheduleLabel = formatReminderScheduleLabel({
                reminder,
                mealLabels: copy.mealLabels,
                afterMealLabel: copy.scheduleAfterMeal,
                windowLabel: copy.scheduleWindow,
                offsetLabel: copy.scheduleOffset,
                noScheduleLabel: copy.noSchedule,
              });

              return (
                <Box
                  key={reminder.id}
                  sx={{
                    p: 1.5,
                    border: "1px solid var(--sn-border-soft)",
                    borderRadius: 1,
                    bgcolor: "var(--sn-surface-elevated)",
                  }}
                >
                  <Stack spacing={1.2}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                    >
                      <Stack spacing={0.5} minWidth={0}>
                        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            icon={getReminderIcon(reminder.type)}
                            label={getReminderTypeLabel(copy, reminder.type)}
                          />
                          <Chip
                            size="small"
                            label={reminder.repeat === "once" ? copy.oneTime : copy.daily}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            color={reminder.active ? "success" : "default"}
                            label={reminder.active ? copy.statusActive : copy.statusPaused}
                            variant={reminder.active ? "filled" : "outlined"}
                          />
                        </Stack>
                        <Typography sx={{ fontWeight: 900, wordBreak: "break-word" }}>
                          {reminder.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {scheduleLabel}
                          {reminder.dose && quantityLabel
                            ? ` · ${quantityLabel}: ${reminder.dose}`
                            : ""}
                        </Typography>
                        {reminder.nextRunAt && (
                          <Typography variant="body2" color="text.secondary">
                            {copy.next}: {formatReminderDateTime(reminder, locale)}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            label={
                              adherence.completionRate === null
                                ? copy.noEvents
                                : copy.completionRate(adherence.completionRate)
                            }
                            color={
                              adherence.completionRate !== null &&
                              adherence.completionRate >= 80
                                ? "success"
                                : adherence.skipped > 0
                                  ? "warning"
                                  : "default"
                            }
                            variant={adherence.completionRate === null ? "outlined" : "filled"}
                          />
                          {lastActionLabel ? (
                            <Chip
                              size="small"
                              label={copy.lastAction(lastActionLabel)}
                              variant="outlined"
                            />
                          ) : null}
                        </Stack>
                        {adherence.total > 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            {copy.adherence}:{" "}
                            {copy.eventCounts(
                              adherence.completed,
                              adherence.skipped,
                              adherence.snoozed
                            )}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>

                    {isEditing && (
                      <Box
                        component="form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void handleSaveSchedule(reminder);
                        }}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto auto" },
                          gap: 1,
                          alignItems: "center",
                        }}
                      >
                        <TextField
                          size="small"
                          label={copy.editTime}
                          value={editingText}
                          onChange={(event) => setEditingText(event.target.value)}
                          placeholder={copy.timePlaceholder}
                          disabled={isBusy}
                          inputProps={{
                            autoComplete: "off",
                            inputMode: "text",
                          }}
                        />
                        <Button
                          type="submit"
                          variant="contained"
                          size="small"
                          startIcon={<Save size={16} />}
                          disabled={isBusy || !editingText.trim()}
                          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                        >
                          {copy.saveTime}
                        </Button>
                        <Button
                          type="button"
                          variant="text"
                          size="small"
                          startIcon={<X size={16} />}
                          disabled={isBusy}
                          onClick={cancelEditing}
                          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                        >
                          {copy.cancel}
                        </Button>
                      </Box>
                    )}

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Check size={16} />}
                        disabled={isBusy || !reminder.active}
                        onClick={() => {
                          void handleAction(reminder, primaryAction);
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {primaryActionLabel}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Clock size={16} />}
                        disabled={isBusy || !reminder.active}
                        onClick={() => {
                          void handleAction(reminder, "snoozed", { minutes: 15 });
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {copy.snooze}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={isBusy || !reminder.active}
                        onClick={() => {
                          void handleAction(reminder, "skipped");
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {copy.skip}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={reminder.active ? <Pause size={16} /> : <Play size={16} />}
                        disabled={isBusy}
                        onClick={() => {
                          void handleAction(reminder, reminder.active ? "pause" : "resume");
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {reminder.active ? copy.pause : copy.resume}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Pencil size={16} />}
                        disabled={isBusy}
                        onClick={() => startEditing(reminder)}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {copy.editTime}
                      </Button>
                      <Button
                        variant={isConfirmingDelete ? "contained" : "text"}
                        color="error"
                        size="small"
                        startIcon={<Trash2 size={16} />}
                        disabled={isBusy}
                        onClick={() => {
                          if (isConfirmingDelete) {
                            void handleDelete(reminder);
                            return;
                          }

                          setConfirmingDeleteId(reminder.id);
                          setEditingReminderId(null);
                          setNotice({ type: "error", text: copy.deleteConfirm });
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {isConfirmingDelete ? copy.confirmDelete : copy.delete}
                      </Button>
                      {isConfirmingDelete && (
                        <Button
                          variant="text"
                          size="small"
                          startIcon={<X size={16} />}
                          disabled={isBusy}
                          onClick={() => {
                            setConfirmingDeleteId(null);
                            setNotice(null);
                          }}
                          sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                        >
                          {copy.cancel}
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </SectionCard>
  );
};

export default ReminderManagementCard;
