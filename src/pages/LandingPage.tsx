import { useState } from "react";
import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  HeartPulse,
  MessageSquareText,
  RotateCcw,
  ScanBarcode,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import {
  AssistantAvatar,
} from "../shared/components/AssistantAvatar";
import { useLanguage } from "../shared/language";
import { playAIDiscoverySound, playGentleClickSound } from "../shared/lib/sound";
import { useAppColorMode } from "../shared/theme/colorMode";

type LandingLanguage = "uk" | "pl" | "en";

const BRAND_NAME = "Smart Nutrition";
const AI_WELLNESS_ECOSYSTEM = "AI wellness ecosystem";
const AI_COMPANION_LABEL = "AI companion";
const UK_AI_ASSISTANT_LABEL = "AI-помічник";
const PL_AI_ASSISTANT_LABEL = "AI asystent";
const COMMUNITY_FOOD_HUB_TITLE = "Community food hub";
const PROACTIVE_NUDGES_LABEL = "proactive nudges";
const TELEGRAM_RETENTION_LABEL = "Telegram retention";
const BREATHING_PILL = "breathing";
const EYE_TRACKING_PILL = "eye tracking";
const MOOD_SHIFT_PILL = "mood shift";
const DAILY_MEMORY_PILL = "daily memory";
const ADMIN_PANEL_LABEL = "Admin panel";
const CALORIE_STAT_VALUE = "1 420 / 2 050";
const WATER_STAT_VALUE = "1.5 / 2.2 l";
const PROTEIN_STAT_VALUE = "96 / 120 г";
const PROTEIN_STAT_VALUE_EN = "96 / 120 g";
const CALORIE_STAT_COLOR = "#0f766e";
const WATER_STAT_COLOR = "#0891b2";
const PROTEIN_STAT_COLOR = "#2563eb";
const FOOD_SCANNER_TITLE = "AI food scanner";
const HYDRATION_TRACKER_TITLE = "Hydration tracker";
const CALORIE_MACRO_TITLE = "Calorie & macro";
const AI_COACHING_TITLE = "AI coaching";
const PROGRESS_INSIGHTS_TITLE = "Progress insights";
const SMART_REMINDERS_TITLE = "Smart reminders";
const GLASS_WHITE_08 = "rgba(255,255,255,0.08)";
const GLASS_WHITE_14 = "rgba(255,255,255,0.14)";
const GLASS_WHITE_70 = "rgba(255,255,255,0.7)";
const GLASS_WHITE_72 = "rgba(255,255,255,0.72)";
const GLASS_BLUR_14 = "blur(14px)";
const GLASS_BLUR_18 = "blur(18px)";
const STRONG_SHADOW = "var(--sn-shadow-strong)";
const START_ALIGN = "flex-start";
const TWO_COLUMN_GRID = "repeat(2, minmax(0, 1fr))";
const SHOW_EXTENDED_LANDING_SECTIONS = false;

type CompanionCapabilitySlide = {
  title: string;
  body: string;
  tags: readonly string[];
  Icon: typeof Bot;
  tone: string;
};

const getIndexedValue = <T,>(items: readonly T[], requestedIndex: number) =>
  items.find((_, index) => index === requestedIndex);

