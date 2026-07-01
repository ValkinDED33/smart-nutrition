import { type ChangeEvent, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import imageCompression from "browser-image-compression";
import Cropper, { type Area } from "react-easy-crop";
import {
  Alert,
  Box,
  Button,
  Paper,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { formatLocalDateKey, getLocalDateKey } from "../../shared/lib/date";
import { useLanguage } from "../../shared/language";
import { addProgressPhoto, removeProgressPhoto } from "./profileSlice";
import { applyProfileActionInCloud } from "./profileCloudSync";

const MAX_PHOTO_BYTES = 8_000_000;
const MAX_COMPRESSED_PHOTO_MB = 1.2;
const SUPPORTED_PROGRESS_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("FILE_READ_FAILED"));
    reader.readAsDataURL(file);
  });

const createImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("IMAGE_LOAD_FAILED"));
    image.src = src;
  });

const cropImageToDataUrl = async (imageSrc: string, area: Area | null) => {
  if (!area || typeof document === "undefined") {
    return imageSrc;
  }

  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return imageSrc;
  }

  canvas.width = Math.max(Math.round(area.width), 1);
  canvas.height = Math.max(Math.round(area.height), 1);
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.88);
};

const progressPhotoCopy = {
  uk: {
    title: "Фото прогресу",
    subtitle: "Зберігайте однаковий ракурс раз на тиждень, щоб бачити зміни без здогадок.",
    upload: "Додати фото",
    replace: "Замінити фото",
    note: "Нотатка",
    save: "Зберегти фото",
    saving: "Зберігаю...",
    crop: "Кадрувати",
    applyCrop: "Застосувати кадр",
    zoom: "Масштаб",
    preview: "Preview",
    latest: "Останнє фото",
    previous: "Попереднє",
    history: "Історія фото",
    empty: "Фото прогресу ще не додані.",
    tooLarge: "Фото завелике. Виберіть файл до 8 MB.",
    invalid: "Не вдалося прочитати фото.",
    saveError: "Не вдалося зберегти фото в хмарі. Спробуйте ще раз.",
    remove: "Видалити",
  },
  pl: {
    title: "Zdjęcia progresu",
    subtitle: "Zapisuj ten sam kadr raz w tygodniu, aby widzieć zmiany bez zgadywania.",
    upload: "Dodaj zdjęcie",
    replace: "Zmień zdjęcie",
    note: "Notatka",
    save: "Zapisz zdjęcie",
    saving: "Zapisuję...",
    crop: "Kadruj",
    applyCrop: "Zastosuj kadr",
    zoom: "Zoom",
    preview: "Preview",
    latest: "Najnowsze zdjęcie",
    previous: "Poprzednie",
    history: "Historia zdjęć",
    empty: "Nie dodano jeszcze zdjęć progresu.",
    tooLarge: "Zdjęcie jest zbyt duże. Wybierz plik do 8 MB.",
    invalid: "Nie udało się odczytać zdjęcia.",
    saveError: "Nie udało się zapisać zdjęcia w chmurze. Spróbuj ponownie.",
    remove: "Usuń",
  },
  en: {
    title: "Progress photos",
    subtitle: "Keep the same angle once a week to see changes without guessing.",
    upload: "Add photo",
    replace: "Replace photo",
    note: "Note",
    save: "Save photo",
    saving: "Saving...",
    crop: "Crop",
    applyCrop: "Apply crop",
    zoom: "Zoom",
    preview: "Preview",
    latest: "Latest photo",
    previous: "Previous",
    history: "Photo history",
    empty: "No progress photos yet.",
    tooLarge: "Photo is too large. Choose a file up to 8 MB.",
    invalid: "Could not read the photo.",
    saveError: "Could not save the photo to cloud. Try again.",
    remove: "Remove",
  },
} as const;

