import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Activity, Ban, Bot, ClipboardList, Database, ShieldCheck, Trash2, Users } from "lucide-react";
import type { RootState } from "../../app/store";
import type {
  AccessOverview,
  AdminPlatformStats,
  AdminUserSummary,
  AuditLogEntry,
  CatalogProductItem,
  ContentReportItem,
} from "../../shared/types/platform";
import type { UserRole } from "@domain/user/types";
import {
  type AssignableUserRole,
  canAccessAdminCenter,
  getAssignableRolesForActor,
  isProtectedOwnerRole,
  roleLabels as userRoleLabels,
} from "@domain/user/roles";
import {
  PlatformApiError,
  deleteAdminUser,
  getAdminPlatformStats,
  getPlatformAccessOverview,
  listAdminUsers,
  listAuditLogs,
  listContentReports,
  listModerationQueue,
  reviewCatalogSubmission,
  updateAdminUserBan,
  updateAdminUserRole,
} from "../../shared/api/platform";
import { useLanguage } from "../../shared/language";
import type { AppLanguage } from "../../shared/types/i18n";
import { AIMasterBlueprintPanel, type AIMasterBlueprintPattern } from "../../shared/ui";
import { getNutrientLabel } from "@domain/meal/nutrients";
import { getAssistantDisplayName } from "@features/assistant/assistantDisplayName";

type AdminTab = "reports" | "queue" | "stats" | "users" | "audit" | "system";

const ADMIN_CENTER_TITLE = "Admin Center";
const ANALYTICS_LABEL = "Analytics";
const REPORTS_LABEL = "Reports";
const CONTENT_LABEL = "Content";
const AI_CONTROLS_LABEL = "AI controls";
const SYSTEM_LOGS_LABEL = "System logs";
const UK_USERS_LABEL = "Користувачі";
const PL_REPORTS_LABEL = "Zgłoszenia";
const PL_USERS_LABEL = "Użytkownicy";
const ADMIN_FOUR_COLUMN_GRID = "repeat(4, minmax(0, 1fr))";
const ADMIN_TWO_COLUMN_GRID = "repeat(2, minmax(0, 1fr))";
const ADMIN_SOFT_BORDER = "1px solid var(--sn-border-soft)";

const formatAdminMacro = (
  key: "protein" | "fat" | "carbs",
  value: number,
  language: AppLanguage
) => `${getNutrientLabel(key, language)} ${value}`;

