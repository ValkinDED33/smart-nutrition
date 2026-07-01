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
import { toast } from "sonner";
import { reorderItems } from "@integration/runtime/interaction";
import type { AppLanguage } from "@shared/types/i18n";
import {
  applyMealTemplateInCloud,
  deleteMealTemplateFromCloud,
  saveMealTemplateToCloud,
} from "./mealCloudSync";
import { createTemplateEntries } from "./mealSaveModel";

interface Props {
  mealType: MealType;
}

interface TemplateCardProps {
  appLanguage: AppLanguage;
  onApply: (id: string) => void;
  onRemove: (id: string) => void;
  template: MealTemplate;
  t: (key: string) => string;
}

const TemplateCard = ({
  appLanguage,
  onApply,
  onRemove,
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
            <Typography color="text.secondary" variant="body2">
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
              >
                {t("templates.apply")}
              </Button>
              <Button
                color="error"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onRemove(template.id)}
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

export const TemplateVault = ({ mealType }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectTodayMealItems);
  const meal = useSelector((state: RootState) => state.meal);
  const templates = useSelector(selectMealTemplates);
  const { appLanguage, t } = useLanguage();
  const [templateName, setTemplateName] = useState("");
  const [orderedTemplateIds, setOrderedTemplateIds] = useState<string[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);
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

  const runTemplateAction = async (actionId: string, action: () => Promise<unknown>) => {
    setSaveError(null);
    setSavingAction(actionId);

    try {
      await action();
      return true;
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save meal to cloud."
      );
      return false;
    } finally {
      setSavingAction(null);
    }
  };

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

    const saved = await runTemplateAction("save", () =>
      saveMealTemplateToCloud(dispatch, meal, template)
    );

    if (saved) {
      setTemplateName("");
      toast.success(t("templates.save"));
    }
  };

  const handleApplyTemplate = async (templateId: string) => {
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;

    const saved = await runTemplateAction(`apply-${templateId}`, () =>
      applyMealTemplateInCloud(
        dispatch,
        meal,
        templateId,
        createTemplateEntries(template)
      )
    );

    if (saved) {
      toast.success(t("templates.apply"));
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const saved = await runTemplateAction(`delete-${templateId}`, () =>
      deleteMealTemplateFromCloud(dispatch, meal, templateId)
    );

    if (saved) {
      toast.success(t("templates.remove"));
    }
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
        <Typography color="text.secondary">{t("templates.subtitle")}</Typography>

        {saveError ? (
          <Alert severity="error" onClose={() => setSaveError(null)}>
            {saveError}
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
              savingAction === "save"
            }
          >
            {t("templates.save")}
          </Button>
        </Stack>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedCurrentMealTemplates.map((template) => template.id)}>
            <Stack spacing={1.5}>
              {currentMealTemplates.length === 0 ? (
                <Typography color="text.secondary">{t("templates.empty")}</Typography>
              ) : (
                orderedCurrentMealTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    appLanguage={appLanguage}
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
