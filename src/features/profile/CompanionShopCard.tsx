import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Droplets,
  HeartPulse,
  MessageCircle,
  Salad,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../app/store";
import {
  canPurchaseCompanionItem,
  companionShopCatalog,
  getEquippedCompanionItems,
  getOwnedCompanionItems,
  hasCompanionItem,
  isCompanionItemEquipped,
  type CompanionCatalogCategory,
  type CompanionCatalogItem,
  type CompanionCatalogLocale,
  type CompanionCatalogRarity,
} from "../../companion";
import {
  Companion3DLoadingFallback,
  CompanionAvatar as AssistantAvatar,
} from "@features/assistant-3d";
import { useLanguage } from "../../shared/language";
import { applyCompanionShopSelectionInCloud } from "../companion/companionCloudSync";
import { useCompanionRenderModePreference } from "./useCompanionRenderModePreference";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";

const shopCopy = {
  uk: {
    title: "Студія AI-помічника",
    subtitle:
      "Обери зовнішність, характер руху й настрій. Це той самий Smart Nutrition AI: змінюється образ, а пам'ять, навички й інструменти залишаються єдиними.",
    sameBrain:
      "Один помічник у застосунку й Telegram: харчування, вода, здоров'я, родина, задачі, нагадування, фото й AI-чат.",
    studioEyebrow: "Жива колекція",
    studioTitle: "Образи, які хочеться збирати",
    studioSubtitle:
      "Роботи безкоштовні, тварини й фентезі відкриваються як косметична колекція без pay-to-win.",
    freeRobots: "Безкоштовна база",
    collectibleLooks: "Колекційні образи",
    preview: "Живий попередній перегляд",
    previewHint: "Наведи або вибери образ, щоб побачити, як він поводиться.",
    currentSelection: "Зараз у фокусі",
    toolBeltTitle: "Інструменти твого помічника",
    toolBeltSubtitle:
      "Скін не урізає можливості. Помічник усе одно працює з планами, водою, їжею, здоров'ям, сім'єю й нагадуваннями.",
    tryInChat: "Спробувати в чаті",
    balance: "Монети",
    equippedCount: "Вибрано",
    ownedCount: "Куплено",
    choose: "Вибрати",
    buyAndChoose: "Купити",
    equipped: "Активний",
    locked: "Не вистачає",
    owned: "Куплено",
    available: "Доступно",
    saving: "Зберігаю...",
    saveError: "Не вдалося зберегти образ у хмарі. Спробуйте ще раз.",
    coins: "монет",
    profileLook: "Образ із профілю",
    renderModeLoading: "Готую образ",
    filters: {
      all: "Усі",
    },
    rarity: {
      common: "Звичайний",
      rare: "Рідкісний",
      epic: "Епічний",
      legendary: "Легендарний",
    } satisfies Record<CompanionCatalogRarity, string>,
    categories: {
      robot: "Роботи",
      animal: "Тварини",
      fantasy: "Фентезі",
      nature: "Природа",
      outfit: "Одяг",
      emotion: "Емоція",
      accessory: "Аксесуар",
      animation: "Анімація",
      premium: "Преміум образ",
      seasonal: "Сезонний образ",
    } satisfies Record<CompanionCatalogCategory, string>,
    tools: {
      planning: ["Планування", "День, тиждень, цілі й сімейний ритм"],
      nutrition: ["Харчування", "Продукти, рецепти, БЖВ і мікронутрієнти"],
      water: ["Вода", "Трекер, стаканчики й м'які нагадування"],
      health: ["Здоров'я", "Тиск, аналізи, симптоми без діагнозів"],
      activity: ["Активність", "Кроки, тренування, прогулянки й витрати"],
      family: ["Родина", "Партнер, вагітність, дитина й спільні цілі"],
      reminders: ["Нагадування", "Події, ліки, дні народження й задачі"],
      chat: ["AI-розмова", "Пояснення, пошук і допомога без шаблонів"],
      analytics: ["Аналітика", "Графіки, закономірності й звіти"],
      safety: ["Безпека", "Дані, межі wellness і обережні поради"],
    },
  },
  pl: {
    title: "Studio asystenta AI",
    subtitle:
      "Wybierz wygląd, ruch i nastrój. To ten sam Smart Nutrition AI: zmienia się tylko obraz, a pamięć, umiejętności i narzędzia zostają wspólne.",
    sameBrain:
      "Jeden asystent w aplikacji i Telegramie: jedzenie, woda, zdrowie, rodzina, zadania, przypomnienia, zdjęcia i AI chat.",
    studioEyebrow: "Żywa kolekcja",
    studioTitle: "Wyglądy, które chce się zbierać",
    studioSubtitle:
      "Roboty są darmowe, zwierzęta i fantazja otwierają się jako kosmetyczna kolekcja bez pay-to-win.",
    freeRobots: "Darmowa baza",
    collectibleLooks: "Kolekcja wyglądów",
    preview: "Żywy podgląd",
    previewHint: "Najedź albo wybierz wygląd, żeby zobaczyć, jak się zachowuje.",
    currentSelection: "Teraz w fokusie",
    toolBeltTitle: "Narzędzia twojego asystenta",
    toolBeltSubtitle:
      "Skin nie ogranicza możliwości. Asystent nadal pracuje z planami, wodą, jedzeniem, zdrowiem, rodziną i przypomnieniami.",
    tryInChat: "Spróbuj w czacie",
    balance: "Monety",
    equippedCount: "Wybrane",
    ownedCount: "Kupione",
    choose: "Wybierz",
    buyAndChoose: "Kup",
    equipped: "Aktywny",
    locked: "Za mało",
    owned: "Kupione",
    available: "Dostępne",
    saving: "Zapisuję...",
    saveError: "Nie udało się zapisać wyglądu w chmurze. Spróbuj ponownie.",
    coins: "monet",
    profileLook: "Wygląd z profilu",
    renderModeLoading: "Przygotowuję wygląd",
    filters: {
      all: "Wszystkie",
    },
    rarity: {
      common: "Zwykły",
      rare: "Rzadki",
      epic: "Epicki",
      legendary: "Legendarny",
    } satisfies Record<CompanionCatalogRarity, string>,
    categories: {
      robot: "Roboty",
      animal: "Zwierzęta",
      fantasy: "Fantazja",
      nature: "Natura",
      outfit: "Ubranie",
      emotion: "Emocja",
      accessory: "Akcesorium",
      animation: "Animacja",
      premium: "Wygląd premium",
      seasonal: "Wygląd sezonowy",
    } satisfies Record<CompanionCatalogCategory, string>,
    tools: {
      planning: ["Planowanie", "Dzień, tydzień, cele i rytm rodziny"],
      nutrition: ["Odżywianie", "Produkty, przepisy, makro i mikroelementy"],
      water: ["Woda", "Tracker, szklanki i łagodne przypomnienia"],
      health: ["Zdrowie", "Ciśnienie, analizy, objawy bez diagnoz"],
      activity: ["Aktywność", "Kroki, treningi, spacery i spalanie"],
      family: ["Rodzina", "Partner, ciąża, dziecko i wspólne cele"],
      reminders: ["Przypomnienia", "Wydarzenia, leki, urodziny i zadania"],
      chat: ["AI rozmowa", "Wyjaśnienia, wyszukiwanie i pomoc bez szablonów"],
      analytics: ["Analityka", "Wykresy, wzorce i raporty"],
      safety: ["Bezpieczeństwo", "Dane, granice wellness i ostrożne porady"],
    },
  },
  en: {
    title: "AI Assistant Studio",
    subtitle:
      "Choose the look, motion, and mood. It is the same Smart Nutrition AI: only the appearance changes while memory, skills, and tools stay unified.",
    sameBrain:
      "One assistant in the app and Telegram: food, water, health, family, tasks, reminders, photos, and AI chat.",
    studioEyebrow: "Living collection",
    studioTitle: "Looks people actually want to collect",
    studioSubtitle:
      "Robots are free, while animals and fantasy looks unlock as cosmetic collection pieces without pay-to-win.",
    freeRobots: "Free base",
    collectibleLooks: "Collectible looks",
    preview: "Live preview",
    previewHint: "Hover or select a look to see how it behaves.",
    currentSelection: "Now in focus",
    toolBeltTitle: "Your assistant tools",
    toolBeltSubtitle:
      "The skin never limits capability. The assistant still works with plans, water, food, health, family, and reminders.",
    tryInChat: "Try in chat",
    balance: "Coins",
    equippedCount: "Equipped",
    ownedCount: "Owned",
    choose: "Equip",
    buyAndChoose: "Buy",
    equipped: "Active",
    locked: "Not enough",
    owned: "Owned",
    available: "Available",
    saving: "Saving...",
    saveError: "Could not save the look to cloud. Try again.",
    coins: "coins",
    profileLook: "Profile look",
    renderModeLoading: "Preparing look",
    filters: {
      all: "All",
    },
    rarity: {
      common: "Common",
      rare: "Rare",
      epic: "Epic",
      legendary: "Legendary",
    } satisfies Record<CompanionCatalogRarity, string>,
    categories: {
      robot: "Robots",
      animal: "Animals",
      fantasy: "Fantasy",
      nature: "Nature",
      outfit: "Outfit",
      emotion: "Emotion",
      accessory: "Accessory",
      animation: "Animation",
      premium: "Premium look",
      seasonal: "Seasonal look",
    } satisfies Record<CompanionCatalogCategory, string>,
    tools: {
      planning: ["Planning", "Day, week, goals, and family rhythm"],
      nutrition: ["Nutrition", "Products, recipes, macros, and micronutrients"],
      water: ["Water", "Tracker, glasses, and gentle reminders"],
      health: ["Health", "Pressure, labs, symptoms without diagnosis"],
      activity: ["Activity", "Steps, workouts, walks, and energy burn"],
      family: ["Family", "Partner, pregnancy, baby, and shared goals"],
      reminders: ["Reminders", "Events, medication, birthdays, and tasks"],
      chat: ["AI conversation", "Explanations, search, and help without templates"],
      analytics: ["Analytics", "Charts, patterns, and reports"],
      safety: ["Safety", "Data, wellness boundaries, and careful advice"],
    },
  },
} as const;