const landingCopy = {
  uk: {
    eyebrow: "AI wellness-простір",
    brandTitle: BRAND_NAME,
    headline: {
      prefix: `Твій ${UK_AI_ASSISTANT_LABEL} для`,
      accent: "здоровішого",
      suffix: "дня.",
    },
    title: "AI-помічник харчування і здоров'я",
    heroTyping: [
      "Поруч, коли треба випити воду.",
      "Пам'ятає твої звички і стиль підтримки.",
      "Реагує на день, а не просто рахує цифри.",
    ],
    subtitle:
      `Живий ${UK_AI_ASSISTANT_LABEL} для їжі, води, ліків, прогресу і м'якої мотивації. Він не просто трекає дані, а веде день разом із вами.`,
    primary: "Почати безкоштовно",
    secondary: "Побачити помічника",
    telegramCta: "Підключити Telegram",
    navOverview: "Огляд продукту",
    socialProof: "10 000+ користувачів будують звички разом з помічником",
    proof: [UK_AI_ASSISTANT_LABEL, "пам'ять", "розумні підказки", "Telegram поруч"],
    presencePills: ["дихає", "стежить за увагою", "змінює настрій", "пам'ятає день"],
    sceneCards: [
      {
        title: "Ранковий фокус",
        body: "Вода, білок і таблетка о 09:00 вже у плані.",
        tone: "спокійно",
      },
      {
        title: "AI помітив",
        body: "Вчора зрив був увечері, тому сьогодні підказка прийде раніше.",
        tone: "підказка",
      },
      {
        title: "Telegram поруч",
        body: "Швидкий лог води або ліків без відкриття застосунку.",
        tone: "поруч",
      },
    ],
    heroStats: [
      {
        label: "Калорії",
        value: CALORIE_STAT_VALUE,
        progress: 69,
        color: CALORIE_STAT_COLOR,
      },
      { label: "Вода", value: WATER_STAT_VALUE, progress: 68, color: WATER_STAT_COLOR },
      { label: "Білок", value: PROTEIN_STAT_VALUE, progress: 80, color: PROTEIN_STAT_COLOR },
    ],
    mascot: {
      name: UK_AI_ASSISTANT_LABEL,
      title: "AI-помічник поруч",
      body: "Сьогодні залишилось 600 ккал. Я б додала воду і легку вечерю з білком.",
      mood: "жива реакція",
      xps: "+25 XP за серію",
    },
    quickActions: ["Фото їжі", "Штрихкод", "Повторити вчора", "Ручний ввід"],
    featureRail: [
      { title: "AI-сканер їжі", body: "Фото їжі і швидкий аналіз" },
      { title: "Трекер води", body: "Вода без ручного хаосу" },
      { title: "Калорії та БЖВ", body: "Калорії, білок, жири, вуглеводи" },
      { title: "AI-підтримка", body: "Підказки під твій день" },
      { title: "Живий прогрес", body: "Зміни без сухої статистики" },
      { title: "Розумні нагадування", body: "Вода, їжа, ліки і звички" },
    ],
    sectionEyebrow: "За 5 секунд зрозуміло, що робити",
    ecosystemTitle: "Не калькулятор, а простір з помічником",
    ecosystemBody:
      "Smart Nutrition об'єднує харчування, мотивацію, аналітику, воду, прогрес і спільноту в один спокійний щоденний маршрут.",
    ecosystem: [
      {
        title: UK_AI_ASSISTANT_LABEL,
        body: "Дивиться за курсором, реагує на дії, радіє досягненням і попереджає про ризики без тиску.",
      },
      {
        title: "Їжа без тертя",
        body: "Пошук, штрихкод, фото, шаблони, повтор вчорашнього і особистий каталог продуктів.",
      },
      {
        title: "Жива мотивація",
        body: "Серії, XP, рівні, досягнення, день паузи і м'які завдання, які не ламають настрій.",
      },
      {
        title: "Спільнота їжі",
        body: "Рецепти, коментарі, збереження, рейтинги і модерація страв перед публікацією.",
      },
    ],
    foodTitle: "Додавання їжі має бути майже непомітним",
    foodBody:
      "Користувач не думає про форму. Він просто обирає найшвидший шлях, а AI збирає чернетку і пояснює БЖВ.",
    foods: [
      { title: "Боул з куркою", kcal: "520 ккал", meta: "38 г білка" },
      { title: "Йогурт і ягоди", kcal: "210 ккал", meta: "16 г білка" },
      { title: "Вівсянка", kcal: "340 ккал", meta: "повтор вчора" },
    ],
    analyticsTitle: "Аналітика, яка говорить людською мовою",
    analytics: [
      { label: "Серія", value: "12 днів" },
      { label: "Вага", value: "-0.4 кг" },
      { label: "Настрій", value: "стабільний" },
      { label: "Ризик", value: "мало води" },
    ],
    progressAdvice:
      "Я бачу плато за вагою. Це нормально: білок стабільний, воду краще підняти на 2 склянки.",
    communityTitle: "Спільнота і модерація вже в логіці продукту",
    communityItems: [
      "Друзі",
      "Форум",
      "Рецепти",
      "Статті",
      "Модератори",
      "Панель адміністратора",
    ],
    mobileTitle: "Працює як мобільний веб-застосунок і PWA",
    mobileBody:
      "Перший екран після входу дає три дії: додати їжу, випити воду, запитати помічника. Без інструкцій.",
    learningTitle: "Корисно знати",
    learningTopics: ["сон", "стрес", "магній", "цукор", "ЖКТ", "вода"],
    sliderEyebrow: "Живий помічник",
    sliderAriaLabel: "Можливості помічника Smart Nutrition",
    sliderPreviousLabel: "Попередня можливість помічника",
    sliderNextLabel: "Наступна можливість помічника",
    sliderTags: {
      hydration: ["вода", "розумні підказки"],
      reminders: ["Telegram", "ліки", "звички"],
      mobile: ["PWA", "мобільно", "безпечний шлях"],
    },
    finalTitle: "Ціль продукту проста",
    finalBody:
      "Користувач має відчувати не складну програму, а живого помічника, який допомагає ставати кращим кожного дня.",
  },
  pl: {
    eyebrow: "AI wellness-przestrzeń",
    brandTitle: BRAND_NAME,
    headline: {
      prefix: `Twój ${PL_AI_ASSISTANT_LABEL} dla`,
      accent: "zdrowszego",
      suffix: "dnia.",
    },
    title: "AI asystent żywienia i zdrowia",
    heroTyping: [
      "Jest obok, gdy warto wypić wodę.",
      "Pamięta nawyki i styl wsparcia.",
      "Reaguje na dzień, a nie tylko liczy liczby.",
    ],
    subtitle:
      `Żywy ${PL_AI_ASSISTANT_LABEL} do jedzenia, wody, leków, progresu i łagodnej motywacji. Nie tylko śledzi dane, ale prowadzi dzień razem z Tobą.`,
    primary: "Zacznij za darmo",
    secondary: "Zobacz asystenta",
    telegramCta: "Połącz Telegram",
    navOverview: "Przegląd produktu",
    socialProof: "10 000+ użytkowników buduje nawyki z asystentem",
    proof: [PL_AI_ASSISTANT_LABEL, "pamięć", "mądre podpowiedzi", "Telegram obok"],
    presencePills: ["oddycha", "reaguje na uwagę", "zmienia nastrój", "pamięta dzień"],
    sceneCards: [
      {
        title: "Poranny rytm",
        body: "Woda, białko i tabletka o 09:00 są już w planie.",
        tone: "spokojnie",
      },
      {
        title: "AI zauważył",
        body: "Wczoraj trudniej było wieczorem, więc dziś podpowiedź przyjdzie wcześniej.",
        tone: "podpowiedź",
      },
      {
        title: "Telegram obok",
        body: "Szybki log wody lub leków bez otwierania aplikacji.",
        tone: "blisko",
      },
    ],
    heroStats: [
      {
        label: "Kalorie",
        value: CALORIE_STAT_VALUE,
        progress: 69,
        color: CALORIE_STAT_COLOR,
      },
      { label: "Woda", value: WATER_STAT_VALUE, progress: 68, color: WATER_STAT_COLOR },
      { label: "Białko", value: PROTEIN_STAT_VALUE_EN, progress: 80, color: PROTEIN_STAT_COLOR },
    ],
    mascot: {
      name: PL_AI_ASSISTANT_LABEL,
      title: "AI asystent jest obok",
      body: "Zostało dziś 600 kcal. Dodałabym wodę i lekką kolację z białkiem.",
      mood: "żywa reakcja",
      xps: "+25 XP za serię",
    },
    quickActions: ["Zdjęcie", "Kod kreskowy", "Powtórz wczoraj", "Ręczny wpis"],
    featureRail: [
      { title: "AI skaner jedzenia", body: "Zdjęcie posiłku i szybka analiza" },
      { title: "Tracker wody", body: "Woda bez ręcznego chaosu" },
      { title: "Kalorie i makro", body: "Kalorie, białko, tłuszcz, węgle" },
      { title: "AI wsparcie", body: "Podpowiedzi pod Twój dzień" },
      { title: "Żywy progres", body: "Zmiany bez suchej statystyki" },
      { title: "Mądre przypomnienia", body: "Woda, jedzenie, leki i nawyki" },
    ],
    sectionEyebrow: "W 5 sekund wiadomo, co zrobić",
    ecosystemTitle: "Nie kalkulator, tylko przestrzeń z asystentem",
    ecosystemBody:
      "Smart Nutrition łączy żywienie, motywację, analitykę, wodę, progres i społeczność w jeden spokojny codzienny rytm.",
    ecosystem: [
      {
        title: PL_AI_ASSISTANT_LABEL,
        body: "Patrzy za kursorem, reaguje na akcje, cieszy się z osiągnięć i ostrzega bez presji.",
      },
      {
        title: "Jedzenie bez tarcia",
        body: "Wyszukiwarka, kod kreskowy, zdjęcie, szablony, powtórka wczoraj i osobisty katalog.",
      },
      {
        title: "Żywa motywacja",
        body: "Serie, XP, poziomy, osiągnięcia, dzień przerwy i łagodne zadania, które nie psują nastroju.",
      },
      {
        title: "Społeczność jedzenia",
        body: "Przepisy, komentarze, zapisy, oceny i moderacja potraw przed publikacją.",
      },
    ],
    foodTitle: "Dodawanie jedzenia ma być prawie niewidoczne",
    foodBody:
      "Użytkownik nie myśli o formularzu. Wybiera najszybszą ścieżkę, a AI składa szkic i tłumaczy makro.",
    foods: [
      { title: "Bowl z kurczakiem", kcal: "520 kcal", meta: "38 g białka" },
      { title: "Jogurt i owoce", kcal: "210 kcal", meta: "16 g białka" },
      { title: "Owsianka", kcal: "340 kcal", meta: "powtórka wczoraj" },
    ],
    analyticsTitle: "Analityka, która mówi po ludzku",
    analytics: [
      { label: "Seria", value: "12 dni" },
      { label: "Waga", value: "-0.4 kg" },
      { label: "Nastrój", value: "stabilny" },
      { label: "Ryzyko", value: "mało wody" },
    ],
    progressAdvice:
      "Widzę plateau wagi. To normalne: białko jest stabilne, wodę warto podnieść o 2 szklanki.",
    communityTitle: "Community i moderacja są częścią produktu",
    communityItems: [
      "Znajomi",
      "Forum",
      "Przepisy",
      "Artykuły",
      "Moderatorzy",
      "Panel administratora",
    ],
    mobileTitle: "Działa jako mobilna aplikacja webowa i PWA",
    mobileBody:
      "Pierwszy ekran po wejściu daje trzy akcje: dodaj jedzenie, wypij wodę, zapytaj asystenta. Bez instrukcji.",
    learningTitle: "Warto wiedzieć",
    learningTopics: ["sen", "stres", "magnez", "cukier", "jelita", "woda"],
    sliderEyebrow: "Żywy asystent",
    sliderAriaLabel: "Możliwości asystenta Smart Nutrition",
    sliderPreviousLabel: "Poprzednia możliwość asystenta",
    sliderNextLabel: "Następna możliwość asystenta",
    sliderTags: {
      hydration: ["woda", "mądre podpowiedzi"],
      reminders: ["Telegram", "leki", "nawyki"],
      mobile: ["PWA", "mobilnie", "bezpieczny przepływ"],
    },
    finalTitle: "Cel produktu jest prosty",
    finalBody:
      "Użytkownik ma czuć nie złożoną aplikację, tylko żywego pomocnika, który pomaga stawać się lepszym każdego dnia.",
  },
  en: {
    eyebrow: AI_WELLNESS_ECOSYSTEM,
    brandTitle: BRAND_NAME,
    headline: {
      prefix: `Your ${AI_COMPANION_LABEL} for a`,
      accent: "healthier",
      suffix: "you.",
    },
    title: "AI nutrition and health assistant",
    heroTyping: [
      "Nearby when water is due.",
      "Remembers habits and support style.",
      "Reacts to the day, not just the numbers.",
    ],
    subtitle:
      `A living ${AI_COMPANION_LABEL} for food, water, medication, progress, and gentle motivation. It does not just track data; it moves through the day with you.`,
    primary: "Start free",
    secondary: "See companion",
    telegramCta: "Connect Telegram",
    navOverview: "Product overview",
    socialProof: "10,000+ users building habits with their companion",
    proof: [AI_COMPANION_LABEL, "memory", PROACTIVE_NUDGES_LABEL, "Telegram nearby"],
    presencePills: [BREATHING_PILL, EYE_TRACKING_PILL, MOOD_SHIFT_PILL, DAILY_MEMORY_PILL],
    sceneCards: [
      {
        title: "Morning focus",
        body: "Water, protein, and a 09:00 medication reminder are already in the plan.",
        tone: "calm",
      },
      {
        title: "AI noticed",
        body: "Yesterday slipped in the evening, so today the nudge arrives earlier.",
        tone: "coach",
      },
      {
        title: TELEGRAM_RETENTION_LABEL,
        body: "Quick water or medication logging without opening the app.",
        tone: "warm",
      },
    ],
    heroStats: [
      {
        label: "Calories",
        value: CALORIE_STAT_VALUE,
        progress: 69,
        color: CALORIE_STAT_COLOR,
      },
      { label: "Water", value: WATER_STAT_VALUE, progress: 68, color: WATER_STAT_COLOR },
      { label: "Protein", value: PROTEIN_STAT_VALUE_EN, progress: 80, color: PROTEIN_STAT_COLOR },
    ],
    mascot: {
      name: AI_COMPANION_LABEL,
      title: `${AI_COMPANION_LABEL} is here`,
      body: "You have 600 kcal left today. I would add water and a light protein dinner.",
      mood: "live reaction",
      xps: "+25 XP streak",
    },
    quickActions: ["Food photo", "Barcode", "Repeat yesterday", "Manual entry"],
    featureRail: [
      { title: FOOD_SCANNER_TITLE, body: "Food photo and quick analysis" },
      { title: HYDRATION_TRACKER_TITLE, body: "Water without manual chaos" },
      { title: CALORIE_MACRO_TITLE, body: "Calories, protein, fats, carbs" },
      { title: AI_COACHING_TITLE, body: "Guidance for your day" },
      { title: PROGRESS_INSIGHTS_TITLE, body: "Changes without dry stats" },
      { title: SMART_REMINDERS_TITLE, body: "Water, meals, medication, habits" },
    ],
    sectionEyebrow: "Clear next actions in 5 seconds",
    ecosystemTitle: "Not a calculator, a companion platform",
    ecosystemBody:
      "Smart Nutrition connects nutrition, gamification, analytics, hydration, progress, and community into one calm daily flow.",
    ecosystem: [
      {
        title: AI_COMPANION_LABEL,
        body: "Follows the cursor, reacts to actions, celebrates wins, and warns about risks without pressure.",
      },
      {
        title: "Frictionless food",
        body: "Search, barcode, photo, templates, yesterday repeat, and a personal product catalog.",
      },
      {
        title: "Living motivation",
        body: "Streaks, XP, levels, achievements, day-off protection, and gentle tasks that keep momentum.",
      },
      {
        title: COMMUNITY_FOOD_HUB_TITLE,
        body: "Recipes, comments, saves, ratings, and meal moderation before publishing.",
      },
    ],
    foodTitle: "Adding food should feel almost invisible",
    foodBody:
      "The user does not think about forms. They pick the fastest path while AI builds the draft and explains macros.",
    foods: [
      { title: "Chicken bowl", kcal: "520 kcal", meta: "38 g protein" },
      { title: "Yogurt and berries", kcal: "210 kcal", meta: "16 g protein" },
      { title: "Oats", kcal: "340 kcal", meta: "repeat yesterday" },
    ],
    analyticsTitle: "Analytics that speaks like a human",
    analytics: [
      { label: "Streak", value: "12 days" },
      { label: "Weight", value: "-0.4 kg" },
      { label: "Mood", value: "stable" },
      { label: "Risk", value: "low water" },
    ],
    progressAdvice:
      "I see a weight plateau. That is normal: protein is stable, water should go up by 2 glasses.",
    communityTitle: "Community and moderation are product logic",
    communityItems: [
      "Friends",
      "Forum",
      "Recipes",
      "Articles",
      "Moderators",
      ADMIN_PANEL_LABEL,
    ],
    mobileTitle: "Works as a responsive web app and PWA",
    mobileBody:
      "The first screen after login gives three actions: add food, drink water, ask companion. No instructions needed.",
    learningTitle: "Worth knowing",
    learningTopics: ["sleep", "stress", "magnesium", "sugar", "gut", "water"],
    sliderEyebrow: "Living assistant",
    sliderAriaLabel: "Smart Nutrition assistant capabilities",
    sliderPreviousLabel: "Previous assistant capability",
    sliderNextLabel: "Next assistant capability",
    sliderTags: {
      hydration: ["water", "smart nudges"],
      reminders: ["Telegram", "medication", "habits"],
      mobile: ["PWA", "mobile", "safe flow"],
    },
    finalTitle: "The product goal is simple",
    finalBody:
      "Users should feel a living assistant, not a complicated app: something that helps them improve every day.",
  },
} as const;

