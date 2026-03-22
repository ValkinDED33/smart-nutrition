export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;

  age: number;
  weight: number; // кг
  height: number; // см

  gender: "male" | "female";

  activity: "sedentary" | "light" | "moderate" | "active" | "very_active";

  goal: "cut" | "maintain" | "bulk";

  measurements?: {
    waist?: number;
    hip?: number;
    chest?: number;
  };
}

/**
 * DTO для реєстрації
 */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

/**
 * DTO для логіну
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Відповідь від auth API
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Оновлення профілю
 */
export type UpdateUserPayload = Partial<Omit<User, "id" | "email">>;
