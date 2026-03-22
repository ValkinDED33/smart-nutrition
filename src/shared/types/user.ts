export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Goal = "cut" | "maintain" | "bulk";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age: number;
  weight: number;
  height: number;
  gender: Gender;
  activity: ActivityLevel;
  goal: Goal;
  measurements?: {
    waist?: number;
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
  token: string;
}

export type UpdateUserPayload = Partial<Omit<User, "id" | "email">>;
