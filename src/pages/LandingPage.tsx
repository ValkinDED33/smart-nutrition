import { TypeAnimation } from "react-type-animation";
import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  Camera,
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
import { useAppColorMode } from "../shared/theme/colorMode";

type LandingLanguage = "uk" | "pl" | "en";

const BRAND_NAME = "Smart Nutrition";
const AI_WELLNESS_ECOSYSTEM = "AI wellness ecosystem";
const AI_COMPANION_LABEL = "AI companion";
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
const GLASS_WHITE_72 = "rgba(255,255,255,0.72)";
const GLASS_BLUR_14 = "blur(14px)";

const landingCopy = {
  uk: {
    eyebrow: AI_WELLNESS_ECOSYSTEM,
    brandTitle: BRAND_NAME,
    headline: {
      prefix: "Твій AI-компаньйон для",
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
      "Живий AI-компаньйон для їжі, води, ліків, прогресу і м'якої мотивації. Він не просто трекає, а веде день разом із вами.",
    primary: "Почати безкоштовно",
    secondary: "Побачити companion",
    telegramCta: "Підключити Telegram",
    navOverview: "Огляд продукту",
    socialProof: "10 000+ користувачів будують звички разом з companion",
    proof: [AI_COMPANION_LABEL, "пам'ять", PROACTIVE_NUDGES_LABEL, "Telegram поруч"],
    presencePills: [BREATHING_PILL, EYE_TRACKING_PILL, MOOD_SHIFT_PILL, DAILY_MEMORY_PILL],
    sceneCards: [
      {
        title: "Ранковий фокус",
        body: "Вода, білок і таблетка о 09:00 вже у плані.",
        tone: "calm",
      },
      {
        title: "AI помітив",
        body: "Вчора зрив був увечері, тому сьогодні підказка прийде раніше.",
        tone: "coach",
      },
      {
        title: TELEGRAM_RETENTION_LABEL,
        body: "Швидкий лог води або ліків без відкриття застосунку.",
        tone: "warm",
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
      name: "Diana",
      title: "Diana поруч",
      body: "Сьогодні залишилось 600 ккал. Я б додала воду і легку вечерю з білком.",
      mood: "жива реакція",
      xps: "+25 XP за серію",
    },
    quickActions: ["Фото їжі", "Штрихкод", "Повторити вчора", "Ручний ввід"],
    featureRail: [
      { title: FOOD_SCANNER_TITLE, body: "Фото їжі і швидкий аналіз" },
      { title: HYDRATION_TRACKER_TITLE, body: "Вода без ручного хаосу" },
      { title: CALORIE_MACRO_TITLE, body: "Калорії, білок, жири, вуглеводи" },
      { title: AI_COACHING_TITLE, body: "Підказки під твій день" },
      { title: PROGRESS_INSIGHTS_TITLE, body: "Зміни без сухої статистики" },
      { title: SMART_REMINDERS_TITLE, body: "Вода, їжа, ліки і звички" },
    ],
    sectionEyebrow: "За 5 секунд зрозуміло, що робити",
    ecosystemTitle: "Не калькулятор, а companion-платформа",
    ecosystemBody:
      "Smart Nutrition об'єднує нутриціологію, gamification, analytics, воду, прогрес і community в один спокійний щоденний маршрут.",
    ecosystem: [
      {
        title: "AI-компаньйон",
        body: "Дивиться за курсором, реагує на дії, радіє досягненням і попереджає про ризики без тиску.",
      },
      {
        title: "Їжа без тертя",
        body: "Пошук, штрихкод, фото, шаблони, повтор вчорашнього і особистий каталог продуктів.",
      },
      {
        title: "Жива мотивація",
        body: "Серії, XP, рівні, досягнення, day-off і м'які завдання, які не ламають настрій.",
      },
      {
        title: COMMUNITY_FOOD_HUB_TITLE,
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
    communityTitle: "Community і модерація вже в логіці продукту",
    communityItems: [
      "Друзі",
      "Форум",
      "Рецепти",
      "Статті",
      "Модератори",
      ADMIN_PANEL_LABEL,
    ],
    mobileTitle: "Працює як responsive web app і PWA",
    mobileBody:
      "Перший екран після входу дає три дії: додати їжу, випити воду, запитати companion. Без інструкцій.",
    learningTitle: "Полезно знати",
    learningTopics: ["сон", "стрес", "магній", "цукор", "ЖКТ", "вода"],
    finalTitle: "Ціль продукту проста",
    finalBody:
      "Користувач має відчувати не складну програму, а живого помічника, який допомагає ставати кращим кожного дня.",
  },
  pl: {
    eyebrow: AI_WELLNESS_ECOSYSTEM,
    brandTitle: BRAND_NAME,
    headline: {
      prefix: "Twój AI companion dla",
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
      "Żywy AI companion do jedzenia, wody, leków, progresu i łagodnej motywacji. Nie tylko śledzi dane, ale prowadzi dzień razem z Tobą.",
    primary: "Zacznij za darmo",
    secondary: "Zobacz companion",
    telegramCta: "Połącz Telegram",
    navOverview: "Przegląd produktu",
    socialProof: "10 000+ użytkowników buduje nawyki z companion",
    proof: [AI_COMPANION_LABEL, "pamięć", PROACTIVE_NUDGES_LABEL, "Telegram obok"],
    presencePills: [BREATHING_PILL, EYE_TRACKING_PILL, MOOD_SHIFT_PILL, DAILY_MEMORY_PILL],
    sceneCards: [
      {
        title: "Poranny fokus",
        body: "Woda, białko i tabletka o 09:00 są już w planie.",
        tone: "calm",
      },
      {
        title: "AI zauważył",
        body: "Wczoraj trudniej było wieczorem, więc dziś podpowiedź przyjdzie wcześniej.",
        tone: "coach",
      },
      {
        title: TELEGRAM_RETENTION_LABEL,
        body: "Szybki log wody lub leków bez otwierania aplikacji.",
        tone: "warm",
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
      name: "Diana",
      title: "Diana jest obok",
      body: "Zostało dziś 600 kcal. Dodałabym wodę i lekką kolację z białkiem.",
      mood: "żywa reakcja",
      xps: "+25 XP za serię",
    },
    quickActions: ["Zdjęcie", "Kod kreskowy", "Powtórz wczoraj", "Ręczny wpis"],
    featureRail: [
      { title: FOOD_SCANNER_TITLE, body: "Zdjęcie posiłku i szybka analiza" },
      { title: HYDRATION_TRACKER_TITLE, body: "Woda bez ręcznego chaosu" },
      { title: CALORIE_MACRO_TITLE, body: "Kalorie, białko, tłuszcz, węgle" },
      { title: AI_COACHING_TITLE, body: "Podpowiedzi pod Twój dzień" },
      { title: PROGRESS_INSIGHTS_TITLE, body: "Zmiany bez suchej statystyki" },
      { title: SMART_REMINDERS_TITLE, body: "Woda, jedzenie, leki i nawyki" },
    ],
    sectionEyebrow: "W 5 sekund wiadomo, co zrobić",
    ecosystemTitle: "Nie kalkulator, tylko companion-platforma",
    ecosystemBody:
      "Smart Nutrition łączy dietetykę, gamification, analytics, wodę, progres i community w jeden spokojny codzienny rytm.",
    ecosystem: [
      {
        title: AI_COMPANION_LABEL,
        body: "Patrzy za kursorem, reaguje na akcje, cieszy się z osiągnięć i ostrzega bez presji.",
      },
      {
        title: "Jedzenie bez tarcia",
        body: "Wyszukiwarka, kod kreskowy, zdjęcie, szablony, powtórka wczoraj i osobisty katalog.",
      },
      {
        title: "Żywa motywacja",
        body: "Serie, XP, poziomy, osiągnięcia, day-off i łagodne zadania, które nie psują nastroju.",
      },
      {
        title: COMMUNITY_FOOD_HUB_TITLE,
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
      ADMIN_PANEL_LABEL,
    ],
    mobileTitle: "Działa jako responsive web app i PWA",
    mobileBody:
      "Pierwszy ekran po wejściu daje trzy akcje: dodaj jedzenie, wypij wodę, zapytaj companion. Bez instrukcji.",
    learningTitle: "Warto wiedzieć",
    learningTopics: ["sen", "stres", "magnez", "cukier", "jelita", "woda"],
    finalTitle: "Cel produktu jest prosty",
    finalBody:
      "Użytkownik ma czuć nie złożoną aplikację, tylko żywego pomocnika, który pomaga stawać się lepszym każdego dnia.",
  },
  en: {
    eyebrow: AI_WELLNESS_ECOSYSTEM,
    brandTitle: BRAND_NAME,
    headline: {
      prefix: "Your AI companion for a",
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
      "A living AI companion for food, water, medication, progress, and gentle motivation. It does not just track data; it moves through the day with you.",
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
      name: "Diana",
      title: "Diana is here",
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
  mobilePanelBg: isDarkMode ? GLASS_WHITE_08 : "rgba(255,255,255,0.7)",
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
  analyticsCardBg: isDarkMode ? GLASS_WHITE_08 : "rgba(255,255,255,0.7)",
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
        position: { xs: "relative", md: "absolute" },
        zIndex: 2,
        right: { md: 0 },
        bottom: { md: 0 },
        minHeight: { xs: 320, sm: 500, md: 600 },
        width: { xs: "100%", md: "64%" },
        mt: { xs: 1, md: 0 },
        display: { xs: "none", sm: "grid" },
        placeItems: "center",
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
          width: { sm: 460, md: 690 },
          height: { sm: 460, md: 690 },
          borderRadius: "50%",
          right: { sm: 8, md: 44 },
          top: { sm: -16, md: -18 },
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
        component={motion.div}
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.72, ease: "easeOut" }}
        sx={{
          position: "relative",
          zIndex: 2,
          display: "grid",
          placeItems: "center",
          width: { sm: 300, md: 390 },
          height: { sm: 390, md: 500 },
          mt: { sm: 1, md: 2 },
        }}
      >
        <Box
          aria-hidden
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
            },
          }}
        />
        <Box
          aria-hidden
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
            width: card.id === "coach" ? { sm: 220, md: 250 } : { sm: 180, md: 210 },
            p: { sm: 1.25, md: 1.45 },
            borderRadius: 1,
            border: isDarkMode
              ? "1px solid rgba(255,255,255,0.16)"
              : "1px solid rgba(255,255,255,0.72)",
            bgcolor: isDarkMode ? "rgba(2,6,23,0.58)" : "rgba(255,255,255,0.42)",
            color: isDarkMode ? "#ffffff" : "#102a43",
            backdropFilter: "blur(18px)",
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
        minHeight: { xs: "100svh", md: "100svh" },
        maxHeight: { md: 840 },
        overflow: "hidden",
        borderRadius: { xs: 0, md: 1 },
        px: { xs: 2, sm: 3, md: 5 },
        pt: { xs: 11, md: 12 },
        pb: { xs: 3, md: 4 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        color: scene.heroText,
        background: scene.heroBackground,
        border: `1px solid ${scene.featureRailBorder}`,
        boxShadow: "var(--sn-shadow-strong)",
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
        maxWidth: { xs: 980, md: 760 },
        pt: { xs: 1, md: 2 },
        pb: { md: 3 },
      }}
    >
      <Chip
        label={copy.eyebrow}
        sx={{
          alignSelf: "flex-start",
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
          fontSize: { xs: 42, sm: 68, md: 76, lg: 82 },
          lineHeight: 0.98,
          fontWeight: 900,
          letterSpacing: 0,
          maxWidth: 760,
          textShadow: scene.titleShadow,
          "@media (min-width: 900px) and (max-height: 760px)": {
            fontSize: 62,
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
          fontSize: { xs: 23, md: 32 },
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
        display: { xs: "none", md: "grid" },
        "@media (max-height: 760px)": {
          display: "none",
        },
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        alignItems: "stretch",
        width: "100%",
        p: 1,
        borderRadius: 1,
        border: `1px solid ${scene.featureRailBorder}`,
        backgroundColor: scene.featureRailBg,
        backdropFilter: "blur(18px)",
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
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
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
            sm: "repeat(2, minmax(0, 1fr))",
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
      alignItems={{ xs: "flex-start", md: "center" }}
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
      }}
    >
      <Hero copy={copy} isDarkMode={isDarkMode} />
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
    </Stack>
  );
};

export default LandingPage;
