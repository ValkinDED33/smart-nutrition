import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { selectMealTemplates, selectTodayMealItems } from "./selectors";
import type { MealTemplate, MealType } from "@domain/meal/types";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "@domain/products/productDisplay";
import { reorderItems } from "@integration/runtime/interaction";
import type { AppLanguage } from "@shared/types/i18n";
import {
  applyMealTemplateInCloud,
  deleteMealTemplateFromCloud,
  saveMealTemplateToCloud,
} from "./mealCloudSync";
import { createTemplateEntries } from "./mealSaveModel";
import { useMealActionFeedback } from "./useMealActionFeedback";

interface Props {
  mealType: MealType;
}

interface TemplateCardProps {
  appLanguage: AppLanguage;
  onApply: (id: string) => void;
  onRemove: (id: string) => void;
  isApplying?: boolean;
  isRemoving?: boolean;
  template: MealTemplate;
  t: (key: string) => string;
}

const TemplateCard = ({
  appLanguage,
  onApply,
  onRemove,
  isApplying = false,
  isRemoving = false,
  template,
  t,
}: TemplateCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ id: template.id });

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        opacity: isDragging ? 0.72 : 1,
        zIndex: isDragging ? 2 : 1,
      }}
    >
      <Card
        sx={{
          borderRadius: 1,
          border: isDragging
            ? "1px solid rgba(15, 118, 110, 0.55)"
            : "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "none",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        {...attributes}
        {...listeners}
      >
        <CardContent>
          <Stack spacing={1.2}>
            <Typography sx={{ fontWeight: 800 }}>{template.name}</Typography>
            <Typography color={TEMPLATE_TEXT_SECONDARY} variant="body2">
              {template.items
                .map(
                  (item) =>
                    `${getProductDisplayName(item.product, appLanguage)} ${item.quantity} ${item.product.unit}`
                )
                .join(", ")}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onApply(template.id)}
                disabled={isApplying}
              >
                {t("templates.apply")}
              </Button>
              <Button
                color="error"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRemove(template.id)}
                disabled={isRemoving}
              >
                {t("templates.remove")}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const moveId = (ids: string[], activeId: string, overId: string) => {
  const activeIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);

  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
    return ids;
  }

  return reorderItems(ids, activeIndex, overIndex);
};

const normalizeOrderIds = (ids: string[], templates: MealTemplate[]) => [
  ...ids.filter((id) => templates.some((template) => template.id === id)),
  ...templates
    .map((template) => template.id)
    .filter((id) => !ids.includes(id)),
];

const vaultCopy = {
  uk: {
    saving: "Зберігаю зміни шаблону в хмару...",
    savedTemplate: "Шаблон збережено і підтверджено хмарою.",
    appliedTemplate: "Шаблон застосовано до поточного дня і підтверджено хмарою.",
    deletedTemplate: "Шаблон видалено і підтверджено хмарою.",
    failedSaveTemplate: "Не вдалося зберегти шаблон.",
    failedApplyTemplate: "Не вдалося застосувати шаблон.",
    failedDeleteTemplate: "Не вдалося видалити шаблон.",
    retry: "Спробувати ще раз",
  },
  pl: {
    saving: "Zapisuję zmiany szablonu w chmurze...",
    savedTemplate: "Szablon zapisany i potwierdzony w chmurze.",
    appliedTemplate: "Szablon użyty w dzisiejszym dniu i potwierdzony w chmurze.",
    deletedTemplate: "Szablon usunięty i potwierdzony w chmurze.",
    failedSaveTemplate: "Nie udało się zapisać szablonu.",
    failedApplyTemplate: "Nie udało się użyć szablonu.",
    failedDeleteTemplate: "Nie udało się usunąć szablonu.",
    retry: "Spróbuj ponownie",
  },
  en: {
    saving: "Saving template changes to cloud...",
    savedTemplate: "Template saved and confirmed in the cloud.",
    appliedTemplate: "Template applied to today and confirmed in the cloud.",
    deletedTemplate: "Template deleted and confirmed in the cloud.",
    failedSaveTemplate: "Could not save the template.",
    failedApplyTemplate: "Could not apply the template.",
    failedDeleteTemplate: "Could not delete the template.",
    retry: "Try again",
  },
} as const;

type VaultCopy = (typeof vaultCopy)[keyof typeof vaultCopy];

const TEMPLATE_TEXT_SECONDARY = "text.secondary";
const SAVE_TEMPLATE_ACTION_ID = "save-template";

const getVaultCopy = (language: AppLanguage): VaultCopy => {
  switch (language) {
    case "uk":
      return vaultCopy.uk;
    case "pl":
      return vaultCopy.pl;
    case "en":
    default:
      return vaultCopy.en;
  }
};

