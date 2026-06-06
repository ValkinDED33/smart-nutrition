export * from "./assistantRuntimeRules";
import type { AssistantAction, AssistantRule, AssistantUserStyle } from "./assistantRuntimeTypes";

export const assistantRules: Partial<
  Record<AssistantAction, Partial<Record<AssistantUserStyle, AssistantRule>>>
> = {};
