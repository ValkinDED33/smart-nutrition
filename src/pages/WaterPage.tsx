import { lazy, Suspense, useState } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import CountUp from "react-countup";
import { Droplets } from "lucide-react";
import type { AppDispatch, RootState } from "../app/store";
import { incrementWater } from "../features/water/waterSlice";
import { useLanguage } from "../shared/language";
import {
  buildLazyModuleRecoveryCopy,
  LazyModuleBoundary,
  LoadingSkeleton,
  PageShell,
  SectionCard,
  SectionTabs,
} from "@shared/ui";

const WaterTracker = lazy(() =>
  import("../features/water/WaterTracker").then((module) => ({
    default: module.WaterTracker,
  }))
);

const waterPageCopy = {
  uk: {
    title: "Вода",
    subtitle: "Норма, випито, залишок і швидке додавання без зайвих кроків.",
    consumed: "Випито",
    goal: "Норма",
    remaining: "Залишилось",
    addGlass: "Додати 250 мл",
    sections: {
      today: "Сьогодні",
      goal: "Ціль",
      history: "Історія",
      reminders: "Нагадування",
    },
  },
  pl: {
    title: "Woda",
    subtitle: "Norma, wypito, pozostało i szybkie dodawanie bez zbędnych kroków.",
    consumed: "Wypito",
    goal: "Norma",
    remaining: "Pozostało",
    addGlass: "Dodaj 250 ml",
    sections: {
      today: "Dzisiaj",
      goal: "Cel",
      history: "Historia",
      reminders: "Przypomnienia",
    },
  },
  en: {
    title: "Water",
    subtitle: "Goal, consumed, remaining, and quick add without extra steps.",
    consumed: "Consumed",
    goal: "Goal",
    remaining: "Remaining",
    addGlass: "Add 250 ml",
    sections: {
      today: "Today",
      goal: "Goal",
      history: "History",
      reminders: "Reminders",
    },
  },
} as const;

type WaterSection = "today" | "goal" | "history" | "reminders";

const WaterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const water = useSelector((state: RootState) => state.water);
  const { appLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState<WaterSection>("today");
  const copy = waterPageCopy[appLanguage];
  const recoveryCopy = buildLazyModuleRecoveryCopy(
    appLanguage,
    copy.sections[activeSection]
  );
  const remainingMl = Math.max(water.dailyWaterGoal - water.consumedMl, 0);
  const addAmountMl = water.glassSizeMl || 250;
  const sections = [
    { id: "today", label: copy.sections.today },
    { id: "goal", label: copy.sections.goal },
    { id: "history", label: copy.sections.history },
    { id: "reminders", label: copy.sections.reminders },
  ];
  const tracker = (
    <LazyModuleBoundary
      errorTitle={recoveryCopy.errorTitle}
      errorBody={recoveryCopy.errorBody}
      reloadLabel={recoveryCopy.reloadLabel}
      resetKey={`water:${activeSection}`}
    >
      <Suspense fallback={<LoadingSkeleton titleRows={1} cards={3} chart bodyRows={3} />}>
        <WaterTracker />
      </Suspense>
    </LazyModuleBoundary>
  );

  return (
    <PageShell title={copy.title} subtitle={copy.subtitle}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, md: 3 },
          borderRadius: 1,
          color: "white",
          background:
            "linear-gradient(135deg, rgba(14,116,144,0.98) 0%, rgba(37,99,235,0.94) 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={0.8}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "rgba(255,255,255,0.16)",
                }}
              >
                <Droplets size={24} aria-hidden="true" />
              </Box>
              <Typography
                component="h2"
                variant="h4"
                sx={{ fontWeight: 900, fontSize: { xs: 34, md: 42 } }}
              >
                {copy.title}
              </Typography>
            </Stack>
            <Typography sx={{ maxWidth: 660, color: "rgba(255,255,255,0.82)" }}>
              {copy.subtitle}
            </Typography>
          </Stack>

          <Button
            variant="contained"
            onClick={() => dispatch(incrementWater(addAmountMl))}
            sx={{
              minHeight: 48,
              borderRadius: 999,
              px: 2.2,
              textTransform: "none",
              fontWeight: 900,
              color: "#0f172a",
              backgroundColor: "#ffffff",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.92)" },
            }}
          >
            +{addAmountMl} ml
          </Button>
        </Stack>
      </Paper>

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={(sectionId) => setActiveSection(sectionId as WaterSection)}
        ariaLabel="Water sections"
      />

      {activeSection === "today" ? (
        <SectionCard tone="info">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {[
              { label: copy.consumed, value: water.consumedMl },
              { label: copy.goal, value: water.dailyWaterGoal },
              { label: copy.remaining, value: remainingMl },
            ].map((item) => (
              <Paper
                key={item.label}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 1,
                  border: "1px solid var(--sn-border-soft)",
                  backgroundColor: "var(--sn-surface-elevated)",
                }}
              >
                <Typography color="text.secondary">{item.label}</Typography>
                <Typography component="p" variant="h5" sx={{ fontWeight: 900 }}>
                  <CountUp end={item.value} duration={0.65} /> ml
                </Typography>
              </Paper>
            ))}
          </Box>
        </SectionCard>
      ) : (
        tracker
      )}

      {activeSection === "today" ? tracker : null}
    </PageShell>
  );
};

export default WaterPage;
