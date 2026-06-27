import { useEffect, useState } from "react";
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
  type AssistantAvatarMood,
} from "../shared/components/AssistantAvatar";
import type { AssistantCompanionKind } from "@domain/profile/types";
import { useLanguage } from "../shared/language";
import { useAppColorMode } from "../shared/theme/colorMode";

type LandingLanguage = "uk" | "pl" | "en";

const landingCopy = {
  uk: {
    eyebrow: "AI wellness ecosystem",
    brandTitle: "Smart Nutrition",
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
    proof: ["AI companion", "пам'ять", "proactive nudges", "Telegram поруч"],
    presencePills: ["breathing", "eye tracking", "mood shift", "daily memory"],
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
        title: "Telegram retention",
        body: "Швидкий лог води або ліків без відкриття застосунку.",
        tone: "warm",
      },
    ],
    heroStats: [
      {
        label: "Калорії",
        value: "1 420 / 2 050",
        progress: 69,
        color: "#0f766e",
      },
      { label: "Вода", value: "1.5 / 2.2 л", progress: 68, color: "#0891b2" },
      { label: "Білок", value: "96 / 120 г", progress: 80, color: "#2563eb" },
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
      { title: "AI food scanner", body: "Фото їжі і швидкий аналіз" },
      { title: "Hydration tracker", body: "Вода без ручного хаосу" },
      { title: "Calorie & macro", body: "Калорії, білок, жири, вуглеводи" },
      { title: "AI coaching", body: "Підказки під твій день" },
      { title: "Progress insights", body: "Зміни без сухої статистики" },
      { title: "Smart reminders", body: "Вода, їжа, ліки і звички" },
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
        title: "Community food hub",
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
      "Admin panel",
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
    eyebrow: "AI wellness ecosystem",
    brandTitle: "Smart Nutrition",
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
    proof: ["AI companion", "pamięć", "proactive nudges", "Telegram obok"],
    presencePills: ["breathing", "eye tracking", "mood shift", "daily memory"],
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
        title: "Telegram retention",
        body: "Szybki log wody lub leków bez otwierania aplikacji.",
        tone: "warm",
      },
    ],
    heroStats: [
      {
        label: "Kalorie",
        value: "1 420 / 2 050",
        progress: 69,
        color: "#0f766e",
      },
      { label: "Woda", value: "1.5 / 2.2 l", progress: 68, color: "#0891b2" },
      { label: "Białko", value: "96 / 120 g", progress: 80, color: "#2563eb" },
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
      { title: "AI food scanner", body: "Zdjęcie posiłku i szybka analiza" },
      { title: "Hydration tracker", body: "Woda bez ręcznego chaosu" },
      { title: "Calorie & macro", body: "Kalorie, białko, tłuszcz, węgle" },
      { title: "AI coaching", body: "Podpowiedzi pod Twój dzień" },
      { title: "Progress insights", body: "Zmiany bez suchej statystyki" },
      { title: "Smart reminders", body: "Woda, jedzenie, leki i nawyki" },
    ],
    sectionEyebrow: "W 5 sekund wiadomo, co zrobić",
    ecosystemTitle: "Nie kalkulator, tylko companion-platforma",
    ecosystemBody:
      "Smart Nutrition łączy dietetykę, gamification, analytics, wodę, progres i community w jeden spokojny codzienny rytm.",
    ecosystem: [
      {
        title: "AI companion",
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
        title: "Community food hub",
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
      "Admin panel",
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
    eyebrow: "AI wellness ecosystem",
    brandTitle: "Smart Nutrition",
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
    proof: ["AI companion", "memory", "proactive nudges", "Telegram nearby"],
    presencePills: ["breathing", "eye tracking", "mood shift", "daily memory"],
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
        title: "Telegram retention",
        body: "Quick water or medication logging without opening the app.",
        tone: "warm",
      },
    ],
    heroStats: [
      {
        label: "Calories",
        value: "1 420 / 2 050",
        progress: 69,
        color: "#0f766e",
      },
      { label: "Water", value: "1.5 / 2.2 l", progress: 68, color: "#0891b2" },
      { label: "Protein", value: "96 / 120 g", progress: 80, color: "#2563eb" },
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
      { title: "AI food scanner", body: "Food photo and quick analysis" },
      { title: "Hydration tracker", body: "Water without manual chaos" },
      { title: "Calorie & macro", body: "Calories, protein, fats, carbs" },
      { title: "AI coaching", body: "Guidance for your day" },
      { title: "Progress insights", body: "Changes without dry stats" },
      { title: "Smart reminders", body: "Water, meals, medication, habits" },
    ],
    sectionEyebrow: "Clear next actions in 5 seconds",
    ecosystemTitle: "Not a calculator, a companion platform",
    ecosystemBody:
      "Smart Nutrition connects nutrition, gamification, analytics, hydration, progress, and community into one calm daily flow.",
    ecosystem: [
      {
        title: "AI companion",
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
        title: "Community food hub",
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
      "Admin panel",
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

const getLandingScene = (isDarkMode: boolean) => ({
  heroBackground: isDarkMode
    ? "radial-gradient(circle at 76% 30%, rgba(163,230,53,0.22), transparent 28%), radial-gradient(circle at 86% 68%, rgba(20,184,166,0.18), transparent 32%), linear-gradient(135deg, #020617 0%, #061321 42%, #071a16 100%)"
    : "radial-gradient(circle at 78% 24%, rgba(255,255,255,0.9), transparent 22%), radial-gradient(circle at 86% 72%, rgba(14,165,233,0.2), transparent 34%), linear-gradient(135deg, #f8fffb 0%, #effdfa 38%, #e7f5ff 100%)",
  heroOverlay: isDarkMode
    ? "linear-gradient(90deg, rgba(2,6,23,0.9) 0%, rgba(7,17,31,0.7) 42%, rgba(2,6,23,0.16) 100%), linear-gradient(180deg, rgba(7,17,31,0.68) 0%, rgba(7,17,31,0.32) 56%, rgba(20,184,166,0.12) 100%)"
    : "linear-gradient(90deg, rgba(248,255,251,0.94) 0%, rgba(236,253,245,0.82) 42%, rgba(240,249,255,0.3) 100%), linear-gradient(180deg, rgba(255,255,255,0.58) 0%, rgba(236,254,255,0.2) 54%, rgba(20,184,166,0.1) 100%)",
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
    ? "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)"
    : "linear-gradient(rgba(15,118,110,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.08) 1px, transparent 1px)",
  proofBorder: isDarkMode ? "rgba(255,255,255,0.24)" : "rgba(15,118,110,0.18)",
  proofColor: isDarkMode ? "rgba(255,255,255,0.88)" : "rgba(15,23,42,0.76)",
  proofBg: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.56)",
  mobilePanelBg: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)",
  mobilePanelBorder: isDarkMode
    ? "rgba(255,255,255,0.14)"
    : "rgba(20,184,166,0.16)",
  secondaryButtonColor: isDarkMode ? "#ffffff" : "#0f766e",
  secondaryButtonBorder: isDarkMode
    ? "rgba(255,255,255,0.32)"
    : "rgba(15,118,110,0.24)",
  secondaryButtonBg: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.72)",
  socialColor: isDarkMode ? "rgba(255,255,255,0.76)" : "rgba(15,23,42,0.7)",
  sceneBackdrop: isDarkMode
    ? "linear-gradient(135deg, rgba(240,253,244,0.2), rgba(20,184,166,0.16) 48%, rgba(132,204,22,0.18))"
    : "linear-gradient(135deg, rgba(255,255,255,0.58), rgba(186,230,253,0.24) 46%, rgba(187,247,208,0.34))",
  sceneBorder: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(20,184,166,0.18)",
  avatarStageBg: isDarkMode
    ? "radial-gradient(circle at 50% 40%, rgba(236,254,255,0.74), rgba(20,184,166,0.16) 52%, rgba(2,6,23,0.18) 100%)"
    : "radial-gradient(circle at 50% 38%, rgba(255,255,255,0.95), rgba(204,251,241,0.54) 54%, rgba(186,230,253,0.3) 100%)",
  avatarStageShadow: isDarkMode
    ? "0 34px 120px rgba(20,184,166,0.28), 0 0 80px rgba(132,204,22,0.12), inset 0 1px 0 rgba(255,255,255,0.56)"
    : "0 34px 120px rgba(14,165,233,0.22), 0 0 90px rgba(34,197,94,0.14), inset 0 1px 0 rgba(255,255,255,0.86)",
  presenceBg: isDarkMode ? "rgba(15,23,42,0.78)" : "rgba(255,255,255,0.72)",
  presenceColor: isDarkMode ? "#ffffff" : "#0f766e",
  presenceBorder: isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(15,118,110,0.18)",
  sceneCardBg: isDarkMode ? "rgba(15,23,42,0.76)" : "rgba(255,255,255,0.78)",
  sceneCardText: isDarkMode ? "#f8fafc" : "#102a43",
  sceneCardMuted: isDarkMode ? "rgba(226,232,240,0.74)" : "#475569",
  featureRailBg: isDarkMode ? "rgba(2,6,23,0.28)" : "rgba(255,255,255,0.64)",
  featureRailBorder: isDarkMode ? "rgba(255,255,255,0.14)" : "rgba(15,118,110,0.16)",
  featureCardBg: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.58)",
  featureCardBorder: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(15,118,110,0.12)",
  featureIconBg: isDarkMode ? "rgba(163,230,53,0.1)" : "rgba(20,184,166,0.1)",
  featureIconColor: isDarkMode ? "#a3e635" : "#0f766e",
  featureIconShadow: isDarkMode
    ? "0 0 28px rgba(163,230,53,0.14)"
    : "0 0 28px rgba(20,184,166,0.12)",
  featureText: isDarkMode ? "#ffffff" : "#102a43",
  featureMuted: isDarkMode ? "rgba(255,255,255,0.62)" : "rgba(15,23,42,0.58)",
});

