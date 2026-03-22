import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch } from "../../app/store";
import { applyMealTemplate, deleteMealTemplate, saveMealTemplate } from "./mealSlice";
import { selectMealItems, selectMealTemplates } from "./selectors";
import type { MealType } from "../../shared/types/meal";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "../../shared/lib/productDisplay";

interface Props {
  mealType: MealType;
}

export const TemplateVault = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectMealItems);
  const templates = useSelector(selectMealTemplates);
  const { language } = useLanguage();
  const [templateName, setTemplateName] = useState("");

  const text =
    language === "pl"
      ? {
          title: "Szablony posiłków",
          subtitle:
            "Zapisz aktualny posiłek jako szablon i odtwórz go jednym kliknięciem.",
          placeholder: "Np. śniadanie białkowe",
          save: "Zapisz szablon",
          apply: "Powtórz",
          remove: "Usuń",
          empty: "Brak zapisanych szablonów dla tego posiłku.",
        }
      : {
          title: "Шаблони прийомів їжі",
          subtitle:
            "Збережи поточний прийом їжі як шаблон і повторюй його одним натисканням.",
          placeholder: "Наприклад: білковий сніданок",
          save: "Зберегти шаблон",
          apply: "Повторити",
          remove: "Видалити",
          empty: "Для цього прийому їжі шаблонів поки немає.",
        };

  const currentMealEntries = useMemo(
    () => items.filter((item) => item.mealType === mealType).slice(0, 8),
    [items, mealType]
  );
  const currentMealTemplates = templates.filter(
    (template) => template.mealType === mealType
  );

  const handleSaveTemplate = () => {
    const normalizedName = templateName.trim();
    if (!normalizedName || currentMealEntries.length === 0) return;

    dispatch(
      saveMealTemplate({
        name: normalizedName,
        mealType,
        items: currentMealEntries.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
      })
    );
    setTemplateName("");
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 5,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.subtitle}</Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            label={text.placeholder}
          />
          <Button
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || currentMealEntries.length === 0}
          >
            {text.save}
          </Button>
        </Stack>

        <Stack spacing={1.5}>
          {currentMealTemplates.length === 0 ? (
            <Typography color="text.secondary">{text.empty}</Typography>
          ) : (
            currentMealTemplates.map((template) => (
              <Card
                key={template.id}
                sx={{
                  borderRadius: 4,
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  boxShadow: "none",
                }}
              >
                <CardContent>
                  <Stack spacing={1.2}>
                    <Typography sx={{ fontWeight: 800 }}>{template.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {template.items
                        .map(
                          (item) =>
                            `${getProductDisplayName(item.product, language)} ${item.quantity} ${item.product.unit}`
                        )
                        .join(", ")}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button onClick={() => dispatch(applyMealTemplate(template.id))}>
                        {text.apply}
                      </Button>
                      <Button
                        color="error"
                        onClick={() => dispatch(deleteMealTemplate(template.id))}
                      >
                        {text.remove}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
