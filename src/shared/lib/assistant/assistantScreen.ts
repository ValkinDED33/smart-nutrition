import type { AssistantScreenContext } from "../../types/assistant";

const screenMatchers: Array<{
  screen: AssistantScreenContext["screen"];
  test: (path: string) => boolean;
}> = [
  { screen: "dashboard", test: (path) => path.startsWith("/dashboard") },
  { screen: "food", test: (path) => path.startsWith("/food") || path.startsWith("/meals") },
  { screen: "recipes", test: (path) => path.startsWith("/recipes") },
  { screen: "community", test: (path) => path.startsWith("/community") },
  { screen: "progress", test: (path) => path.startsWith("/progress") },
  { screen: "profile", test: (path) => path.startsWith("/profile") },
  { screen: "coach", test: (path) => path.startsWith("/coach") },
  { screen: "admin", test: (path) => path.startsWith("/admin") },
  { screen: "water", test: (path) => path.startsWith("/water") },
];

export const getAssistantScreenFromPath = (
  path: string
): AssistantScreenContext["screen"] =>
  screenMatchers.find((item) => item.test(path))?.screen ?? "unknown";

export const createAssistantScreenContext = (
  path: string
): AssistantScreenContext => ({
  screen: getAssistantScreenFromPath(path),
  currentPath: path,
});
