import { useEffect, useState } from "react";
import { TypeAnimation } from "react-type-animation";
import {
  Box,
  Button,
  Chip,
  Divider,
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

type LandingLanguage = "uk" | "pl";

const landingCopy = {
  uk: {
    eyebrow: "AI wellness ecosystem",
    title: "AI-помічник харчування і здоров'я",
    subtitle:
      "Слідкуйте за їжею, водою, звичками і прогресом разом із живим AI-компаньйоном, який пояснює день простою мовою.",
    primary: "Почати безкоштовно",
    secondary: "Спробувати AI",
    navOverview: "Огляд продукту",
    proof: ["AI-компаньйон", "Вода і білок", "Community", "PWA"],
    heroStats: [
      { label: "Калорії", value: "1 420 / 2 050", progress: 69, color: "#0f766e" },
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
    communityItems: ["Друзі", "Форум", "Рецепти", "Статті", "Модератори", "Admin panel"],
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
    title: "AI asystent żywienia i zdrowia",
    subtitle:
      "Śledź jedzenie, wodę, nawyki i progres razem z żywym AI companionem, który tłumaczy dzień prostym językiem.",
    primary: "Zacznij za darmo",
    secondary: "Wypróbuj AI",
    navOverview: "Przegląd produktu",
    proof: ["AI pupil", "Woda i białko", "Community", "PWA"],
    heroStats: [
      { label: "Kalorie", value: "1 420 / 2 050", progress: 69, color: "#0f766e" },
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
    communityItems: ["Znajomi", "Forum", "Przepisy", "Artykuły", "Moderatorzy", "Admin panel"],
    mobileTitle: "Działa jako responsive web app i PWA",
    mobileBody:
      "Pierwszy ekran po wejściu daje trzy akcje: dodaj jedzenie, wypij wodę, zapytaj companion. Bez instrukcji.",
    learningTitle: "Warto wiedzieć",
    learningTopics: ["sen", "stres", "magnez", "cukier", "jelita", "woda"],
    finalTitle: "Cel produktu jest prosty",
    finalBody:
      "Użytkownik ma czuć nie złożoną aplikację, tylko żywego pomocnika, który pomaga stawać się lepszym każdego dnia.",
  },
} as const;

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

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

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

const HeroDashboard = ({
  copy,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
}) => (
  <Paper
    elevation={0}
    sx={{
      width: { xs: "100%", sm: 420 },
      p: 2,
      borderRadius: 1,
      border: "1px solid rgba(15,23,42,0.08)",
      bgcolor: "rgba(255,255,255,0.86)",
      backdropFilter: "blur(18px)",
      boxShadow: "0 24px 70px rgba(15,23,42,0.16)",
    }}
  >
    <Stack spacing={1.6}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 900 }}>
            Smart Nutrition
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 900 }}>{copy.navOverview}</Typography>
        </Box>
        <Chip label="AI online" color="success" variant="outlined" />
      </Stack>
      <Divider />
      {copy.heroStats.map((metric) => (
        <Box key={metric.label}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={{ fontWeight: 900 }}>{metric.label}</Typography>
            <Typography sx={{ color: metric.color, fontWeight: 900 }}>{metric.value}</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={metric.progress}
            sx={{
              mt: 0.8,
              height: 10,
              borderRadius: 999,
              bgcolor: "rgba(15,23,42,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: metric.color },
            }}
          />
        </Box>
      ))}
      <Box
        sx={{
          p: 1.4,
          borderRadius: 1,
          color: "#083344",
          bgcolor: "#ecfeff",
          border: "1px solid rgba(8,145,178,0.18)",
        }}
      >
        <Typography sx={{ fontWeight: 900 }}>{copy.mascot.title}</Typography>
        <Typography sx={{ mt: 0.4, lineHeight: 1.55 }}>{copy.mascot.body}</Typography>
      </Box>
    </Stack>
  </Paper>
);

