import type {
  FamilyLifecycleMode,
  PartnerSharingState,
  WomenHealthState,
} from "./types";

export const familyLifecycleModes: FamilyLifecycleMode[] = [
  "personal",
  "couple",
  "trying_to_conceive",
  "pregnant",
  "partner",
  "postpartum",
  "breastfeeding",
  "baby",
  "family",
];

export const isFamilyLifecycleMode = (value: unknown): value is FamilyLifecycleMode =>
  familyLifecycleModes.includes(value as FamilyLifecycleMode);

export const hasActivePregnancyPartnerLink = (partnerSharing: PartnerSharingState) =>
  partnerSharing.links.some(
    (link) =>
      link.status === "active" &&
      link.role === "partner" &&
      link.permissions.includes("pregnancy_timeline")
  );

const hasActiveOwnerFamilyLink = (partnerSharing: PartnerSharingState) =>
  partnerSharing.links.some(
    (link) =>
      link.status === "active" &&
      link.role === "owner" &&
      link.permissions.includes("pregnancy_timeline")
  );

export const resolveFamilyLifecycleMode = ({
  explicitMode,
  womenHealth,
  partnerSharing,
}: {
  explicitMode?: unknown;
  womenHealth: Pick<WomenHealthState, "mode">;
  partnerSharing: PartnerSharingState;
}): FamilyLifecycleMode => {
  if (womenHealth.mode === "pregnant") {
    return "pregnant";
  }

  if (womenHealth.mode === "trying_to_conceive") {
    return "trying_to_conceive";
  }

  if (womenHealth.mode === "postpartum") {
    return explicitMode === "breastfeeding" ? "breastfeeding" : "postpartum";
  }

  if (hasActivePregnancyPartnerLink(partnerSharing)) {
    return "partner";
  }

  if (isFamilyLifecycleMode(explicitMode)) {
    return explicitMode;
  }

  if (hasActiveOwnerFamilyLink(partnerSharing)) {
    return "couple";
  }

  return "personal";
};
