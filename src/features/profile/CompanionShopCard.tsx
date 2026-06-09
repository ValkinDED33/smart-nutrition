import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { AssistantAvatar } from "../../shared/components/AssistantAvatar";
import { useLanguage } from "../../shared/language";
import type { AssistantCompanionKind } from "@domain/profile/types";
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
  tagLabel: string;
  companionKind?: AssistantCompanionKind;
  comingSoon?: boolean;
}

const shopCopy = {
  uk: {
    title: "Студія компаньйона",
    subtitle:
      "Образи, реакції та аксесуари для ігрового компаньйона. Зараз доступні тільки чесні прев'ю та вибір персонажа.",
    balance: "Монети",
    coins: "монет",
    selected: "Поточний",
    choose: "Вибрати",
    previewAction: "Прев'ю",
    equipped: "Вибрано",
    preview: "Поточний образ",
    previewHint: "Прев'ю не списує монети і не змінює профіль.",
    statusAvailable: "Доступно",
    statusComingSoon: "Скоро",
    statusLocked: "Не вистачає монет",
    statusEquipped: "Активний",
    futureItem: "Буде доступно пізніше",
    needCoins: "Потрібно {count}",
    categories: {
      outfit: "Одяг",
      emotion: "Емоція",
      accessory: "Аксесуар",
      animation: "Анімація",
      premium: "Преміум образ",
      seasonal: "Сезонний образ",
    },
    items: [
      {
        id: "soft-hoodie",
        category: "outfit",
        title: "М'яка худі",
        description: "Теплий образ для ранкових нагадувань про воду.",
        price: 120,
        tagLabel: "затишок",
        comingSoon: true,
      },
      {
        id: "spark-reaction",
        category: "emotion",
        title: "Радість за рекорд",
        description: "Компаньйон святкує серії, закриту воду і білок.",
        price: 80,
        tagLabel: "емоція",
        comingSoon: true,
      },
      {
        id: "water-bottle",
        category: "accessory",
        title: "Пляшка води",
        description: "Аксесуар для водного трекера і м'яких нагадувань.",
        price: 95,
        tagLabel: "вода",
        comingSoon: true,
      },
      {
        id: "float-idle",
        category: "animation",
        title: "Плавна пауза",
        description: "Легка анімація очікування без зайвого шуму.",
        price: 140,
        tagLabel: "рух",
        comingSoon: true,
      },
      {
        id: "dragon-premium",
        category: "premium",
        title: "Дракон",
        description: "Ігровий преміум-образ для яскравішої підтримки.",
        price: 260,
        tagLabel: "преміум",
        companionKind: "dragon",
      },
      {
        id: "capybara-season",
        category: "seasonal",
        title: "Спокій капібари",
        description: "Сезонний спокійний образ для режиму без стресу.",
        price: 220,
        tagLabel: "сезон",
        companionKind: "capybara",
      },
    ] satisfies ShopItem[],
  },
  pl: {
    title: "Studio kompana",
    subtitle:
      "Wyglądy, reakcje i akcesoria dla grywalnego kompana. Teraz pokazujemy tylko uczciwy podgląd i wybór postaci.",
    balance: "Monety",
    coins: "monet",
    selected: "Obecny",
    choose: "Wybierz",
    previewAction: "Podgląd",
    equipped: "Wybrane",
    preview: "Obecny wygląd",
    previewHint: "Podgląd nie wydaje monet i nie zmienia profilu.",
    statusAvailable: "Dostępne",
    statusComingSoon: "Wkrótce",
    statusLocked: "Za mało monet",
    statusEquipped: "Aktywny",
    futureItem: "Dostępne później",
    needCoins: "Potrzeba {count}",
    categories: {
      outfit: "Ubranie",
      emotion: "Emocja",
      accessory: "Akcesorium",
      animation: "Animacja",
      premium: "Wygląd premium",
      seasonal: "Wygląd sezonowy",
    },
    items: [
      {
        id: "soft-hoodie",
        category: "outfit",
        title: "Miękka bluza",
        description: "Ciepły styl do porannych przypomnień o wodzie.",
        price: 120,
        tagLabel: "komfort",
        comingSoon: true,
      },
      {
        id: "spark-reaction",
        category: "emotion",
        title: "Radość za rekord",
        description: "Kompan świętuje serie, wodę i domknięte białko.",
        price: 80,
        tagLabel: "emocja",
        comingSoon: true,
      },
      {
        id: "water-bottle",
        category: "accessory",
        title: "Butelka wody",
        description: "Akcesorium do water trackera i łagodnych przypomnień.",
        price: 95,
        tagLabel: "woda",
        comingSoon: true,
      },
      {
        id: "float-idle",
        category: "animation",
        title: "Płynny spokój",
        description: "Lekka animacja oczekiwania bez nadmiaru ruchu.",
        price: 140,
        tagLabel: "ruch",
        comingSoon: true,
      },
      {
        id: "dragon-premium",
        category: "premium",
        title: "Smok",
        description: "Premium wygląd dla bardziej grywalnego wsparcia.",
        price: 260,
        tagLabel: "premium",
        companionKind: "dragon",
      },
      {
        id: "capybara-season",
        category: "seasonal",
        title: "Spokój kapibary",
        description: "Sezonowy spokojny wygląd do trybu bez stresu.",
        price: 220,
        tagLabel: "sezon",
        companionKind: "capybara",
      },
    ] satisfies ShopItem[],
  },
} as const;

const CompanionShopCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const companion = useSelector((state: RootState) => state.companion);
  const { language } = useLanguage();
  const copy = shopCopy[language];
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);

  const activePreview = useMemo(
    () =>
      copy.items.find((item) => item.id === previewItemId) ??
      copy.items.find((item) => item.companionKind === assistant.companionKind) ??
      copy.items.find((item) => item.id === "soft-hoodie") ??
      copy.items[0],
    [assistant.companionKind, copy.items, previewItemId]
  );

  const selectedCount = copy.items.some(
    (item) => item.companionKind === assistant.companionKind
  )
    ? 1
    : 0;

  const handleEquip = (item: ShopItem) => {
    setPreviewItemId(item.id);

    const isEquipped =
      Boolean(item.companionKind) &&
      item.companionKind === assistant.companionKind;
    const canChoose =
      Boolean(item.companionKind) &&
      !item.comingSoon &&
      (isEquipped || companion.coins >= item.price);

    if (item.companionKind && canChoose && !isEquipped) {
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
            <Chip label={`${copy.balance}: ${companion.coins}`} color="primary" />
            <Chip label={`${copy.selected}: ${selectedCount}`} variant="outlined" />
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
                variant={activePreview?.companionKind ?? assistant.companionKind}
                mood="happy"
                size={96}
                active
              />
              {activePreview && (
                <Stack spacing={0.6}>
                  <Typography sx={{ fontWeight: 900 }}>{activePreview.title}</Typography>
                  <Typography color="text.secondary">{activePreview.description}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {copy.previewHint}
                  </Typography>
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
              const isComingSoon = Boolean(item.comingSoon);
              const isLocked =
                Boolean(item.companionKind) &&
                !isEquipped &&
                companion.coins < item.price;
              const canChoose =
                Boolean(item.companionKind) &&
                !isComingSoon &&
                !isLocked &&
                !isEquipped;
              const statusLabel = isEquipped
                ? copy.statusEquipped
                : isComingSoon
                  ? copy.statusComingSoon
                  : isLocked
                    ? copy.statusLocked
                    : copy.statusAvailable;
              const actionLabel = isEquipped
                ? copy.equipped
                : isComingSoon
                  ? copy.statusComingSoon
                  : canChoose
                    ? copy.choose
                    : copy.previewAction;

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
                      <Chip label={item.tagLabel} size="small" variant="outlined" />
                      <Chip
                        label={statusLabel}
                        size="small"
                        color={isEquipped ? "success" : isLocked ? "warning" : "default"}
                        variant={isEquipped ? "filled" : "outlined"}
                      />
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
                      <Typography sx={{ fontWeight: 900 }}>
                        {isComingSoon
                          ? copy.futureItem
                          : isLocked
                            ? copy.needCoins.replace("{count}", `${item.price} ${copy.coins}`)
                            : `${item.price} ${copy.coins}`}
                      </Typography>
                      <Button
                        size="small"
                        variant={isEquipped ? "contained" : "outlined"}
                        disabled={isEquipped || isComingSoon}
                        onClick={() => handleEquip(item)}
                        sx={{ textTransform: "none", fontWeight: 800 }}
                      >
                        {actionLabel}
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