const LandingMascot = ({
  copy,
}: {
  copy: (typeof landingCopy)[LandingLanguage];
}) => {
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
    <Paper
      id="ai-overview"
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid rgba(255,255,255,0.42)",
        bgcolor: "rgba(15,23,42,0.84)",
        color: "white",
        backdropFilter: "blur(18px)",
        boxShadow: "0 28px 70px rgba(15,23,42,0.28)",
        width: { xs: "100%", sm: 340 },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <AssistantAvatar
          name={copy.mascot.name}
          variant={companion}
          mood={mood}
          lookOffset={lookOffset}
          active
          size={86}
        />
        <Stack spacing={0.8} sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 22 }}>{copy.mascot.name}</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>{copy.mascot.body}</Typography>
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              label={copy.mascot.mood}
              sx={{ color: "white", borderColor: "rgba(255,255,255,0.26)" }}
              variant="outlined"
            />
            <Chip size="small" label={copy.mascot.xps} color="success" />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};

const Hero = ({ copy }: { copy: (typeof landingCopy)[LandingLanguage] }) => (
  <Box
    component="section"
    sx={{
      position: "relative",
      minHeight: { xs: 720, md: 650 },
      overflow: "hidden",
      borderRadius: 1,
      px: { xs: 2, sm: 3, md: 5 },
      py: { xs: 4, md: 5 },
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      alignItems: "center",
      background:
        "linear-gradient(135deg, #ecfeff 0%, #f0fdf4 42%, #fff7ed 100%)",
      border: "1px solid rgba(15,23,42,0.08)",
    }}
  >
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(120deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.68) 44%, rgba(255,255,255,0.18) 100%)",
      }}
    />
    <Stack
      spacing={2.3}
      sx={{
        position: "relative",
        zIndex: 2,
        width: { xs: "100%", md: "58%" },
        maxWidth: 760,
      }}
    >
      <Chip
        label={copy.eyebrow}
        sx={{ alignSelf: "flex-start", bgcolor: "#0f766e", color: "white" }}
      />
      <Typography
        component="h1"
        sx={{
          fontSize: { xs: 42, sm: 58, md: 76 },
          lineHeight: 0.98,
          fontWeight: 900,
          letterSpacing: 0,
          color: "#102a43",
          maxWidth: 760,
        }}
      >
        <TypeAnimation
          key={copy.title}
          sequence={[copy.title]}
          speed={62}
          cursor={false}
        />
      </Typography>
      <Typography
        sx={{
          maxWidth: 660,
          color: "#334155",
          fontSize: { xs: 17, md: 20 },
          lineHeight: 1.65,
          fontWeight: 600,
        }}
      >
        {copy.subtitle}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {copy.proof.map((item) => (
          <Chip
            key={item}
            label={item}
            variant="outlined"
            sx={{
              borderColor: "rgba(15,118,110,0.24)",
              color: "#0f766e",
              bgcolor: "rgba(255,255,255,0.68)",
            }}
          />
        ))}
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4}>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          size="large"
          sx={{ px: 3.2, py: 1.4 }}
        >
          {copy.primary}
        </Button>
        <Button
          component="a"
          href="#ai-overview"
          variant="outlined"
          size="large"
          sx={{ px: 3.2, py: 1.4, bgcolor: "rgba(255,255,255,0.72)" }}
        >
          {copy.secondary}
        </Button>
      </Stack>
    </Stack>

    <Stack
      spacing={2}
      alignItems="flex-end"
      sx={{
        position: { xs: "relative", md: "absolute" },
        zIndex: 1,
        right: { xs: "auto", md: 38 },
        bottom: { xs: "auto", md: 42 },
        mt: { xs: 4, md: 0 },
        ml: { xs: 0, md: 4 },
        width: { xs: "100%", md: 470 },
      }}
    >
      <HeroDashboard copy={copy} />
      <LandingMascot copy={copy} />
    </Stack>
  </Box>
);

const QuickFoodPanel = ({ copy }: { copy: (typeof landingCopy)[LandingLanguage] }) => (
  <Box
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
        sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 } }}
      >
        {copy.foodTitle}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 650, lineHeight: 1.75 }}>
        {copy.foodBody}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {copy.quickActions.map((action) => (
          <Button key={action} variant="outlined" sx={iconButtonSx} aria-label={action}>
            {action[0]}
          </Button>
        ))}
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
            p: 2,
            minHeight: 186,
            borderRadius: 1,
            border: "1px solid rgba(15,23,42,0.08)",
            bgcolor: "rgba(255,255,255,0.9)",
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
            <Typography sx={{ fontWeight: 900, fontSize: 20 }}>{food.title}</Typography>
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

