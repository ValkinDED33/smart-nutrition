import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import {
  canPurchaseCompanionItem,
  companionShopCatalog,
  getEquippedCompanionItems,
  hasCompanionItem,
  isCompanionItemEquipped,
  type CompanionCatalogCategory,
  type CompanionCatalogItem,
  type CompanionCatalogLocale,
} from "../../companion";
import { CompanionAvatar as AssistantAvatar } from "@features/assistant-3d";
import { useLanguage } from "../../shared/language";
import { applyCompanionShopSelectionInCloud } from "../companion/companionCloudSync";

const shopCopy = {
  uk: {
    title: "Студія компаньйона",
    subtitle:
      "Образи, реакції та аксесуари для ігрового компаньйона. Монети заробляються реальними звичками.",
    balance: "Монети",
    equippedCount: "Вибрано",
    choose: "Вибрати",
    buyAndChoose: "Купити",
    equipped: "Активний",
    locked: "Не вистачає",
    comingSoon: "Скоро",
    owned: "Куплено",
    available: "Доступно",
    saving: "Зберігаю...",
    saveError: "Не вдалося зберегти образ у хмарі. Спробуйте ще раз.",
    coins: "монет",
    preview: "Поточний образ",
    profileLook: "Образ із профілю",
    futureItem: "Буде доступно пізніше",
    categories: {
      outfit: "Одяг",
      emotion: "Емоція",
      accessory: "Аксесуар",
      animation: "Анімація",
      premium: "Преміум образ",
      seasonal: "Сезонний образ",
    } satisfies Record<CompanionCatalogCategory, string>,
  },
  pl: {
    title: "Studio kompana",
    subtitle:
      "Wyglądy, reakcje i akcesoria dla grywalnego kompana. Monety zdobywasz przez realne nawyki.",
    balance: "Monety",
    equippedCount: "Wybrane",
    choose: "Wybierz",
    buyAndChoose: "Kup",
    equipped: "Aktywny",
    locked: "Za mało",
    comingSoon: "Wkrótce",
    owned: "Kupione",
    available: "Dostępne",
    saving: "Zapisuję...",
    saveError: "Nie udało się zapisać wyglądu w chmurze. Spróbuj ponownie.",
    coins: "monet",
    preview: "Obecny wygląd",
    profileLook: "Wygląd z profilu",
    futureItem: "Dostępne później",
    categories: {
      outfit: "Ubranie",
      emotion: "Emocja",
      accessory: "Akcesorium",
      animation: "Animacja",
      premium: "Wygląd premium",
      seasonal: "Wygląd sezonowy",
    } satisfies Record<CompanionCatalogCategory, string>,
  },
  en: {
    title: "Companion Studio",
    subtitle:
      "Looks, reactions, and accessories for the game companion. Coins come from real habits.",
    balance: "Coins",
    equippedCount: "Equipped",
    choose: "Equip",
    buyAndChoose: "Buy",
    equipped: "Active",
    locked: "Not enough",
    comingSoon: "Soon",
    owned: "Owned",
    available: "Available",
    saving: "Saving...",
    saveError: "Could not save the look to cloud. Try again.",
    coins: "coins",
    preview: "Current look",
    profileLook: "Profile look",
    futureItem: "Available later",
    categories: {
      outfit: "Outfit",
      emotion: "Emotion",
      accessory: "Accessory",
      animation: "Animation",
      premium: "Premium look",
      seasonal: "Seasonal look",
    } satisfies Record<CompanionCatalogCategory, string>,
  },
} as const;

const getStatusTone = ({
  isEquipped,
  isLocked,
}: {
  isEquipped: boolean;
  isLocked: boolean;
}) => {
  if (isEquipped) {
    return "success";
  }

  if (isLocked) {
    return "warning";
  }

  return "default";
};

const CompanionShopCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const assistant = profile.assistant;
  const authMeta = useSelector((state: RootState) => state.auth.cloudMeta);
  const meal = useSelector((state: RootState) => state.meal);
  const water = useSelector((state: RootState) => state.water);
  const fridge = useSelector((state: RootState) => state.fridge);
  const community = useSelector((state: RootState) => state.community);
  const companion = useSelector((state: RootState) => state.companion);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { appLanguage } = useLanguage();
  const locale: CompanionCatalogLocale = appLanguage;
  const copy = shopCopy[locale];
  const equippedItems = useMemo(
    () => getEquippedCompanionItems(companion),
    [companion]
  );
  const activePreview =
    equippedItems.find((item) => item.slot === "companion") ??
    companionShopCatalog.find((item) => item.companionKind === assistant.companionKind) ??
    null;

  const handleItemAction = async (item: CompanionCatalogItem) => {
    const isOwned = hasCompanionItem(companion, item.id);
    const canBuy = canPurchaseCompanionItem(companion, item);

    if (
      savingItemId !== null ||
      !item.available ||
      isCompanionItemEquipped(companion, item.id)
    ) {
      return;
    }

    if (!isOwned && !canBuy) {
      return;
    }

    setSavingItemId(item.id);
    setSaveError(null);

    try {
      await applyCompanionShopSelectionInCloud(
        dispatch,
        {
          auth: { cloudMeta: authMeta },
          profile,
          meal,
          water,
          fridge,
          community,
          companion,
        },
        item
      );
    } catch {
      setSaveError(copy.saveError);
    } finally {
      setSavingItemId(null);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid var(--sn-border-soft)",
        backgroundColor: "var(--sn-surface-elevated)",
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
        >
          <Stack spacing={0.5}>
            <Typography component="h2" variant="h6" sx={{ fontWeight: 900 }}>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={`${copy.balance}: ${companion.coins}`} color="primary" />
            <Chip
              label={`${copy.equippedCount}: ${companion.equippedItemIds.length}`}
              variant="outlined"
            />
          </Stack>
        </Stack>
        {saveError ? (
          <Typography color="error" variant="body2" sx={{ fontWeight: 800 }}>
            {saveError}
          </Typography>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "0.82fr 1.18fr" },
            gap: 2,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 1,
              borderColor: "rgba(15, 23, 42, 0.08)",
              background:
                "linear-gradient(135deg, rgba(240,253,250,0.92) 0%, rgba(239,246,255,0.9) 100%)",
            }}
          >
            <Stack spacing={1.2} alignItems="center" textAlign="center">
              <Typography sx={{ fontWeight: 800 }}>{copy.preview}</Typography>
              <AssistantAvatar
                name={assistant.name}
                variant={activePreview?.companionKind ?? assistant.companionKind}
                mood="happy"
                size={96}
                renderMode="3d"
                active
              />
              <Stack spacing={0.6}>
                <Typography sx={{ fontWeight: 900 }}>
                  {activePreview?.title[locale] ?? copy.profileLook}
                </Typography>
                <Typography color="text.secondary">
                  {activePreview?.description[locale] ?? assistant.name}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 1.2,
            }}
          >
            {companionShopCatalog.map((item) => {
              const isOwned = hasCompanionItem(companion, item.id);
              const isEquipped = isCompanionItemEquipped(companion, item.id);
              const canBuy = canPurchaseCompanionItem(companion, item);
              const isLocked = item.available && !isOwned && !canBuy;
              const isComingSoon = !item.available;
              const statusLabel = isEquipped
                ? copy.equipped
                : isComingSoon
                  ? copy.comingSoon
                  : isOwned
                    ? copy.owned
                    : isLocked
                      ? copy.locked
                      : copy.available;
              const actionLabel = isOwned ? copy.choose : copy.buyAndChoose;
              const isSaving = savingItemId === item.id;
              const buttonDisabled =
                savingItemId !== null || isEquipped || isComingSoon || isLocked;

              return (
                <Paper
                  key={item.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    borderColor: isEquipped
                      ? "rgba(15, 118, 110, 0.55)"
                      : "rgba(15, 23, 42, 0.08)",
                    backgroundColor: isEquipped
                      ? "rgba(240,253,250,0.86)"
                      : "rgba(248,250,252,0.72)",
                  }}
                >
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip
                        label={copy.categories[item.category]}
                        size="small"
                        color={item.category === "premium" ? "secondary" : "default"}
                      />
                      <Chip label={item.tagLabel[locale]} size="small" variant="outlined" />
                      <Chip
                        label={statusLabel}
                        size="small"
                        color={getStatusTone({ isEquipped, isLocked })}
                        variant={isEquipped ? "filled" : "outlined"}
                      />
                    </Stack>
                    <Typography sx={{ fontWeight: 900 }}>{item.title[locale]}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.description[locale]}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ fontWeight: 900 }}>
                        {isComingSoon
                          ? copy.futureItem
                          : `${item.price} ${copy.coins}`}
                      </Typography>
                      <Button
                        size="small"
                        variant={isEquipped ? "contained" : "outlined"}
                        disabled={buttonDisabled}
                        onClick={() => void handleItemAction(item)}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                      >
                        {isSaving
                          ? copy.saving
                          : isEquipped
                            ? copy.equipped
                            : actionLabel}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
};

export default CompanionShopCard;