type LandingCopy = (typeof landingCopy)[LandingLanguage];

const getLandingCopy = (language: LandingLanguage): LandingCopy => {
  switch (language) {
    case "uk":
      return landingCopy.uk;
    case "pl":
      return landingCopy.pl;
    case "en":
      return landingCopy.en;
  }
};

const getLandingScene = (isDarkMode: boolean) => ({
  pageBackground: isDarkMode
    ? "radial-gradient(circle at 10% 0%, rgba(20,184,166,0.16), transparent 28%), radial-gradient(circle at 90% 8%, rgba(163,230,53,0.1), transparent 32%), linear-gradient(180deg, #020617 0%, #050b18 48%, #07110f 100%)"
    : "radial-gradient(circle at 12% 0%, rgba(34,197,94,0.16), transparent 28%), radial-gradient(circle at 88% 12%, rgba(14,165,233,0.16), transparent 30%), linear-gradient(180deg, #f8fffb 0%, #effdfa 44%, #f8fbff 100%)",
  heroBackground: isDarkMode
    ? "radial-gradient(circle at 78% 20%, rgba(226,232,240,0.18), transparent 16%), radial-gradient(circle at 78% 44%, rgba(163,230,53,0.34), transparent 25%), radial-gradient(circle at 90% 70%, rgba(20,184,166,0.22), transparent 30%), radial-gradient(circle at 62% 74%, rgba(34,197,94,0.22), transparent 28%), linear-gradient(135deg, #010409 0%, #03101b 42%, #061712 100%)"
    : "radial-gradient(circle at 76% 18%, rgba(255,255,255,0.98), transparent 20%), radial-gradient(circle at 78% 42%, rgba(125,211,252,0.48), transparent 28%), radial-gradient(circle at 88% 74%, rgba(20,184,166,0.26), transparent 32%), radial-gradient(circle at 62% 76%, rgba(187,247,208,0.52), transparent 28%), linear-gradient(135deg, #fbfffe 0%, #effdfa 34%, #e6f7ff 100%)",
  heroOverlay: isDarkMode
    ? "linear-gradient(90deg, rgba(1,4,9,0.98) 0%, rgba(3,12,24,0.82) 39%, rgba(2,6,23,0.12) 100%), linear-gradient(180deg, rgba(2,6,23,0.72) 0%, rgba(3,14,23,0.24) 52%, rgba(20,184,166,0.16) 100%)"
    : "linear-gradient(90deg, rgba(255,255,255,0.88) 0%, rgba(240,253,250,0.58) 38%, rgba(240,249,255,0.04) 100%), linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(236,254,255,0.04) 52%, rgba(20,184,166,0.1) 100%)",
  heroText: isDarkMode ? "#ffffff" : "#102a43",
  mutedText: isDarkMode ? "rgba(255,255,255,0.82)" : "rgba(15,23,42,0.68)",
  titleShadow: isDarkMode
    ? "0 18px 80px rgba(0,0,0,0.28)"
    : "0 22px 80px rgba(15,118,110,0.12)",
  accentColor: isDarkMode ? "#a3e635" : "#0f766e",
  accentShadow: isDarkMode
    ? "0 0 34px rgba(163,230,53,0.36)"
    : "0 0 32px rgba(20,184,166,0.2)",
  typingColor: isDarkMode ? "#d9f99d" : "#0f766e",
  eyebrowBg: isDarkMode ? "rgba(20,184,166,0.18)" : "rgba(15,118,110,0.1)",
  eyebrowColor: isDarkMode ? "#ccfbf1" : "#0f766e",
  eyebrowBorder: isDarkMode
    ? "rgba(94,234,212,0.28)"
    : "rgba(20,184,166,0.22)",
  gridOpacity: isDarkMode ? 0.24 : 0.18,
  gridLines: isDarkMode
    ? "radial-gradient(circle at center, rgba(255,255,255,0.26) 0 1px, transparent 1.8px)"
    : "radial-gradient(circle at center, rgba(14,165,233,0.18) 0 1px, transparent 1.8px)",
  proofBorder: isDarkMode ? "rgba(255,255,255,0.24)" : "rgba(15,118,110,0.18)",
  proofColor: isDarkMode ? "rgba(255,255,255,0.88)" : "rgba(15,23,42,0.76)",
  proofBg: isDarkMode ? GLASS_WHITE_08 : "rgba(255,255,255,0.56)",
  mobilePanelBg: isDarkMode ? GLASS_WHITE_08 : GLASS_WHITE_70,
  mobilePanelBorder: isDarkMode
    ? GLASS_WHITE_14
    : "rgba(20,184,166,0.16)",
  secondaryButtonColor: isDarkMode ? "#ffffff" : "#0f766e",
  secondaryButtonBorder: isDarkMode
    ? "rgba(255,255,255,0.32)"
    : "rgba(15,118,110,0.24)",
  secondaryButtonBg: isDarkMode ? GLASS_WHITE_08 : GLASS_WHITE_72,
  socialColor: isDarkMode ? "rgba(255,255,255,0.76)" : "rgba(15,23,42,0.7)",
  sceneBackdrop: isDarkMode
    ? "linear-gradient(135deg, rgba(2,6,23,0.52), rgba(20,184,166,0.16) 48%, rgba(132,204,22,0.16))"
    : `linear-gradient(135deg, ${GLASS_WHITE_72}, rgba(186,230,253,0.28) 46%, rgba(187,247,208,0.42))`,
  sceneBorder: isDarkMode ? "rgba(94,234,212,0.18)" : "rgba(20,184,166,0.18)",
  avatarStageBg: isDarkMode
    ? "radial-gradient(circle at 50% 40%, rgba(94,234,212,0.18), rgba(20,184,166,0.12) 52%, rgba(2,6,23,0.74) 100%)"
    : "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.95), rgba(204,251,241,0.54) 54%, rgba(186,230,253,0.3) 100%)",
  avatarStageShadow: isDarkMode
    ? "0 34px 120px rgba(20,184,166,0.24), 0 0 80px rgba(132,204,22,0.12), inset 0 1px 0 rgba(255,255,255,0.16)"
    : "0 34px 120px rgba(14,165,233,0.22), 0 0 90px rgba(34,197,94,0.14), inset 0 1px 0 rgba(255,255,255,0.86)",
  presenceBg: isDarkMode ? "rgba(15,23,42,0.78)" : GLASS_WHITE_72,
  presenceColor: isDarkMode ? "#ffffff" : "#0f766e",
  presenceBorder: isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(15,118,110,0.18)",
  sceneCardBg: isDarkMode ? "rgba(15,23,42,0.76)" : "rgba(255,255,255,0.78)",
  sceneCardText: isDarkMode ? "#f8fafc" : "#102a43",
  sceneCardMuted: isDarkMode ? "rgba(226,232,240,0.74)" : "#475569",
  sceneIconBg: isDarkMode ? "rgba(2,6,23,0.74)" : GLASS_WHITE_72,
  sceneCardShadow: isDarkMode
    ? "0 18px 56px rgba(0,0,0,0.36)"
    : "0 18px 56px rgba(15,23,42,0.18)",
  featureRailBg: isDarkMode ? "rgba(2,6,23,0.58)" : "rgba(255,255,255,0.64)",
  featureRailBorder: isDarkMode ? GLASS_WHITE_14 : "rgba(15,118,110,0.16)",
  featureCardBg: isDarkMode ? "rgba(15,23,42,0.68)" : "rgba(255,255,255,0.58)",
  featureCardBorder: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,118,110,0.12)",
  featureIconBg: isDarkMode ? "rgba(163,230,53,0.1)" : "rgba(20,184,166,0.1)",
  featureIconColor: isDarkMode ? "#a3e635" : "#0f766e",
  featureIconShadow: isDarkMode
    ? "0 0 28px rgba(163,230,53,0.14)"
    : "0 0 28px rgba(20,184,166,0.12)",
  featureText: isDarkMode ? "#ffffff" : "#102a43",
  featureMuted: isDarkMode ? "rgba(255,255,255,0.62)" : "rgba(15,23,42,0.58)",
  portalRing: isDarkMode
    ? "radial-gradient(circle, transparent 46%, rgba(163,230,53,0.22) 47%, rgba(94,234,212,0.1) 52%, transparent 58%)"
    : `radial-gradient(circle, transparent 42%, ${GLASS_WHITE_72} 43%, rgba(14,165,233,0.22) 50%, transparent 58%)`,
  heroLandscape: isDarkMode
    ? "linear-gradient(180deg, transparent 0%, rgba(5,46,22,0.3) 40%, rgba(2,6,23,0.88) 100%)"
    : "linear-gradient(180deg, transparent 0%, rgba(224,242,254,0.44) 38%, rgba(240,253,250,0.78) 100%)",
  analyticsBg: isDarkMode
    ? "radial-gradient(circle at 88% 10%, rgba(132,204,22,0.22), transparent 28%), linear-gradient(135deg, #07111f 0%, #102a43 52%, #0f766e 100%)"
    : "radial-gradient(circle at 88% 10%, rgba(34,197,94,0.18), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(236,254,255,0.82) 52%, rgba(220,252,231,0.9) 100%)",
  analyticsText: isDarkMode ? "#ffffff" : "#102a43",
  analyticsMuted: isDarkMode ? "rgba(255,255,255,0.66)" : "rgba(15,23,42,0.62)",
  analyticsCardBg: isDarkMode ? GLASS_WHITE_08 : GLASS_WHITE_70,
  analyticsCardBorder: isDarkMode ? GLASS_WHITE_14 : "rgba(15,118,110,0.14)",
  analyticsAdviceBg: isDarkMode ? "rgba(20,184,166,0.14)" : "rgba(20,184,166,0.1)",
  analyticsAdviceBorder: isDarkMode ? "rgba(94,234,212,0.22)" : "rgba(15,118,110,0.16)",
  phoneShellBg: isDarkMode ? "#020617" : "#e2e8f0",
  phoneScreenBg: isDarkMode ? "#07111f" : "#f8fafc",
  phoneCardBg: isDarkMode ? "rgba(15,23,42,0.82)" : "#ffffff",
  phoneCardBorder: isDarkMode ? "rgba(148,163,184,0.22)" : "rgba(15,23,42,0.08)",
});

