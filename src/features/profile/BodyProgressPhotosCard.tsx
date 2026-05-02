import { type ChangeEvent, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { useLanguage } from "../../shared/language";
import { addProgressPhoto, removeProgressPhoto } from "./profileSlice";

const MAX_PHOTO_BYTES = 1_200_000;

const progressPhotoCopy = {
  uk: {
    title: "Фото прогресу",
    subtitle: "Зберігайте однаковий ракурс раз на тиждень, щоб бачити зміни без здогадок.",
    upload: "Додати фото",
    replace: "Замінити фото",
    note: "Нотатка",
    save: "Зберегти фото",
    preview: "Preview",
    latest: "Останнє фото",
    previous: "Попереднє",
    history: "Історія фото",
    empty: "Фото прогресу ще не додані.",
    tooLarge: "Фото завелике. Виберіть файл до 1.2 MB.",
    invalid: "Не вдалося прочитати фото.",
    remove: "Видалити",
  },
  pl: {
    title: "Zdjęcia progresu",
    subtitle: "Zapisuj ten sam kadr raz w tygodniu, aby widzieć zmiany bez zgadywania.",
    upload: "Dodaj zdjęcie",
    replace: "Zmień zdjęcie",
    note: "Notatka",
    save: "Zapisz zdjęcie",
    preview: "Preview",
    latest: "Najnowsze zdjęcie",
    previous: "Poprzednie",
    history: "Historia zdjęć",
    empty: "Nie dodano jeszcze zdjęć progresu.",
    tooLarge: "Zdjęcie jest zbyt duże. Wybierz plik do 1.2 MB.",
    invalid: "Nie udało się odczytać zdjęcia.",
    remove: "Usuń",
  },
} as const;

export const BodyProgressPhotosCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const photos = useSelector((state: RootState) => state.profile.progressPhotos);
  const { language } = useLanguage();
  const copy = progressPhotoCopy[language];
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sortedPhotos = useMemo(
    () =>
      [...photos].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
      ),
    [photos]
  );
  const latest = sortedPhotos[0];
  const previous = sortedPhotos[1];

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) {
      setPreview(null);
      setError(file.size > MAX_PHOTO_BYTES ? copy.tooLarge : copy.invalid);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string" || !reader.result.startsWith("data:image/")) {
        setError(copy.invalid);
        return;
      }

      setPreview(reader.result);
    };
    reader.onerror = () => {
      setError(copy.invalid);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!preview) {
      return;
    }

    dispatch(addProgressPhoto({ imageDataUrl: preview, note }));
    setPreview(null);
    setNote("");
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
      <Stack spacing={2.2}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Stack spacing={1.5} sx={{ flex: 1 }}>
            <Button
              variant="outlined"
              component="label"
              sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800 }}
            >
              {preview ? copy.replace : copy.upload}
              <Box
                component="input"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                sx={{ display: "none" }}
              />
            </Button>
            <TextField
              label={copy.note}
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 160))}
              multiline
              minRows={2}
              fullWidth
            />
            <Button
              variant="contained"
              disabled={!preview}
              onClick={handleSave}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {copy.save}
            </Button>
          </Stack>

          <Box
            sx={{
              flex: 1,
              minHeight: 220,
              borderRadius: 4,
              border: "1px dashed rgba(15, 23, 42, 0.18)",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(15, 23, 42, 0.03)",
            }}
          >
            {preview ? (
              <Box
                component="img"
                src={preview}
                alt={copy.preview}
                sx={{ width: "100%", height: 260, objectFit: "cover" }}
              />
            ) : (
              <Typography color="text.secondary">{copy.preview}</Typography>
            )}
          </Box>
        </Stack>

        {sortedPhotos.length === 0 ? (
          <Typography color="text.secondary">{copy.empty}</Typography>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 1.5,
              }}
            >
              {[latest, previous].flatMap((photo) => (photo ? [photo] : [])).map((photo, index) => (
                <Paper
                  key={photo.id}
                  variant="outlined"
                  sx={{ borderRadius: 4, overflow: "hidden" }}
                >
                  <Box
                    component="img"
                    src={photo.imageDataUrl}
                    alt={index === 0 ? copy.latest : copy.previous}
                    sx={{ width: "100%", height: 260, objectFit: "cover", display: "block" }}
                  />
                  <Stack spacing={0.5} sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 800 }}>
                      {index === 0 ? copy.latest : copy.previous}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatLocalDateKey(getLocalDateKey(photo.date), language, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Typography>
                    {photo.note && (
                      <Typography variant="body2" color="text.secondary">
                        {photo.note}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Box>

            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 800 }}>{copy.history}</Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(2, minmax(0, 1fr))",
                    sm: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1,
                }}
              >
                {sortedPhotos.map((photo) => (
                  <Paper key={photo.id} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
                    <Box
                      component="img"
                      src={photo.imageDataUrl}
                      alt={copy.history}
                      sx={{ width: "100%", height: 104, objectFit: "cover", display: "block" }}
                    />
                    <Stack spacing={0.6} sx={{ p: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatLocalDateKey(getLocalDateKey(photo.date), language, {
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => dispatch(removeProgressPhoto(photo.id))}
                        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                      >
                        {copy.remove}
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
};
