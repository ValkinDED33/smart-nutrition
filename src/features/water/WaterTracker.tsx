import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import {
  incrementWater,
  setWaterConsumed,
  setWaterGlassSize,
  setWaterTarget,
  syncWaterDay,
} from "./waterSlice";
import { useLanguage } from "../../shared/language";

const waterCopy = {
  uk: {
    title: "Р’РѕРґР° Р·Р° РґРµРЅСЊ",
    subtitle:
      "РљРѕРЅС‚СЂРѕР»СЋР№С‚Рµ РЅРѕСЂРјСѓ, Р·Р°Р»РёС€РѕРє С– РѕР±'С”Рј РєРѕР¶РЅРѕРіРѕ СЃС‚Р°РєР°РЅР°.",
    drank: "Р’РёРїРёС‚Рѕ",
    remaining: "Р—Р°Р»РёС€РёР»РѕСЃСЏ",
    target: "РќРѕСЂРјР° РЅР° РґРµРЅСЊ",
    glassSize: "РћР±'С”Рј СЃС‚Р°РєР°РЅР°",
    statusUnder: "РњРµРЅС€Рµ РЅРѕСЂРјРё",
    statusOnTrack: "Р’ РЅРѕСЂРјС–",
    statusAbove: "Р’РёС‰Рµ РЅРѕСЂРјРё",
    progress: "Р’РёРїРёС‚Рѕ {current} Р» Р· {target} Р»",
    remainingLabel: "Р—Р°Р»РёС€РёР»РѕСЃСЏ {value} РјР»",
    customAmount: "РќРµС†С–Р»РёР№ СЃС‚Р°РєР°РЅ",
    addGlass: "Р”РѕРґР°С‚Рё СЃС‚Р°РєР°РЅ",
    removeGlass: "Р—РЅСЏС‚Рё 250 РјР»",
    partialTitle: "РЎРєС–Р»СЊРєРё РІРёРїРёС‚Рѕ?",
    partialHint: "Р’РєР°Р¶С–С‚СЊ РѕР±'С”Рј РґР»СЏ С†СЊРѕРіРѕ СЃС‚Р°РєР°РЅР°.",
    amount: "РћР±'С”Рј (РјР»)",
    save: "Р—Р±РµСЂРµРіС‚Рё",
    cancel: "РЎРєР°СЃСѓРІР°С‚Рё",
  },
  pl: {
    title: "Woda na dziЕ„",
    subtitle:
      "Kontroluj dziennД… normД™, pozostaЕ‚o i objД™toЕ›Д‡ kaЕјdej szklanki.",
    drank: "Wypito",
    remaining: "PozostaЕ‚o",
    target: "Norma na dzieЕ„",
    glassSize: "ObjД™toЕ›Д‡ szklanki",
    statusUnder: "PoniЕјej normy",
    statusOnTrack: "W normie",
    statusAbove: "PowyЕјej normy",
    progress: "Wypito {current} l z {target} l",
    remainingLabel: "PozostaЕ‚o {value} ml",
    customAmount: "NiepeЕ‚na szklanka",
    addGlass: "Dodaj szklankД™",
    removeGlass: "Odejmij 250 ml",
    partialTitle: "Ile wypito?",
    partialHint: "Ustaw objД™toЕ›Д‡ dla tej szklanki.",
    amount: "ObjД™toЕ›Д‡ (ml)",
    save: "Zapisz",
    cancel: "Anuluj",
  },
} as const;

const formatLiters = (valueMl: number) => (valueMl / 1000).toFixed(1);

