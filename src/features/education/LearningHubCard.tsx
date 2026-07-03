import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { useSwipeable } from "react-swipeable";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useLanguage } from "../../shared/language";
import type { RootState } from "../../app/store";
import { buildAssistantPersonalizationPlan } from "@core/assistant/personalizationPlan";
import type { AssistantDietFriction } from "@domain/profile/types";

const learningCopy = {
  uk: {
    title: "Корисно знати",
    subtitle:
      "Короткі wellness-картки, міні-статті, інфографіка і AI пояснення без довгих лекцій.",
    aiLabel: "AI пояснення",
    personalFocus: "Персональна тема",
    infographic: "Інфографіка",
    readTime: "2 хв",
    topics: [
      {
        key: "sleep",
        title: "Сон",
        insight: "Недосип підсилює голод і тягу до швидких вуглеводів.",
        ai: "Почніть з одного стабільного часу підйому. Так тілу легше вирівняти апетит.",
        tags: ["режим", "відновлення"],
        score: 82,
      },
      {
        key: "cortisol",
        title: "Кортизол",
        insight: "Хронічний стрес може маскувати прогрес через затримку води.",
        ai: "Якщо вага стрибнула за ніч, спочатку перевірте сон, сіль і стрес, а не урізайте їжу.",
        tags: ["стрес", "вага"],
        score: 68,
      },
      {
        key: "stress",
        title: "Стрес",
        insight: "Стрес часто б'є не по мотивації, а по автоматичних харчових рішеннях.",
        ai: "Заздалегідь збережіть один простий прийом їжі, який легко повторити в складний день.",
        tags: ["звички", "план"],
        score: 74,
      },
      {
        key: "magnesium",
        title: "Магній",
        insight: "Магній пов'язаний з м'язовим тонусом, сном і нервовою системою.",
        ai: "Додавайте продукти з магнієм поступово: крупи, бобові, насіння або зелень.",
        tags: ["мікроелементи", "сон"],
        score: 63,
      },
      {
        key: "sugar",
        title: "Цукор",
        insight: "Цукор легше контролювати, коли в прийомі їжі є білок і клітковина.",
        ai: "Не забороняйте солодке різко. Спершу додайте ситну основу до дня.",
        tags: ["апетит", "баланс"],
        score: 79,
      },
      {
        key: "gut",
        title: "ЖКТ",
        insight: "Регулярність, вода і клітковина часто важливіші за складні правила.",
        ai: "Збільшуйте клітковину повільно, щоб травлення встигало адаптуватися.",
        tags: ["клітковина", "вода"],
        score: 71,
      },
      {
        key: "hormones",
        title: "Гормони",
        insight: "Вага може змінюватися через цикл, сон, стрес і сіль.",
        ai: "Дивіться на тренд за 2-4 тижні, а не на одну цифру зранку.",
        tags: ["тренд", "аналіз"],
        score: 76,
      },
      {
        key: "vitamins",
        title: "Вітаміни",
        insight: "Різноманітність у тарілці допомагає закрити мікронутрієнти без хаосу.",
        ai: "Оберіть правило кольорів: два різні овочі або фрукти щодня.",
        tags: ["мікро", "тарілка"],
        score: 66,
      },
      {
        key: "water",
        title: "Вода",
        insight: "Спрага іноді відчувається як втома або зайвий голод.",
        ai: "Поставте перший стакан поруч з ранковою рутиною, а не покладайтеся на пам'ять.",
        tags: ["гідратація", "енергія"],
        score: 88,
      },
      {
        key: "weight-loss",
        title: "Похудення",
        insight: "Стійкий дефіцит краще працює, коли білок, сон і вода не провалюються.",
        ai: "Якщо стало важко, не зменшуйте план одразу. Перевірте ситість і темп.",
        tags: ["дефіцит", "білок"],
        score: 81,
      },
    ],
  },
  pl: {
    title: "Warto wiedzieć",
    subtitle:
      "Krótkie karty wellness, mini artykuły, infografiki i wyjaśnienia AI bez długich wykładów.",
    aiLabel: "Wyjaśnienie AI",
    personalFocus: "Temat osobisty",
    infographic: "Infografika",
    readTime: "2 min",
    topics: [
      {
        key: "sleep",
        title: "Sen",
        insight: "Niedobór snu wzmacnia głód i ochotę na szybkie węglowodany.",
        ai: "Zacznij od jednej stałej godziny pobudki. Ciału łatwiej wtedy regulować apetyt.",
        tags: ["rytm", "regeneracja"],
        score: 82,
      },
      {
        key: "cortisol",
        title: "Kortyzol",
        insight: "Przewlekły stres może maskować progres przez zatrzymanie wody.",
        ai: "Jeśli waga skoczyła przez noc, sprawdź sen, sól i stres zanim obetniesz jedzenie.",
        tags: ["stres", "waga"],
        score: 68,
      },
      {
        key: "stress",
        title: "Stres",
        insight: "Stres często uderza nie w motywację, tylko w automatyczne decyzje żywieniowe.",
        ai: "Zapisz wcześniej jeden prosty posiłek, który da się powtórzyć w trudny dzień.",
        tags: ["nawyki", "plan"],
        score: 74,
      },
      {
        key: "magnesium",
        title: "Magnez",
        insight: "Magnez łączy się z napięciem mięśni, snem i układem nerwowym.",
        ai: "Dodawaj źródła magnezu stopniowo: kasze, strączki, nasiona albo zieleninę.",
        tags: ["mikro", "sen"],
        score: 63,
      },
      {
        key: "sugar",
        title: "Cukier",
        insight: "Cukier łatwiej kontrolować, gdy w posiłku jest białko i błonnik.",
        ai: "Nie zakazuj słodyczy nagle. Najpierw dodaj sycącą bazę dnia.",
        tags: ["apetyt", "balans"],
        score: 79,
      },
      {
        key: "gut",
        title: "Jelita",
        insight: "Regularność, woda i błonnik często znaczą więcej niż skomplikowane reguły.",
        ai: "Zwiększaj błonnik powoli, żeby trawienie zdążyło się dostosować.",
        tags: ["błonnik", "woda"],
        score: 71,
      },
      {
        key: "hormones",
        title: "Hormony",
        insight: "Waga może się zmieniać przez cykl, sen, stres i sól.",
        ai: "Patrz na trend z 2-4 tygodni, nie na jedną poranną liczbę.",
        tags: ["trend", "analiza"],
        score: 76,
      },
      {
        key: "vitamins",
        title: "Witaminy",
        insight: "Różnorodność na talerzu pomaga domknąć mikroelementy bez chaosu.",
        ai: "Użyj reguły kolorów: dwa różne warzywa albo owoce dziennie.",
        tags: ["mikro", "talerz"],
        score: 66,
      },
      {
        key: "water",
        title: "Woda",
        insight: "Pragnienie bywa odczuwane jak zmęczenie albo dodatkowy głód.",
        ai: "Połącz pierwszą szklankę z poranną rutyną zamiast liczyć na pamięć.",
        tags: ["nawodnienie", "energia"],
        score: 88,
      },
      {
        key: "weight-loss",
        title: "Odchudzanie",
        insight: "Stały deficyt działa lepiej, gdy białko, sen i woda nie spadają.",
        ai: "Gdy robi się trudno, nie tnij planu od razu. Sprawdź sytość i tempo.",
        tags: ["deficyt", "białko"],
        score: 81,
      },
    ],
  },
  en: {
    title: "Useful to Know",
    subtitle:
      "Short wellness cards, mini articles, infographics, and AI explanations without long lectures.",
    aiLabel: "AI explanation",
    personalFocus: "Personal topic",
    infographic: "Infographic",
    readTime: "2 min",
    topics: [
      {
        key: "sleep",
        title: "Sleep",
        insight: "Lack of sleep increases hunger and cravings for quick carbs.",
        ai: "Start with one stable wake-up time. It helps the body regulate appetite more easily.",
        tags: ["rhythm", "recovery"],
        score: 82,
      },
      {
        key: "cortisol",
        title: "Cortisol",
        insight: "Chronic stress can hide progress through water retention.",
        ai: "If weight jumps overnight, check sleep, salt, and stress before cutting food.",
        tags: ["stress", "weight"],
        score: 68,
      },
      {
        key: "stress",
        title: "Stress",
        insight: "Stress often affects automatic food choices more than motivation.",
        ai: "Save one simple meal in advance that is easy to repeat on a hard day.",
        tags: ["habits", "plan"],
        score: 74,
      },
      {
        key: "magnesium",
        title: "Magnesium",
        insight: "Magnesium is linked to muscle tone, sleep, and the nervous system.",
        ai: "Add magnesium sources gradually: grains, legumes, seeds, or greens.",
        tags: ["micros", "sleep"],
        score: 63,
      },
      {
        key: "sugar",
        title: "Sugar",
        insight: "Sugar is easier to manage when meals include protein and fiber.",
        ai: "Do not ban sweets abruptly. First add a more filling base to the day.",
        tags: ["appetite", "balance"],
        score: 79,
      },
      {
        key: "gut",
        title: "Gut",
        insight: "Regularity, water, and fiber often matter more than complex rules.",
        ai: "Increase fiber slowly so digestion has time to adapt.",
        tags: ["fiber", "water"],
        score: 71,
      },
      {
        key: "hormones",
        title: "Hormones",
        insight: "Weight can change because of cycle, sleep, stress, and salt.",
        ai: "Look at a 2-4 week trend, not one morning number.",
        tags: ["trend", "analysis"],
        score: 76,
      },
      {
        key: "vitamins",
        title: "Vitamins",
        insight: "Plate variety helps cover micronutrients without chaos.",
        ai: "Use a color rule: two different vegetables or fruits every day.",
        tags: ["micros", "plate"],
        score: 66,
      },
      {
        key: "water",
        title: "Water",
        insight: "Thirst can sometimes feel like fatigue or extra hunger.",
        ai: "Attach the first glass to your morning routine instead of relying on memory.",
        tags: ["hydration", "energy"],
        score: 88,
      },
      {
        key: "weight-loss",
        title: "Weight loss",
        insight: "A steady deficit works better when protein, sleep, and water do not collapse.",
        ai: "If it gets hard, do not shrink the plan immediately. Check satiety and pace first.",
        tags: ["deficit", "protein"],
        score: 81,
      },
    ],
  },
} as const;