const iconButtonSx = {
  minWidth: 44,
  width: 44,
  height: 44,
  px: 0,
  borderRadius: "50%",
  borderColor: "rgba(15,23,42,0.12)",
} as const;

const getFeatureRailIcon = (index: number) => {
  switch (index) {
    case 0:
      return Camera;
    case 1:
      return Droplets;
    case 2:
      return Utensils;
    case 3:
      return Bot;
    case 4:
      return HeartPulse;
    case 5:
      return Bell;
    default:
      return Sparkles;
  }
};

const getQuickActionIcon = (index: number) => {
  switch (index) {
    case 0:
      return Camera;
    case 1:
      return ScanBarcode;
    case 2:
      return RotateCcw;
    case 3:
      return MessageSquareText;
    default:
      return Sparkles;
  }
};

const landingGlassPanelSx = {
  borderRadius: 1,
  border: "1px solid var(--sn-border-soft)",
  backgroundColor: "var(--sn-surface-glass)",
  boxShadow: "var(--sn-shadow-soft)",
  backdropFilter: "blur(20px)",
} as const;

const landingSectionTitleSx = {
  fontWeight: 900,
  fontSize: { xs: 34, md: 46 },
  letterSpacing: 0,
} as const;

const landingCompanionOrbitRings = [
  { size: { sm: 245, md: 322 }, rotate: 0, duration: 15 },
  { size: { sm: 295, md: 392 }, rotate: 16, duration: 19 },
  { size: { sm: 345, md: 462 }, rotate: -14, duration: 24 },
] as const;

const landingCompanionSignalNodes = [
  { id: "water", angle: 28, distance: { sm: 126, md: 168 }, color: "#22d3ee" },
  { id: "food", angle: 118, distance: { sm: 116, md: 156 }, color: "#a3e635" },
  { id: "care", angle: 216, distance: { sm: 122, md: 164 }, color: "#34d399" },
  { id: "memory", angle: 308, distance: { sm: 134, md: 178 }, color: "#60a5fa" },
] as const;