export const BodyProgressPhotosCard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const photos = profile.progressPhotos;
  const { appLanguage } = useLanguage();
  const copy = progressPhotoCopy[appLanguage];
  const [rawPreview, setRawPreview] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);

  const sortedPhotos = useMemo(
    () =>
      [...photos].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()
      ),
    [photos]
  );
  const latest = sortedPhotos[0];
  const previous = sortedPhotos[1];

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError(null);

    if (!file) {
      return;
    }

    if (!SUPPORTED_PROGRESS_PHOTO_TYPES.has(file.type) || file.size > MAX_PHOTO_BYTES) {
      setRawPreview(null);
      setPreview(null);
      setError(file.size > MAX_PHOTO_BYTES ? copy.tooLarge : copy.invalid);
      return;
    }

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: MAX_COMPRESSED_PHOTO_MB,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const dataUrl = await readFileAsDataUrl(compressedFile);

      if (!/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(dataUrl)) {
        setError(copy.invalid);
        return;
      }

      setRawPreview(dataUrl);
      setPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch {
      setError(copy.invalid);
    }
  };

  const handleApplyCrop = async () => {
    if (!rawPreview) {
      return;
    }

    try {
      setPreview(await cropImageToDataUrl(rawPreview, croppedAreaPixels));
    } catch {
      setError(copy.invalid);
    }
  };

  const handleSave = async () => {
    if (isSaving || (!preview && !rawPreview)) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const imageDataUrl =
        preview ?? (await cropImageToDataUrl(rawPreview ?? "", croppedAreaPixels));

      await applyProfileActionInCloud(
        dispatch,
        profile,
        addProgressPhoto({ imageDataUrl, note })
      );
      setRawPreview(null);
      setPreview(null);
      setNote("");
    } catch {
      setError(copy.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (photoId: string) => {
    if (removingPhotoId !== null) {
      return;
    }

    setRemovingPhotoId(photoId);
    setError(null);

    try {
      await applyProfileActionInCloud(
        dispatch,
        profile,
        removeProgressPhoto(photoId)
      );
    } catch {
      setError(copy.saveError);
    } finally {
      setRemovingPhotoId(null);
    }
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
      <Stack spacing={2.2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
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
              {rawPreview || preview ? copy.replace : copy.upload}
              <Box
                component="input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
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
            {rawPreview && !preview && (
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  {copy.zoom}
                </Typography>
                <Slider
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(_, value) => setZoom(Array.isArray(value) ? value[0] ?? 1 : value)}
                />
                <Button
                  variant="outlined"
                  onClick={() => {
                    void handleApplyCrop();
                  }}
                  sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800 }}
                >
                  {copy.applyCrop}
                </Button>
              </Stack>
            )}
            {rawPreview && preview && (
              <Button
                variant="text"
                onClick={() => setPreview(null)}
                sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 800 }}
              >
                {copy.crop}
              </Button>
            )}
            <Button
              variant="contained"
              disabled={isSaving || (!preview && !rawPreview)}
              onClick={() => {
                void handleSave();
              }}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {isSaving ? copy.saving : copy.save}
            </Button>
          </Stack>

          <Box
            sx={{
              flex: 1,
              minHeight: 220,
              borderRadius: 1,
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
            ) : rawPreview ? (
              <Box sx={{ position: "relative", width: "100%", height: 260 }}>
                <Cropper
                  image={rawPreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 5}
                  onCropChange={setCrop}
                  onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                  onZoomChange={setZoom}
                />
              </Box>
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
                  sx={{ borderRadius: 1, overflow: "hidden" }}
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
                      {formatLocalDateKey(getLocalDateKey(photo.date), appLanguage, {
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
                        {formatLocalDateKey(getLocalDateKey(photo.date), appLanguage, {
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        disabled={removingPhotoId !== null}
                        onClick={() => {
                          void handleRemove(photo.id);
                        }}
                        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
                      >
                        {removingPhotoId === photo.id ? copy.saving : copy.remove}
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
