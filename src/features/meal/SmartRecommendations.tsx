import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RootState, AppDispatch } from "../../app/store";
import { selectMealItems } from "./selectors";
import { useLanguage } from "../../shared/language";
import { addDays, getLocalDateKey } from "../../shared/lib/date";
import { productCatalog } from "../../shared/lib/productCatalog";
import { recipes } from "../../shared/lib/recipes";
import {
  pickPreferredProteinProducts,
  productMatchesPreferences,
  recipeMatchesPreferences,
} from "../../shared/lib/preferences";
import { addMealEntries, addProduct } from "./mealSlice";
import type { MealEntry } from "../../shared/types/meal";
import type { Product } from "../../shared/types/product";
import { calculateMacroTargets } from "../../shared/lib/macroTargets";
import { buildDailyContext } from "../../shared/lib/dailyContext";

const recommendationCopy = {
  uk: {
    priority: "Пріоритет",
    onTrack: "У нормі",
    insight: "Підказка",
    todayFitTitle: "Сьогодні вам підійде",
    todayFitDetail: (meal: string) =>
      `Контекст дня підказує наступний слот: ${meal}. Рекомендації нижче враховують сьогодні, учора і тижневий ритм.`,
    recipePromptTitle: (calories: number) => `Хочете рецепт на ~${calories.toFixed(0)} ккал?`,
    recipePromptDetail: (title: string) =>
      `Під поточний зазор добре лягає рецепт: ${title}. Його можна додати одразу в щоденник.`,
    fallbackProteinFoods: "пісні білкові продукти",
    fallbackFiberFoods: "овочі та фрукти",
    proteinGapTitle: (gap: number) => `Бракує білка: ${gap.toFixed(0)} г`,
    proteinGapDetail: (foods: string) =>
      `Сьогодні білка поки замало. Додайте один цільовий прийом їжі або перекус уже зараз. Найкращі варіанти під ваші вподобання: ${foods}.`,
    fiberLowTitle: "Клітковини все ще мало",
    fiberLowDetail: (foods: string) =>
      `Овочів, фруктів і продуктів із вищим вмістом клітковини поки не вистачає. Корисні варіанти: ${foods}.`,
    cutCorrectionTitle: (surplus: number) => `Корекція на сушці: +${surplus.toFixed(0)} ккал`,
    cutCorrectionDetail:
      "Зробіть наступний прийом їжі легшим: нежирний білок, овочі та без зайвих калорійних додатків.",
    bulkPushTitle: (remaining: number) => `Для набору залишилось: ${remaining.toFixed(0)} ккал`,
    bulkPushDetail:
      "Сьогодні вам ще потрібно більше енергії. Додайте один щільний перекус із білком і вуглеводами до кінця дня.",
    driftTitle: (delta: number) => `Відхилення за 7 днів: ${Math.abs(delta).toFixed(0)} ккал`,
    driftAuto:
      "Автоматична адаптація вже ввімкнена, тож продовжуйте стабільно вести записи, а ціль підлаштується під тренд.",
    driftManual:
      "Ваш середній тижневий показник відхиляється від цілі. Варто або скоригувати калорійність, або точніше контролювати порції.",
    weakDataTitle: "Даних поки замало",
    weakDataDetail: (loggedDays: number) =>
      `Лише ${loggedDays} із останніх 7 днів мають записи про харчування. За стабільнішого трекінгу рекомендації стануть значно точнішими.`,
    incompleteDayTitle: "Сьогоднішній день ще неповний",
    incompleteDayDetail:
      "Сьогодні у вас поки замало записаних прийомів їжі. Додайте пропущені записи, перш ніж різко коригувати калорійність.",
    weeklyBalancedTitle: "Тижневий баланс виглядає стабільно",
    weeklyBalancedDetail:
      "Споживання тримається близько до цілі, а білок у здоровому діапазоні. Збережіть схожу структуру і сьогодні.",
    todayBalancedTitle: "Сьогодні все виглядає збалансовано",
    todayBalancedDetail:
      "Калорії та макроси поки виглядають рівно. Збережіть подібну якість і розмір порції в наступному прийомі їжі.",
    addAction: (quantity: number, unit: string, productName: string) =>
      `Додати ${quantity.toFixed(0)} ${unit === "piece" ? "шт." : unit === "ml" ? "мл" : "г"} ${productName}`,
    addRecipeAction: (title: string) => `Додати рецепт: ${title}`,
  },
  pl: {
    priority: "Priorytet",
    onTrack: "W normie",
    insight: "Wskazówka",
    todayFitTitle: "Dziś najlepiej pasuje",
    todayFitDetail: (meal: string) =>
      `Kontekst dnia wskazuje kolejny slot: ${meal}. Poniższe rekomendacje biorą pod uwagę dziś, wczoraj i rytm tygodnia.`,
    recipePromptTitle: (calories: number) => `Chcesz przepis na ~${calories.toFixed(0)} kcal?`,
    recipePromptDetail: (title: string) =>
      `Do obecnego zapasu dobrze pasuje przepis: ${title}. Możesz dodać go od razu do dziennika.`,
    fallbackProteinFoods: "chude źródła białka",
    fallbackFiberFoods: "warzywa i owoce",
    proteinGapTitle: (gap: number) => `Brakuje białka: ${gap.toFixed(0)} g`,
    proteinGapDetail: (foods: string) =>
      `Dziś masz jeszcze za mało białka. Dodaj jeden konkretny posiłek lub przekąskę już teraz. Najlepsze opcje pod Twoje preferencje: ${foods}.`,
    fiberLowTitle: "Błonnika nadal jest za mało",
    fiberLowDetail: (foods: string) =>
      `Wciąż brakuje warzyw, owoców i produktów z większą ilością błonnika. Pomocne opcje: ${foods}.`,
    cutCorrectionTitle: (surplus: number) => `Korekta na redukcji: +${surplus.toFixed(0)} kcal`,
    cutCorrectionDetail:
      "Kolejny posiłek utrzymaj lekki: chude białko, warzywa i bez dodatkowych kalorii.",
    bulkPushTitle: (remaining: number) => `Na masę zostało: ${remaining.toFixed(0)} kcal`,
    bulkPushDetail:
      "Dziś nadal potrzebujesz więcej energii. Dodaj jedną bardziej kaloryczną przekąskę z białkiem i węglowodanami przed końcem dnia.",
    driftTitle: (delta: number) => `Odchylenie z 7 dni: ${Math.abs(delta).toFixed(0)} kcal`,
    driftAuto:
      "Automatyczna adaptacja jest włączona, więc loguj regularnie i pozwól celowi reagować na trend.",
    driftManual:
      "Średnia tygodniowa odchyla się od celu. Warto skorygować kalorie albo dokładniej pilnować porcji.",
    weakDataTitle: "Danych nadal jest za mało",
    weakDataDetail: (loggedDays: number) =>
      `Tylko ${loggedDays} z ostatnich 7 dni ma wpisy żywieniowe. Przy bardziej regularnym śledzeniu rekomendacje będą znacznie trafniejsze.`,
    incompleteDayTitle: "Dzisiejszy dzień wygląda jeszcze niepełnie",
    incompleteDayDetail:
      "Masz dziś zapisanych tylko kilka posiłków. Uzupełnij brakujące wpisy, zanim zrobisz mocniejsze korekty kalorii.",
    weeklyBalancedTitle: "Bilans tygodnia wygląda stabilnie",
    weeklyBalancedDetail:
      "Spożycie trzyma się blisko celu, a białko jest w dobrym zakresie. Utrzymaj podobną strukturę także dziś.",
    todayBalancedTitle: "Dzisiejszy dzień wygląda dobrze",
    todayBalancedDetail:
      "Kalorie i makroskładniki wyglądają na razie stabilnie. Zachowaj podobną jakość i wielkość kolejnego posiłku.",
    addAction: (quantity: number, unit: string, productName: string) =>
      `Dodaj ${quantity.toFixed(0)} ${unit === "piece" ? "szt." : unit === "ml" ? "ml" : "g"} ${productName}`,
    addRecipeAction: (title: string) => `Dodaj przepis: ${title}`,
  },
  en: {
    priority: "Priority",
    onTrack: "On track",
    insight: "Insight",
    todayFitTitle: "Today fits",
    todayFitDetail: (meal: string) =>
      `The day context points to the next slot: ${meal}. These recommendations use today, yesterday, and the weekly rhythm.`,
    recipePromptTitle: (calories: number) => `Want a ~${calories.toFixed(0)} kcal recipe?`,
    recipePromptDetail: (title: string) =>
      `This recipe fits the current gap well: ${title}. You can add it straight to the diary.`,
    fallbackProteinFoods: "lean protein foods",
    fallbackFiberFoods: "vegetables and fruit",
    proteinGapTitle: (gap: number) => `Protein gap: ${gap.toFixed(0)} g`,
    proteinGapDetail: (foods: string) =>
      `Protein is still low today. Add one targeted meal or snack now. Best options for your preferences: ${foods}.`,
    fiberLowTitle: "Fiber is still low",
    fiberLowDetail: (foods: string) =>
      `Vegetables, fruit, and higher-fiber foods are still missing. Helpful options: ${foods}.`,
    cutCorrectionTitle: (surplus: number) => `Cutting adjustment: +${surplus.toFixed(0)} kcal`,
    cutCorrectionDetail:
      "Make the next meal lighter: lean protein, vegetables, and no heavy extras.",
    bulkPushTitle: (remaining: number) => `Bulking gap left: ${remaining.toFixed(0)} kcal`,
    bulkPushDetail:
      "You still need more energy today. Add one denser snack with protein and carbs before the day ends.",
    driftTitle: (delta: number) => `7-day drift: ${Math.abs(delta).toFixed(0)} kcal`,
    driftAuto:
      "Automatic adaptation is on, so keep logging consistently and let the target respond to the trend.",
    driftManual:
      "Your weekly average is drifting from target. Adjust calories or tighten portion tracking.",
    weakDataTitle: "Data is still light",
    weakDataDetail: (loggedDays: number) =>
      `Only ${loggedDays} of the last 7 days have food logs. Recommendations get sharper with steadier tracking.`,
    incompleteDayTitle: "Today is still incomplete",
    incompleteDayDetail:
      "You only have a few meal logs today. Fill the missing slots before making stronger calorie corrections.",
    weeklyBalancedTitle: "The weekly balance looks stable",
    weeklyBalancedDetail:
      "Intake is staying close to target and protein is in a healthy range. Keep a similar structure today.",
    todayBalancedTitle: "Today looks balanced",
    todayBalancedDetail:
      "Calories and macros look steady so far. Keep similar quality and portion size in the next meal.",
    addAction: (quantity: number, unit: string, productName: string) =>
      `Add ${quantity.toFixed(0)} ${unit === "piece" ? "pc." : unit === "ml" ? "ml" : "g"} ${productName}`,
    addRecipeAction: (title: string) => `Add recipe: ${title}`,
  },
} as const;

