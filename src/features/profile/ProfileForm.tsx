import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch, RootState } from "../../app/store";
import { setUser } from "../auth/authSlice";
import { setDailyCalories, setGoal, updateWeight } from "./profileSlice";
import { calculateCalories } from "../../shared/lib/calorieCalculator";
import { updateStoredProfile } from "../../shared/api/auth";
import { useLanguage } from "../../shared/i18n/I18nProvider";

type FormData = {
  gender: "male" | "female";
  weight: number;
  height: number;
  age: number;
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "cut" | "maintain" | "bulk";
};

const ProfileForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { t } = useLanguage();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        gender: z.enum(["male", "female"]),
        weight: z.number().min(30, t("validation.weightMin")),
        height: z.number().min(120, t("validation.heightMin")),
        age: z.number().min(10, t("validation.ageMin")),
        activity: z.enum([
          "sedentary",
          "light",
          "moderate",
          "active",
          "very_active",
        ]),
        goal: z.enum(["cut", "maintain", "bulk"]),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      gender: user?.gender ?? "male",
      weight: user?.weight ?? 70,
      height: user?.height ?? 175,
      age: user?.age ?? 25,
      activity: user?.activity ?? "moderate",
      goal: user?.goal ?? "maintain",
    },
  });

  if (!user) return null;

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await updateStoredProfile({
        ...user,
        ...data,
      });

      dispatch(setUser(updatedUser));
      dispatch(
        setDailyCalories(
          calculateCalories({
            age: data.age,
            weight: data.weight,
            height: data.height,
            gender: data.gender,
            activity: data.activity,
          })
        )
      );
      dispatch(setGoal(data.goal));
      dispatch(updateWeight(data.weight));
      setSuccessMessage(t("profile.saved"));
    } catch {
      setServerError(t("error.genericProfile"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.84)",
      }}
    >
      <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t("profile.title")}
        </Typography>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            label={t("form.gender")}
            defaultValue={user.gender}
            {...register("gender")}
            error={Boolean(errors.gender)}
            helperText={errors.gender?.message}
          >
            <MenuItem value="male">{t("option.gender.male")}</MenuItem>
            <MenuItem value="female">{t("option.gender.female")}</MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label={t("form.activity")}
            defaultValue={user.activity}
            {...register("activity")}
            error={Boolean(errors.activity)}
            helperText={errors.activity?.message}
          >
            <MenuItem value="sedentary">{t("option.activity.sedentary")}</MenuItem>
            <MenuItem value="light">{t("option.activity.light")}</MenuItem>
            <MenuItem value="moderate">{t("option.activity.moderate")}</MenuItem>
            <MenuItem value="active">{t("option.activity.active")}</MenuItem>
            <MenuItem value="very_active">
              {t("option.activity.very_active")}
            </MenuItem>
          </TextField>

          <TextField
            select
            fullWidth
            label={t("form.goal")}
            defaultValue={user.goal}
            {...register("goal")}
            error={Boolean(errors.goal)}
            helperText={errors.goal?.message}
          >
            <MenuItem value="cut">{t("option.goal.cut")}</MenuItem>
            <MenuItem value="maintain">{t("option.goal.maintain")}</MenuItem>
            <MenuItem value="bulk">{t("option.goal.bulk")}</MenuItem>
          </TextField>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="number"
            label={t("form.age")}
            {...register("age", { valueAsNumber: true })}
            error={Boolean(errors.age)}
            helperText={errors.age?.message}
          />
          <TextField
            fullWidth
            type="number"
            label={t("form.weight")}
            {...register("weight", { valueAsNumber: true })}
            error={Boolean(errors.weight)}
            helperText={errors.weight?.message}
          />
          <TextField
            fullWidth
            type="number"
            label={t("form.height")}
            {...register("height", { valueAsNumber: true })}
            error={Boolean(errors.height)}
            helperText={errors.height?.message}
          />
        </Stack>

        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          sx={{
            alignSelf: "flex-start",
            px: 3,
            py: 1.2,
            borderRadius: 999,
            textTransform: "none",
            fontWeight: 800,
            background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
          }}
        >
          {t("form.save")}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ProfileForm;
