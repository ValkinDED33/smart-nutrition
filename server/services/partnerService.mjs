import { createHash, randomBytes } from "node:crypto";
import { StateApiError, createOpaqueToken, hashOneTimeToken } from "../lib/domain.mjs";

const PARTNER_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PARTNER_PERMISSION = "pregnancy_timeline";
const PREGNANCY_DAYS = 280;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);

const normalizePartnerSharing = (value) => {
  const record = isRecord(value) ? value : {};
  const invites = Array.isArray(record.invites) ? record.invites.filter(isRecord).slice(-10) : [];
  const links = Array.isArray(record.links) ? record.links.filter(isRecord).slice(-10) : [];

  return { invites, links };
};

const getInviteHash = (code, secret) =>
  hashOneTimeToken(`partner:${String(code ?? "").trim().toUpperCase()}`, secret);

const createInviteCode = () =>
  `SN-${randomBytes(4).toString("hex").toUpperCase()}`;

const createShareId = (prefix) => `${prefix}_${createOpaqueToken(12)}`;

const hasActivePregnancyLink = (links, partnerUserId, role) =>
  links.some(
    (link) =>
      link?.partnerUserId === partnerUserId &&
      link?.role === role &&
      link?.status !== "revoked" &&
      Array.isArray(link?.permissions) &&
      link.permissions.includes(PARTNER_PERMISSION)
  );

const upsertActiveLink = (links, link) => {
  if (hasActivePregnancyLink(links, link.partnerUserId, link.role)) {
    return links;
  }

  return [...links, link].slice(-10);
};

const pregnancySizes = [
  [4, "poppy_seed", "Tiny early changes are beginning."],
  [8, "raspberry", "Major systems are forming quickly."],
  [12, "lime", "Growth becomes easier to follow week by week."],
  [16, "avocado", "Movement and proportions become more recognizable."],
  [20, "banana", "The pregnancy is around the halfway point."],
  [24, "corn", "Steady growth and sensory development continue."],
  [28, "eggplant", "The third trimester is approaching or starting."],
  [32, "squash", "Growth, rest, and gentle routines matter more."],
  [36, "romaine", "The final weeks are focused on readiness and monitoring."],
  [40, "watermelon", "The due window is close; medical guidance leads."],
];

const getPregnancyMilestone = (week) => {
  if (!Number.isFinite(week) || week <= 0) {
    return null;
  }

  const [milestoneWeek, sizeKey, note] =
    [...pregnancySizes].reverse().find(([candidateWeek]) => week >= candidateWeek) ??
    pregnancySizes[0];

  return {
    milestoneWeek,
    sizeKey,
    note,
    disclaimer:
      "Educational estimate only. It is not a diagnosis, prescription, or replacement for clinician guidance.",
  };
};

const readDateTime = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const clampPregnancyWeek = (week) => Math.max(1, Math.min(42, Math.round(week)));

const getEffectivePregnancyWeek = (womenHealth, now = new Date()) => {
  if (typeof womenHealth.pregnancyWeek === "number" && Number.isFinite(womenHealth.pregnancyWeek)) {
    return clampPregnancyWeek(womenHealth.pregnancyWeek);
  }

  const nowTime = now.getTime();
  const dueTime = readDateTime(womenHealth.dueDate);

  if (dueTime !== null) {
    const elapsedWeeks = (PREGNANCY_DAYS - (dueTime - nowTime) / DAY_MS) / 7;

    if (Number.isFinite(elapsedWeeks) && elapsedWeeks >= 1 && elapsedWeeks <= 42) {
      return clampPregnancyWeek(elapsedWeeks);
    }
  }

  const lastPeriodTime = readDateTime(womenHealth.lastPeriodStartDate);

  if (lastPeriodTime !== null) {
    const elapsedWeeks = (nowTime - lastPeriodTime) / WEEK_MS;

    if (Number.isFinite(elapsedWeeks) && elapsedWeeks >= 1 && elapsedWeeks <= 42) {
      return clampPregnancyWeek(elapsedWeeks);
    }
  }

  return null;
};

const sanitizePregnancyShare = ({ ownerUser, ownerProfile }) => {
  const womenHealth = isRecord(ownerProfile?.womenHealth) ? ownerProfile.womenHealth : {};
  const week = getEffectivePregnancyWeek(womenHealth);

  return {
    owner: {
      id: ownerUser.id,
      name: ownerUser.name,
    },
    pregnancy: {
      mode: womenHealth.mode === "pregnant" ? "pregnant" : womenHealth.mode ?? "none",
      pregnancyWeek: week,
      dueDate: typeof womenHealth.dueDate === "string" ? womenHealth.dueDate : null,
      lastPeriodStartDate:
        typeof womenHealth.lastPeriodStartDate === "string"
          ? womenHealth.lastPeriodStartDate
          : null,
      updatedAt: typeof womenHealth.updatedAt === "string" ? womenHealth.updatedAt : null,
    },
    baby: getPregnancyMilestone(week),
  };
};

const requireProfile = async (stateRepository, user) => {
  const profile = await stateRepository.getProfileStateByUserId(user.id, user);

  if (!profile) {
    throw new StateApiError("PROFILE_NOT_FOUND", "Cloud profile is unavailable.");
  }

  return {
    ...profile,
    partnerSharing: normalizePartnerSharing(profile.partnerSharing),
  };
};

