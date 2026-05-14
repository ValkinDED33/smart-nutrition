import type { FirebaseApp, FirebaseOptions } from "firebase/app";

let firebaseApp: FirebaseApp | null = null;

export const readFirebaseConfig = (): FirebaseOptions | null => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !appId || !projectId) {
    return null;
  }

  return {
    apiKey,
    appId,
    projectId,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  };
};

export const initializeFirebaseApp = async () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  const config = readFirebaseConfig();

  if (!config) {
    return null;
  }

  const { getApps, initializeApp } = await import("firebase/app");
  const existingApp = getApps()[0];
  firebaseApp = existingApp ?? initializeApp(config);

  return firebaseApp;
};
