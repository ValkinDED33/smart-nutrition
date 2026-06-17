import type { AssistantCompanionKind } from "@domain/profile/types";

export type AssistantAvatarMood =
  | "idle"
  | "happy"
  | "coach"
  | "concerned"
  | "sleepy"
  | "celebrate";

export interface AssistantAvatarProps {
  name: string;
  size?: number;
  variant?: AssistantCompanionKind;
  mood?: AssistantAvatarMood;
  lookOffset?: {
    x: number;
    y: number;
  };
  active?: boolean;
}
