import { lazy, Suspense } from "react";
import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LoadingSkeleton, PageShell } from "@shared/ui";
import { useLanguage } from "@shared/language";
import type { AppLanguage } from "@shared/types/i18n";

const CompanionShopCard = lazy(() => import("@features/profile/CompanionShopCard"));

const copyByLanguage: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    back: string;
  }
> = {
  uk: {
    title: "Магазин помічника",
    subtitle:
      "Окремий простір для образів, скинів і стилю помічника. Вибір синхронізується через cloud і не створює другого помічника.",
    back: "Назад до помічника",
  },
  pl: {
    title: "Sklep asystenta",
    subtitle:
      "Osobna przestrzeń na wygląd, skórki i styl asystenta. Wybór synchronizuje się przez cloud i nie tworzy drugiego asystenta.",
    back: "Wróć do asystenta",
  },
  en: {
    title: "Assistant shop",
    subtitle:
      "A dedicated space for assistant looks, skins, and style. Selection syncs through cloud and never creates a second assistant.",
    back: "Back to assistant",
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

const CompanionShopPage = () => {
  const { language } = useLanguage();
  const copy = getCopy(language);

  return (
    <PageShell
      title={copy.title}
      subtitle={copy.subtitle}
      maxWidth={1480}
      action={
        <Button
          component={RouterLink}
          to="/coach"
          variant="outlined"
          startIcon={<ArrowLeft size={18} />}
        >
          {copy.back}
        </Button>
      }
    >
      <Suspense fallback={<LoadingSkeleton cards={4} bodyRows={3} />}>
        <CompanionShopCard />
      </Suspense>
    </PageShell>
  );
};

export default CompanionShopPage;