type ShopCopy = (typeof shopCopy)[keyof typeof shopCopy];
type CompanionShopFilter = CompanionCatalogCategory | "all";

const companionShopFilters: CompanionShopFilter[] = [
  "all",
  "robot",
  "animal",
  "fantasy",
  "nature",
  "seasonal",
];

const assistantToolIcons: Array<{
  key: keyof ShopCopy["tools"];
  icon: LucideIcon;
  accent: string;
}> = [
  { key: "planning", icon: CalendarDays, accent: "#a855f7" },
  { key: "nutrition", icon: Salad, accent: "#22c55e" },
  { key: "water", icon: Droplets, accent: "#22d3ee" },
  { key: "health", icon: HeartPulse, accent: "#f472b6" },
  { key: "activity", icon: Activity, accent: "#f59e0b" },
  { key: "family", icon: Users, accent: "#fb7185" },
  { key: "reminders", icon: Bell, accent: "#facc15" },
  { key: "chat", icon: MessageCircle, accent: "#38bdf8" },
  { key: "analytics", icon: BarChart3, accent: "#34d399" },
  { key: "safety", icon: ShieldCheck, accent: "#c4b5fd" },
];

const previewOrbitItems: Array<{
  key: keyof ShopCopy["tools"];
  x: number;
  y: number;
}> = [
  { key: "planning", x: 4, y: 4 },
  { key: "nutrition", x: 61, y: 8 },
  { key: "water", x: 0, y: 38 },
  { key: "health", x: 70, y: 39 },
  { key: "family", x: 7, y: 70 },
  { key: "reminders", x: 64, y: 73 },
  { key: "chat", x: 32, y: 0 },
  { key: "analytics", x: 35, y: 82 },
  { key: "safety", x: 78, y: 4 },
] as const;