const adminCopy = {
  uk: {
    title: ADMIN_CENTER_TITLE,
    subtitle:
      "Модерація продуктів, ролі користувачів і журнал дій для командного контролю.",
    backendUnavailable:
      "Хмарні дані тимчасово недоступні, тому адмін-центр зараз не може підвантажити інформацію.",
    tabs: {
      reports: "Скарги",
      queue: "Модерація",
      stats: "Статистика",
      users: UK_USERS_LABEL,
      audit: "Аудит",
      system: "Система",
    },
    statsTitle: "Платформа",
    statsSubtitle: "Ключові показники користувачів, AI і каталогу.",
    usersTotal: UK_USERS_LABEL,
    usersActive: "Активні",
    usersOnline: "Онлайн зараз",
    usersNewThisWeek: "Нові за тиждень",
    usersBanned: "Заблоковані",
    aiRequestsTotal: "AI-запити",
    productsTotal: "Продукти",
    productsPending: "На модерації",
    photoAnalysesTotal: "Фото-аналіз",
    suspiciousAccounts: "Підозрілі акаунти",
    moderationTitle: "Модерація",
    reportsLabel: "Скарги",
    contentLabel: "Контент",
    photoAnalytics: "Фото-аналітика",
    suspicious: "Підозрілі акаунти",
    systemTitle: "Операційний центр",
    systemSubtitle:
      "Аналітика, reports, content management, AI controls і системні логи в одному місці.",
    analytics: ANALYTICS_LABEL,
    reports: REPORTS_LABEL,
    content: CONTENT_LABEL,
    aiControls: AI_CONTROLS_LABEL,
    systemLogs: SYSTEM_LOGS_LABEL,
    activeUsers: UK_USERS_LABEL,
    publicProducts: "Продукти на перевірці",
    openReports: "Скарги",
    aiPolicy: "AI відповідає як wellness companion, без медичних діагнозів і з м'якими попередженнями.",
    logsReady: "Події ролей, модерації та блокувань вже пишуться в audit log.",
    pendingEmpty: "Черга модерації зараз порожня.",
    reportsEmpty: "Нових скарг зараз немає.",
    approve: "Підтвердити",
    reject: "Відхилити",
    role: "Роль",
    applyRole: "Застосувати",
    ban: "Заблокувати",
    unban: "Розблокувати",
    deleteUser: "Видалити",
    usersPanelTitle: "Стан акаунтів",
    usersPanelSubtitle:
      "Операційне зведення з хмари: онлайн, підтвердження email і акаунти, які потребують уваги.",
    verifiedUsers: "Email підтверджено",
    pendingEmailUsers: "Email очікує",
    attentionUsers: "Потребують уваги",
    protectedUsers: "Захищені ролі",
    active: "Активний",
    offline: "Офлайн",
    accountCreated: "Створено",
    lastSession: "Остання сесія",
    noSession: "Сесій ще немає",
    emailStatus: "Email",
    emailConfirmed: "Підтверджено",
    emailPending: "Очікує підтвердження",
    security: "Безпека",
    banReason: "Причина",
    bannedAt: "Дата блокування",
    confirmDelete: "Видалити користувача? Цю дію не можна скасувати.",
    banned: "Заблоковано",
    twoFactor: "2FA",
    required: "Потрібно",
    optional: "Опційно",
    noAudit: "Журнал дій порожній.",
  },
  pl: {
    title: ADMIN_CENTER_TITLE,
    subtitle:
      "Moderacja produktów, role użytkowników i dziennik działań do kontroli zespołowej.",
    backendUnavailable:
      "Dane w chmurze są chwilowo niedostępne, więc centrum administracyjne nie może teraz pobrać informacji.",
    tabs: {
      reports: PL_REPORTS_LABEL,
      queue: "Moderacja",
      stats: "Statystyka",
      users: PL_USERS_LABEL,
      audit: "Audyt",
      system: "System",
    },
    statsTitle: "Platforma",
    statsSubtitle: "Kluczowe wskaźniki użytkowników, AI i katalogu.",
    usersTotal: PL_USERS_LABEL,
    usersActive: "Aktywni",
    usersOnline: "Online teraz",
    usersNewThisWeek: "Nowi w tygodniu",
    usersBanned: "Zablokowani",
    aiRequestsTotal: "Zapytania AI",
    productsTotal: "Produkty",
    productsPending: "W moderacji",
    photoAnalysesTotal: "Analiza zdjęć",
    suspiciousAccounts: "Podejrzane konta",
    moderationTitle: "Moderacja",
    reportsLabel: PL_REPORTS_LABEL,
    contentLabel: "Treści",
    photoAnalytics: "Analiza zdjęć",
    suspicious: "Podejrzane konta",
    systemTitle: "Centrum operacyjne",
    systemSubtitle:
      "Analityka, reports, content management, AI controls i logi systemowe w jednym miejscu.",
    analytics: ANALYTICS_LABEL,
    reports: REPORTS_LABEL,
    content: CONTENT_LABEL,
    aiControls: AI_CONTROLS_LABEL,
    systemLogs: SYSTEM_LOGS_LABEL,
    activeUsers: PL_USERS_LABEL,
    publicProducts: "Produkty do sprawdzenia",
    openReports: PL_REPORTS_LABEL,
    aiPolicy: "AI odpowiada jak wellness companion, bez diagnoz medycznych i z łagodnymi ostrzeżeniami.",
    logsReady: "Zdarzenia ról, moderacji i blokad są już zapisywane w audit logu.",
    pendingEmpty: "Kolejka moderacji jest teraz pusta.",
    reportsEmpty: "Nie ma teraz nowych zgłoszeń.",
    approve: "Zatwierdź",
    reject: "Odrzuć",
    role: "Rola",
    applyRole: "Zastosuj",
    ban: "Zablokuj",
    unban: "Odblokuj",
    deleteUser: "Usuń",
    usersPanelTitle: "Stan kont",
    usersPanelSubtitle:
      "Operacyjny przegląd z chmury: online, potwierdzenie email i konta wymagające uwagi.",
    verifiedUsers: "Email potwierdzony",
    pendingEmailUsers: "Email oczekuje",
    attentionUsers: "Wymagają uwagi",
    protectedUsers: "Role chronione",
    active: "Aktywne",
    offline: "Offline",
    accountCreated: "Utworzono",
    lastSession: "Ostatnia sesja",
    noSession: "Brak sesji",
    emailStatus: "Email",
    emailConfirmed: "Potwierdzony",
    emailPending: "Czeka na potwierdzenie",
    security: "Bezpieczeństwo",
    banReason: "Powód",
    bannedAt: "Data blokady",
    confirmDelete: "Usunąć użytkownika? Tej akcji nie można cofnąć.",
    banned: "Zablokowane",
    twoFactor: "2FA",
    required: "Wymagane",
    optional: "Opcjonalne",
    noAudit: "Dziennik działań jest pusty.",
  },
  en: {
    title: ADMIN_CENTER_TITLE,
    subtitle:
      "Product moderation, user roles, and audit logs for team control.",
    backendUnavailable:
      "Cloud data is temporarily unavailable, so Admin Center cannot load information right now.",
    tabs: {
      reports: "Reports",
      queue: "Moderation",
      stats: "Stats",
      users: "Users",
      audit: "Audit",
      system: "System",
    },
    statsTitle: "Platform",
    statsSubtitle: "Key indicators for users, AI, and catalog.",
    usersTotal: "Users",
    usersActive: "Active",
    usersOnline: "Online now",
    usersNewThisWeek: "New this week",
    usersBanned: "Banned",
    aiRequestsTotal: "AI requests",
    productsTotal: "Products",
    productsPending: "Pending moderation",
    photoAnalysesTotal: "Photo analysis",
    suspiciousAccounts: "Suspicious accounts",
    moderationTitle: "Moderation",
    reportsLabel: REPORTS_LABEL,
    contentLabel: CONTENT_LABEL,
    photoAnalytics: "Photo analytics",
    suspicious: "Suspicious accounts",
    systemTitle: "Operations center",
    systemSubtitle:
      "Analytics, reports, content management, AI controls, and system logs in one place.",
    analytics: ANALYTICS_LABEL,
    reports: REPORTS_LABEL,
    content: CONTENT_LABEL,
    aiControls: AI_CONTROLS_LABEL,
    systemLogs: SYSTEM_LOGS_LABEL,
    activeUsers: "Users",
    publicProducts: "Products to review",
    openReports: REPORTS_LABEL,
    aiPolicy:
      "AI responds as a wellness companion, without medical diagnoses and with gentle warnings.",
    logsReady: "Role, moderation, and ban events are already written to audit log.",
    pendingEmpty: "Moderation queue is empty right now.",
    reportsEmpty: "There are no new reports right now.",
    approve: "Approve",
    reject: "Reject",
    role: "Role",
    applyRole: "Apply",
    ban: "Ban",
    unban: "Unban",
    deleteUser: "Delete",
    usersPanelTitle: "Account state",
    usersPanelSubtitle:
      "Cloud-backed operations summary: online, email confirmation, and accounts needing attention.",
    verifiedUsers: "Email confirmed",
    pendingEmailUsers: "Email pending",
    attentionUsers: "Needs attention",
    protectedUsers: "Protected roles",
    active: "Active",
    offline: "Offline",
    accountCreated: "Created",
    lastSession: "Last session",
    noSession: "No sessions yet",
    emailStatus: "Email",
    emailConfirmed: "Confirmed",
    emailPending: "Pending confirmation",
    security: "Security",
    banReason: "Reason",
    bannedAt: "Banned at",
    confirmDelete: "Delete this user? This action cannot be undone.",
    banned: "Banned",
    twoFactor: "2FA",
    required: "Required",
    optional: "Optional",
    noAudit: "Audit log is empty.",
  },
} as const;

