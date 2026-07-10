export type AssistantArea =
  | "auth"
  | "onboarding"
  | "home"
  | "meals"
  | "coach"
  | "progress"
  | "profile"
  | "community"
  | "recipes"
  | "water"
  | "admin"
  | "unknown";

export type AssistantDuty =
  | "guide"
  | "explain"
  | "warn"
  | "motivate"
  | "suggest"
  | "remind"
  | "analyze"
  | "navigate";

export type AssistantTone = "supportive" | "focused" | "urgent" | "celebratory";

export type AssistantVisibility = "global" | "onboarding" | "hidden";

const ONBOARDING_ROUTE = "/onboarding";
const DASHBOARD_ROUTE = "/dashboard";
const COMMUNITY_ROUTE = "/community";

export type AssistantDefaultAction = {
  label: string;
  route: string;
};

export type AssistantCapability = {
  id: string;
  area: AssistantArea;
  duties: AssistantDuty[];
  description: string;
  entryRoute?: string;
  defaultAction: AssistantDefaultAction;
  tone: AssistantTone;
  visibility: AssistantVisibility;
};

export type AssistantAreaManifest = {
  area: AssistantArea;
  label: string;
  routePrefixes: string[];
  defaultRoute?: string;
  tone: AssistantTone;
  visibility: AssistantVisibility;
};

export const assistantAreas: AssistantAreaManifest[] = [
  {
    area: "auth",
    label: "Start",
    routePrefixes: [
      "/login",
      "/register",
      "/reset-password",
      "/forgot-password",
      "/verify-email",
      "/language",
    ],
    defaultRoute: "/register",
    tone: "supportive",
    visibility: "global",
  },
  {
    area: "onboarding",
    label: "Onboarding",
    routePrefixes: [ONBOARDING_ROUTE],
    defaultRoute: ONBOARDING_ROUTE,
    tone: "supportive",
    visibility: "onboarding",
  },
  {
    area: "home",
    label: "Home",
    routePrefixes: ["/", "/home", DASHBOARD_ROUTE],
    defaultRoute: DASHBOARD_ROUTE,
    tone: "supportive",
    visibility: "global",
  },
  {
    area: "meals",
    label: "Meals",
    routePrefixes: ["/meals", "/food"],
    defaultRoute: "/meals",
    tone: "focused",
    visibility: "global",
  },
  {
    area: "coach",
    label: "Coach",
    routePrefixes: ["/coach"],
    defaultRoute: "/coach",
    tone: "supportive",
    visibility: "global",
  },
  {
    area: "progress",
    label: "Progress",
    routePrefixes: ["/progress"],
    defaultRoute: "/progress",
    tone: "focused",
    visibility: "global",
  },
  {
    area: "profile",
    label: "Profile",
    routePrefixes: ["/profile"],
    defaultRoute: "/profile",
    tone: "supportive",
    visibility: "global",
  },
  {
    area: "community",
    label: "Community",
    routePrefixes: [COMMUNITY_ROUTE],
    defaultRoute: COMMUNITY_ROUTE,
    tone: "supportive",
    visibility: "global",
  },
  {
    area: "recipes",
    label: "Recipes",
    routePrefixes: ["/recipes"],
    defaultRoute: "/recipes",
    tone: "focused",
    visibility: "global",
  },
  {
    area: "water",
    label: "Water",
    routePrefixes: ["/water"],
    defaultRoute: "/progress",
    tone: "urgent",
    visibility: "global",
  },
  {
    area: "admin",
    label: "Admin",
    routePrefixes: ["/admin"],
    defaultRoute: "/admin",
    tone: "focused",
    visibility: "global",
  },
];