const quickActionIcons = [
  Camera,
  ScanBarcode,
  RotateCcw,
  MessageSquareText,
] as const;

const featureRailIcons = [
  Camera,
  Droplets,
  Utensils,
  Bot,
  HeartPulse,
  Bell,
] as const;

const companionKinds: AssistantCompanionKind[] = [
  "robot",
  "cat",
  "dog",
  "capybara",
  "dragon",
];

const moodCycle: AssistantAvatarMood[] = ["happy", "coach", "celebrate"];

const clamp = (value: number, min = -1, max = 1) =>
  Math.max(min, Math.min(max, value));

const usePointerLook = () => {
  const [lookOffset, setLookOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let animationFrame: number | undefined;

    const handlePointerMove = (event: PointerEvent) => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        setLookOffset({
          x: clamp((event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2),
          y: clamp((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2),
        });
      });
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });

    return () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return lookOffset;
};

const iconButtonSx = {
  minWidth: 44,
  width: 44,
  height: 44,
  px: 0,
  borderRadius: "50%",
  borderColor: "rgba(15,23,42,0.12)",
} as const;

const companionSceneIcons = [HeartPulse, Bell, Droplets] as const;

const sceneToneSx = {
  calm: {
    border: "rgba(132,204,22,0.34)",
    bg: "rgba(240,253,244,0.78)",
    icon: "#65a30d",
  },
  coach: {
    border: "rgba(45,212,191,0.34)",
    bg: "rgba(236,254,255,0.76)",
    icon: "#14b8a6",
  },
  warm: {
    border: "rgba(245,158,11,0.32)",
    bg: "rgba(255,251,235,0.76)",
    icon: "#d97706",
  },
} as const;

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
  copy,
  isDarkMode,
}: {
  copy: LandingCopy;
  isDarkMode: boolean;
}) => {
  const scene = getLandingScene(isDarkMode);
  const lookOffset = usePointerLook();
  const [moodIndex, setMoodIndex] = useState(0);
  const [companionIndex, setCompanionIndex] = useState(0);
  const mood = moodCycle[moodIndex] ?? "happy";
  const companion = companionKinds[companionIndex] ?? "robot";

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setMoodIndex((current) => (current + 1) % moodCycle.length);
      setCompanionIndex((current) => (current + 1) % companionKinds.length);
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Box
      id="ai-overview"
      sx={{
        position: { xs: "relative", md: "absolute" },
        zIndex: 2,
        right: { md: 0 },
        bottom: { md: 0 },
        minHeight: { xs: 320, sm: 430, md: 548 },
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
          inset: { xs: "10% 0 4%", md: "4% 6% 2%" },
          borderRadius: 1,
          background: scene.sceneBackdrop,
          border: `1px solid ${scene.sceneBorder}`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.38)",
          transform: "skewY(-1.2deg)",
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
          width: { xs: 190, sm: 280, md: 360 },
          height: { xs: 190, sm: 280, md: 360 },
          borderRadius: "50%",
          background: scene.avatarStageBg,
          border: "1px solid rgba(94,234,212,0.26)",
          boxShadow: scene.avatarStageShadow,
          backdropFilter: "blur(18px)",
        }}
      >
        <Box
          aria-hidden
          component={motion.div}
          animate={{ scale: [0.98, 1.06, 0.98], opacity: [0.42, 0.2, 0.42] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            inset: { xs: 20, sm: 30 },
            borderRadius: "50%",
            border: "1px solid rgba(20,184,166,0.46)",
          }}
        />
        <AssistantAvatar
          name={copy.mascot.name}
          variant={companion}
          mood={mood}
          lookOffset={lookOffset}
          active
          size={136}
        />
        <Chip
          label={copy.mascot.mood}
          sx={{
            position: "absolute",
            bottom: { xs: 24, sm: 36 },
            background: "linear-gradient(135deg, #0f766e, #65a30d)",
            color: "white",
            fontWeight: 900,
            boxShadow: "var(--sn-glow)",
          }}
        />
      </Box>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        justifyContent="center"
        sx={{ position: "absolute", zIndex: 3, bottom: { xs: 8, md: 22 } }}
      >
        {copy.presencePills.map((pill) => (
          <Chip
            key={pill}
            label={pill}
            size="small"
            sx={{
              bgcolor: scene.presenceBg,
              color: scene.presenceColor,
              border: `1px solid ${scene.presenceBorder}`,
              backdropFilter: "blur(10px)",
            }}
          />
        ))}
      </Stack>

      {copy.sceneCards.map((card, index) => {
        const Icon = companionSceneIcons[index] ?? Sparkles;
        const tone = sceneToneSx[card.tone];
        const placement =
          index === 0
            ? {
              left: { xs: 0, md: 56 },
                top: { xs: 0, md: 46 },
              }
            : index === 1
              ? {
                  right: { xs: 0, md: 36 },
                  top: { xs: 128, sm: 78, md: 78 },
                }
              : {
                  left: { xs: 0, sm: 30, md: 120 },
                  bottom: { xs: 70, sm: 86, md: 74 },
                };

        return (
          <Paper
            key={card.title}
            component={motion.div}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: [0, -7, 0] }}
            transition={{
              opacity: { delay: 0.24 + index * 0.1, duration: 0.36 },
              y: {
                delay: index * 0.2,
                duration: 4 + index * 0.35,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            elevation={0}
            sx={{
              position: "absolute",
              display: { xs: "none", sm: "block" },
              zIndex: 4,
              width: { xs: 210, sm: 250, md: 282 },
              p: { xs: 1.3, sm: 1.6 },
              borderRadius: 1,
              border: `1px solid ${tone.border}`,
              bgcolor: isDarkMode ? scene.sceneCardBg : tone.bg,
              backdropFilter: "blur(14px)",
              boxShadow: "0 18px 56px rgba(15,23,42,0.18)",
              ...placement,
            }}
          >
            <Stack direction="row" spacing={1.1} alignItems="flex-start">
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  color: tone.icon,
                  bgcolor: "rgba(255,255,255,0.72)",
                  flexShrink: 0,
                }}
              >
                <Icon size={18} aria-hidden="true" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, color: scene.sceneCardText }}>
                  {card.title}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.4,
                    color: scene.sceneCardMuted,
                    lineHeight: 1.45,
                    fontSize: { xs: 13, sm: 14 },
                  }}
                >
                  {card.body}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        );
      })}
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
        minHeight: { xs: "calc(100svh - 132px)", md: "calc(100svh - 118px)" },
        maxHeight: { md: 720 },
        overflow: "hidden",
        borderRadius: 1,
        px: { xs: 2, sm: 3, md: 5 },
        py: { xs: 3, md: 4 },
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
          backdropFilter: "blur(14px)",
        }}
      />
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: 42, sm: 68, md: 82 },
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
          backdropFilter: "blur(14px)",
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
                border: "2px solid rgba(255,255,255,0.72)",
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

    <CompanionExperienceScene copy={copy} isDarkMode={isDarkMode} />

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
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
        const Icon = featureRailIcons[index] ?? Sparkles;

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
          const Icon = quickActionIcons[index] ?? Sparkles;

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
}: {
  copy: (typeof landingCopy)[LandingLanguage];
}) => (
  <Paper
    id="reminders"
    component="section"
    elevation={0}
    sx={{
      ...landingGlassPanelSx,
      p: { xs: 2.4, md: 3 },
      color: "white",
      background:
        "radial-gradient(circle at 88% 10%, rgba(132,204,22,0.22), transparent 28%), linear-gradient(135deg, #07111f 0%, #102a43 52%, #0f766e 100%)",
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
              border: "1px solid rgba(255,255,255,0.14)",
              bgcolor: "rgba(255,255,255,0.08)",
            }}
          >
            <Typography sx={{ color: "rgba(255,255,255,0.66)" }}>
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
          bgcolor: "rgba(20,184,166,0.14)",
          border: "1px solid rgba(94,234,212,0.22)",
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
          <Typography sx={{ color: "rgba(255,255,255,0.86)", lineHeight: 1.7 }}>
            {copy.progressAdvice}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  </Paper>
);

const MobileCommunityPanel = ({
  copy,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
}) => (
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
        bgcolor: "#0f172a",
        boxShadow: "0 30px 90px rgba(15,23,42,0.24)",
      }}
    >
      <Box
        sx={{
          minHeight: 610,
          borderRadius: 1,
          p: 2,
          bgcolor: "#f8fafc",
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
                bgcolor: "white",
                border: "1px solid rgba(15,23,42,0.08)",
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
  const copy = landingCopy[appLanguage];

  return (
    <Stack spacing={{ xs: 4, md: 5 }}>
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
        <AnalyticsPanel copy={copy} />
        <MobileCommunityPanel copy={copy} />
        <FinalCta copy={copy} />
      </Stack>
    </Stack>
  );
};

export default LandingPage;
