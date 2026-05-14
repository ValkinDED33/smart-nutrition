import { Capacitor } from "@capacitor/core";
import { initializePostHog } from "./analytics";
import { initializeFirebaseApp } from "./firebase";

export const getRuntimePlatform = () => Capacitor.getPlatform();

export const initializeRuntimeIntegrations = async () => {
  const [firebaseApp, posthog] = await Promise.all([
    initializeFirebaseApp(),
    initializePostHog(),
  ]);

  return {
    analyticsEnabled: Boolean(posthog),
    firebaseEnabled: Boolean(firebaseApp),
    platform: getRuntimePlatform(),
  };
};