const adminLocaleByLanguage: Record<AppLanguage, string> = {
  uk: "uk-UA",
  pl: "pl-PL",
  en: "en-US",
};

const getAdminCopy = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return adminCopy.uk;
    case "pl":
      return adminCopy.pl;
    case "en":
      return adminCopy.en;
  }
};

const getAdminLocale = (language: AppLanguage) => {
  switch (language) {
    case "uk":
      return adminLocaleByLanguage.uk;
    case "pl":
      return adminLocaleByLanguage.pl;
    case "en":
      return adminLocaleByLanguage.en;
  }
};

const getAdminTabLabel = (
  tabs: (typeof adminCopy)[AppLanguage]["tabs"],
  tabId: AdminTab
) => {
  switch (tabId) {
    case "reports":
      return tabs.reports;
    case "queue":
      return tabs.queue;
    case "stats":
      return tabs.stats;
    case "users":
      return tabs.users;
    case "audit":
      return tabs.audit;
    case "system":
      return tabs.system;
  }
};

const getUserRoleLabel = (role: UserRole) => {
  switch (role) {
    case "USER":
      return userRoleLabels.USER;
    case "VERIFIED_USER":
      return userRoleLabels.VERIFIED_USER;
    case "HELPER":
      return userRoleLabels.HELPER;
    case "NUTRITIONIST":
      return userRoleLabels.NUTRITIONIST;
    case "MODERATOR":
      return userRoleLabels.MODERATOR;
    case "ADMIN":
      return userRoleLabels.ADMIN;
    case "OWNER":
      return userRoleLabels.OWNER;
    case "SUPER_ADMIN":
      return userRoleLabels.SUPER_ADMIN;
  }
};

