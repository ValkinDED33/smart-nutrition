import {
  getAssistantAreaManifest,
  getAssistantCapabilitiesForArea,
  getAssistantDefaultAction,
  getAssistantDutiesForArea,
  getAssistantPrimaryCapability,
  getAssistantToneForArea,
  getAssistantVisibilityForArea,
  resolveAssistantArea,
  type AssistantArea,
  type AssistantCapability,
  type AssistantDefaultAction,
  type AssistantDuty,
  type AssistantTone,
  type AssistantVisibility,
} from "./assistantManifest";

export interface AssistantContext {
  area: AssistantArea;
  duties: AssistantDuty[];
  capabilities: AssistantCapability[];
  primaryCapability: AssistantCapability | null;
  tone: AssistantTone;
  visibility: AssistantVisibility;
  defaultAction: AssistantDefaultAction | null;
  currentRoute: string;
  screenName: string;
}

const normalizeCurrentRoute = (pathname: string) => {
  const normalizedPathname = pathname.trim() || "/";

  return normalizedPathname.startsWith("/")
    ? normalizedPathname
    : `/${normalizedPathname}`;
};

export const resolveAssistantContext = (pathname: string): AssistantContext => {
  const currentRoute = normalizeCurrentRoute(pathname);
  const area = resolveAssistantArea(currentRoute);
  const capabilities = getAssistantCapabilitiesForArea(area);
  const primaryCapability = getAssistantPrimaryCapability(area);
  const areaManifest = getAssistantAreaManifest(area);

  return {
    area,
    duties: getAssistantDutiesForArea(area),
    capabilities,
    primaryCapability,
    tone: getAssistantToneForArea(area),
    visibility: getAssistantVisibilityForArea(area),
    defaultAction: getAssistantDefaultAction(area),
    currentRoute,
    screenName: areaManifest?.label ?? "Unknown",
  };
};

export const serializeAssistantDuties = (duties: AssistantDuty[]) =>
  duties.join(",");
