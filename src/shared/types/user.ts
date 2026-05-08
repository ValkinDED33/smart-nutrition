import type { AppSnapshot } from "./appSnapshot";

export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "cut" | "maintain" | "bulk";

export type UserRole =
  | "USER"
  | "VERIFIED_USER"
  | "NUTRITIONIST"
  | "MODERATOR"
  | "ADMIN"
  | "SUPER_ADMIN";
export type VerificationChannel = "email" | "sms";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  phone?: string;
  phoneVerified?: boolean;
  verificationChannel?: VerificationChannel;
  avatar?: string;
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  activity: ActivityLevel;
  goal: Goal;
  role: UserRole;
  isBanned?: boolean;
  bannedAt?: string | null;
  bannedReason?: string | null;
  twoFactorEnabled?: boolean;
  twoFactorRequired?: boolean;
  measurements?: {
    waist?: number;
    abdomen?: number;
    hip?: number;
    chest?: number;
  };
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  refreshToken?: string;
  snapshot?: AppSnapshot | null;
}

export interface RegistrationVerificationPending {
  ok: true;
  requiresVerification: true;
  email: string;
  channel: VerificationChannel;
  maskedTarget: string;
  delivery: VerificationChannel | "preview";
  message: string;
  previewCode?: string;
  expiresAt?: string;
}

export type UpdateUserPayload = Partial<Omit<User, "id" | "email">>;