const formatDateTime = (value: string, language: AppLanguage) =>
  new Date(value).toLocaleString(getAdminLocale(language), {
    dateStyle: "short",
    timeStyle: "short",
  });

const formatOptionalDateTime = (
  value: string | null | undefined,
  language: AppLanguage,
  fallback: string
) => (value ? formatDateTime(value, language) : fallback);

const assignableRoleValues: AssignableUserRole[] = [
  "USER",
  "HELPER",
  "MODERATOR",
  "ADMIN",
];

const toAssignableRole = (role: UserRole): AssignableUserRole =>
  assignableRoleValues.includes(role as AssignableUserRole)
    ? (role as AssignableUserRole)
    : "USER";

const getVisibleAdminTabs = (access: AccessOverview | null): AdminTab[] => {
  if (!access) {
    return [];
  }

  return [
    access.permissions.reviewReports ? "reports" : null,
    access.permissions.reviewCatalog ? "queue" : null,
    access.permissions.manageSystem ? "stats" : null,
    access.permissions.manageModerators || access.permissions.manageAdmins
      ? "users"
      : null,
    access.permissions.viewAuditLogs ? "audit" : null,
    access.permissions.manageAdmins ? "system" : null,
  ].filter(Boolean) as AdminTab[];
};

const createRoleDrafts = (users: AdminUserSummary[]) =>
  new Map(
    users
      .filter((item) => !isProtectedOwnerRole(item.role))
      .map((item) => [item.id, toAssignableRole(item.role)])
  );

const getRoleDraft = (
  roleDrafts: Map<string, AssignableUserRole>,
  user: AdminUserSummary
) => roleDrafts.get(user.id) ?? toAssignableRole(user.role);

const getPlatformStatsCards = ({
  copy,
  stats,
  users,
  queue,
}: {
  copy: ReturnType<typeof getAdminCopy>;
  stats: AdminPlatformStats | null;
  users: AdminUserSummary[];
  queue: CatalogProductItem[];
}) => [
  { label: copy.usersTotal, value: stats?.usersTotal ?? users.length },
  { label: copy.usersActive, value: stats?.usersActive ?? 0 },
  {
    label: copy.usersOnline,
    value: stats?.usersOnline ?? users.filter((user) => user.hasActiveSession).length,
  },
  { label: copy.usersNewThisWeek, value: stats?.usersNewThisWeek ?? 0 },
  { label: copy.usersBanned, value: stats?.usersBanned ?? 0 },
  { label: copy.aiRequestsTotal, value: stats?.aiRequestsTotal ?? 0 },
  { label: copy.productsTotal, value: stats?.productsTotal ?? 0 },
  { label: copy.productsPending, value: stats?.productsPending ?? queue.length },
  { label: copy.photoAnalysesTotal, value: stats?.photoAnalysesTotal ?? 0 },
];

const getModerationStatsCards = ({
  copy,
  stats,
  queue,
}: {
  copy: ReturnType<typeof getAdminCopy>;
  stats: AdminPlatformStats | null;
  queue: CatalogProductItem[];
}) => [
  { label: copy.reportsLabel, value: stats?.reportsOpen ?? 0 },
  { label: copy.contentLabel, value: stats?.productsPending ?? queue.length },
  { label: copy.photoAnalytics, value: stats?.photoAnalysesTotal ?? 0 },
  { label: copy.suspicious, value: stats?.suspiciousAccounts ?? 0 },
];

const getAdminUserHealthCards = ({
  copy,
  stats,
  users,
}: {
  copy: ReturnType<typeof getAdminCopy>;
  stats: AdminPlatformStats | null;
  users: AdminUserSummary[];
}) => {
  const bannedCount = stats?.usersBanned ?? users.filter((user) => user.isBanned).length;
  const pendingEmailCount = users.filter((user) => !user.emailVerified).length;
  const protectedRoleCount = users.filter((user) => isProtectedOwnerRole(user.role)).length;

  return [
    { label: copy.usersTotal, value: stats?.usersTotal ?? users.length },
    {
      label: copy.usersOnline,
      value: stats?.usersOnline ?? users.filter((user) => user.hasActiveSession).length,
    },
    {
      label: copy.verifiedUsers,
      value: users.filter((user) => user.emailVerified).length,
    },
    { label: copy.pendingEmailUsers, value: pendingEmailCount },
    { label: copy.usersBanned, value: bannedCount },
    {
      label: copy.attentionUsers,
      value: bannedCount + pendingEmailCount,
    },
    { label: copy.protectedUsers, value: protectedRoleCount },
  ];
};

