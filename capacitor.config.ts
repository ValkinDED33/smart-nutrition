import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.smartnutrition.app",
  appName: "Smart Nutrition",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
