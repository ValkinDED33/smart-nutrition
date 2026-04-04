import type { AuthResponse, User } from "../types/user";

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
