import type {
  AuthResponse,
  RegistrationVerificationPending,
  User,
} from "@domain/user/types";
import type { AppSnapshot } from "../types/appSnapshot";
import type { AppLanguage } from "../types/i18n";

export type { RegistrationVerificationPending } from "@domain/user/types";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  age: number;
  weight: number;
  height: number;
  gender: "male" | "female";
  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "cut" | "maintain" | "bulk";
  languagePreference?: AppLanguage;
}

export interface AuthRuntimeInfo {
  mode: "remote-cloud";
  providerLabel: string;
  sessionLabel: string;
  syncLabel: string;
  securityLabel: string;
  supportsAccountDeletion: boolean;
  supportsDataExport: boolean;
  supportsSessionRevocation: boolean;
}

export interface AccountBackupSummary {
  id: string;
  name: string;
  reason: string;
  updatedAt: string;
  sizeBytes: number;
}

export interface AccountBackupPayload extends AccountBackupSummary {
  payload: unknown;
}

export interface AccountExportPayload {
  exportedAt: string;
  mode: "remote-cloud";
  user: User;
  snapshot: AppSnapshot | null;
  backups: AccountBackupSummary[];
}

export interface PasswordResetRequestResult {
  ok: true;
  message: string;
  delivery: "email";
  expiresAt?: string;
}

export interface PasswordResetResult {
  ok: true;
  message: string;
}

export interface RegistrationVerificationPayload {
  token: string;
}

export interface RegistrationVerificationResendPayload {
  email: string;
}

export type RegistrationResult = AuthResponse | RegistrationVerificationPending;

export interface RegistrationAvailabilityResult {
  email: {
    checked: boolean;
    valid: boolean;
    available: boolean;
  };
  name: {
    checked: boolean;
    valid: boolean;
    available: boolean;
  };
}

export class AuthApiError extends Error {
  code:
    | "EMAIL_IN_USE"
    | "NAME_IN_USE"
    | "INVALID_CREDENTIALS"
    | "INVALID_REFRESH_TOKEN"
    | "TOO_MANY_ATTEMPTS"
    | "INVALID_RESET_TOKEN"
    | "EMAIL_DELIVERY_UNAVAILABLE"
    | "VERIFICATION_DELIVERY_UNAVAILABLE"
    | "INVALID_VERIFICATION_LINK"
    | "REGISTRATION_NOT_VERIFIED"
    | "ACCOUNT_BANNED"
    | "WEAK_PASSWORD"
    | "INVALID_PROFILE"
    | "REMOTE_API_UNAVAILABLE";

  constructor(code: AuthApiError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

export interface AuthProvider {
  restoreSession: (options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
  }) => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  updateStoredProfile: (user: User) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegistrationResult>;
  checkRegistrationAvailability: (payload: {
    name?: string;
    email?: string;
  }) => Promise<RegistrationAvailabilityResult>;
  verifyRegistration: (payload: RegistrationVerificationPayload) => Promise<AuthResponse>;
  resendRegistrationVerification: (
    payload: RegistrationVerificationResendPayload
  ) => Promise<RegistrationVerificationPending>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  requestPasswordReset: (email: string) => Promise<PasswordResetRequestResult>;
  resetPassword: (token: string, password: string) => Promise<PasswordResetResult>;
  deleteAccount: (email: string) => Promise<void>;
  getRuntimeInfo: () => AuthRuntimeInfo;
}