export const assistantCapabilities: AssistantCapability[] = [
  {
    id: "auth-companion",
    area: "auth",
    duties: ["guide", "explain", "motivate", "navigate"],
    description:
      "Keeps login, registration, verification, and password recovery calm and clear without blocking form inputs.",
    entryRoute: "/register",
    defaultAction: {
      label: "Create account",
      route: "/register",
    },
    tone: "supportive",
    visibility: "global",
  },
  {
    id: "onboarding-guide",
    area: "onboarding",
    duties: ["guide", "explain", "motivate"],
    description:
      "Guides the user through profile setup and captures goals, friction, and support style.",
    entryRoute: ONBOARDING_ROUTE,
    defaultAction: {
      label: "Continue setup",
      route: ONBOARDING_ROUTE,
    },
    tone: "supportive",
    visibility: "onboarding",
  },
  {
    id: "home-companion",
    area: "home",
    duties: ["suggest", "motivate", "navigate"],
    description:
      "Turns the user's current nutrition, motivation, and onboarding context into a visible daily focus.",
    entryRoute: DASHBOARD_ROUTE,
    defaultAction: {
      label: "Open daily coach",
      route: "/coach",
    },
    tone: "supportive",
    visibility: "global",
  },
  {
    id: "meal-helper",
    area: "meals",
    duties: ["suggest", "analyze", "warn", "explain"],
    description:
      "Helps add food, explains calories and macros, and warns when the day needs correction.",
    entryRoute: "/meals",
    defaultAction: {
      label: "Add or review food",
      route: "/meals",
    },
    tone: "focused",
    visibility: "global",
  },
  {
    id: "coach-support",
    area: "coach",
    duties: ["motivate", "analyze", "suggest", "explain"],
    description:
      "Answers user questions from live profile, diary, coach analysis, motivation state, and assistant memory.",
    entryRoute: "/coach",
    defaultAction: {
      label: "Open coach",
      route: "/coach",
    },
    tone: "supportive",
    visibility: "global",
  },
  {
    id: "progress-analyst",
    area: "progress",
    duties: ["analyze", "explain", "remind"],
    description:
      "Explains weekly and monthly progress, check-ins, water, body metrics, and recurring patterns.",
    entryRoute: "/progress",
    defaultAction: {
      label: "Review progress",
      route: "/progress",
    },
    tone: "focused",
    visibility: "global",
  },
  {
    id: "profile-memory",
    area: "profile",
    duties: ["guide", "explain", "remind"],
    description:
      "Connects profile settings, onboarding answers, assistant memory, notifications, and data controls.",
    entryRoute: "/profile",
    defaultAction: {
      label: "Complete profile",
      route: "/profile",
    },
    tone: "supportive",
    visibility: "global",
  },
  {
    id: "community-bridge",
    area: "community",
    duties: ["motivate", "navigate", "suggest"],
    description:
      "Surfaces community support when the user's friction or motivation state benefits from social context.",
    entryRoute: COMMUNITY_ROUTE,
    defaultAction: {
      label: "Open community",
      route: COMMUNITY_ROUTE,
    },
    tone: "supportive",
    visibility: "global",
  },
  {
    id: "recipe-planner",
    area: "recipes",
    duties: ["suggest", "explain", "navigate"],
    description:
      "Connects recipes and pantry ideas to today's calorie, protein, diet style, and preference context.",
    entryRoute: "/recipes",
    defaultAction: {
      label: "Plan a recipe",
      route: "/recipes",
    },
    tone: "focused",
    visibility: "global",
  },
  {
    id: "water-reminder",
    area: "water",
    duties: ["remind", "warn", "motivate"],
    description:
      "Keeps hydration visible through progress, reminders, assistant nudges, and daily context.",
    entryRoute: "/progress",
    defaultAction: {
      label: "Log water",
      route: "/progress",
    },
    tone: "urgent",
    visibility: "global",
  },
  {
    id: "admin-helper",
    area: "admin",
    duties: ["explain", "navigate"],
    description:
      "Keeps operational tools understandable for roles that can access moderation and administration.",
    entryRoute: "/admin",
    defaultAction: {
      label: "Open admin tools",
      route: "/admin",
    },
    tone: "focused",
    visibility: "global",
  },
];

const normalizePathname = (pathname: string) => {
  const normalized = pathname.trim() || "/";

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
};

const matchesRoutePrefix = (pathname: string, prefix: string) =>
  prefix === "/" ? pathname === "/" : pathname.startsWith(prefix);

export const resolveAssistantArea = (pathname: string): AssistantArea => {
  const normalizedPathname = normalizePathname(pathname);

  return (
    assistantAreas.find((manifest) =>
      manifest.routePrefixes.some((prefix) =>
        matchesRoutePrefix(normalizedPathname, prefix)
      )
    )?.area ?? "unknown"
  );
};

export const getAssistantAreaManifest = (
  area: AssistantArea
): AssistantAreaManifest | null =>
  assistantAreas.find((manifest) => manifest.area === area) ?? null;

export const getAssistantCapabilitiesForArea = (
  area: AssistantArea
): AssistantCapability[] =>
  assistantCapabilities.filter((capability) => capability.area === area);

export const getAssistantDutiesForArea = (area: AssistantArea): AssistantDuty[] =>
  Array.from(
    new Set(
      getAssistantCapabilitiesForArea(area).flatMap(
        (capability) => capability.duties
      )
    )
  );

export const getAssistantPrimaryCapability = (
  area: AssistantArea
): AssistantCapability | null => getAssistantCapabilitiesForArea(area)[0] ?? null;

export const getAssistantDefaultAction = (
  area: AssistantArea
): AssistantDefaultAction | null => {
  const primaryCapability = getAssistantPrimaryCapability(area);

  if (primaryCapability) {
    return primaryCapability.defaultAction;
  }

  const manifest = getAssistantAreaManifest(area);

  return manifest?.defaultRoute
    ? {
        label: manifest.label,
        route: manifest.defaultRoute,
      }
    : null;
};

export const getAssistantToneForArea = (area: AssistantArea): AssistantTone =>
  getAssistantPrimaryCapability(area)?.tone ??
  getAssistantAreaManifest(area)?.tone ??
  "supportive";

export const getAssistantVisibilityForArea = (
  area: AssistantArea
): AssistantVisibility =>
  getAssistantPrimaryCapability(area)?.visibility ??
  getAssistantAreaManifest(area)?.visibility ??
  "hidden";

export const resolveAssistantCapabilities = (
  pathname: string
): AssistantCapability[] =>
  getAssistantCapabilitiesForArea(resolveAssistantArea(pathname));
