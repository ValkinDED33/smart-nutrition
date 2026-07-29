import { createHash, randomBytes } from "node:crypto";
import { StateApiError, createOpaqueToken, hashOneTimeToken } from "../lib/domain.mjs";

const PARTNER_INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PARTNER_PERMISSION = "pregnancy_timeline";
const PREGNANCY_DAYS = 280;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);

const normalizeEmail = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

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

const weeklyPregnancyDevelopment = [
  [4, "poppy_seed", 0.2, 0.1, "Implantation and very early development are underway."],
  [5, "sesame_seed", 0.4, 0.2, "The neural tube, early heart structures, and placenta are developing."],
  [6, "lentil", 0.6, 0.5, "The heartbeat may begin, and tiny limb buds start forming."],
  [7, "blueberry", 1.0, 1, "Brain, face, arms, and legs are changing quickly."],
  [8, "raspberry", 1.6, 2, "Major organs continue forming, and movement starts even if it cannot be felt."],
  [9, "cherry", 2.3, 2, "Fingers and toes are becoming more defined."],
  [10, "strawberry", 3.1, 4, "The early organ-building phase is settling into rapid growth."],
  [11, "fig", 4.1, 7, "Bones, skin, and facial features keep developing."],
  [12, "lime", 5.4, 14, "Reflexes and steady growth become easier to follow week by week."],
  [13, "lemon", 6.7, 73, "The second trimester is close; growth, movement, and proportions become clearer."],
  [14, "peach", 8.7, 93, "The baby is stretching more, and facial expressions begin to appear."],
  [15, "apple", 10.1, 118, "Hearing structures and bones continue to strengthen."],
  [16, "avocado", 11.6, 146, "Movement and proportions become more recognizable."],
  [17, "pear", 13.0, 181, "Fat stores start forming, helping future temperature regulation."],
  [18, "bell_pepper", 14.2, 223, "The nervous system and senses continue maturing."],
  [19, "mango", 15.3, 273, "Growth is steady, and protective vernix begins to form."],
  [20, "banana", 16.4, 331, "The pregnancy is around the halfway point."],
  [21, "carrot", 26.7, 399, "The baby is growing longer, and movements may become more noticeable."],
  [22, "papaya", 27.8, 478, "The lungs and senses are still developing; gentle routines matter."],
  [23, "grapefruit", 28.9, 568, "Hearing and movement continue to become more organized."],
  [24, "corn", 30.0, 670, "Steady growth and sensory development continue."],
  [25, "rutabaga", 34.6, 785, "The baby is gaining weight and practicing breathing motions."],
  [26, "scallion_bunch", 35.6, 913, "Eyes and sleep-wake rhythms continue developing."],
  [27, "cauliflower", 36.6, 1055, "The final week of the second trimester brings rapid brain growth."],
  [28, "eggplant", 37.6, 1210, "The third trimester is approaching or starting."],
  [29, "butternut_squash", 38.6, 1379, "Muscles, lungs, and brain keep maturing."],
  [30, "cabbage", 39.9, 1559, "Growth continues, and the baby may have stronger sleep cycles."],
  [31, "coconut", 41.1, 1751, "The baby keeps gaining fat and practicing important reflexes."],
  [32, "squash", 42.4, 1953, "Growth, rest, and gentle routines matter more."],
  [33, "pineapple", 43.7, 2162, "Bones are hardening, while the skull remains flexible for birth."],
  [34, "cantaloupe", 45.0, 2377, "The lungs continue maturing, and weight gain is steady."],
  [35, "honeydew", 46.2, 2595, "The baby is building reserves for the first weeks after birth."],
  [36, "romaine", 47.4, 2813, "The final weeks are focused on readiness and monitoring."],
  [37, "swiss_chard", 48.6, 3028, "The baby is considered early term; position and wellbeing matter."],
  [38, "leek", 49.8, 3236, "Organs are nearly ready, and weight continues increasing."],
  [39, "pumpkin", 50.7, 3435, "The due window is close; signs and clinician guidance lead."],
  [40, "watermelon", 51.2, 3619, "The due window is here; medical guidance leads."],
];

