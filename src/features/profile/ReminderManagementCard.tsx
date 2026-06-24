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
import { Bell, Check, Clock, Droplets, HeartPulse, ListChecks, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@shared/language";
import { SectionCard } from "@shared/ui";
import {
  createRemoteReminder,
  deleteRemoteReminder,
  listRemoteReminders,
  updateRemoteReminderAction,
  type ReminderAction,
  type ReminderItem,
  type ReminderType,
} from "@shared/api/reminders";
import {
  formatReminderDateTime,
  getReminderPrimaryAction,
  isMedicationLikeReminderType,
  reminderTypeOptions,
  sortReminders,
  toReminderType,
} from "./reminderManagementModel";

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
    medicationPlaceholder: "Наприклад: Вітамін D 1 капсула щодня о 09:00",
    medicationCoursePlaceholder: "Наприклад: Амоксиклав 875 мг, 08:00 і 20:00, 7 днів",
    pregnancySupplementPlaceholder: "Наприклад: Фолієва кислота 1 капсула щодня о 09:00",
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
    deleted: "Нагадування вимкнено.",
    done: "Зроблено",
    taken: "Прийнято",
    waterLogged: "Випито",
    snooze: "Через 10 хв",
    skip: "Пропустити",
    delete: "Видалити",
    oneTime: "Один раз",
    daily: "Щодня",
    next: "Наступне",
    dose: "Доза",
    portion: "Порція",
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
    medicationPlaceholder: "Np. Witamina D 1 kapsułka codziennie o 09:00",
    medicationCoursePlaceholder: "Np. Amoksiklav 875 mg, 08:00 i 20:00, 7 dni",
    pregnancySupplementPlaceholder: "Np. Kwas foliowy 1 kapsułka codziennie o 09:00",
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
    deleted: "Przypomnienie wyłączone.",
    done: "Zrobione",
    taken: "Przyjęte",
    waterLogged: "Wypite",
    snooze: "Za 10 min",
    skip: "Pomiń",
    delete: "Usuń",
    oneTime: "Jednorazowo",
    daily: "Codziennie",
    next: "Następne",
    dose: "Dawka",
    portion: "Porcja",
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
    medicationPlaceholder: "Example: Vitamin D 1 capsule daily at 09:00",
    medicationCoursePlaceholder: "Example: Amoxiclav 875 mg, 08:00 and 20:00, 7 days",
    pregnancySupplementPlaceholder: "Example: Folic acid 1 capsule daily at 09:00",
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
    deleted: "Reminder disabled.",
    done: "Done",
    taken: "Taken",
    waterLogged: "Logged",
    snooze: "In 10 min",
    skip: "Skip",
    delete: "Delete",
    oneTime: "One time",
    daily: "Daily",
    next: "Next",
    dose: "Dose",
    portion: "Serving",
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

export const ReminderManagementCard = () => {
  const { appLanguage } = useLanguage();
  const copy = getReminderCopy(appLanguage);
  const locale = getReminderLocale(appLanguage);
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [type, setType] = useState<ReminderType>("task");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyReminderId, setBusyReminderId] = useState<string | null>(null);
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
      setItems(await listRemoteReminders({ activeOnly: true }));
    } catch {
      setNotice({ type: "error", text: copy.loadError });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    void listRemoteReminders({ activeOnly: true })
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

  const handleCreate = async () => {
    if (!canCreate) {
      return;
    }

    setCreating(true);
    setNotice(null);

    try {
      const item = await createRemoteReminder({ type, text: trimmedText });
      setItems((current) => sortReminders([item, ...current.filter((reminder) => reminder.id !== item.id)]));
      setText("");
      setNotice({ type: "success", text: copy.created });
    } catch {
      setNotice({ type: "error", text: copy.createError });
    } finally {
      setCreating(false);
    }
  };

  const handleAction = async (reminder: ReminderItem, action: ReminderAction) => {
    setBusyReminderId(reminder.id);
    setNotice(null);

    try {
      const item = await updateRemoteReminderAction(reminder.id, action);
      setItems((current) =>
        item.active
          ? sortReminders(current.map((entry) => (entry.id === item.id ? item : entry)))
          : current.filter((entry) => entry.id !== item.id)
      );
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
              const primaryAction: ReminderAction = getReminderPrimaryAction(reminder.type);
              const primaryActionLabel = getReminderPrimaryActionLabel(copy, reminder.type);
              const quantityLabel = getReminderQuantityLabel(copy, reminder.type);

              return (
                <Box
                  key={reminder.id}
                  sx={{
                    p: 1.5,
                    border: "1px solid rgba(15, 23, 42, 0.08)",
                    borderRadius: 1,
                    bgcolor: "rgba(255,255,255,0.78)",
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
                        </Stack>
                        <Typography sx={{ fontWeight: 900, wordBreak: "break-word" }}>
                          {reminder.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {reminder.times.join(", ")}
                          {reminder.dose && quantityLabel
                            ? ` · ${quantityLabel}: ${reminder.dose}`
                            : ""}
                        </Typography>
                        {reminder.nextRunAt && (
                          <Typography variant="body2" color="text.secondary">
                            {copy.next}: {formatReminderDateTime(reminder, locale)}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Check size={16} />}
                        disabled={isBusy}
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
                        disabled={isBusy}
                        onClick={() => {
                          void handleAction(reminder, "snoozed");
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {copy.snooze}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={isBusy}
                        onClick={() => {
                          void handleAction(reminder, "skipped");
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {copy.skip}
                      </Button>
                      <Button
                        variant="text"
                        color="error"
                        size="small"
                        startIcon={<Trash2 size={16} />}
                        disabled={isBusy}
                        onClick={() => {
                          void handleDelete(reminder);
                        }}
                        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 800 }}
                      >
                        {copy.delete}
                      </Button>
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