export const WaterTracker = () => {
  const dispatch = useDispatch<AppDispatch>();
  const water = useSelector((state: RootState) => state.water);
  const { language } = useLanguage();
  const copy = waterCopy[language];
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [partialAmountMl, setPartialAmountMl] = useState<number>(water.glassSizeMl);

  useEffect(() => {
    dispatch(syncWaterDay());
  }, [dispatch]);

  const glassCount = Math.max(Math.ceil(water.dailyTargetMl / water.glassSizeMl), 6);
  const remainingMl = Math.max(water.dailyTargetMl - water.consumedMl, 0);
  const progress = water.dailyTargetMl
    ? Math.min((water.consumedMl / water.dailyTargetMl) * 100, 100)
    : 0;
  const status =
    water.consumedMl < water.dailyTargetMl
      ? copy.statusUnder
      : water.consumedMl <= water.dailyTargetMl + water.glassSizeMl / 2
        ? copy.statusOnTrack
        : copy.statusAbove;

  const glasses = useMemo(
    () =>
      Array.from({ length: glassCount }, (_, index) => {
        const slotStart = index * water.glassSizeMl;
        const fill = Math.min(
          Math.max((water.consumedMl - slotStart) / water.glassSizeMl, 0),
          1
        );

        return {
          index,
          slotStart,
          slotEnd: slotStart + water.glassSizeMl,
          fill,
        };
      }),
    [glassCount, water.consumedMl, water.glassSizeMl]
  );

  const handleGlassClick = (index: number, fill: number) => {
    const slotStart = index * water.glassSizeMl;
    const slotEnd = slotStart + water.glassSizeMl;

    if (fill === 1) {
      dispatch(setWaterConsumed(slotStart));
      return;
    }

    if (fill > 0) {
      setEditingSlot(index);
      setPartialAmountMl(Math.round(fill * water.glassSizeMl));
      return;
    }

    dispatch(setWaterConsumed(slotEnd));
  };

  const openPartialDialog = () => {
    const nextIndex = Math.min(
      Math.floor(water.consumedMl / water.glassSizeMl),
      glassCount - 1
    );
    const slotStart = nextIndex * water.glassSizeMl;
    const currentAmount = Math.max(water.consumedMl - slotStart, 0);

    setEditingSlot(nextIndex);
    setPartialAmountMl(currentAmount > 0 ? Math.round(currentAmount) : water.glassSizeMl);
  };

  const savePartialGlass = () => {
    if (editingSlot === null) {
      return;
    }

    const slotStart = editingSlot * water.glassSizeMl;
    const normalizedAmount = Math.min(
      Math.max(Math.round(partialAmountMl), 0),
      water.glassSizeMl
    );

    dispatch(setWaterConsumed(slotStart + normalizedAmount));
    setEditingSlot(null);
  };

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
      <Stack spacing={2.5}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "220px minmax(0, 1fr)" },
            gap: 3,
            alignItems: "center",
          }}
        >
          <Box sx={{ position: "relative", width: 180, height: 180, mx: "auto" }}>
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background:
                  "conic-gradient(#0ea5e9 0deg, #22c55e 180deg, rgba(226,232,240,0.72) 180deg)",
                opacity: 0.15,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: `conic-gradient(#0ea5e9 0deg, #22c55e ${
                  progress * 3.6
                }deg, rgba(226,232,240,0.72) ${progress * 3.6}deg)`,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 16,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.96)",
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                px: 2,
              }}
            >
              <Stack spacing={0.4}>
                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                  {Math.round(progress)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {status}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Stack spacing={1.5}>
            <Typography sx={{ fontWeight: 700 }}>
              {copy.progress
                .replace("{current}", formatLiters(water.consumedMl))
                .replace("{target}", formatLiters(water.dailyTargetMl))}
            </Typography>
            <Typography color="text.secondary">
              {copy.remainingLabel.replace("{value}", remainingMl.toFixed(0))}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 12, borderRadius: 999 }}
            />
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`${copy.drank}: ${water.consumedMl} ml`} color="info" />
              <Chip label={`${copy.remaining}: ${remainingMl} ml`} variant="outlined" />
              <Chip
                label={status}
                color={status === copy.statusAbove ? "warning" : status === copy.statusOnTrack ? "success" : "default"}
              />
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <TextField
            type="number"
            label={`${copy.target} (ml)`}
            value={water.dailyTargetMl}
            onChange={(event) => dispatch(setWaterTarget(Number(event.target.value) || 0))}
            inputProps={{ min: 250, step: 50 }}
          />
          <TextField
            type="number"
            label={`${copy.glassSize} (ml)`}
            value={water.glassSizeMl}
            onChange={(event) =>
              dispatch(setWaterGlassSize(Number(event.target.value) || 0))
            }
            inputProps={{ min: 100, step: 50 }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(glassCount, 4)}, minmax(0, 1fr))`,
            gap: 1.2,
          }}
        >
          {glasses.map((glass) => (
            <Box
              key={`glass-${glass.index}`}
              component="button"
              type="button"
              onClick={() => handleGlassClick(glass.index, glass.fill)}
              sx={{
                p: 0,
                minHeight: 112,
                borderRadius: 4,
                border: "1px solid rgba(125,211,252,0.42)",
                backgroundColor: "rgba(239,246,255,0.72)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  insetInline: 8,
                  bottom: 8,
                  height: `${glass.fill * 100}%`,
                  borderRadius: 2,
                  background: "linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)",
                  transition: "height 180ms ease",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "end center",
                  pb: 1,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  {Math.round(glass.fill * water.glassSizeMl)} ml
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            variant="contained"
            onClick={() => dispatch(incrementWater(water.glassSizeMl))}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 999,
              background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
            }}
          >
            {copy.addGlass}
          </Button>
          <Button
            variant="outlined"
            onClick={openPartialDialog}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 999 }}
          >
            {copy.customAmount}
          </Button>
          <Button
            variant="text"
            onClick={() => dispatch(incrementWater(-water.glassSizeMl))}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {copy.removeGlass}
          </Button>
        </Stack>
      </Stack>

      <Dialog
        open={editingSlot !== null}
        onClose={() => setEditingSlot(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{copy.partialTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">{copy.partialHint}</Typography>
            <TextField
              type="number"
              label={copy.amount}
              value={partialAmountMl}
              onChange={(event) => setPartialAmountMl(Number(event.target.value) || 0)}
              inputProps={{ min: 0, max: water.glassSizeMl, step: 10 }}
            />
            <LinearProgress
              variant="determinate"
              value={(Math.min(partialAmountMl, water.glassSizeMl) / water.glassSizeMl) * 100}
              sx={{ height: 10, borderRadius: 999 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingSlot(null)}>{copy.cancel}</Button>
          <Button onClick={savePartialGlass} variant="contained">
            {copy.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WaterTracker;