const getPregnancyWeekInfo = (week) => {
  if (!Number.isFinite(week) || week <= 0) {
    return null;
  }

  const normalizedWeek = Math.max(4, Math.min(40, Math.round(week)));
  const [milestoneWeek, sizeKey, lengthCm, weightG, note] =
    weeklyPregnancyDevelopment.find(([candidateWeek]) => candidateWeek === normalizedWeek) ??
    weeklyPregnancyDevelopment[weeklyPregnancyDevelopment.length - 1];

  return {
    milestoneWeek,
    sizeKey,
    lengthCm,
    weightG,
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

const clampPregnancyDay = (days) =>
  Math.max(0, Math.min(PREGNANCY_DAYS + 14, Math.floor(days)));

const getTrimester = (week) => {
  if (!Number.isFinite(week) || week <= 0) {
    return null;
  }

  if (week <= 13) {
    return 1;
  }

  if (week <= 27) {
    return 2;
  }

  return 3;
};

const getPregnancyMonth = (totalDays) => {
  if (!Number.isFinite(totalDays) || totalDays < 0) {
    return null;
  }

  return Math.max(1, Math.min(10, Math.floor(totalDays / 28) + 1));
};

const getPregnancyAge = (womenHealth, now = new Date()) => {
  const nowTime = now.getTime();
  const dueTime = readDateTime(womenHealth.dueDate);
  const lastPeriodTime = readDateTime(womenHealth.lastPeriodStartDate);
  let totalDays = null;

  if (
    typeof womenHealth.pregnancyWeek === "number" &&
    Number.isFinite(womenHealth.pregnancyWeek)
  ) {
    totalDays = clampPregnancyDay(clampPregnancyWeek(womenHealth.pregnancyWeek) * 7);
  } else if (dueTime !== null) {
    totalDays = clampPregnancyDay((nowTime - (dueTime - PREGNANCY_DAYS * DAY_MS)) / DAY_MS);
  } else if (lastPeriodTime !== null) {
    totalDays = clampPregnancyDay((nowTime - lastPeriodTime) / DAY_MS);
  }

  if (totalDays === null) {
    return null;
  }

  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const week = clampPregnancyWeek(Math.max(1, weeks));

  return {
    week,
    completedWeeks: weeks,
    days,
    totalDays,
    trimester: getTrimester(week),
    month: getPregnancyMonth(totalDays),
    daysRemaining:
      dueTime === null ? Math.max(0, PREGNANCY_DAYS - totalDays) : Math.max(0, Math.ceil((dueTime - nowTime) / DAY_MS)),
    asOfDate: now.toISOString(),
  };
};

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
  const age = getPregnancyAge(womenHealth);
  const week = age?.week ?? getEffectivePregnancyWeek(womenHealth);

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
    timeline: age,
    baby: getPregnancyWeekInfo(week),
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

export const createPartnerService = ({
  authRepository,
  stateRepository,
  emailService = null,
  config,
}) => {
  const secret = config.jwtSecret;

  const createInvite = async (currentUser, options = {}) => {
    const ownerProfile = await requireProfile(stateRepository, currentUser);
    const womenHealth = isRecord(ownerProfile.womenHealth) ? ownerProfile.womenHealth : {};
    const partnerEmail = normalizeEmail(options.partnerEmail);

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
    const inviteUrl = `${config.appBaseUrl}/partner-invite?code=${encodeURIComponent(code)}`;
    const emailDelivery = partnerEmail
      ? await emailService?.sendPartnerInviteEmail?.({
          to: partnerEmail,
          inviterName: currentUser.name,
          inviteUrl,
          code,
          expiresAt: invite.expiresAt,
        })
      : null;

    await authRepository.createAuditLog?.({
      id: createShareId("audit"),
      userId: currentUser.id,
      action: "partner_invite_created",
      createdAt: now.toISOString(),
      metadata: {
        inviteId: invite.id,
        permissions: invite.permissions,
        delivery: partnerEmail ? "email" : "manual",
        emailDelivered: emailDelivery?.ok ?? false,
      },
    });

    return {
      code,
      inviteUrl,
      expiresAt: invite.expiresAt,
      permissions: invite.permissions,
      email: partnerEmail
        ? {
            requested: true,
            delivered: Boolean(emailDelivery?.ok),
            target: partnerEmail,
            code: emailDelivery?.ok
              ? null
              : emailDelivery?.code ?? "EMAIL_NOT_CONFIGURED",
          }
        : {
            requested: false,
            delivered: false,
            target: null,
            code: null,
          },
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
