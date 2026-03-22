import { useDispatch } from "react-redux";
import {
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { addMealEntries } from "./mealSlice";
import { recipes } from "../../shared/lib/recipes";
import type { MealEntry, MealType } from "../../shared/types/meal";
import type { AppDispatch } from "../../app/store";
import { useLanguage } from "../../shared/language";

interface Props {
  mealType: MealType;
}

const createEntryId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `recipe-meal-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const RecipeSection = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { language } = useLanguage();
  const text =
    language === "pl"
      ? {
          add: "Dodaj przepis do dziennika",
          title: "Przepisy fit",
          ingredients: "Składniki",
        }
      : {
          add: "Додати рецепт у щоденник",
          title: "Корисні рецепти",
          ingredients: "Інгредієнти",
        };

  const filteredRecipes = recipes.filter((recipe) => recipe.mealType === mealType);

  const handleAddRecipe = (recipeId: string) => {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;

    const eatenAt = new Date().toISOString();
    const entries: MealEntry[] = recipe.ingredients.map((ingredient) => ({
      id: createEntryId(),
      product: ingredient.product,
      quantity: ingredient.quantity,
      mealType: recipe.mealType,
      eatenAt,
      origin: "recipe",
    }));

    dispatch(addMealEntries(entries));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        {text.title}
      </Typography>
      {filteredRecipes.map((recipe) => (
        <Card
          key={recipe.id}
          sx={{
            borderRadius: 5,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "none",
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`${recipe.calories} kcal`} />
                <Chip label={`P ${recipe.protein.toFixed(1)} g`} />
                <Chip label={`F ${recipe.fat.toFixed(1)} g`} />
                <Chip label={`C ${recipe.carbs.toFixed(1)} g`} />
              </Stack>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {recipe.title}
              </Typography>
              <Typography color="text.secondary">{recipe.description}</Typography>
              <Typography variant="body2">
                {text.ingredients}:{" "}
                {recipe.ingredients
                  .map(
                    (ingredient) =>
                      `${ingredient.product.name} ${ingredient.quantity} ${ingredient.product.unit}`
                  )
                  .join(", ")}
              </Typography>
              <Button
                variant="contained"
                onClick={() => handleAddRecipe(recipe.id)}
                sx={{ alignSelf: "flex-start" }}
              >
                {text.add}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};
