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
import { selectMealTemplates, selectTodayMealItems } from "./selectors";
import type { MealTemplate, MealType } from "@domain/meal/types";
import { useLanguage } from "../../shared/language";
import { getProductDisplayName } from "@domain/products/productDisplay";
import { toast } from "sonner";
import { reorderItems } from "@integration/runtime/interaction";
import type { AppLanguage } from "@shared/types/i18n";

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
  const templates = useSelector(selectMealTemplates);
  const { appLanguage, t } = useLanguage();
  const [templateName, setTemplateName] = useState("");
  const [orderedTemplateIds, setOrderedTemplateIds] = useState<string[]>([]);
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
    toast.success(t("templates.save"));
  };

  const handleApplyTemplate = (templateId: string) => {
    dispatch(applyMealTemplate(templateId));
    toast.success(t("templates.apply"));
  };

  const handleDeleteTemplate = (templateId: string) => {
    dispatch(deleteMealTemplate(templateId));
    toast.success(t("templates.remove"));
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

        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField
            fullWidth
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            label={t("templates.placeholder")}
          />
          <Button
            variant="contained"
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || currentMealEntries.length === 0}
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