const CompanionExperienceScene = ({
  isDarkMode,
}: {
  isDarkMode: boolean;
}) => {
  const scene = getLandingScene(isDarkMode);
  const referenceCards = [
    {
      id: "hydration",
      label: "Hydration",
      value: "6 / 8 glasses",
      badge: "62%",
      sx: { left: { sm: 10, md: 72 }, top: { sm: 24, md: 58 } },
    },
    {
      id: "calories",
      label: "Today",
      value: "1,450 kcal",
      badge: "72%",
      sx: { right: { sm: 4, md: 42 }, top: { sm: 90, md: 130 } },
    },
    {
      id: "protein",
      label: "Protein",
      value: "108 / 150g",
      badge: null,
      sx: { left: { sm: 18, md: 22 }, top: { sm: 214, md: 258 } },
    },
    {
      id: "coach",
      label: "AI Coach",
      value: "Great job hitting your protein goal.",
      badge: null,
      sx: { left: { sm: 94, md: 128 }, bottom: { sm: 68, md: 92 } },
    },
    {
      id: "streak",
      label: "Streak",
      value: "12 days",
      badge: null,
      sx: { right: { sm: 32, md: 70 }, bottom: { sm: 46, md: 74 } },
    },
  ];

  return (
    <Box
      id="ai-overview"
      sx={{
        position: "relative",
        zIndex: 2,
        gridColumn: { md: "2", lg: "2" },
        gridRow: { md: "1", lg: "1" },
        alignSelf: "center",
        justifySelf: "stretch",
        minHeight: { xs: 320, sm: 430, md: 500, lg: 570, xl: 610 },
        width: "100%",
        minWidth: 0,
        mt: { xs: 1, md: 0 },
        display: { xs: "none", sm: "grid" },
        placeItems: "center",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: { xs: "10% 0 4%", md: "2% 2% 0%" },
          borderRadius: 1,
          background: isDarkMode
            ? "radial-gradient(circle at 58% 46%, rgba(163,230,53,0.22), transparent 18%), radial-gradient(circle at 76% 28%, rgba(148,163,184,0.36), transparent 14%), radial-gradient(circle at 50% 82%, rgba(20,184,166,0.2), transparent 28%), linear-gradient(145deg, rgba(2,6,23,0.1), rgba(5,46,22,0.22))"
            : "radial-gradient(circle at 58% 42%, rgba(255,255,255,0.94), transparent 18%), radial-gradient(circle at 76% 28%, rgba(186,230,253,0.56), transparent 16%), radial-gradient(circle at 54% 82%, rgba(20,184,166,0.26), transparent 28%), linear-gradient(145deg, rgba(224,242,254,0.24), rgba(220,252,231,0.34))",
          border: `1px solid ${scene.sceneBorder}`,
          boxShadow: isDarkMode
            ? "inset 0 1px 0 rgba(255,255,255,0.18), 0 60px 160px rgba(0,0,0,0.28)"
            : "inset 0 1px 0 rgba(255,255,255,0.82), 0 60px 150px rgba(14,165,233,0.16)",
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          zIndex: 1,
          width: { sm: 430, md: 520, lg: 590, xl: 660 },
          height: { sm: 430, md: 520, lg: 590, xl: 660 },
          borderRadius: "50%",
          right: { sm: 8, md: -8, lg: 10, xl: 28 },
          top: { sm: -16, md: -6, lg: -18, xl: -34 },
          background: isDarkMode
            ? "radial-gradient(circle, transparent 42%, rgba(255,255,255,0.2) 43%, rgba(163,230,53,0.26) 47%, rgba(20,184,166,0.12) 54%, transparent 61%)"
            : "radial-gradient(circle, transparent 40%, rgba(255,255,255,0.92) 41%, rgba(14,165,233,0.32) 47%, rgba(20,184,166,0.2) 55%, transparent 63%)",
          filter: isDarkMode
            ? "drop-shadow(0 0 58px rgba(163,230,53,0.22))"
            : "drop-shadow(0 0 72px rgba(14,165,233,0.26))",
          opacity: isDarkMode ? 0.96 : 0.88,
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          zIndex: 1,
          left: { sm: "2%", md: "8%" },
          right: { sm: "0%", md: "2%" },
          bottom: { sm: 0, md: 0 },
          height: { sm: 210, md: 265 },
          borderRadius: "50% 50% 0 0",
          background: isDarkMode
            ? "linear-gradient(180deg, transparent 0%, rgba(22,101,52,0.28) 26%, rgba(2,6,23,0.9) 100%)"
            : "linear-gradient(180deg, transparent 0%, rgba(186,230,253,0.46) 26%, rgba(236,253,245,0.92) 100%)",
          filter: "blur(0.5px)",
        }}
      />
      <Box
        aria-hidden
        data-landing-living-companion-field="true"
        sx={{
          position: "absolute",
          zIndex: 2,
          width: { sm: 360, md: 410, lg: 440, xl: 500 },
          height: { sm: 360, md: 410, lg: 440, xl: 500 },
          right: { sm: 42, md: 56, lg: 72, xl: 112 },
          top: { sm: 44, md: 44, lg: 26, xl: 38 },
          pointerEvents: "none",
          "@media (prefers-reduced-motion: reduce)": {
            "& [data-landing-orbit-ring], & [data-landing-signal-node]": {
              animation: "none",
            },
          },
        }}
      >
        {landingCompanionOrbitRings.map((ring, index) => (
          <Box
            key={ring.duration}
            data-landing-orbit-ring
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: ring.size,
              height: ring.size,
              borderRadius: "50%",
              transform: `translate(-50%, -50%) rotate(${ring.rotate}deg)`,
              border: isDarkMode
                ? "1px solid rgba(163,230,53,0.18)"
                : "1px solid rgba(14,165,233,0.2)",
              borderTopColor: index === 0 ? "#a3e635" : "rgba(34,211,238,0.46)",
              borderRightColor: index === 2 ? "#22d3ee" : "rgba(255,255,255,0.28)",
              boxShadow: isDarkMode
                ? "0 0 42px rgba(34,211,238,0.1)"
                : "0 0 50px rgba(14,165,233,0.13)",
              animation: `landingCompanionOrbit ${ring.duration}s linear infinite`,
            }}
          />
        ))}
        {landingCompanionSignalNodes.map((node, index) => (
          <Box
            key={node.id}
            data-landing-signal-node={node.id}
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: { sm: 12, md: 15 },
              height: { sm: 12, md: 15 },
              borderRadius: "50%",
              bgcolor: node.color,
              boxShadow: `0 0 22px ${node.color}`,
              transform: {
                sm: `rotate(${node.angle}deg) translateX(${node.distance.sm}px) rotate(-${node.angle}deg)`,
                md: `rotate(${node.angle}deg) translateX(${node.distance.md}px) rotate(-${node.angle}deg)`,
              },
              animation: `landingCompanionSignal ${3.8 + index * 0.4}s ease-in-out infinite`,
              animationDelay: `${index * 0.36}s`,
            }}
          />
        ))}
      </Box>

      <Box
        component={motion.div}
        data-landing-living-companion-stage="true"
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: [0, -8, 0], scale: [1, 1.015, 1] }}
        whileHover={{
          scale: 1.035,
          rotate: -1.4,
          transition: { type: "spring", stiffness: 170, damping: 16 },
        }}
        transition={{
          opacity: { duration: 0.72, ease: "easeOut" },
          y: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
        }}
        sx={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          placeItems: "center",
          width: { sm: 300, md: 360, lg: 360, xl: 390 },
          height: { sm: 390, md: 430, lg: 430, xl: 470 },
          mt: { sm: 1, md: 2 },
          pointerEvents: "auto",
          cursor: "default",
          "&:hover [data-landing-companion-head]::after": {
            transform: "translate(-46%, -50%)",
          },
          "&:hover [data-landing-companion-body]::before": {
            transform: "translate(-50%, -50%) scale(1.08) rotate(8deg)",
          },
          "@media (prefers-reduced-motion: reduce)": {
            transform: "none !important",
          },
        }}
      >
        <Box
          aria-hidden
          component={motion.div}
          animate={{ opacity: [0.72, 1, 0.72], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            width: { sm: 250, md: 330 },
            height: { sm: 250, md: 330 },
            top: { sm: 30, md: 50 },
            borderRadius: "50%",
            background: isDarkMode
              ? "radial-gradient(circle, rgba(163,230,53,0.24), rgba(20,184,166,0.08) 52%, rgba(2,6,23,0.08) 70%)"
              : "radial-gradient(circle, rgba(255,255,255,0.9), rgba(34,211,238,0.22) 50%, rgba(187,247,208,0.14) 70%)",
            filter: "blur(2px)",
            boxShadow: isDarkMode
              ? "0 0 110px rgba(163,230,53,0.22)"
              : "0 0 120px rgba(14,165,233,0.22)",
          }}
        />
        <Box
          aria-hidden
          component={motion.div}
          data-landing-companion-head
          animate={{ y: [0, -5, 0], rotate: [0, 1.2, 0] }}
          transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            top: { sm: 80, md: 108 },
            width: { sm: 168, md: 214 },
            height: { sm: 132, md: 168 },
            borderRadius: "46% 46% 34% 34%",
            background: isDarkMode
              ? "linear-gradient(145deg, #f8fafc 0%, #dbeafe 48%, #94a3b8 100%)"
              : "linear-gradient(145deg, #ffffff 0%, #ecfeff 48%, #cbd5e1 100%)",
            boxShadow: isDarkMode
              ? "0 34px 90px rgba(0,0,0,0.42), inset -18px -20px 38px rgba(15,23,42,0.18), inset 16px 18px 36px rgba(255,255,255,0.68)"
              : "0 34px 90px rgba(14,165,233,0.2), inset -18px -20px 38px rgba(15,23,42,0.1), inset 16px 18px 36px rgba(255,255,255,0.92)",
            "&::before": {
              content: '""',
              position: "absolute",
              inset: { sm: 26, md: 34 },
              borderRadius: 999,
              background: "#07111f",
              boxShadow: "inset 0 0 28px rgba(20,184,166,0.46)",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              left: "50%",
              top: "52%",
              width: { sm: 90, md: 116 },
              height: { sm: 36, md: 46 },
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle at 28% 44%, #86efac 0 14%, transparent 15%), radial-gradient(circle at 72% 44%, #86efac 0 14%, transparent 15%), radial-gradient(ellipse at 50% 78%, transparent 0 56%, #86efac 57% 61%, transparent 62%)",
              filter: "drop-shadow(0 0 12px rgba(134,239,172,0.9))",
              transition: "transform 180ms ease",
            },
          }}
        />
        <Box
          aria-hidden
          data-landing-companion-body
          sx={{
            position: "absolute",
            top: { sm: 226, md: 292 },
            width: { sm: 138, md: 178 },
            height: { sm: 148, md: 190 },
            borderRadius: "44% 44% 36% 36%",
            background: isDarkMode
              ? "linear-gradient(145deg, #e2e8f0, #94a3b8)"
              : "linear-gradient(145deg, #ffffff, #cbd5e1)",
            boxShadow: isDarkMode
              ? "0 28px 80px rgba(0,0,0,0.38), inset -16px -20px 34px rgba(15,23,42,0.16)"
              : "0 28px 80px rgba(14,165,233,0.16), inset -14px -18px 32px rgba(15,23,42,0.08)",
            "&::before": {
              content: '""',
              position: "absolute",
              left: "50%",
              top: "48%",
              width: { sm: 58, md: 76 },
              height: { sm: 58, md: 76 },
              transform: "translate(-50%, -50%)",
              borderRadius: "36% 64% 34% 66%",
              background: "linear-gradient(135deg, #22c55e, #bef264)",
              boxShadow: "0 0 32px rgba(134,239,172,0.74)",
              transition: "transform 220ms ease",
            },
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: { sm: 252, md: 320 },
            left: { sm: 48, md: 62 },
            width: { sm: 54, md: 70 },
            height: { sm: 16, md: 20 },
            borderRadius: 999,
            transform: "rotate(32deg)",
            background: "linear-gradient(90deg, #e2e8f0, #94a3b8)",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: { sm: 252, md: 320 },
            right: { sm: 48, md: 62 },
            width: { sm: 54, md: 70 },
            height: { sm: 16, md: 20 },
            borderRadius: 999,
            transform: "rotate(-32deg)",
            background: "linear-gradient(90deg, #94a3b8, #e2e8f0)",
          }}
        />
      </Box>

      {referenceCards.map((card, index) => (
        <Paper
          key={card.id}
          component={motion.div}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: [0, -6, 0] }}
          transition={{
            opacity: { delay: 0.12 + index * 0.08, duration: 0.3 },
            y: {
              delay: index * 0.16,
              duration: 4 + index * 0.28,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          elevation={0}
          sx={{
            position: "absolute",
            zIndex: 4,
            width: card.id === "coach" ? { sm: 220, md: 244 } : { sm: 176, md: 200 },
            display:
              card.id === "coach" || card.id === "streak"
                ? { sm: "none", xl: "block" }
                : "block",
            p: { sm: 1.25, md: 1.45 },
            borderRadius: 1,
            border: isDarkMode
              ? "1px solid rgba(255,255,255,0.16)"
              : `1px solid ${GLASS_WHITE_72}`,
            bgcolor: isDarkMode ? "rgba(2,6,23,0.58)" : "rgba(255,255,255,0.42)",
            color: isDarkMode ? "#ffffff" : "#102a43",
            backdropFilter: GLASS_BLUR_18,
            boxShadow: isDarkMode
              ? "0 20px 60px rgba(0,0,0,0.34)"
              : "0 20px 54px rgba(14,165,233,0.18)",
            ...card.sx,
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: 12, color: scene.sceneCardMuted, fontWeight: 800 }}>
                {card.label}
              </Typography>
              <Typography sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                {card.value}
              </Typography>
              {card.id === "protein" ? (
                <LinearProgress
                  variant="determinate"
                  value={72}
                  sx={{
                    mt: 0.9,
                    height: 5,
                    borderRadius: 999,
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)",
                    "& .MuiLinearProgress-bar": { bgcolor: "#22d3ee" },
                  }}
                />
              ) : null}
            </Box>
            {card.badge ? (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  background:
                    "conic-gradient(from 0deg, #22d3ee 0 38%, #84cc16 38% 72%, rgba(255,255,255,0.16) 72% 100%)",
                  boxShadow: "0 0 24px rgba(34,211,238,0.28)",
                  "&::before": {
                    content: `"${card.badge}"`,
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: isDarkMode ? "#07111f" : "#ffffff",
                    fontSize: 12,
                  },
                }}
              />
            ) : null}
          </Stack>
        </Paper>
      ))}
    </Box>
  );
};