const softChipSx = {
  color: "#e5f9ff",
  borderColor: "rgba(229,249,255,0.22)",
};

const getShopCopy = (locale: CompanionCatalogLocale): ShopCopy => {
  switch (locale) {
    case "pl":
      return shopCopy.pl;
    case "en":
      return shopCopy.en;
    case "uk":
    default:
      return shopCopy.uk;
  }
};

const getCatalogText = (
  values: Record<CompanionCatalogLocale, string>,
  locale: CompanionCatalogLocale
) => {
  switch (locale) {
    case "pl":
      return values.pl;
    case "en":
      return values.en;
    case "uk":
    default:
      return values.uk;
  }
};

const getCategoryLabel = (
  categories: Record<CompanionCatalogCategory, string>,
  category: CompanionCatalogCategory
) => {
  switch (category) {
    case "robot":
      return categories.robot;
    case "animal":
      return categories.animal;
    case "fantasy":
      return categories.fantasy;
    case "nature":
      return categories.nature;
    case "emotion":
      return categories.emotion;
    case "accessory":
      return categories.accessory;
    case "animation":
      return categories.animation;
    case "premium":
      return categories.premium;
    case "seasonal":
      return categories.seasonal;
    case "outfit":
    default:
      return categories.outfit;
  }
};

const getRarityLabel = (
  rarity: Record<CompanionCatalogRarity, string>,
  value: CompanionCatalogRarity
) => {
  switch (value) {
    case "rare":
      return rarity.rare;
    case "epic":
      return rarity.epic;
    case "legendary":
      return rarity.legendary;
    case "common":
    default:
      return rarity.common;
  }
};

