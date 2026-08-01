import type { AppSnapshot } from "./appSnapshot";

export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "cut" | "maintain" | "bulk";
export type AppLanguage = "uk" | "pl" | "en";

export type UserRole =
  | "USER"
  | "VERIFIED_USER"
  | "HELPER"
  | "NUTRITIONIST"
  | "MODERATOR"
  | "ADMIN"
  | "OWNER"
  | "SUPER_ADMIN";
export type CommunityMemberStatus =
  | "NEW_MEMBER"
  | "ACTIVE_MEMBER"
  | "TRUSTED_MEMBER"
  | "COMMUNITY_EXPERT";
type VerificationChannel = "email";

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  verificationChannel?: VerificationChannel;
  avatar?: string;
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  activity: ActivityLevel;
  goal: Goal;
  languagePreference?: AppLanguage;
  role: UserRole;
  communityStatus?: CommunityMemberStatus;
  reputationScore?: number;
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
  delivery: VerificationChannel;
  message: string;
  expiresAt?: string;
}