const Hero = ({
  copy,
  isDarkMode,
}: {
  copy: LandingCopy;
  isDarkMode: boolean;
}) => {
  const scene = getLandingScene(isDarkMode);

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        minHeight: { xs: "auto", md: "auto", lg: "min(760px, calc(100svh - 24px))" },
        overflow: "hidden",
        borderRadius: { xs: 0, md: 1 },
        px: { xs: 2, sm: 3, md: 4, lg: 5 },
        pt: { xs: 10, md: 11, lg: 12 },
        pb: { xs: 3, md: 4, lg: 5 },
        display: { xs: "flex", md: "grid", lg: "grid" },
        gridTemplateColumns: {
          md: "minmax(0, 0.9fr) minmax(360px, 0.78fr)",
          lg: "minmax(0, 0.82fr) minmax(500px, 1fr)",
        },
        gridTemplateRows: { md: "auto auto", lg: "1fr" },
        columnGap: { md: 2.5, lg: 4 },
        rowGap: { md: 2, lg: 0 },
        flexDirection: "column",
        justifyContent: "space-between",
        color: scene.heroText,
        background: scene.heroBackground,
        border: `1px solid ${scene.featureRailBorder}`,
        boxShadow: STRONG_SHADOW,
      }}
    >
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background: scene.heroOverlay,
      }}
    />
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        opacity: scene.gridOpacity,
        backgroundImage: scene.gridLines,
        backgroundSize: "42px 42px",
        maskImage:
          "linear-gradient(180deg, rgba(0,0,0,0.86), rgba(0,0,0,0.1))",
      }}
    />
    <Stack
      spacing={2}
      sx={{
        position: "relative",
        zIndex: 3,
        gridColumn: { md: "1", lg: "1" },
        gridRow: { md: "1", lg: "1" },
        maxWidth: { xs: 980, md: 560, lg: 620 },
        minWidth: 0,
        pt: { xs: 1, md: 2, lg: 4 },
        pb: { md: 3 },
        alignSelf: { lg: "center" },
      }}
    >
      <Chip
        label={copy.eyebrow}
        sx={{
          alignSelf: START_ALIGN,
          bgcolor: scene.eyebrowBg,
          color: scene.eyebrowColor,
          border: `1px solid ${scene.eyebrowBorder}`,
          fontWeight: 900,
          backdropFilter: GLASS_BLUR_14,
        }}
      />
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: 40, sm: 58, md: 50, lg: 60, xl: 70 },
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: 0,
          maxWidth: { xs: 760, md: 560, lg: 620 },
          overflowWrap: "anywhere",
          textShadow: scene.titleShadow,
          "@media (min-width: 900px) and (max-height: 760px)": {
            fontSize: 54,
          },
        }}
      >
        {copy.headline.prefix}{" "}
        <Box
          component="span"
          sx={{
            color: scene.accentColor,
            textShadow: scene.accentShadow,
          }}
        >
          {copy.headline.accent}
        </Box>{" "}
        {copy.headline.suffix}
      </Typography>
      <Typography
        component="p"
        sx={{
          minHeight: { xs: 62, sm: 36 },
          fontSize: { xs: 23, md: 25, lg: 32 },
          lineHeight: 1.15,
          fontWeight: 900,
          color: scene.typingColor,
        }}
      >
        <TypeAnimation
          key={copy.heroTyping.join("|")}
          sequence={[
            copy.heroTyping[0],
            1700,
            copy.heroTyping[1],
            1700,
            copy.heroTyping[2],
            1700,
          ]}
          speed={54}
          repeat={Infinity}
        />
      </Typography>
      <Typography
        sx={{
          maxWidth: 760,
          color: scene.mutedText,
          fontSize: { xs: 17, md: 20 },
          lineHeight: 1.65,
          fontWeight: 600,
        }}
      >
        {copy.subtitle}
      </Typography>
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{
          display: { xs: "none", sm: "flex" },
          "@media (min-width: 900px) and (max-height: 760px)": {
            display: "none",
          },
        }}
      >
        {copy.proof.map((item) => (
          <Chip
            key={item}
            label={item}
            variant="outlined"
            sx={{
              borderColor: scene.proofBorder,
              color: scene.proofColor,
              bgcolor: scene.proofBg,
              backdropFilter: "blur(10px)",
            }}
          />
        ))}
      </Stack>
      <Stack
        direction="row"
        spacing={1.2}
        alignItems="center"
        sx={{
          display: { xs: "flex", sm: "none" },
          p: 1.1,
          borderRadius: 1,
          border: `1px solid ${scene.mobilePanelBorder}`,
          backgroundColor: scene.mobilePanelBg,
          backdropFilter: GLASS_BLUR_14,
        }}
      >
        <AssistantAvatar
          name={copy.mascot.name}
          variant="robot"
          mood="happy"
          size={58}
          active
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900 }}>{copy.mascot.title}</Typography>
          <Typography
            sx={{
              color: scene.mutedText,
              fontSize: 13,
              lineHeight: 1.45,
            }}
          >
            {copy.mascot.body}
          </Typography>
        </Box>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4}>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          size="large"
          onClick={playAIDiscoverySound}
          sx={{
            px: 3.2,
            py: 1.4,
            color: "#ffffff",
          }}
        >
          {copy.primary}
        </Button>
        <Button
          component={Link}
          to="/register"
          variant="outlined"
          size="large"
          onClick={playGentleClickSound}
          startIcon={<MessageSquareText size={18} aria-hidden="true" />}
          sx={{
            px: 3.2,
            py: 1.4,
            color: scene.secondaryButtonColor,
            borderColor: scene.secondaryButtonBorder,
            bgcolor: scene.secondaryButtonBg,
          }}
        >
          {copy.telegramCta}
        </Button>
      </Stack>
      <Stack
        direction="row"
        spacing={1.2}
        alignItems="center"
        useFlexGap
        flexWrap="wrap"
        sx={{
          color: scene.socialColor,
          display: { xs: "none", sm: "flex" },
          "@media (min-width: 900px) and (max-height: 760px)": {
            display: "none",
          },
        }}
      >
        <Stack direction="row" spacing={-0.5} aria-hidden="true">
          {["I", "A", "M", "S"].map((initial, index) => (
            <Box
              key={initial}
              sx={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: `2px solid ${GLASS_WHITE_72}`,
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 900,
                background:
                  index % 2 === 0
                    ? "linear-gradient(135deg, #0f766e, #65a30d)"
                    : "linear-gradient(135deg, #14b8a6, #2563eb)",
              }}
            >
              {initial}
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={0.3} aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={16}
              fill="#facc15"
              color="#facc15"
              aria-hidden="true"
            />
          ))}
        </Stack>
        <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
          {copy.socialProof}
        </Typography>
      </Stack>
    </Stack>

    <CompanionExperienceScene isDarkMode={isDarkMode} />

    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.2}
        sx={{
          position: "relative",
          zIndex: 3,
        display: "none",
        gridColumn: { md: "1 / -1", lg: "auto" },
        "@media (min-width: 1200px) and (max-height: 760px)": {
          display: "none",
        },
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        alignItems: "stretch",
        width: "100%",
        p: 1,
        borderRadius: 1,
        border: `1px solid ${scene.featureRailBorder}`,
        backgroundColor: scene.featureRailBg,
        backdropFilter: GLASS_BLUR_18,
      }}
    >
      {copy.featureRail.map((feature, index) => {
        const Icon = getFeatureRailIcon(index);

        return (
        <Box
          key={feature.title}
          sx={{
            p: 1.4,
            borderRadius: 1,
            border: `1px solid ${scene.featureCardBorder}`,
            backgroundColor: scene.featureCardBg,
          }}
        >
          <Stack spacing={0.7}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: scene.featureIconColor,
                backgroundColor: scene.featureIconBg,
                boxShadow: scene.featureIconShadow,
              }}
            >
              <Icon size={18} aria-hidden="true" />
            </Box>
            <Typography
              sx={{ fontWeight: 900, fontSize: 14, color: scene.featureText }}
            >
              {feature.title}
            </Typography>
            <Typography sx={{ color: scene.featureMuted, fontSize: 12 }}>
              {feature.body}
            </Typography>
          </Stack>
        </Box>
        );
      })}
    </Stack>
    </Box>
  );
};