export const TemplateVault = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectTodayMealItems);
  const meal = useSelector((state: RootState) => state.meal);
  const templates = useSelector(selectMealTemplates);
  const { appLanguage, t } = useLanguage();
  const copy = getVaultCopy(appLanguage);
  const [templateName, setTemplateName] = useState("");
  const [orderedTemplateIds, setOrderedTemplateIds] = useState<string[]>([]);
  const {
    notice,
    runMealAction,
    retryMealAction,
    clearFeedback,
    isSavingAction,
  } = useMealActionFeedback({
    saving: {
      add: copy.saving,
      edit: copy.saving,
      delete: copy.saving,
      repeat: copy.saving,
      saveTemplate: copy.saving,
      applyTemplate: copy.saving,
      saveProduct: copy.saving,
    },
    confirmed: {
      add: copy.appliedTemplate,
      edit: copy.savedTemplate,
      delete: copy.deletedTemplate,
      repeat: copy.appliedTemplate,
      saveTemplate: copy.savedTemplate,
      applyTemplate: copy.appliedTemplate,
      saveProduct: copy.savedTemplate,
    },
    failed: {
      add: copy.failedApplyTemplate,
      edit: copy.failedSaveTemplate,
      delete: copy.failedDeleteTemplate,
      repeat: copy.failedApplyTemplate,
      saveTemplate: copy.failedSaveTemplate,
      applyTemplate: copy.failedApplyTemplate,
      saveProduct: copy.failedSaveTemplate,
    },
    retry: copy.retry,
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const currentMealEntries = useMemo(
    () => items.filter((item) => item.mealType === mealType).slice(0, 8),
    [items, mealType]
  );
  const currentMealTemplates = useMemo(
    () => templates.filter((template) => template.mealType === mealType),
    [mealType, templates]
  );
  const orderedCurrentMealTemplates = useMemo(() => {
    const templateById = new Map(
      currentMealTemplates.map((template) => [template.id, template])
    );
    const orderedTemplates = orderedTemplateIds
      .map((id) => templateById.get(id))
      .filter((template): template is MealTemplate => Boolean(template));
    const missingTemplates = currentMealTemplates.filter(
      (template) => !orderedTemplateIds.includes(template.id)
    );

    return [...orderedTemplates, ...missingTemplates];
  }, [currentMealTemplates, orderedTemplateIds]);

  const handleSaveTemplate = async () => {
    const normalizedName = templateName.trim();
    if (!normalizedName || currentMealEntries.length === 0) return;

    const template: MealTemplate = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `template-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: normalizedName,
      mealType,
      items: currentMealEntries.map((item) => ({
          product: item.product,
          quantity: item.quantity,
        })),
      createdAt: new Date().toISOString(),
    };

    const saved = await runMealAction({
      actionId: SAVE_TEMPLATE_ACTION_ID,
      kind: "saveTemplate",
      action: () => saveMealTemplateToCloud(dispatch, meal, template),
    });

    if (saved) {
      setTemplateName("");
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    await runMealAction({
      actionId: `apply-${templateId}`,
      kind: "applyTemplate",
      action: () =>
        applyMealTemplateInCloud(
          dispatch,
          meal,
          templateId,
          createTemplateEntries(template)
        ),
    });
  };

  const handleDeleteTemplate = async (templateId: string) => {
    await runMealAction({
      actionId: `delete-${templateId}`,
      kind: "delete",
      action: () => deleteMealTemplateFromCloud(dispatch, meal, templateId),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : "";

    if (!overId || activeId === overId) {
      return;
    }

    setOrderedTemplateIds((currentIds) =>
      moveId(normalizeOrderIds(currentIds, currentMealTemplates), activeId, overId)
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
          {t("templates.title")}
        </Typography>
        <Typography color={TEMPLATE_TEXT_SECONDARY}>{t("templates.subtitle")}</Typography>

        {notice ? (
          <Alert
            severity={notice.severity}
            action={
              notice.retryable ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => void retryMealAction()}
                  sx={{ textTransform: "none", fontWeight: 800 }}
                >
                  {copy.retry}
                </Button>
              ) : undefined
            }
            onClose={clearFeedback}
          >
            {notice.text}
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            label={t("templates.placeholder")}
          />
          <Button
            variant="contained"
            onClick={() => void handleSaveTemplate()}
            disabled={
              !templateName.trim() ||
              currentMealEntries.length === 0 ||
              isSavingAction(SAVE_TEMPLATE_ACTION_ID)
            }
          >
            {isSavingAction(SAVE_TEMPLATE_ACTION_ID) ? copy.saving : t("templates.save")}
          </Button>
        </Stack>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedCurrentMealTemplates.map((template) => template.id)}>
            <Stack spacing={1.5}>
              {currentMealTemplates.length === 0 ? (
                <Typography color={TEMPLATE_TEXT_SECONDARY}>{t("templates.empty")}</Typography>
              ) : (
                orderedCurrentMealTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    appLanguage={appLanguage}
                    isApplying={isSavingAction(`apply-${template.id}`)}
                    isRemoving={isSavingAction(`delete-${template.id}`)}
                    onApply={handleApplyTemplate}
                    onRemove={handleDeleteTemplate}
                    template={template}
                    t={t}
                  />
                ))
              )}
            </Stack>
          </SortableContext>
        </DndContext>
      </Stack>
    </Paper>
  );
};
