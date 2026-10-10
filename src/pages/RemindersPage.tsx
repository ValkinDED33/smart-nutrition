import { lazy, Suspense } from "react";
import { EcosystemPulse } from "@features/assistant/EcosystemPulse";
import { buildLazyModuleRecoveryCopy, LazyModuleBoundary, LoadingSkeleton, PageShell } from "@shared/ui";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

const ReminderManagementCard = lazy(
  () => import("../features/profile/ReminderManagementCard")
);

const copyByLanguage: Record<AppLanguage, { title: string; subtitle: string }> = {
  uk: {
    title: "Нагадування i задачi",
    subtitle:
      "Подiї, таблетки, вода, тиск, днi народження i Telegram в одному робочому центрi.",
  },
  pl: {
    title: "Przypomnienia i zadania",
    subtitle: "Wydarzenia, tabletki, woda, cisnienie, urodziny i Telegram w jednym centrum.",
  },
  en: {
    title: "Reminders and tasks",
    subtitle: "Events, pills, water, pressure, birthdays, and Telegram in one working center.",
  },
};

const getCopy = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return copyByLanguage.uk;
    case "pl":
      return copyByLanguage.pl;
    case "en":
    default:
      return copyByLanguage.en;
  }
};

const RemindersPage = () => {
  const { appLanguage } = useLanguage();
  const copy = getCopy(appLanguage);
  const recoveryCopy = buildLazyModuleRecoveryCopy(appLanguage, copy.title);

  return (
    <PageShell
      title={copy.title}
      subtitle={copy.subtitle}
      assistantHint={<EcosystemPulse focus="profile" />}
      compact
    >
      <LazyModuleBoundary
        errorTitle={recoveryCopy.errorTitle}
        errorBody={recoveryCopy.errorBody}
        reloadLabel={recoveryCopy.reloadLabel}
        resetKey="route:reminders"
      >
        <Suspense fallback={<LoadingSkeleton cards={3} bodyRows={3} />}>
          <ReminderManagementCard />
        </Suspense>
      </LazyModuleBoundary>
    </PageShell>
  );
};

export default RemindersPage;
