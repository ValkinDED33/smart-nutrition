import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Paper, Stack, Typography } from "@mui/material";
import type { RootState } from "../../app/store";
import { useLanguage } from "../../shared/i18n/I18nProvider";

export const SmartRecommendations = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const dailyCalories = useSelector(
    (state: RootState) => state.profile.dailyCalories
  );
  const items = useSelector((state: RootState) => state.meal.items);
  const { language } = useLanguage();

  const text =
    language === "pl"
      ? {
          title: "Rekomendacje dnia",
          empty: "Dodaj więcej wpisów, aby otrzymać spersonalizowane wskazówki.",
          lowProtein:
            "Białko jest jeszcze nisko. Warto dodać twaróg, jogurt grecki, jajka albo mięso.",
          highCalories:
            "Kalorie są już blisko limitu. Kolejny posiłek lepiej oprzeć na białku i warzywach.",
          balanced:
            "Bilans dnia wygląda stabilnie. Utrzymaj podobny rozkład posiłków do końca dnia.",
        }
      : {
          title: "Рекомендації на день",
          empty: "Додай більше записів, щоб отримати персональні підказки.",
          lowProtein:
            "Білка поки замало. Варто додати сир, грецький йогурт, яйця або м'ясо.",
          highCalories:
            "Калорії вже близько до ліміту. Наступний прийом їжі краще будувати на білку і овочах.",
          balanced:
            "Баланс дня виглядає стабільно. Тримай подібний розподіл прийомів їжі до кінця дня.",
        };

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTotals = items
    .filter((item) => item.eatenAt.slice(0, 10) === todayKey)
    .reduce(
      (accumulator, item) => {
        const factor = item.quantity / 100;
        accumulator.calories += item.product.nutrients.calories * factor;
        accumulator.protein += item.product.nutrients.protein * factor;
        return accumulator;
      },
      { calories: 0, protein: 0 }
    );

  const recommendations = useMemo(() => {
    if (!user) return [];

    const proteinTarget = user.weight * 1.6;
    const next: string[] = [];

    if (todayTotals.protein < proteinTarget * 0.6) {
      next.push(text.lowProtein);
    }

    if (todayTotals.calories > dailyCalories * 0.85) {
      next.push(text.highCalories);
    }

    if (next.length === 0) {
      next.push(text.balanced);
    }

    return next;
  }, [
    dailyCalories,
    text.balanced,
    text.highCalories,
    text.lowProtein,
    todayTotals.calories,
    todayTotals.protein,
    user,
  ]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={1.4}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {text.title}
        </Typography>
        {recommendations.length === 0 ? (
          <Typography color="text.secondary">{text.empty}</Typography>
        ) : (
          recommendations.map((recommendation) => (
            <Typography key={recommendation} color="text.secondary">
              - {recommendation}
            </Typography>
          ))
        )}
      </Stack>
    </Paper>
  );
};