export const createPartnerService = ({ authRepository, stateRepository, config }) => {
  const secret = config.jwtSecret;

  const createInvite = async (currentUser) => {
    const ownerProfile = await requireProfile(stateRepository, currentUser);
    const womenHealth = isRecord(ownerProfile.womenHealth) ? ownerProfile.womenHealth : {};

    if (womenHealth.mode !== "pregnant" && womenHealth.mode !== "trying_to_conceive") {
      throw new StateApiError(
        "PARTNER_CONTEXT_REQUIRED",
        "Enable pregnancy or planning mode before creating a partner invite."
      );
    }

    const now = new Date();
    const code = createInviteCode();
    const invite = {
      id: createShareId("pinv"),
      codeHash: getInviteHash(code, secret),
      codePreview: code.slice(-4),
      permissions: [PARTNER_PERMISSION],
      expiresAt: new Date(now.getTime() + PARTNER_INVITE_TTL_MS).toISOString(),
      createdAt: now.toISOString(),
      acceptedAt: null,
    };

    const nextProfile = {
      ...ownerProfile,
      partnerSharing: {
        ...ownerProfile.partnerSharing,
        invites: [...ownerProfile.partnerSharing.invites, invite].slice(-10),
      },
    };

    await stateRepository.upsertProfileState(currentUser.id, nextProfile, undefined);
    await authRepository.createAuditLog?.({
      id: createShareId("audit"),
      userId: currentUser.id,
      action: "partner_invite_created",
      createdAt: now.toISOString(),
      metadata: { inviteId: invite.id, permissions: invite.permissions },
    });

    return {
      code,
      inviteUrl: `${config.appBaseUrl}/partner-invite?code=${encodeURIComponent(code)}`,
      expiresAt: invite.expiresAt,
      permissions: invite.permissions,
    };
  };

  const acceptInvite = async (currentUser, code) => {
    const normalizedCode = String(code ?? "").trim().toUpperCase();

    if (!/^SN-[A-Z0-9]{6,12}$/.test(normalizedCode)) {
      throw new StateApiError("INVALID_PARTNER_INVITE", "Partner invite code is invalid.");
    }

    const codeHash = getInviteHash(normalizedCode, secret);
    const now = new Date().toISOString();
    const users = await authRepository.listUsers();
    let ownerUser = null;
    let ownerProfile = null;
    let invite = null;

    for (const candidate of users) {
      if (!candidate?.id || candidate.id === currentUser.id) {
        continue;
      }

      const candidateProfile = await stateRepository.getProfileStateByUserId(candidate.id, candidate);
      const candidateSharing = normalizePartnerSharing(candidateProfile?.partnerSharing);
      const matchedInvite = candidateSharing.invites.find(
        (item) => item.codeHash === codeHash && !item.acceptedAt
      );

      if (matchedInvite) {
        ownerUser = candidate;
        ownerProfile = { ...candidateProfile, partnerSharing: candidateSharing };
        invite = matchedInvite;
        break;
      }
    }

    if (!ownerUser || !ownerProfile || !invite) {
      throw new StateApiError("PARTNER_INVITE_NOT_FOUND", "Partner invite was not found.");
    }

    if (Date.parse(invite.expiresAt) < Date.now()) {
      throw new StateApiError("PARTNER_INVITE_EXPIRED", "Partner invite has expired.");
    }

    const currentProfile = await requireProfile(stateRepository, currentUser);
    const linkId = createHash("sha256")
      .update(`${ownerUser.id}:${currentUser.id}:${PARTNER_PERMISSION}`)
      .digest("hex")
      .slice(0, 24);

    const ownerLink = {
      id: `plink_${linkId}`,
      partnerUserId: currentUser.id,
      role: "owner",
      permissions: [PARTNER_PERMISSION],
      status: "active",
      connectedAt: now,
      revokedAt: null,
    };
    const partnerLink = {
      id: `plink_${linkId}`,
      partnerUserId: ownerUser.id,
      role: "partner",
      permissions: [PARTNER_PERMISSION],
      status: "active",
      connectedAt: now,
      revokedAt: null,
    };

    const nextOwnerProfile = {
      ...ownerProfile,
      partnerSharing: {
        invites: ownerProfile.partnerSharing.invites.map((item) =>
          item.id === invite.id ? { ...item, acceptedAt: now } : item
        ),
        links: upsertActiveLink(ownerProfile.partnerSharing.links, ownerLink),
      },
    };
    const nextCurrentProfile = {
      ...currentProfile,
      partnerSharing: {
        ...currentProfile.partnerSharing,
        links: upsertActiveLink(currentProfile.partnerSharing.links, partnerLink),
      },
    };

    await stateRepository.upsertProfileState(ownerUser.id, nextOwnerProfile, undefined);
    await stateRepository.upsertProfileState(currentUser.id, nextCurrentProfile, undefined);
    await authRepository.createAuditLog?.({
      id: createShareId("audit"),
      userId: currentUser.id,
      action: "partner_invite_accepted",
      createdAt: now,
      metadata: { ownerUserId: ownerUser.id, permissions: [PARTNER_PERMISSION] },
    });

    return {
      ok: true,
      share: sanitizePregnancyShare({ ownerUser, ownerProfile: nextOwnerProfile }),
    };
  };

  const listPregnancyShares = async (currentUser) => {
    const currentProfile = await requireProfile(stateRepository, currentUser);
    const activePartnerLinks = currentProfile.partnerSharing.links.filter(
      (link) =>
        link.role === "partner" &&
        link.status !== "revoked" &&
        Array.isArray(link.permissions) &&
        link.permissions.includes(PARTNER_PERMISSION)
    );

    const items = [];

    for (const link of activePartnerLinks) {
      const ownerUser = await authRepository.findUserById(link.partnerUserId);

      if (!ownerUser) {
        continue;
      }

      const ownerProfile = await stateRepository.getProfileStateByUserId(ownerUser.id, ownerUser);
      items.push(sanitizePregnancyShare({ ownerUser, ownerProfile }));
    }

    return { items };
  };

  return {
    createInvite,
    acceptInvite,
    listPregnancyShares,
  };
};