type RecommendationTone = "success" | "warning" | "info";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const createEntryId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `smart-rec-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const getActionQuantity = (product: Product | undefined, targetAmount: number, fallback: number) => {
  if (!product) {
    return undefined;
  }

  const normalizedTargetAmount =
    Number.isFinite(targetAmount) && targetAmount > 0 ? targetAmount : fallback;

  if (product.unit === "piece") {
    return clamp(Math.ceil(normalizedTargetAmount), 1, 4);
  }

  return clamp(Math.ceil(normalizedTargetAmount / 10) * 10, 80, 240);
};

export const SmartRecommendations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.profile);
  const water = useSelector((state: RootState) => state.water);
  const items = useSelector(selectMealItems);
  const { appLanguage, t } = useLanguage();
  const copy = recommendationCopy[appLanguage];
  const macroTargets = useMemo(
    () =>
      calculateMacroTargets({
        calories: profile.dailyCalories,
        weight: user?.weight ?? 0,
        goal: profile.goal,
        dietStyle: profile.dietStyle,
      }),
    [profile.dailyCalories, profile.dietStyle, profile.goal, user?.weight]
  );
  const dailyContext = useMemo(
    () =>
      buildDailyContext({
        items,
        dailyCalories: profile.dailyCalories,
        macroTargets,
        waterConsumedMl: water.consumedMl,
        waterTargetMl: water.dailyWaterGoal,
      }),
    [
      items,
      macroTargets,
      profile.dailyCalories,
      water.consumedMl,
      water.dailyWaterGoal,
    ]
  );
  const todayKey = getLocalDateKey(new Date());
  const todayTotals = dailyContext.today;
  const suggestedMealLabel = t(`mealType.${dailyContext.suggestedMealType}`);

  const recommendations = useMemo(() => {
    if (!user) return [];

    const proteinTarget = macroTargets.protein;
    const fiberTarget = 25;
    const dailyCalories = profile.dailyCalories;
    const weekKeys = Array.from({ length: 7 }, (_, index) =>
      getLocalDateKey(addDays(new Date(), -index))
    );
    const weeklyEntries = items.filter((item) => weekKeys.includes(getLocalDateKey(item.eatenAt)));
    const weekCalories =
      weeklyEntries.reduce(
        (sum, item) => sum + (item.product.nutrients.calories * item.quantity) / 100,
        0
      ) / 7;
    const preferences = {
      dietStyle: profile.dietStyle,
      allergies: profile.allergies,
      excludedIngredients: profile.excludedIngredients,
      adaptiveMode: profile.adaptiveMode,
    };
    const preferredProteinProducts = pickPreferredProteinProducts(productCatalog, preferences, 4);
    const proteinFoods = preferredProteinProducts.map((product) => product.name).join(", ");
    const fiberProducts = productCatalog
      .filter((product) => productMatchesPreferences(product, preferences))
      .filter((product) => product.nutrients.fiber >= 3)
      .sort((left, right) => right.nutrients.fiber - left.nutrients.fiber);
    const fiberFoods = fiberProducts
      .slice(0, 3)
      .map((product) => product.name)
      .join(", ");
    const todayEntries = items.filter((item) => getLocalDateKey(item.eatenAt) === todayKey);
    const loggedDays = weekKeys.filter((dayKey) =>
      items.some((item) => getLocalDateKey(item.eatenAt) === dayKey)
    ).length;
    const next: Array<{
      priority: number;
      tone: RecommendationTone;
      title: string;
      detail: string;
      actionLabel?: string;
      actionProduct?: Product;
      actionQuantity?: number;
      actionRecipe?: (typeof recipes)[number];
    }> = [];

    next.push({
      priority: 98,
      tone: dailyContext.nudgeTone === "direct" ? "warning" : "info",
      title: copy.todayFitTitle,
      detail: copy.todayFitDetail(suggestedMealLabel),
    });

    if (todayTotals.protein < proteinTarget * 0.75) {
      const gap = Math.max(proteinTarget - todayTotals.protein, 0);
      const primaryProteinProduct = preferredProteinProducts[0];
      const actionQuantity = getActionQuantity(
        primaryProteinProduct,
        primaryProteinProduct
          ? (gap / Math.max(primaryProteinProduct.nutrients.protein, 1)) * 100
          : 0,
        150
      );

      next.push({
        priority: 100,
        tone: "warning",
        title: copy.proteinGapTitle(gap),
        detail: copy.proteinGapDetail(proteinFoods || copy.fallbackProteinFoods),
        actionLabel:
          primaryProteinProduct && actionQuantity
            ? copy.addAction(actionQuantity, primaryProteinProduct.unit, primaryProteinProduct.name)
            : undefined,
        actionProduct: primaryProteinProduct,
        actionQuantity,
      });
    }

    if (todayTotals.fiber < fiberTarget * 0.7) {
      const fiberProduct = fiberProducts[0];
      const actionQuantity = getActionQuantity(
        fiberProduct,
        fiberProduct ? (Math.max(fiberTarget - todayTotals.fiber, 0) / Math.max(fiberProduct.nutrients.fiber, 1)) * 100 : 0,
        150
      );

      next.push({
        priority: 82,
        tone: "info",
        title: copy.fiberLowTitle,
        detail: copy.fiberLowDetail(fiberFoods || copy.fallbackFiberFoods),
        actionLabel:
          fiberProduct && actionQuantity
            ? copy.addAction(actionQuantity, fiberProduct.unit, fiberProduct.name)
            : undefined,
        actionProduct: fiberProduct,
        actionQuantity,
      });
    }

    const recipeTargetCalories =
      dailyContext.gaps.calories > 250
        ? clamp(dailyContext.gaps.calories, 320, 650)
        : 400;
    const recipeCandidate = recipes
      .filter((recipe) => recipeMatchesPreferences(recipe, preferences))
      .filter(
        (recipe) =>
          dailyContext.primaryFocus !== "calories_high" &&
          recipe.calories <= recipeTargetCalories + 140
      )
      .sort(
        (left, right) =>
          Math.abs(left.calories - recipeTargetCalories) -
          Math.abs(right.calories - recipeTargetCalories)
      )[0];

    if (recipeCandidate && dailyContext.gaps.calories >= 250) {
      next.push({
        priority: 88,
        tone: "info",
        title: copy.recipePromptTitle(recipeCandidate.calories),
        detail: copy.recipePromptDetail(recipeCandidate.title),
        actionLabel: copy.addRecipeAction(recipeCandidate.title),
        actionRecipe: recipeCandidate,
      });
    }

    if (profile.goal === "cut" && todayTotals.calories > dailyCalories + 150) {
      const leanProduct = preferredProteinProducts[0];

      next.push({
        priority: 95,
        tone: "warning",
        title: copy.cutCorrectionTitle(todayTotals.calories - dailyCalories),
        detail: copy.cutCorrectionDetail,
        actionLabel: leanProduct ? copy.addAction(120, leanProduct.unit, leanProduct.name) : undefined,
        actionProduct: leanProduct,
        actionQuantity: leanProduct ? 120 : undefined,
      });
    }

    if (profile.goal === "bulk" && todayTotals.calories < dailyCalories - 250) {
      const denseSnack = productCatalog
        .filter((product) => productMatchesPreferences(product, preferences))
        .sort(
          (left, right) =>
            right.nutrients.calories + right.nutrients.protein * 3 -
            (left.nutrients.calories + left.nutrients.protein * 3)
        )[0];
      const actionQuantity = getActionQuantity(
        denseSnack,
        denseSnack
          ? (Math.max(dailyCalories - todayTotals.calories, 0) / Math.max(denseSnack.nutrients.calories, 1)) *
              100
          : 0,
        120
      );

      next.push({
        priority: 95,
        tone: "warning",
        title: copy.bulkPushTitle(dailyCalories - todayTotals.calories),
        detail: copy.bulkPushDetail,
        actionLabel:
          denseSnack && actionQuantity
            ? copy.addAction(actionQuantity, denseSnack.unit, denseSnack.name)
            : undefined,
        actionProduct: denseSnack,
        actionQuantity,
      });
    }

    if (Math.abs(weekCalories - dailyCalories) > 180) {
      next.push({
        priority: 70,
        tone: "info",
        title: copy.driftTitle(weekCalories - dailyCalories),
        detail:
          profile.adaptiveMode === "automatic" ? copy.driftAuto : copy.driftManual,
      });
    }

    if (loggedDays < 4) {
      next.push({
        priority: 85,
        tone: "warning",
        title: copy.weakDataTitle,
        detail: copy.weakDataDetail(loggedDays),
      });
    }

    if (todayEntries.length <= 1) {
      next.push({
        priority: 75,
        tone: "info",
        title: copy.incompleteDayTitle,
        detail: copy.incompleteDayDetail,
      });
    }

    if (
      profile.goal === "maintain" &&
      loggedDays >= 4 &&
      Math.abs(weekCalories - dailyCalories) <= 120 &&
      todayTotals.protein >= proteinTarget * 0.8
    ) {
      next.push({
        priority: 20,
        tone: "success",
        title: copy.weeklyBalancedTitle,
        detail: copy.weeklyBalancedDetail,
      });
    }

    if (next.length === 0) {
      next.push({
        priority: 10,
        tone: "success",
        title: copy.todayBalancedTitle,
        detail: copy.todayBalancedDetail,
      });
    }

    return next.sort((left, right) => right.priority - left.priority).slice(0, 4);
  }, [
    copy,
    dailyContext,
    items,
    macroTargets.protein,
    profile.adaptiveMode,
    profile.allergies,
    profile.dailyCalories,
    profile.dietStyle,
    profile.excludedIngredients,
    profile.goal,
    todayKey,
    todayTotals.calories,
    todayTotals.fiber,
    todayTotals.protein,
    suggestedMealLabel,
    user,
  ]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={1.4}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("recommendations.title")}
        </Typography>
        {recommendations.length === 0 ? (
          <Typography color="text.secondary">{t("recommendations.empty")}</Typography>
        ) : (
          recommendations.map((recommendation) => (
            <Paper
              key={`${recommendation.title}-${recommendation.detail}`}
              variant="outlined"
              sx={{
                p: 1.6,
                borderRadius: 1,
                borderColor:
                  recommendation.tone === "warning"
                    ? "rgba(245, 158, 11, 0.35)"
                    : recommendation.tone === "success"
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(15, 23, 42, 0.08)",
                backgroundColor:
                  recommendation.tone === "warning"
                    ? "rgba(255, 251, 235, 0.72)"
                    : recommendation.tone === "success"
                      ? "rgba(240, 253, 244, 0.76)"
                      : "rgba(248,250,252,0.9)",
              }}
            >
              <Stack spacing={0.8}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography sx={{ fontWeight: 800 }}>{recommendation.title}</Typography>
                  <Chip
                    size="small"
                    label={
                      recommendation.tone === "warning"
                        ? copy.priority
                        : recommendation.tone === "success"
                          ? copy.onTrack
                          : copy.insight
                    }
                    color={
                      recommendation.tone === "warning"
                        ? "warning"
                        : recommendation.tone === "success"
                          ? "success"
                          : "default"
                    }
                  />
                </Stack>
                <Typography color="text.secondary">{recommendation.detail}</Typography>
                {recommendation.actionLabel &&
                  (recommendation.actionRecipe ||
                    (recommendation.actionProduct && recommendation.actionQuantity)) && (
                    <Button
                      variant="outlined"
                      sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                      onClick={() => {
                        if (recommendation.actionRecipe) {
                          const eatenAt = new Date().toISOString();
                          const entries: MealEntry[] =
                            recommendation.actionRecipe.ingredients.map((ingredient) => ({
                              id: createEntryId(),
                              product: ingredient.product,
                              quantity: ingredient.quantity,
                              mealType: recommendation.actionRecipe!.mealType,
                              eatenAt,
                              origin: "recipe",
                            }));

                          dispatch(addMealEntries(entries));
                          return;
                        }

                        dispatch(
                          addProduct({
                            product: recommendation.actionProduct!,
                            quantity: recommendation.actionQuantity!,
                            mealType: dailyContext.suggestedMealType,
                            origin: "manual",
                          })
                        );
                      }}
                    >
                      {recommendation.actionLabel}
                    </Button>
                  )}
              </Stack>
            </Paper>
          ))
        )}
      </Stack>
    </Paper>
  );
};
