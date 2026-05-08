import { useState } from "react";
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

const learningCopy = {
  uk: {
    title: "Корисно знати",
    subtitle:
      "Короткі wellness-картки, міні-статті, інфографіка і AI пояснення без довгих лекцій.",
    aiLabel: "AI пояснення",
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
} as const;

export const LearningHubCard = () => {
  const { language } = useLanguage();
  const copy = learningCopy[language];
  const [topicIndex, setTopicIndex] = useState(0);
  const activeTopic = copy.topics[topicIndex] ?? copy.topics[0];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.5 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.9)",
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
          <Chip label={copy.readTime} color="primary" variant="outlined" />
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
              <Typography color="text.secondary">{activeTopic.insight}</Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  borderColor: "rgba(15, 118, 110, 0.18)",
                  backgroundColor: "rgba(240,253,250,0.7)",
                }}
              >
                <Typography sx={{ fontWeight: 900, mb: 0.5 }}>{copy.aiLabel}</Typography>
                <Typography color="text.secondary">{activeTopic.ai}</Typography>
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
              <Typography sx={{ fontWeight: 900 }}>{copy.infographic}</Typography>
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