const AIDiscoveryAccordion = ({
  copy,
  isDarkMode,
}: {
  copy: LandingCopy;
  isDarkMode: boolean;
}) => {
  const [openItem, setOpenItem] = useState(0);
  const scene = getLandingScene(isDarkMode);
  const discoveryItems = [
    {
      title: copy.mascot.title,
      body: copy.mascot.body,
      meta: copy.mascot.mood,
      Icon: Bot,
    },
    ...copy.sceneCards.map((item) => ({
      title: item.title,
      body: item.body,
      meta: item.tone,
      Icon: Sparkles,
    })),
    ...copy.featureRail.slice(0, 3).map((item, index) => ({
      title: item.title,
      body: item.body,
      meta: getIndexedValue(copy.quickActions, index) ?? copy.navOverview,
      Icon: getFeatureRailIcon(index),
    })),
  ];

  return (
    <Box
      id="ai-discovery"
      component="section"
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 5 },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          border: `1px solid ${scene.featureRailBorder}`,
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(2,6,23,0.9), rgba(6,78,59,0.34))"
            : "linear-gradient(135deg, rgba(255,255,255,0.88), rgba(220,252,231,0.62))",
          boxShadow: STRONG_SHADOW,
          backdropFilter: GLASS_BLUR_18,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "0.42fr 0.58fr" },
            minHeight: { md: 460 },
          }}
        >
          <Stack
            spacing={1.5}
            sx={{
              p: { xs: 2.2, md: 3.2 },
              borderRight: {
                lg: `1px solid ${scene.featureRailBorder}`,
              },
            }}
          >
            <Chip
              label="AI Discovery"
              sx={{
                alignSelf: START_ALIGN,
                bgcolor: scene.eyebrowBg,
                color: scene.eyebrowColor,
                border: `1px solid ${scene.eyebrowBorder}`,
                fontWeight: 900,
              }}
            />
            <Typography component="h2" variant="h3" sx={landingSectionTitleSx}>
              {copy.ecosystemTitle}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
              {copy.ecosystemBody}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {copy.presencePills.map((pill) => (
                <Chip key={pill} label={pill} variant="outlined" />
              ))}
            </Stack>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: TWO_COLUMN_GRID },
              borderTop: {
                xs: `1px solid ${scene.featureRailBorder}`,
                lg: "none",
              },
            }}
          >
            {discoveryItems.map((item, index) => {
              const isOpen = openItem === index;
              const buttonId = `ai-discovery-button-${index}`;
              const panelId = `ai-discovery-panel-${index}`;
              const Icon = item.Icon;

              return (
                <Box
                  key={`${item.title}-${index}`}
                  sx={{
                    minHeight: { xs: "auto", md: 176 },
                    borderRight: {
                      md:
                        index % 2 === 0
                          ? `1px solid ${scene.featureRailBorder}`
                          : "none",
                    },
                    borderBottom: `1px solid ${scene.featureRailBorder}`,
                    backgroundColor: isOpen
                      ? isDarkMode
                        ? "rgba(255,255,255,0.07)"
                        : GLASS_WHITE_70
                      : "transparent",
                    transition:
                      "background-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.09)"
                        : "rgba(255,255,255,0.82)",
                      boxShadow: isDarkMode
                        ? "inset 0 0 0 1px rgba(163,230,53,0.2)"
                        : "inset 0 0 0 1px rgba(20,184,166,0.2)",
                    },
                  }}
                >
                  <Box
                    component="button"
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => {
                      playGentleClickSound();
                      setOpenItem(isOpen ? -1 : index);
                    }}
                    sx={{
                      width: "100%",
                      minHeight: { xs: 96, md: isOpen ? 96 : 176 },
                      p: { xs: 2, md: 2.4 },
                      border: 0,
                      borderRadius: 0,
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 1.4,
                      alignItems: "start",
                      color: "inherit",
                      textAlign: "left",
                      background: "transparent",
                      cursor: "pointer",
                      transition: "min-height 220ms ease",
                      "&:focus-visible": {
                        outline: `3px solid ${scene.accentColor}`,
                        outlineOffset: -5,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        color: scene.featureIconColor,
                        backgroundColor: scene.featureIconBg,
                        boxShadow: scene.featureIconShadow,
                      }}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        component="h3"
                        sx={{
                          color: scene.heroText,
                          fontWeight: 900,
                          fontSize: { xs: 18, md: 20 },
                          lineHeight: 1.2,
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography
                        sx={{
                          mt: 0.5,
                          color: scene.featureMuted,
                          fontSize: 13,
                          fontWeight: 800,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.meta}
                      </Typography>
                    </Box>
                    <Box
                      aria-hidden="true"
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        border: `1px solid ${scene.featureRailBorder}`,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 220ms ease, background-color 180ms ease",
                        backgroundColor: isOpen
                          ? scene.featureIconBg
                          : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <ChevronDown size={20} aria-hidden="true" />
                    </Box>
                  </Box>

                  <Box
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    sx={{
                      px: { xs: 2, md: 2.4 },
                      pb: { xs: 2, md: 2.4 },
                    }}
                  >
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {item.body}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const QuickFoodPanel = ({
  copy,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
}) => (
  <Box
    id="nutrition"
    component="section"
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", lg: "0.95fr 1.05fr" },
      gap: 2.5,
      alignItems: "center",
    }}
  >
    <Stack spacing={1.4}>
      <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
        {copy.sectionEyebrow}
      </Typography>
      <Typography
        component="h2"
        variant="h3"
        sx={landingSectionTitleSx}
      >
        {copy.foodTitle}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ maxWidth: 650, lineHeight: 1.75 }}
      >
        {copy.foodBody}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {copy.quickActions.map((action, index) => {
          const Icon = getQuickActionIcon(index);

          return (
            <Button
              key={action}
              variant="outlined"
              onClick={playGentleClickSound}
              sx={iconButtonSx}
              aria-label={action}
            >
              <Icon size={20} aria-hidden="true" />
            </Button>
          );
        })}
      </Stack>
    </Stack>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        gap: 1.5,
      }}
    >
      {copy.foods.map((food, index) => (
        <Paper
          key={food.title}
          elevation={0}
          sx={{
            ...landingGlassPanelSx,
            p: 2,
            minHeight: 186,
          }}
        >
          <Stack spacing={1.2}>
            <Box
              aria-hidden
              sx={{
                height: 68,
                borderRadius: 1,
                background:
                  index === 0
                    ? "linear-gradient(135deg, #f59e0b 0%, #16a34a 100%)"
                    : index === 1
                      ? "linear-gradient(135deg, #f9a8d4 0%, #2563eb 100%)"
                      : "linear-gradient(135deg, #fde68a 0%, #92400e 100%)",
              }}
            />
            <Typography sx={{ fontWeight: 900, fontSize: 20 }}>
              {food.title}
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip size="small" label={food.kcal} />
              <Chip size="small" label={food.meta} variant="outlined" />
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Box>
  </Box>
);

const EcosystemGrid = ({
  copy,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
}) => (
  <Box id="features" component="section">
    <Stack spacing={1.2} sx={{ mb: 2 }}>
      <Typography
        component="h2"
        variant="h3"
        sx={landingSectionTitleSx}
      >
        {copy.ecosystemTitle}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ maxWidth: 850, lineHeight: 1.75 }}
      >
        {copy.ecosystemBody}
      </Typography>
    </Stack>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: TWO_COLUMN_GRID },
        gap: 1.5,
      }}
    >
      {copy.ecosystem.map((feature, index) => (
        <Paper
          key={feature.title}
          elevation={0}
          sx={{
            ...landingGlassPanelSx,
            p: 2.4,
            minHeight: 190,
          }}
        >
          <Stack spacing={1.2}>
            <Chip
              label={`0${index + 1}`}
              sx={{
                width: 54,
                bgcolor:
                  index % 2 === 0
                    ? "rgba(15,118,110,0.1)"
                    : "rgba(37,99,235,0.1)",
                color: index % 2 === 0 ? "#0f766e" : "#1d4ed8",
              }}
            />
            <Typography component="h3" variant="h5" sx={{ fontWeight: 900 }}>
              {feature.title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {feature.body}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Box>
  </Box>
);

const AnalyticsPanel = ({
  copy,
  isDarkMode,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
  isDarkMode: boolean;
}) => {
  const scene = getLandingScene(isDarkMode);

  return (
  <Paper
    id="reminders"
    component="section"
    elevation={0}
    sx={{
      ...landingGlassPanelSx,
      p: { xs: 2.4, md: 3 },
      color: scene.analyticsText,
      background: scene.analyticsBg,
      overflow: "hidden",
    }}
  >
    <Stack spacing={2.5}>
      <Typography
        component="h2"
        variant="h3"
        sx={landingSectionTitleSx}
      >
        {copy.analyticsTitle}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: TWO_COLUMN_GRID,
            lg: "repeat(4, 1fr)",
          },
          gap: 1.5,
        }}
      >
        {copy.analytics.map((item) => (
          <Box
            key={item.label}
            sx={{
              p: 2,
              borderRadius: 1,
              border: `1px solid ${scene.analyticsCardBorder}`,
              bgcolor: scene.analyticsCardBg,
            }}
          >
            <Typography sx={{ color: scene.analyticsMuted }}>
              {item.label}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: 28, fontWeight: 900 }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          p: 2,
          borderRadius: 1,
          bgcolor: scene.analyticsAdviceBg,
          border: `1px solid ${scene.analyticsAdviceBorder}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems="center"
        >
          <AssistantAvatar
            name={copy.mascot.name}
            variant="robot"
            mood="coach"
            active
          />
          <Typography sx={{ color: scene.mutedText, lineHeight: 1.7 }}>
            {copy.progressAdvice}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  </Paper>
  );
};

const MobileCommunityPanel = ({
  copy,
  isDarkMode,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
  isDarkMode: boolean;
}) => {
  const scene = getLandingScene(isDarkMode);

  return (
  <Box
    id="community"
    component="section"
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", lg: "0.9fr 1.1fr" },
      gap: 3,
      alignItems: "center",
    }}
  >
    <Stack spacing={2}>
      <Typography
        component="h2"
        variant="h3"
        sx={landingSectionTitleSx}
      >
        {copy.mobileTitle}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ maxWidth: 680, lineHeight: 1.75 }}
      >
        {copy.mobileBody}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          ...landingGlassPanelSx,
          p: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <ShieldCheck size={20} aria-hidden="true" />
          <Typography sx={{ fontWeight: 900 }}>
            {copy.communityTitle}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {copy.communityItems.map((item) => (
            <Chip key={item} label={item} variant="outlined" />
          ))}
        </Stack>
      </Paper>
      <Paper
        elevation={0}
        sx={{
          ...landingGlassPanelSx,
          p: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Bot size={20} aria-hidden="true" />
          <Typography sx={{ fontWeight: 900 }}>{copy.learningTitle}</Typography>
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {copy.learningTopics.map((topic) => (
            <Chip
              key={topic}
              label={topic}
              color="primary"
              variant="outlined"
            />
          ))}
        </Stack>
      </Paper>
    </Stack>

    <Box
      sx={{
        mx: "auto",
        width: { xs: "min(100%, 340px)", md: 360 },
        p: 1.2,
        borderRadius: 8,
        bgcolor: scene.phoneShellBg,
        boxShadow: "0 30px 90px rgba(15,23,42,0.24)",
      }}
    >
      <Box
        sx={{
          minHeight: 610,
          borderRadius: 1,
          p: 2,
          bgcolor: scene.phoneScreenBg,
          color: scene.heroText,
          overflow: "hidden",
        }}
      >
        <Stack spacing={1.4}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AssistantAvatar
              name={copy.mascot.name}
              variant="cat"
              mood="happy"
              size={54}
              active
            />
            <Box>
              <Typography sx={{ fontWeight: 900 }}>Smart Nutrition</Typography>
              <Typography variant="caption" color="text.secondary">
                {copy.mascot.body}
              </Typography>
            </Box>
          </Stack>
          {copy.heroStats.map((metric) => (
            <Box
              key={metric.label}
              sx={{
                p: 1.4,
                borderRadius: 1,
                bgcolor: scene.phoneCardBg,
                border: `1px solid ${scene.phoneCardBorder}`,
              }}
            >
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 900 }}>{metric.label}</Typography>
                <Typography sx={{ color: metric.color, fontWeight: 900 }}>
                  {metric.progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={metric.progress}
                sx={{
                  mt: 1,
                  height: 8,
                  borderRadius: 999,
                  "& .MuiLinearProgress-bar": { bgcolor: metric.color },
                }}
              />
            </Box>
          ))}
          <Button
            component={Link}
            to="/register"
            variant="contained"
            sx={{ mt: 1 }}
          >
            {copy.primary}
          </Button>
        </Stack>
      </Box>
    </Box>
  </Box>
  );
};

const CompanionCapabilitySlider = ({
  copy,
  isDarkMode,
}: {
  copy: LandingCopy;
  isDarkMode: boolean;
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scene = getLandingScene(isDarkMode);
  const slides: [CompanionCapabilitySlide, ...CompanionCapabilitySlide[]] = [
    {
      title: copy.featureRail[0]?.title ?? FOOD_SCANNER_TITLE,
      body:
        copy.featureRail[0]?.body ??
        "Food photo, barcode, and fast product recognition.",
      tags: [copy.quickActions[0] ?? "Photo", copy.quickActions[1] ?? "Barcode"],
      Icon: Camera,
      tone: "#22c55e",
    },
    {
      title: copy.featureRail[1]?.title ?? HYDRATION_TRACKER_TITLE,
      body: copy.featureRail[1]?.body ?? "Water tracking without manual chaos.",
      tags: copy.sliderTags.hydration,
      Icon: Droplets,
      tone: "#22d3ee",
    },
    {
      title: copy.featureRail[5]?.title ?? SMART_REMINDERS_TITLE,
      body:
        copy.featureRail[5]?.body ??
        "Water, meals, medication, and habits in one reminder system.",
      tags: copy.sliderTags.reminders,
      Icon: Bell,
      tone: "#a3e635",
    },
    {
      title: copy.mascot.title,
      body: copy.mascot.body,
      tags: copy.presencePills.slice(0, 3),
      Icon: Bot,
      tone: "#60a5fa",
    },
    {
      title: copy.analyticsTitle,
      body: copy.progressAdvice,
      tags: copy.analytics.slice(0, 3).map((item) => item.label),
      Icon: HeartPulse,
      tone: "#14b8a6",
    },
    {
      title: copy.mobileTitle,
      body: copy.mobileBody,
      tags: copy.sliderTags.mobile,
      Icon: ShieldCheck,
      tone: "#facc15",
    },
  ];
  const active = getIndexedValue(slides, activeSlide) ?? slides[0];
  const ActiveIcon = active.Icon;
  const goToSlide = (direction: -1 | 1) => {
    playGentleClickSound();
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <Box
      component="section"
      aria-label={copy.sliderAriaLabel}
      sx={{
        width: "100%",
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 2, sm: 3, md: 5 },
        pb: { xs: 4, md: 5 },
      }}
    >
      <Stack spacing={1.2} sx={{ mb: 2 }}>
        <Typography variant="overline" sx={{ color: scene.accentColor, fontWeight: 900 }}>
          {copy.sliderEyebrow}
        </Typography>
        <Typography component="h2" variant="h3" sx={landingSectionTitleSx}>
          {copy.title}
        </Typography>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          overflow: "hidden",
          borderRadius: 1,
          border: `1px solid ${scene.featureRailBorder}`,
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(8,13,26,0.98), rgba(3,7,18,0.96))"
            : "linear-gradient(90deg, rgba(255,255,255,0.96), rgba(241,245,249,0.9))",
          boxShadow: STRONG_SHADOW,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "0.48fr 0.52fr" },
            minHeight: { md: 480 },
          }}
        >
          <Box
            sx={{
              position: "relative",
              minHeight: { xs: 360, md: 480 },
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              background: isDarkMode
                ? `radial-gradient(circle at 50% 46%, ${active.tone}44, transparent 25%), radial-gradient(circle at 72% 28%, rgba(255,255,255,0.2), transparent 18%), linear-gradient(135deg, rgba(15,23,42,0.88), rgba(3,7,18,0.96))`
                : `radial-gradient(circle at 50% 46%, ${active.tone}33, transparent 28%), radial-gradient(circle at 70% 26%, rgba(255,255,255,0.96), transparent 18%), linear-gradient(135deg, rgba(236,253,245,0.92), rgba(224,242,254,0.9))`,
              borderRight: { lg: `1px solid ${scene.featureRailBorder}` },
            }}
          >
            <Box
              component={motion.div}
              key={active.title}
              initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              sx={{
                width: { xs: 230, md: 320 },
                height: { xs: 230, md: 320 },
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: isDarkMode
                  ? "rgba(2,6,23,0.52)"
                  : GLASS_WHITE_72,
                border: `1px solid ${scene.featureRailBorder}`,
                boxShadow: `0 0 90px ${active.tone}55`,
                backdropFilter: "blur(16px)",
              }}
            >
              <Box
                sx={{
                  width: { xs: 150, md: 210 },
                  height: { xs: 150, md: 210 },
                  borderRadius: "42%",
                  display: "grid",
                  placeItems: "center",
                  color: isDarkMode ? "#ecfeff" : "#042f2e",
                  background: `linear-gradient(135deg, ${active.tone}, rgba(255,255,255,0.88))`,
                  boxShadow: `inset 0 0 38px rgba(255,255,255,0.34), 0 28px 90px ${active.tone}55`,
                }}
              >
                <ActiveIcon size={82} aria-hidden="true" />
              </Box>
            </Box>

            <Paper
              elevation={0}
              component={motion.div}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: [0, -8, 0] }}
              transition={{
                opacity: { duration: 0.24 },
                y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
              }}
              sx={{
                position: "absolute",
                left: { xs: 18, md: 36 },
                bottom: { xs: 18, md: 36 },
                maxWidth: { xs: 245, md: 310 },
                p: 1.5,
                borderRadius: 1,
                border: `1px solid ${scene.featureRailBorder}`,
                bgcolor: isDarkMode ? "rgba(2,6,23,0.68)" : GLASS_WHITE_72,
                color: scene.heroText,
                backdropFilter: "blur(16px)",
              }}
            >
              <Typography sx={{ fontSize: 12, color: scene.featureMuted, fontWeight: 900 }}>
                {copy.mascot.name}
              </Typography>
              <Typography sx={{ mt: 0.4, fontWeight: 900, lineHeight: 1.25 }}>
                {active.tags.join(" / ")}
              </Typography>
            </Paper>
          </Box>

          <Stack
            spacing={3}
            sx={{
              p: { xs: 2.4, md: 4.5, lg: 5 },
              minHeight: { xs: 390, md: 480 },
              justifyContent: "space-between",
              bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#ffffff",
            }}
          >
            <Stack spacing={2.4}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {active.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    variant="outlined"
                    sx={{
                      borderColor: scene.proofBorder,
                      color: scene.proofColor,
                      bgcolor: scene.proofBg,
                      fontWeight: 900,
                    }}
                  />
                ))}
              </Stack>
              <Typography
                component={motion.h3}
                key={active.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                sx={{
                  m: 0,
                  color: scene.heroText,
                  fontSize: { xs: 34, md: 48, lg: 56 },
                  lineHeight: 1.02,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                {active.title}
              </Typography>
              <Typography
                key={active.body}
                component={motion.p}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.04 }}
                sx={{
                  m: 0,
                  maxWidth: 680,
                  color: scene.mutedText,
                  fontSize: { xs: 16, md: 19 },
                  lineHeight: 1.65,
                  fontWeight: 650,
                }}
              >
                {active.body}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.2} alignItems="center">
              <Button
                type="button"
                variant="outlined"
                onClick={() => goToSlide(-1)}
                aria-label={copy.sliderPreviousLabel}
                sx={{
                  ...iconButtonSx,
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  minWidth: 58,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: active.tone,
                  },
                  "&:focus-visible": {
                    outline: `3px solid ${active.tone}`,
                    outlineOffset: 3,
                  },
                }}
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => goToSlide(1)}
                aria-label={copy.sliderNextLabel}
                sx={{
                  ...iconButtonSx,
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  minWidth: 58,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    borderColor: active.tone,
                  },
                  "&:focus-visible": {
                    outline: `3px solid ${active.tone}`,
                    outlineOffset: 3,
                  },
                }}
              >
                <ChevronRight size={24} aria-hidden="true" />
              </Button>
              <Stack direction="row" spacing={0.7} sx={{ ml: 1 }}>
                {slides.map((slide, index) => (
                  <Box
                    key={slide.title}
                    component="button"
                    type="button"
                    aria-label={`Show ${slide.title}`}
                    aria-current={index === activeSlide ? "true" : undefined}
                    onClick={() => {
                      playGentleClickSound();
                      setActiveSlide(index);
                    }}
                    sx={{
                      width: index === activeSlide ? 30 : 10,
                      height: 10,
                      borderRadius: 999,
                      border: 0,
                      p: 0,
                      cursor: "pointer",
                      bgcolor:
                        index === activeSlide
                          ? active.tone
                          : isDarkMode
                            ? "rgba(255,255,255,0.22)"
                            : "rgba(15,23,42,0.18)",
                      transition: "width 180ms ease, background-color 180ms ease",
                      "&:focus-visible": {
                        outline: `2px solid ${active.tone}`,
                        outlineOffset: 3,
                      },
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

const FinalCta = ({
  copy,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
}) => (
  <Paper
    id="about"
    component="section"
    elevation={0}
    sx={{
      ...landingGlassPanelSx,
      p: { xs: 2.5, md: 3.5 },
    }}
  >
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      alignItems={{ xs: START_ALIGN, md: "center" }}
      justifyContent="space-between"
    >
      <Stack spacing={0.7}>
        <Typography component="h2" variant="h4" sx={{ fontWeight: 900 }}>
          {copy.finalTitle}
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 820, lineHeight: 1.7 }}
        >
          {copy.finalBody}
        </Typography>
      </Stack>
      <Button
        component={Link}
        to="/register"
        variant="contained"
        size="large"
        sx={{ px: 3, py: 1.4, flexShrink: 0 }}
      >
        {copy.primary}
      </Button>
    </Stack>
  </Paper>
);

const LandingPage = () => {
  const { appLanguage } = useLanguage();
  const { isDarkMode } = useAppColorMode();
  const copy = getLandingCopy(appLanguage);
  const scene = getLandingScene(isDarkMode);

  return (
    <Stack
      spacing={{ xs: 4, md: 5 }}
      sx={{
        background: scene.pageBackground,
        color: scene.heroText,
        transition: "background 240ms ease, color 240ms ease",
        "@keyframes landingCompanionOrbit": {
          "0%": { rotate: "0deg" },
          "100%": { rotate: "360deg" },
        },
        "@keyframes landingCompanionSignal": {
          "0%, 100%": { opacity: 0.58, scale: 0.82 },
          "45%": { opacity: 1, scale: 1.18 },
        },
      }}
    >
      <Hero copy={copy} isDarkMode={isDarkMode} />
      <CompanionCapabilitySlider copy={copy} isDarkMode={isDarkMode} />
      <AIDiscoveryAccordion copy={copy} isDarkMode={isDarkMode} />
      {SHOW_EXTENDED_LANDING_SECTIONS ? (
        <Stack
          spacing={{ xs: 4, md: 5 }}
          sx={{
            width: "100%",
            maxWidth: 1440,
            mx: "auto",
            px: { xs: 2, sm: 3, md: 5 },
            pb: { xs: 4, md: 6 },
          }}
        >
          <EcosystemGrid copy={copy} />
          <QuickFoodPanel copy={copy} />
          <AnalyticsPanel copy={copy} isDarkMode={isDarkMode} />
          <MobileCommunityPanel copy={copy} isDarkMode={isDarkMode} />
          <FinalCta copy={copy} />
        </Stack>
      ) : (
        <Box
          sx={{
            width: "100%",
            maxWidth: 1440,
            mx: "auto",
            px: { xs: 2, sm: 3, md: 5 },
            pb: { xs: 4, md: 5 },
          }}
        >
          <FinalCta copy={copy} />
        </Box>
      )}
    </Stack>
  );
};

export default LandingPage;