export const AdminCenterCard = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const assistant = useSelector((state: RootState) => state.profile.assistant);
  const { appLanguage } = useLanguage();
  const copy = getAdminCopy(appLanguage);
  const assistantDisplayName = getAssistantDisplayName(assistant.name, appLanguage);
  const backendUnavailableMessage = copy.backendUnavailable;
  const [tab, setTab] = useState<AdminTab>("reports");
  const [access, setAccess] = useState<AccessOverview | null>(null);
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [queue, setQueue] = useState<CatalogProductItem[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [reports, setReports] = useState<ContentReportItem[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Map<string, AssignableUserRole>>(
    () => new Map()
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const nextAccess = await getPlatformAccessOverview();

        if (!active) {
          return;
        }

        setAccess(nextAccess);
        setError(null);

        if (nextAccess.permissions.manageSystem) {
          const nextStats = await getAdminPlatformStats();

          if (active) {
            setStats(nextStats);
          }
        }

        if (nextAccess.permissions.reviewCatalog) {
          const queueItems = await listModerationQueue();

          if (active) {
            setQueue(queueItems);
          }
        }

        if (nextAccess.permissions.reviewReports) {
          const reportItems = await listContentReports();

          if (active) {
            setReports(reportItems);
          }
        }

        if (nextAccess.permissions.manageModerators || nextAccess.permissions.manageAdmins) {
          const userItems = await listAdminUsers();

          if (active) {
            setUsers(userItems);
            setRoleDrafts(createRoleDrafts(userItems));
          }
        }

        if (nextAccess.permissions.viewAuditLogs) {
          const auditItems = await listAuditLogs();

          if (active) {
            setAudit(auditItems);
          }
        }
      } catch (nextError) {
        if (active) {
          setError(
            nextError instanceof PlatformApiError
              ? nextError.message
              : backendUnavailableMessage
          );
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [backendUnavailableMessage]);

  if (!currentUser || !canAccessAdminCenter(currentUser.role)) {
    return null;
  }

  const allowedRoles = getAssignableRolesForActor(access?.role ?? currentUser.role);
  const visibleTabs = getVisibleAdminTabs(access);
  const activeTab = visibleTabs.includes(tab) ? tab : (visibleTabs[0] ?? "reports");
  const adminBlueprintPatterns: AIMasterBlueprintPattern[] = [
    {
      key: "stats",
      label: copy.tabs.stats,
      description: `${copy.usersOnline}, ${copy.aiRequestsTotal}, ${copy.productsPending}`,
      icon: Activity,
      accent: "#22d3ee",
      onClick: () => setTab("stats"),
    },
    {
      key: "users",
      label: copy.tabs.users,
      description: copy.usersPanelSubtitle,
      icon: Users,
      accent: "#10b981",
      onClick: () => setTab("users"),
    },
    {
      key: "queue",
      label: copy.tabs.queue,
      description: `${copy.publicProducts}, ${copy.contentLabel}, ${copy.photoAnalytics}`,
      icon: ClipboardList,
      accent: "#84cc16",
      onClick: () => setTab("queue"),
    },
    {
      key: "reports",
      label: copy.tabs.reports,
      description: `${copy.openReports}, ${copy.suspicious}, ${copy.security}`,
      icon: ShieldCheck,
      accent: "#f59e0b",
      onClick: () => setTab("reports"),
    },
    {
      key: "audit",
      label: copy.tabs.audit,
      description: copy.logsReady,
      icon: Database,
      accent: "#a78bfa",
      onClick: () => setTab("audit"),
    },
    {
      key: "system",
      label: copy.tabs.system,
      description: copy.aiPolicy,
      icon: Bot,
      accent: "#f472b6",
      onClick: () => setTab("system"),
    },
  ].filter((pattern) => visibleTabs.includes(pattern.key as AdminTab));
  const latestAudit = audit[0];
  const handlePlatformMutationError = (nextError: unknown) => {
    setError(
      nextError instanceof PlatformApiError
        ? nextError.message
        : backendUnavailableMessage
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: ADMIN_SOFT_BORDER,
        backgroundColor: "var(--sn-surface-glass)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h6" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {access && (
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label={getUserRoleLabel(access.role)} color="primary" />
            <Chip
              label={`${copy.twoFactor}: ${access.twoFactorRequired ? copy.required : copy.optional}`}
              variant="outlined"
            />
          </Stack>
        )}

        {error && <Alert severity="warning">{error}</Alert>}

        {adminBlueprintPatterns.length > 0 && (
          <AIMasterBlueprintPanel
            eyebrow={copy.systemTitle}
            title={copy.usersPanelTitle}
            description={copy.systemSubtitle}
            patterns={adminBlueprintPatterns}
            assistantName={assistantDisplayName}
            assistantVariant={assistant.companionKind}
          />
        )}

        {visibleTabs.length > 0 && (
          <Tabs
            value={activeTab}
            onChange={(_, value: AdminTab) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {visibleTabs.map((tabId) => (
              <Tab key={tabId} value={tabId} label={getAdminTabLabel(copy.tabs, tabId)} />
            ))}
          </Tabs>
        )}

        {activeTab === "stats" && access?.permissions.manageSystem && (
          <Stack spacing={1.4}>
            <Stack spacing={0.3}>
              <Typography sx={{ fontWeight: 900 }}>{copy.statsTitle}</Typography>
              <Typography color="text.secondary">{copy.statsSubtitle}</Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: ADMIN_TWO_COLUMN_GRID,
                  lg: ADMIN_FOUR_COLUMN_GRID,
                },
                gap: 1.2,
              }}
            >
              {getPlatformStatsCards({ copy, stats, users, queue }).map(({ label, value }) => (
                <Box
                  key={label}
                  className="sn-premium-panel"
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: ADMIN_SOFT_BORDER,
                  }}
                >
                  <Typography color="text.secondary" variant="body2">
                    {label}
                  </Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: 26 }}>{value}</Typography>
                </Box>
              ))}
            </Box>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: ADMIN_FOUR_COLUMN_GRID },
                gap: 1.2,
              }}
            >
              {getModerationStatsCards({ copy, stats, queue }).map(({ label, value }) => (
                <Alert key={label} severity={Number(value) > 0 ? "warning" : "info"}>
                  <strong>{label}</strong>: {value}
                </Alert>
              ))}
            </Box>
          </Stack>
        )}

        {activeTab === "reports" && access?.permissions.reviewReports && (
          <Stack spacing={1.2}>
            {reports.length === 0 ? (
              <Alert severity="info">{copy.reportsEmpty}</Alert>
            ) : (
              reports.map((report) => (
                <Paper key={report.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 900 }}>
                      {report.targetType} · {report.reporterName}
                    </Typography>
                    <Typography color="text.secondary">{report.reason}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {formatDateTime(report.createdAt, appLanguage)}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {activeTab === "queue" && access?.permissions.reviewCatalog && (
          <Stack spacing={1.2}>
            {queue.length === 0 ? (
              <Alert severity="info">{copy.pendingEmpty}</Alert>
            ) : (
              queue.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.2}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      {item.imageUrl ? (
                        <Box
                          component="img"
                          src={item.imageUrl}
                          alt={item.name}
                          sx={{
                            width: { xs: "100%", sm: 96 },
                            height: 72,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: "1px solid rgba(15, 23, 42, 0.12)",
                          }}
                        />
                      ) : null}
                      <Stack spacing={0.4}>
                        <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                        <Typography color="text.secondary">
                          {item.category ?? item.brand ?? "Manual"}
                        </Typography>
                        {item.barcode ? (
                          <Typography color="text.secondary" variant="body2">
                            {item.barcode}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip label={`${item.nutrients.calories} kcal`} size="small" />
                      <Chip
                        label={formatAdminMacro("protein", item.nutrients.protein, appLanguage)}
                        size="small"
                      />
                      <Chip
                        label={formatAdminMacro("fat", item.nutrients.fat, appLanguage)}
                        size="small"
                      />
                      <Chip
                        label={formatAdminMacro("carbs", item.nutrients.carbs, appLanguage)}
                        size="small"
                      />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        onClick={() => {
                          void reviewCatalogSubmission(item.id, { decision: "approve" })
                            .then((updatedItem) => {
                              setQueue((current) =>
                                current.map((entry) =>
                                  entry.id === updatedItem.id ? updatedItem : entry
                                )
                              );
                              setError(null);
                            })
                            .catch(handlePlatformMutationError);
                        }}
                      >
                        {copy.approve}
                      </Button>
                      <Button
                        color="error"
                        onClick={() => {
                          void reviewCatalogSubmission(item.id, { decision: "reject" })
                            .then((updatedItem) => {
                              setQueue((current) =>
                                current.map((entry) =>
                                  entry.id === updatedItem.id ? updatedItem : entry
                                )
                              );
                              setError(null);
                            })
                            .catch(handlePlatformMutationError);
                        }}
                      >
                        {copy.reject}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {activeTab === "users" && (access?.permissions.manageModerators || access?.permissions.manageAdmins) && (
          <Stack spacing={1.2}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <Stack spacing={1.2}>
                <Stack spacing={0.3}>
                  <Typography sx={{ fontWeight: 900 }}>{copy.usersPanelTitle}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {copy.usersPanelSubtitle}
                  </Typography>
                </Stack>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: {
                      xs: ADMIN_TWO_COLUMN_GRID,
                      md: ADMIN_FOUR_COLUMN_GRID,
                    },
                  }}
                >
                  {getAdminUserHealthCards({ copy, stats, users }).map(({ label, value }) => (
                    <Box
                      key={label}
                      sx={{
                        p: 1.2,
                        borderRadius: 1,
                        border: ADMIN_SOFT_BORDER,
                        backgroundColor: "var(--sn-surface-glass)",
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: 22 }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </Paper>

            {users.map((user) => (
              <Paper key={user.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                {(() => {
                  const roleDraft = getRoleDraft(roleDrafts, user);
                  const roleOptions = allowedRoles.includes(roleDraft)
                    ? allowedRoles
                    : [roleDraft, ...allowedRoles];
                  const canChangeRole =
                    user.id !== currentUser.id &&
                    !isProtectedOwnerRole(user.role) &&
                    allowedRoles.length > 0 &&
                    (access?.permissions.manageAdmins || user.role !== "ADMIN");

                  return (
                    <Stack spacing={1.4}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        justifyContent="space-between"
                        alignItems={{ xs: "stretch", sm: "flex-start" }}
                      >
                        <Stack spacing={0.3}>
                          <Typography sx={{ fontWeight: 850 }}>{user.name}</Typography>
                          <Typography color="text.secondary" variant="body2">
                            {user.email}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                          <Chip
                            color={user.isBanned ? "error" : "success"}
                            label={user.isBanned ? copy.banned : copy.active}
                          />
                          <Chip
                            color={user.hasActiveSession ? "success" : "default"}
                            label={user.hasActiveSession ? copy.usersOnline : copy.offline}
                            variant={user.hasActiveSession ? "filled" : "outlined"}
                          />
                        </Stack>
                      </Stack>

                      <Box
                        sx={{
                          display: "grid",
                          gap: 1,
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: ADMIN_TWO_COLUMN_GRID,
                            lg: "repeat(4, minmax(0, 1fr))",
                          },
                        }}
                      >
                        {[
                          [copy.accountCreated, formatDateTime(user.createdAt, appLanguage)],
                          [
                            copy.lastSession,
                            formatOptionalDateTime(
                              user.lastSessionAt,
                              appLanguage,
                              copy.noSession
                            ),
                          ],
                          [
                            copy.emailStatus,
                            user.emailVerified ? copy.emailConfirmed : copy.emailPending,
                          ],
                          [
                            copy.security,
                            user.twoFactorEnabled || user.twoFactorRequired
                              ? `${copy.twoFactor}: ${
                                  user.twoFactorRequired ? copy.required : copy.optional
                                }`
                              : `${copy.twoFactor}: ${copy.optional}`,
                          ],
                        ].map(([label, value]) => (
                          <Box key={label}>
                            <Typography variant="caption" color="text.secondary">
                              {label}
                            </Typography>
                            <Typography sx={{ fontWeight: 800 }}>{value}</Typography>
                          </Box>
                        ))}
                      </Box>

                      {user.isBanned && (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                          <Stack spacing={0.3}>
                            {user.bannedAt && (
                              <Typography variant="body2">
                                {copy.bannedAt}:{" "}
                                {formatDateTime(user.bannedAt, appLanguage)}
                              </Typography>
                            )}
                            {user.bannedReason && (
                              <Typography variant="body2">
                                {copy.banReason}: {user.bannedReason}
                              </Typography>
                            )}
                          </Stack>
                        </Alert>
                      )}

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                        <TextField
                          select
                          size="small"
                          label={copy.role}
                          value={roleDraft}
                          disabled={!canChangeRole}
                          onChange={(event) =>
                            setRoleDrafts((current) => {
                              const next = new Map(current);
                              next.set(user.id, event.target.value as AssignableUserRole);

                              return next;
                            })
                          }
                          sx={{ minWidth: 180 }}
                        >
                          {roleOptions.map((role) => (
                            <MenuItem key={role} value={role}>
                              {getUserRoleLabel(role)}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          disabled={!canChangeRole}
                          startIcon={<ShieldCheck size={16} />}
                          onClick={() => {
                            void updateAdminUserRole(user.id, roleDraft)
                              .then((updatedUser) => {
                                setUsers((current) =>
                                  current.map((entry) =>
                                    entry.id === updatedUser.id ? updatedUser : entry
                                  )
                                );
                                setError(null);
                              })
                              .catch(handlePlatformMutationError);
                          }}
                        >
                          {copy.applyRole}
                        </Button>
                        {access?.permissions.banUsers && (
                          <Button
                            color={user.isBanned ? "success" : "error"}
                            disabled={
                              user.id === currentUser.id || isProtectedOwnerRole(user.role)
                            }
                            startIcon={<Ban size={16} />}
                            onClick={() => {
                              void updateAdminUserBan(user.id, {
                                banned: !user.isBanned,
                                reason: "Admin moderation action",
                              })
                                .then((updatedUser) => {
                                  setUsers((current) =>
                                    current.map((entry) =>
                                      entry.id === updatedUser.id ? updatedUser : entry
                                    )
                                  );
                                  setError(null);
                                })
                                .catch(handlePlatformMutationError);
                            }}
                          >
                            {user.isBanned ? copy.unban : copy.ban}
                          </Button>
                        )}
                        {access?.permissions.manageAdmins && (
                          <Button
                            color="error"
                            disabled={
                              user.id === currentUser.id || isProtectedOwnerRole(user.role)
                            }
                            startIcon={<Trash2 size={16} />}
                            onClick={() => {
                              if (!window.confirm(copy.confirmDelete)) {
                                return;
                              }

                              void deleteAdminUser(user.id)
                                .then(() => {
                                  setUsers((current) =>
                                    current.filter((entry) => entry.id !== user.id)
                                  );
                                  setStats((current) =>
                                    current
                                      ? {
                                          ...current,
                                          usersTotal: Math.max(current.usersTotal - 1, 0),
                                          usersActive: user.isBanned
                                            ? current.usersActive
                                            : Math.max(current.usersActive - 1, 0),
                                          usersBanned: user.isBanned
                                            ? Math.max(current.usersBanned - 1, 0)
                                            : current.usersBanned,
                                          usersOnline: user.hasActiveSession
                                            ? Math.max(current.usersOnline - 1, 0)
                                            : current.usersOnline,
                                        }
                                      : current
                                  );
                                  setError(null);
                                })
                                .catch(handlePlatformMutationError);
                            }}
                          >
                            {copy.deleteUser}
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  );
                })()}
              </Paper>
            ))}
          </Stack>
        )}

        {activeTab === "audit" && access?.permissions.viewAuditLogs && (
          <Stack spacing={1.2}>
            {audit.length === 0 ? (
              <Alert severity="info">{copy.noAudit}</Alert>
            ) : (
              audit.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={0.4}>
                    <Typography sx={{ fontWeight: 700 }}>{item.action}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.actorRole} - {formatDateTime(item.createdAt, appLanguage)}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {activeTab === "system" && access?.permissions.manageSystem && (
          <Stack spacing={1.2}>
            <Stack spacing={0.4}>
              <Typography sx={{ fontWeight: 900 }}>{copy.systemTitle}</Typography>
              <Typography color="text.secondary">{copy.systemSubtitle}</Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: ADMIN_FOUR_COLUMN_GRID },
                gap: 1.2,
              }}
            >
              {[
                {
                  title: copy.analytics,
                  value: `${stats?.usersActive ?? users.length}`,
                  hint: copy.activeUsers,
                },
                {
                  title: copy.reports,
                  value: `${stats?.reportsOpen ?? 0}`,
                  hint: copy.openReports,
                },
                {
                  title: copy.content,
                  value: `${stats?.productsPending ?? queue.length}`,
                  hint: copy.publicProducts,
                },
                {
                  title: copy.aiControls,
                  value: "ON",
                  hint: copy.aiPolicy,
                },
              ].map((item) => (
                <Paper key={item.title} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={0.5}>
                    <Typography color="text.secondary">{item.title}</Typography>
                    <Typography sx={{ fontWeight: 900, fontSize: 24 }}>{item.value}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.hint}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>
            <Alert severity="info">{copy.logsReady}</Alert>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
              <Stack spacing={0.4}>
                <Typography sx={{ fontWeight: 900 }}>{copy.systemLogs}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {latestAudit
                    ? `${latestAudit.action} - ${formatDateTime(latestAudit.createdAt, appLanguage)}`
                    : copy.noAudit}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
