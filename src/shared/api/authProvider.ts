import type { AuthResponse, User } from "../types/user";
import type { AppSnapshot } from "../types/appSnapshot";

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
}

export interface AuthRuntimeInfo {
  mode: "local-browser" | "remote-cloud";
  providerLabel: string;
  sessionLabel: string;
  syncLabel: string;
  securityLabel: string;
  supportsCloudSync: boolean;
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
  mode: "local-browser" | "remote-cloud";
  user: User;
  snapshot: AppSnapshot | null;
  backups: AccountBackupSummary[];
}

export interface AuthProvider {
  restoreSession: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  logoutEverywhere: () => Promise<void>;
  updateStoredProfile: (user: User) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  login: (email: string, password: string) => Promise<AuthResponse>;
  deleteAccount: (email: string) => Promise<void>;
  getRuntimeInfo: () => AuthRuntimeInfo;
}
