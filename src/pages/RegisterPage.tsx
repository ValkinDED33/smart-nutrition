import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { AppDispatch } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import { applyProfileTargets } from "../features/profile/profileSlice";
import { calculateProfileTargets } from "../shared/lib/profileTargets";
import { AuthApiError, register as registerApi } from "../shared/api/auth";
import { useLanguage } from "../shared/language";

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  weight: number;
  height: number;
  gender: "male" | "female";
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "cut" | "maintain" | "bulk";
};

const RegisterPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(2, t("validation.nameMin")),
          email: z.string().email(t("validation.invalidEmail")),
          password: z
            .string()
            .min(10, t("validation.passwordMin"))
            .regex(/[A-Z]/, t("validation.passwordUpper"))
            .regex(/[a-z]/, t("validation.passwordLower"))
            .regex(/\d/, t("validation.passwordDigit"))
            .regex(
              /[!@#$%^&*(),.?":{}|<>_\-\\/\][+=~`]/,
              t("validation.passwordSymbol")
            ),
          confirmPassword: z.string(),
          age: z.number().min(10, t("validation.ageMin")),
          weight: z.number().min(30, t("validation.weightMin")),
          height: z.number().min(120, t("validation.heightMin")),
          gender: z.enum(["male", "female"]),
          activity: z.enum([
            "sedentary",
            "light",
            "moderate",
            "active",
            "very_active",
          ]),
          goal: z.enum(["cut", "maintain", "bulk"]),
        })
        .refine((data) => data.password === data.confirmPassword, {
          path: ["confirmPassword"],
          message: t("validation.passwordMatch"),
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
      gender: "male",
      activity: "moderate",
      goal: "maintain",
      age: 25,
      weight: 70,
      height: 175,
    },
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const { user, token } = await registerApi({
        name: data.name,
        email: data.email,
        password: data.password,
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        activity: data.activity,
        goal: data.goal,
      });

      dispatch(setCredentials({ user, accessToken: token }));
      const { maintenanceCalories, targetCalories } = calculateProfileTargets(data);
      dispatch(
        applyProfileTargets({
          goal: data.goal,
          weight: data.weight,
          maintenanceCalories,
          targetCalories,
        })
      );

      navigate("/dashboard");
    } catch (error) {
      if (error instanceof AuthApiError && error.code === "EMAIL_IN_USE") {
        setServerError(t("error.emailInUse"));
      } else {
        setServerError(t("error.genericRegister"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "75vh" }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 740,
          p: { xs: 3, md: 4.5 },
          borderRadius: 7,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,250,252,0.92) 100%)",
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" sx={{ color: "#0f766e", fontWeight: 800 }}>
              {t("brand.name")}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              {t("auth.registerTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {t("auth.registerSubtitle")}
            </Typography>
          </Box>

          {serverError && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {serverError}
            </Alert>
          )}

          <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label={t("form.name")}
                {...register("name")}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
              <TextField
                fullWidth
                label={t("form.email")}
                type="email"
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label={t("form.password")}
                type="password"
                {...register("password")}
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
              />
              <TextField
                fullWidth
                label={t("form.confirmPassword")}
                type="password"
                {...register("confirmPassword")}
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                fullWidth
                label={t("form.age")}
                type="number"
                {...register("age", { valueAsNumber: true })}
                error={Boolean(errors.age)}
                helperText={errors.age?.message}
              />
              <TextField
                fullWidth
                label={t("form.weight")}
                type="number"
                {...register("weight", { valueAsNumber: true })}
                error={Boolean(errors.weight)}
                helperText={errors.weight?.message}
              />
              <TextField
                fullWidth
                label={t("form.height")}
                type="number"
                {...register("height", { valueAsNumber: true })}
                error={Boolean(errors.height)}
                helperText={errors.height?.message}
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label={t("form.gender")}
                defaultValue="male"
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
                defaultValue="moderate"
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
                defaultValue="maintain"
                {...register("goal")}
                error={Boolean(errors.goal)}
                helperText={errors.goal?.message}
              >
                <MenuItem value="cut">{t("option.goal.cut")}</MenuItem>
                <MenuItem value="maintain">{t("option.goal.maintain")}</MenuItem>
                <MenuItem value="bulk">{t("option.goal.bulk")}</MenuItem>
              </TextField>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{
                mt: 1,
                py: 1.5,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                background: "linear-gradient(135deg, #0f766e 0%, #65a30d 100%)",
              }}
            >
              {t("auth.submitRegister")}
            </Button>
          </Stack>

          <Typography color="text.secondary" sx={{ textAlign: "center" }}>
            {t("auth.haveAccount")}{" "}
            <Box
              component={Link}
              to="/login"
              sx={{
                color: "#0f766e",
                fontWeight: 800,
                textDecoration: "none",
                display: "inline",
              }}
            >
              {t("auth.loginLink")}
            </Box>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