const topicByFriction: Record<AssistantDietFriction, string> = {
  unknown: "weight-loss",
  emotional_eating: "stress",
  chaotic_schedule: "water",
  evening_snacking: "sleep",
  low_energy: "water",
  social_pressure: "stress",
};

export const LearningHubCard = () => {
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { appLanguage } = useLanguage();
  const copy = learningCopy[appLanguage];
  const recommendedTopicKey = topicByFriction[assistant.onboarding.mainFriction];
  const recommendedTopicIndex = Math.max(
    copy.topics.findIndex((topic) => topic.key === recommendedTopicKey),
    0
  );
  const personalization = buildAssistantPersonalizationPlan(
    assistant.onboarding,
    appLanguage
  );
  const [topicIndex, setTopicIndex] = useState(recommendedTopicIndex);
  const activeTopic = copy.topics[topicIndex] ?? copy.topics[0];
  const articleMarkdown = useMemo(
    () =>
      [
        activeTopic.insight,
        "",
        `**${copy.aiLabel}:** ${activeTopic.ai}`,
        "",
        activeTopic.tags.map((tag) => `- ${tag}`).join("\n"),
      ].join("\n"),
    [activeTopic.ai, activeTopic.insight, activeTopic.tags, copy.aiLabel]
  );
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () =>
      setTopicIndex((current) => Math.min(current + 1, copy.topics.length - 1)),
    onSwipedRight: () => setTopicIndex((current) => Math.max(current - 1, 0)),
    trackMouse: true,
  });

  return (
    <Paper
      {...swipeHandlers}
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-elevated)",
      }}
    >
      <Stack spacing={1.8}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.4}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              label={`${copy.personalFocus}: ${personalization.frictionLabel}`}
              color="primary"
              variant="outlined"
            />
            <Chip label={copy.readTime} color="primary" variant="outlined" />
          </Stack>
        </Stack>

        <Tabs
          value={topicIndex}
          onChange={(_, value: number) => setTopicIndex(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          {copy.topics.map((topic, index) => (
            <Tab key={topic.key} value={index} label={topic.title} />
          ))}
        </Tabs>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
            gap: 1.5,
          }}
        >
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
            <Stack spacing={1.2}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {activeTopic.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Stack>
              <Typography component="h3" variant="h5" sx={{ fontWeight: 900 }}>
                {activeTopic.title}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  borderColor: "rgba(15, 118, 110, 0.18)",
                  backgroundColor: "rgba(240,253,250,0.7)",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    p: ({ children }) => (
                      <Typography color="text.secondary" sx={{ mb: 0.8, lineHeight: 1.65 }}>
                        {children}
                      </Typography>
                    ),
                    strong: ({ children }) => (
                      <Typography component="span" sx={{ fontWeight: 900, color: "#0f766e" }}>
                        {children}
                      </Typography>
                    ),
                    ul: ({ children }) => (
                      <Box component="ul" sx={{ my: 0, pl: 2.3 }}>
                        {children}
                      </Box>
                    ),
                    li: ({ children }) => (
                      <Typography component="li" color="text.secondary">
                        {children}
                      </Typography>
                    ),
                  }}
                >
                  {articleMarkdown}
                </ReactMarkdown>
              </Paper>
            </Stack>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
              background:
                "linear-gradient(135deg, rgba(239,246,255,0.92) 0%, rgba(240,253,250,0.92) 100%)",
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  aria-hidden="true"
                  sx={{
                    position: "relative",
                    width: 72,
                    height: 52,
                    overflow: "hidden",
                    "@keyframes wellnessPulseRing": {
                      "0%, 100%": {
                        opacity: 0.38,
                        transform: "translate(-50%, -50%) scale(0.82)",
                      },
                      "50%": {
                        opacity: 1,
                        transform: "translate(-50%, -50%) scale(1.18)",
                      },
                    },
                    "@keyframes wellnessPulseCore": {
                      "0%, 100%": {
                        transform: "translate(-50%, -50%) scale(0.92)",
                      },
                      "50%": {
                        transform: "translate(-50%, -50%) scale(1.04)",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: "3px solid #0f766e",
                      animation: "wellnessPulseRing 3s ease-in-out infinite",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: "#65a30d",
                      opacity: 0.92,
                      animation: "wellnessPulseCore 3s ease-in-out infinite",
                    }}
                  />
                </Box>
                <Typography sx={{ fontWeight: 900 }}>{copy.infographic}</Typography>
              </Stack>
              {[100, activeTopic.score, Math.max(activeTopic.score - 18, 24)].map(
                (value, index) => (
                  <Stack key={`${activeTopic.key}-${index}`} spacing={0.6}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">
                        {index === 0
                          ? activeTopic.title
                          : activeTopic.tags[index - 1] ?? activeTopic.title}
                      </Typography>
                      <Typography sx={{ fontWeight: 800 }}>{value}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={value}
                      sx={{
                        height: 10,
                        borderRadius: 999,
                        bgcolor: "rgba(15,23,42,0.08)",
                      }}
                    />
                  </Stack>
                )
              )}
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Paper>
  );
};