const EcosystemGrid = ({ copy }: { copy: (typeof landingCopy)[LandingLanguage] }) => (
  <Box component="section">
    <Stack spacing={1.2} sx={{ mb: 2 }}>
      <Typography
        component="h2"
        variant="h3"
        sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 } }}
      >
        {copy.ecosystemTitle}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 850, lineHeight: 1.75 }}>
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
            p: 2.4,
            minHeight: 190,
            borderRadius: 1,
            border: "1px solid rgba(15,23,42,0.08)",
            bgcolor: "rgba(255,255,255,0.9)",
          }}
        >
          <Stack spacing={1.2}>
            <Chip
              label={`0${index + 1}`}
              sx={{
                width: 54,
                bgcolor: index % 2 === 0 ? "rgba(15,118,110,0.1)" : "rgba(37,99,235,0.1)",
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

const AnalyticsPanel = ({ copy }: { copy: (typeof landingCopy)[LandingLanguage] }) => (
  <Paper
    component="section"
    elevation={0}
    sx={{
      p: { xs: 2.4, md: 3 },
      borderRadius: 1,
      border: "1px solid rgba(15,23,42,0.08)",
      color: "white",
      bgcolor: "#102a43",
      overflow: "hidden",
    }}
  >
    <Stack spacing={2.5}>
      <Typography
        component="h2"
        variant="h3"
        sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 } }}
      >
        {copy.analyticsTitle}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, 1fr)" },
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
            <Typography sx={{ color: "rgba(255,255,255,0.66)" }}>{item.label}</Typography>
            <Typography sx={{ mt: 0.5, fontSize: 28, fontWeight: 900 }}>{item.value}</Typography>
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
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
          <AssistantAvatar name={copy.mascot.name} variant="robot" mood="coach" active />
          <Typography sx={{ color: "rgba(255,255,255,0.86)", lineHeight: 1.7 }}>
            {copy.progressAdvice}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  </Paper>
);

const MobileCommunityPanel = ({ copy }: { copy: (typeof landingCopy)[LandingLanguage] }) => (
  <Box
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
        sx={{ fontWeight: 900, fontSize: { xs: 34, md: 46 } }}
      >
        {copy.mobileTitle}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 680, lineHeight: 1.75 }}>
        {copy.mobileBody}
      </Typography>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 1,
          border: "1px solid rgba(15,23,42,0.08)",
          bgcolor: "rgba(255,255,255,0.9)",
        }}
      >
        <Typography sx={{ fontWeight: 900, mb: 1 }}>{copy.communityTitle}</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {copy.communityItems.map((item) => (
            <Chip key={item} label={item} variant="outlined" />
          ))}
        </Stack>
      </Paper>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 1,
          border: "1px solid rgba(15,23,42,0.08)",
          bgcolor: "rgba(255,255,255,0.9)",
        }}
      >
        <Typography sx={{ fontWeight: 900, mb: 1 }}>{copy.learningTitle}</Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {copy.learningTopics.map((topic) => (
            <Chip key={topic} label={topic} color="primary" variant="outlined" />
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
          borderRadius: 6,
          p: 2,
          bgcolor: "#f8fafc",
          overflow: "hidden",
        }}
      >
        <Stack spacing={1.4}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AssistantAvatar name={copy.mascot.name} variant="cat" mood="happy" size={54} active />
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
          <Button component={Link} to="/register" variant="contained" sx={{ mt: 1 }}>
            {copy.primary}
          </Button>
        </Stack>
      </Box>
    </Box>
  </Box>
);

const FinalCta = ({ copy }: { copy: (typeof landingCopy)[LandingLanguage] }) => (
  <Paper
    component="section"
    elevation={0}
    sx={{
      p: { xs: 2.5, md: 3.5 },
      borderRadius: 1,
      border: "1px solid rgba(15,23,42,0.08)",
      bgcolor: "rgba(255,255,255,0.9)",
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
        <Typography color="text.secondary" sx={{ maxWidth: 820, lineHeight: 1.7 }}>
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
  const { language } = useLanguage();
  const copy = landingCopy[language];

  return (
    <Stack spacing={{ xs: 4, md: 5 }}>
      <Hero copy={copy} />
      <EcosystemGrid copy={copy} />
      <QuickFoodPanel copy={copy} />
      <AnalyticsPanel copy={copy} />
      <MobileCommunityPanel copy={copy} />
      <FinalCta copy={copy} />
    </Stack>
  );
};

export default LandingPage;