const getToolText = (
  tools: ShopCopy["tools"],
  key: keyof ShopCopy["tools"]
) => {
  switch (key) {
    case "planning":
      return tools.planning;
    case "nutrition":
      return tools.nutrition;
    case "water":
      return tools.water;
    case "health":
      return tools.health;
    case "activity":
      return tools.activity;
    case "family":
      return tools.family;
    case "reminders":
      return tools.reminders;
    case "chat":
      return tools.chat;
    case "analytics":
      return tools.analytics;
    case "safety":
    default:
      return tools.safety;
  }
};

const getStatusTone = ({
  isEquipped,
  isLocked,
}: {
  isEquipped: boolean;
  isLocked: boolean;
}) => {
  if (isEquipped) {
    return "success";
  }

  if (isLocked) {
    return "warning";
  }

  return "default";
};

const CompanionShopCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const profile = useSelector((state: RootState) => state.profile);
  const assistant = profile.assistant;
  const authMeta = useSelector((state: RootState) => state.auth.cloudMeta);
  const meal = useSelector((state: RootState) => state.meal);
  const water = useSelector((state: RootState) => state.water);
  const fridge = useSelector((state: RootState) => state.fridge);
  const community = useSelector((state: RootState) => state.community);
  const companion = useSelector((state: RootState) => state.companion);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<CompanionShopFilter>("all");
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const companionRenderModePreference = useCompanionRenderModePreference();
  const { appLanguage } = useLanguage();
  const locale: CompanionCatalogLocale = appLanguage;
  const copy = getShopCopy(locale);
  const assistantDisplayName = getAssistantDisplayName(assistant.name, appLanguage);
  const equippedItems = useMemo(
    () => getEquippedCompanionItems(companion),
    [companion]
  );
  const ownedItems = useMemo(
    () => getOwnedCompanionItems(companion),
    [companion]
  );
  const activePreview =
    equippedItems.find((item) => item.slot === "companion") ??
    companionShopCatalog.find((item) => item.companionKind === assistant.companionKind) ??
    null;
  const availableCatalogItems = useMemo(
    () => companionShopCatalog.filter((item) => item.available),
    []
  );
  const visibleCatalogItems = useMemo(
    () =>
      availableCatalogItems.filter(
        (item) => activeFilter === "all" || item.category === activeFilter
      ),
    [activeFilter, availableCatalogItems]
  );
  const freeBaseCount = availableCatalogItems.filter(
    (item) => item.category === "robot" && item.price === 0
  ).length;
  const collectibleCount = availableCatalogItems.filter(
    (item) => item.category !== "robot" && item.price > 0
  ).length;
  const focusedPreview =
    availableCatalogItems.find((item) => item.id === previewItemId) ?? activePreview;
  const focusedPreviewOwned = focusedPreview
    ? hasCompanionItem(companion, focusedPreview.id)
    : false;
  const focusedPreviewEquipped = focusedPreview
    ? isCompanionItemEquipped(companion, focusedPreview.id)
    : false;
  const focusedPreviewCanBuy = focusedPreview
    ? canPurchaseCompanionItem(companion, focusedPreview)
    : false;
  const focusedPreviewLocked =
    Boolean(focusedPreview?.available) && !focusedPreviewOwned && !focusedPreviewCanBuy;
  const focusedPreviewActionLabel = focusedPreviewOwned ? copy.choose : copy.buyAndChoose;
  const focusedPreviewStatus = focusedPreviewEquipped
    ? copy.equipped
    : focusedPreviewOwned
      ? copy.owned
      : focusedPreviewLocked
        ? copy.locked
        : copy.available;

  const handleItemAction = async (item: CompanionCatalogItem) => {
    const isOwned = hasCompanionItem(companion, item.id);
    const canBuy = canPurchaseCompanionItem(companion, item);

    if (
      savingItemId !== null ||
      !item.available ||
      isCompanionItemEquipped(companion, item.id)
    ) {
      return;
    }

    if (!isOwned && !canBuy) {
      return;
    }

    setSavingItemId(item.id);
    setSaveError(null);

    try {
      await applyCompanionShopSelectionInCloud(
        dispatch,
        {
          auth: { cloudMeta: authMeta },
          profile,
          meal,
          water,
          fridge,
          community,
          companion,
        },
        item
      );
    } catch {
      setSaveError(copy.saveError);
    } finally {
      setSavingItemId(null);
    }
  };
  return (
    <Paper
      elevation={0}
      className="sn-premium-panel"
      data-companion-shop-studio="true"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        overflow: "hidden",
        border: "1px solid rgba(34, 211, 238, 0.22)",
        color: "#e5f9ff",
        background:
          "linear-gradient(115deg, rgba(34,211,238,0.08) 0 1px, transparent 1px 128px), linear-gradient(145deg, #020617 0%, #071322 46%, #061f1b 100%)",
      }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.8} sx={{ maxWidth: 780 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Sparkles size={18} color="#67e8f9" />
              <Typography
                variant="overline"
                sx={{ color: "#67e8f9", fontWeight: 900, letterSpacing: 0 }}
              >
                {copy.studioEyebrow}
              </Typography>
            </Stack>
            <Typography component="h2" variant="h5" sx={{ fontWeight: 950 }}>
              {copy.title}
            </Typography>
            <Typography sx={{ color: "rgba(229,249,255,0.78)" }}>
              {copy.subtitle}
            </Typography>
            <Typography variant="body2" sx={{ color: "#a7f3d0", fontWeight: 900 }}>
              {copy.sameBrain}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${copy.balance}: ${companion.coins}`} color="primary" />
            <Chip
              label={`${copy.equippedCount}: ${companion.equippedItemIds.length}`}
              variant="outlined"
              sx={softChipSx}
            />
            <Chip
              label={`${copy.ownedCount}: ${ownedItems.length}`}
              variant="outlined"
              sx={softChipSx}
            />
          </Stack>
        </Stack>

        {saveError ? (
          <Typography color="error" variant="body2" sx={{ fontWeight: 800 }}>
            {saveError}
          </Typography>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(340px, 0.92fr) minmax(0, 1.08fr)" },
            gap: 2,
            alignItems: "stretch",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 1,
              borderColor: "rgba(34, 211, 238, 0.2)",
              color: "inherit",
              background:
                "linear-gradient(155deg, rgba(15,23,42,0.82), rgba(8,47,73,0.42))",
            }}
          >
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography sx={{ fontWeight: 950 }}>
                  {copy.studioTitle}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(229,249,255,0.7)" }}>
                  {copy.studioSubtitle}
                </Typography>
              </Stack>

              <Stack
                data-companion-shop-collection-summary="true"
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  label={`${copy.freeRobots}: ${freeBaseCount}`}
                  sx={{
                    color: "#dffbff",
                    borderColor: "rgba(34,211,238,0.42)",
                    background: "rgba(34,211,238,0.1)",
                    fontWeight: 900,
                  }}
                  variant="outlined"
                />
                <Chip
                  label={`${copy.collectibleLooks}: ${collectibleCount}`}
                  sx={{
                    color: "#fef3c7",
                    borderColor: "rgba(251,191,36,0.42)",
                    background: "rgba(251,191,36,0.1)",
                    fontWeight: 900,
                  }}
                  variant="outlined"
                />
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {companionShopFilters.map((filter) => (
                  <Chip
                    key={filter}
                    label={
                      filter === "all"
                        ? copy.filters.all
                        : getCategoryLabel(copy.categories, filter)
                    }
                    color={activeFilter === filter ? "primary" : "default"}
                    variant={activeFilter === filter ? "filled" : "outlined"}
                    onClick={() => setActiveFilter(filter)}
                    sx={{
                      fontWeight: 900,
                      color: activeFilter === filter ? undefined : "#dffbff",
                      borderColor: "rgba(229,249,255,0.2)",
                      "&:focus-visible": {
                        outline: "2px solid #67e8f9",
                        outlineOffset: 2,
                      },
                    }}
                  />
                ))}
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.1,
                }}
              >
                {visibleCatalogItems.map((item) => {
                  const isOwned = hasCompanionItem(companion, item.id);
                  const isEquipped = isCompanionItemEquipped(companion, item.id);
                  const canBuy = canPurchaseCompanionItem(companion, item);
                  const isLocked = item.available && !isOwned && !canBuy;
                  const isFocused = focusedPreview?.id === item.id;
                  const statusLabel = isEquipped
                    ? copy.equipped
                    : isOwned
                      ? copy.owned
                      : isLocked
                        ? copy.locked
                        : copy.available;
                  const actionLabel = isOwned ? copy.choose : copy.buyAndChoose;
                  const isSaving = savingItemId === item.id;
                  const buttonDisabled = savingItemId !== null || isEquipped || isLocked;

                  return (
                    <Paper
                      key={item.id}
                      variant="outlined"
                      tabIndex={0}
                      onMouseEnter={() => setPreviewItemId(item.id)}
                      onFocus={() => setPreviewItemId(item.id)}
                      onClick={() => setPreviewItemId(item.id)}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        minHeight: { xs: 204, md: 230 },
                        cursor: "pointer",
                        borderColor: isFocused
                          ? "rgba(34,211,238,0.72)"
                          : isEquipped
                            ? "rgba(74,222,128,0.6)"
                            : "rgba(148,163,184,0.2)",
                        color: "inherit",
                        background: isFocused
                          ? "linear-gradient(150deg, rgba(8,145,178,0.28), rgba(88,28,135,0.16))"
                          : "linear-gradient(150deg, rgba(15,23,42,0.72), rgba(15,118,110,0.12))",
                        boxShadow: isFocused
                          ? "0 18px 42px rgba(34,211,238,0.16)"
                          : "none",
                        transition:
                          "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease",
                        "&:hover, &:focus-visible": {
                          transform: "translateY(-3px)",
                          borderColor: "rgba(34,211,238,0.72)",
                          outline: "none",
                        },
                      }}
                    >
                      <Stack spacing={0.9} sx={{ height: "100%" }}>
                        {item.companionKind ? (
                          <Box
                            sx={{
                              minHeight: { xs: 88, md: 102 },
                              display: "grid",
                              placeItems: "center",
                              borderRadius: 1,
                              background:
                                "linear-gradient(145deg, rgba(34,211,238,0.14), rgba(15,23,42,0.18))",
                            }}
                          >
                            <AssistantAvatar
                              name={getCatalogText(item.title, locale)}
                              variant={item.companionKind}
                              mood={isEquipped ? "celebrate" : isFocused ? "coach" : "happy"}
                              size={82}
                              active={isEquipped || isFocused}
                            />
                          </Box>
                        ) : null}
                        <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap">
                          <Chip
                            label={getRarityLabel(copy.rarity, item.rarity)}
                            size="small"
                            color={item.rarity === "legendary" ? "secondary" : "default"}
                          />
                          <Chip
                            label={statusLabel}
                            size="small"
                            color={getStatusTone({ isEquipped, isLocked })}
                            variant={isEquipped ? "filled" : "outlined"}
                            sx={{
                              color: isEquipped ? undefined : "#dffbff",
                              borderColor: "rgba(229,249,255,0.22)",
                            }}
                          />
                        </Stack>
                        <Typography sx={{ fontWeight: 950, lineHeight: 1.15 }}>
                          {getCatalogText(item.title, locale)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(229,249,255,0.68)",
                            lineHeight: 1.35,
                            flexGrow: 1,
                          }}
                        >
                          {getCatalogText(item.tagLabel, locale)}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 950, color: "#a7f3d0" }}>
                            {`${item.price} ${copy.coins}`}
                          </Typography>
                          <Button
                            size="small"
                            variant={isEquipped ? "contained" : "outlined"}
                            disabled={buttonDisabled}
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleItemAction(item);
                            }}
                            sx={{
                              ml: "auto",
                              minWidth: 0,
                              textTransform: "none",
                              fontWeight: 900,
                              color: isEquipped ? undefined : "#dffbff",
                              borderColor: "rgba(229,249,255,0.24)",
                            }}
                          >
                            {isSaving
                              ? copy.saving
                              : isEquipped
                                ? copy.equipped
                                : actionLabel}
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            data-companion-live-preview="true"
            sx={{
              position: "relative",
              minHeight: { xs: 500, lg: 620 },
              p: { xs: 2, md: 3 },
              borderRadius: 1,
              overflow: "hidden",
              borderColor: "rgba(34, 211, 238, 0.24)",
              color: "inherit",
              background:
                "linear-gradient(115deg, rgba(34,211,238,0.08) 0 1px, transparent 1px 118px), linear-gradient(145deg, rgba(2,6,23,0.88), rgba(8,47,73,0.5))",
            }}
          >
            <Box
              sx={{
                position: "absolute",
                inset: "11% 8% auto",
                height: "48%",
                border: "1px solid rgba(34,211,238,0.28)",
                borderRadius: "50%",
                transform: "rotate(-10deg)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                right: { xs: 18, md: 34 },
                bottom: 18,
                width: { xs: 120, md: 190 },
                height: 2,
                background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.56), transparent)",
              }}
            />
            <Stack spacing={2.2} sx={{ position: "relative", zIndex: 1, height: "100%" }}>
              <Stack spacing={0.5}>
                <Typography variant="overline" sx={{ color: "#67e8f9", fontWeight: 900 }}>
                  {copy.preview}
                </Typography>
                <Typography sx={{ color: "rgba(229,249,255,0.68)" }}>
                  {copy.previewHint}
                </Typography>
              </Stack>

              <Box
                sx={{
                  position: "relative",
                  minHeight: { xs: 255, md: 320 },
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {previewOrbitItems.map(({ key, x, y }, index) => {
                  const [label, description] = getToolText(copy.tools, key);
                  const toolMeta = assistantToolIcons.find((item) => item.key === key);
                  const OrbitIcon = toolMeta?.icon ?? Sparkles;
                  const accent = toolMeta?.accent ?? "#67e8f9";

                  return (
                    <Paper
                      key={key}
                      variant="outlined"
                      data-companion-live-preview-orbit="true"
                      sx={{
                        position: "absolute",
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: x > 55 ? "translateX(-50%)" : "none",
                        p: 1.1,
                        borderRadius: 1,
                        width: { xs: 128, md: 158 },
                        color: "inherit",
                        borderColor: `${accent}55`,
                        background: "rgba(15,23,42,0.72)",
                        backdropFilter: "blur(14px)",
                        display: {
                          xs: index > 2 ? "none" : "block",
                          md: index > 5 ? "none" : "block",
                          xl: "block",
                        },
                      }}
                    >
                      <Stack direction="row" spacing={0.75} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            mt: 0.15,
                            flex: "0 0 auto",
                            display: "grid",
                            placeItems: "center",
                            borderRadius: "50%",
                            color: accent,
                            background: `${accent}1f`,
                          }}
                        >
                          <OrbitIcon size={14} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="caption"
                            sx={{ color: "#f8fafc", fontWeight: 950, lineHeight: 1.15 }}
                          >
                            {label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "rgba(229,249,255,0.64)",
                              display: { xs: "none", md: "block" },
                              lineHeight: 1.25,
                            }}
                          >
                            {description}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}

                <Box
                  sx={{
                    width: { xs: 220, md: 280 },
                    aspectRatio: "1",
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background:
                      "linear-gradient(145deg, rgba(103,232,249,0.18), rgba(15,23,42,0.04) 58%, transparent 64%)",
                    boxShadow: "0 0 90px rgba(34,211,238,0.18)",
                  }}
                >
                  <AssistantAvatar
                    name={assistantDisplayName}
                    variant={focusedPreview?.companionKind ?? assistant.companionKind}
                    mood={focusedPreviewEquipped ? "celebrate" : "coach"}
                    size={companionRenderModePreference.value === "3d" ? 190 : 148}
                    renderMode={companionRenderModePreference.value}
                    loadingFallback={
                      <Companion3DLoadingFallback
                        label={copy.renderModeLoading}
                        size={148}
                      />
                    }
                    on3dLoadError={companionRenderModePreference.mark3dRuntimeError}
                    active
                  />
                </Box>
              </Box>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  mt: "auto",
                  borderRadius: 1,
                  color: "inherit",
                  borderColor: "rgba(229,249,255,0.16)",
                  background: "rgba(2,6,23,0.62)",
                }}
              >
                <Stack spacing={1.4}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Stack spacing={0.4}>
                      <Typography variant="overline" sx={{ color: "#a7f3d0", fontWeight: 900 }}>
                        {copy.currentSelection}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 950 }}>
                        {focusedPreview
                          ? getCatalogText(focusedPreview.title, locale)
                          : copy.profileLook}
                      </Typography>
                    </Stack>
                    {focusedPreview ? (
                      <Chip
                        label={focusedPreviewStatus}
                        color={getStatusTone({
                          isEquipped: focusedPreviewEquipped,
                          isLocked: focusedPreviewLocked,
                        })}
                      />
                    ) : null}
                  </Stack>
                  <Typography sx={{ color: "rgba(229,249,255,0.72)" }}>
                    {focusedPreview
                      ? getCatalogText(focusedPreview.description, locale)
                      : assistantDisplayName}
                  </Typography>
                  {focusedPreview ? (
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Button
                        variant="contained"
                        disabled={
                          savingItemId !== null ||
                          focusedPreviewEquipped ||
                          focusedPreviewLocked
                        }
                        onClick={() => void handleItemAction(focusedPreview)}
                        sx={{ textTransform: "none", fontWeight: 950 }}
                      >
                        {savingItemId === focusedPreview.id
                          ? copy.saving
                          : focusedPreviewEquipped
                            ? copy.equipped
                            : focusedPreviewActionLabel}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<MessageCircle size={16} />}
                        onClick={() => navigate("/coach")}
                        sx={{
                          textTransform: "none",
                          fontWeight: 900,
                          color: "#dffbff",
                          borderColor: "rgba(229,249,255,0.24)",
                        }}
                      >
                        {copy.tryInChat}
                      </Button>
                      <Typography sx={{ ml: { sm: "auto" }, fontWeight: 950, color: "#a7f3d0" }}>
                        {`${focusedPreview.price} ${copy.coins}`}
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            </Stack>
          </Paper>
        </Box>

        <Paper
          variant="outlined"
          data-companion-shop-capabilities="true"
          sx={{
            p: 2,
            borderRadius: 1,
            color: "inherit",
            borderColor: "rgba(34, 211, 238, 0.18)",
            background: "rgba(2,6,23,0.46)",
          }}
        >
          <Stack spacing={1.5}>
            <Stack spacing={0.4}>
              <Typography sx={{ fontWeight: 950 }}>{copy.toolBeltTitle}</Typography>
              <Typography variant="body2" sx={{ color: "rgba(229,249,255,0.7)" }}>
                {copy.toolBeltSubtitle}
              </Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(5, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              {assistantToolIcons.map(({ key, icon: ToolIcon, accent }) => {
                const [title, description] = getToolText(copy.tools, key);

                return (
                  <Box
                    key={key}
                    sx={{
                      p: 1.2,
                      minHeight: 112,
                      borderRadius: 1,
                      border: "1px solid rgba(148,163,184,0.16)",
                      background:
                        "linear-gradient(150deg, rgba(15,23,42,0.72), rgba(15,118,110,0.1))",
                      transition: "transform 180ms ease, border-color 180ms ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        borderColor: accent,
                      },
                    }}
                  >
                    <Stack spacing={0.8}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          display: "grid",
                          placeItems: "center",
                          borderRadius: "50%",
                          color: accent,
                          background: `${accent}1f`,
                        }}
                      >
                        <ToolIcon size={18} />
                      </Box>
                      <Typography sx={{ fontWeight: 950, lineHeight: 1.2 }}>
                        {title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(229,249,255,0.62)", lineHeight: 1.35 }}
                      >
                        {description}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Paper>
  );
};

export default CompanionShopCard;
