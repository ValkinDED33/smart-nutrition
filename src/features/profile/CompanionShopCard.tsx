import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import type { AssistantCompanionKind } from "../../shared/types/profile";
import { setAssistantCustomization } from "./profileSlice";

type ShopCategory =
  | "outfit"
  | "emotion"
  | "accessory"
  | "animation"
  | "premium"
  | "seasonal";

interface ShopItem {
  id: string;
  category: ShopCategory;
  title: string;
  description: string;
  price: number;
  tag: string;
  companionKind?: AssistantCompanionKind;
}

const shopCopy = {
  uk: {
    title: "AI магазин companion",
    subtitle:
      "Одяг, емоції, аксесуари, анімації та premium skins для живого помічника.",
    balance: "Баланс",
    owned: "Активовано",
    equip: "Приміряти",
    equipped: "Вибрано",
    preview: "Прев'ю",
    categories: {
      outfit: "Одяг",
      emotion: "Емоція",
      accessory: "Аксесуар",
      animation: "Анімація",
      premium: "Premium skin",
      seasonal: "Seasonal",
    },
    items: [
      {
        id: "soft-hoodie",
        category: "outfit",
        title: "М'який hoodie",
        description: "Теплий образ для ранкових нагадувань про воду.",
        price: 120,
        tag: "cozy",
      },
      {
        id: "spark-reaction",
        category: "emotion",
        title: "Радість за рекорд",
        description: "Companion святкує серії, закриту воду і білок.",
        price: 80,
        tag: "emotion",
      },
      {
        id: "water-bottle",
        category: "accessory",
        title: "Пляшка води",
        description: "Аксесуар для water tracker і м'яких нагадувань.",
        price: 95,
        tag: "hydrate",
      },
      {
        id: "float-idle",
        category: "animation",
        title: "Floating idle",
        description: "Легка анімація очікування без зайвого шуму.",
        price: 140,
        tag: "motion",
      },
      {
        id: "dragon-premium",
        category: "premium",
        title: "Dragon companion",
        description: "Premium образ для більш ігрового wellness вайбу.",
        price: 260,
        tag: "premium",
        companionKind: "dragon",
      },
      {
        id: "capybara-season",
        category: "seasonal",
        title: "Capybara calm",
        description: "Сезонний спокійний companion для режиму без стресу.",
        price: 220,
        tag: "seasonal",
        companionKind: "capybara",
      },
    ] satisfies ShopItem[],
  },
  pl: {
    title: "Sklep AI companion",
    subtitle:
      "Ubrania, emocje, akcesoria, animacje i premium skins dla żywego asystenta.",
    balance: "Saldo",
    owned: "Aktywowane",
    equip: "Przymierz",
    equipped: "Wybrane",
    preview: "Podgląd",
    categories: {
      outfit: "Ubranie",
      emotion: "Emocja",
      accessory: "Akcesorium",
      animation: "Animacja",
      premium: "Premium skin",
      seasonal: "Seasonal",
    },
    items: [
      {
        id: "soft-hoodie",
        category: "outfit",
        title: "Miękki hoodie",
        description: "Ciepły styl do porannych przypomnień o wodzie.",
        price: 120,
        tag: "cozy",
      },
      {
        id: "spark-reaction",
        category: "emotion",
        title: "Radość za rekord",
        description: "Companion świętuje serie, wodę i domknięte białko.",
        price: 80,
        tag: "emotion",
      },
      {
        id: "water-bottle",
        category: "accessory",
        title: "Butelka wody",
        description: "Akcesorium do water trackera i łagodnych przypomnień.",
        price: 95,
        tag: "hydrate",
      },
      {
        id: "float-idle",
        category: "animation",
        title: "Floating idle",
        description: "Lekka animacja oczekiwania bez nadmiaru ruchu.",
        price: 140,
        tag: "motion",
      },
      {
        id: "dragon-premium",
        category: "premium",
        title: "Dragon companion",
        description: "Premium wygląd dla bardziej grywalnego wellness klimatu.",
        price: 260,
        tag: "premium",
        companionKind: "dragon",
      },
      {
        id: "capybara-season",
        category: "seasonal",
        title: "Capybara calm",
        description: "Sezonowy spokojny companion do trybu bez stresu.",
        price: 220,
        tag: "seasonal",
        companionKind: "capybara",
      },
    ] satisfies ShopItem[],
  },
} as const;

const CompanionShopCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const motivation = useSelector((state: RootState) => state.profile.motivation);
  const { language } = useLanguage();
  const copy = shopCopy[language];
  const [activatedIds, setActivatedIds] = useState<Record<string, boolean>>({
    "soft-hoodie": true,
  });

  const activePreview = useMemo(
    () =>
      copy.items.find((item) => item.companionKind === assistant.companionKind) ??
      copy.items.find((item) => item.id === "soft-hoodie") ??
      copy.items[0],
    [assistant.companionKind, copy.items]
  );

  const activatedCount = Object.values(activatedIds).filter(Boolean).length;

  const handleEquip = (item: ShopItem) => {
    setActivatedIds((current) => ({ ...current, [item.id]: true }));

    if (item.companionKind) {
      dispatch(setAssistantCustomization({ companionKind: item.companionKind }));
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.9)",
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
            <Chip label={`${copy.balance}: ${motivation.points}`} color="primary" />
            <Chip label={`${copy.owned}: ${activatedCount}`} variant="outlined" />
          </Stack>
        </Stack>

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
                variant={assistant.companionKind}
                mood="happy"
                size={96}
                active
              />
              {activePreview && (
                <Stack spacing={0.6}>
                  <Typography sx={{ fontWeight: 900 }}>{activePreview.title}</Typography>
                  <Typography color="text.secondary">{activePreview.description}</Typography>
                </Stack>
              )}
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 1.2,
            }}
          >
            {copy.items.map((item) => {
              const isEquipped =
                Boolean(item.companionKind) &&
                item.companionKind === assistant.companionKind;
              const isActivated = activatedIds[item.id] || isEquipped;

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
                      <Chip label={item.tag} size="small" variant="outlined" />
                    </Stack>
                    <Typography sx={{ fontWeight: 900 }}>{item.title}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.description}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography sx={{ fontWeight: 900 }}>{item.price}</Typography>
                      <Button
                        size="small"
                        variant={isEquipped ? "contained" : "outlined"}
                        onClick={() => handleEquip(item)}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                      >
                        {isEquipped ? copy.equipped : isActivated ? copy.equip : copy.equip}
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
