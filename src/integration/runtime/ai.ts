import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import {
  getDefaultReactRealTimeVADOptions,
  useMicVAD,
  type ReactRealTimeVADOptions,
} from "@ricky0123/vad-react";
import { HumanMessage, countTokensApproximately } from "langchain/browser";

export const createElevenLabsClient = (apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY) => {
  if (!apiKey) {
    return null;
  }

  return new ElevenLabsClient({ apiKey });
};

export const getNutritionVadOptions = (
  options: Partial<ReactRealTimeVADOptions> = {}
): Partial<ReactRealTimeVADOptions> => ({
  ...getDefaultReactRealTimeVADOptions("v5"),
  minSpeechMs: 220,
  positiveSpeechThreshold: 0.72,
  ...options,
});

export const useNutritionMicVAD = (options: Partial<ReactRealTimeVADOptions> = {}) =>
  useMicVAD(getNutritionVadOptions(options));

export const estimateAssistantPromptTokens = (text: string) =>
  countTokensApproximately([new HumanMessage(text)]);
