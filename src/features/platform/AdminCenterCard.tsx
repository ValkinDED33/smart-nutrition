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
import { Ban, ShieldCheck, Trash2 } from "lucide-react";
import type { RootState } from "../../app/store";
import type {
  AccessOverview,
  AdminPlatformStats,
  AdminUserSummary,
  AuditLogEntry,
  CatalogProductItem,
} from "../../shared/types/platform";
import type { UserRole } from "../../shared/types/user";
import {
  PlatformApiError,
  deleteAdminUser,
  getAdminPlatformStats,
  getPlatformAccessOverview,
  listAdminUsers,
  listAuditLogs,
  listModerationQueue,
  reviewCatalogSubmission,
  updateAdminUserBan,
  updateAdminUserRole,
} from "../../shared/api/platform";
import { useLanguage } from "../../shared/language";

type AdminTab = "stats" | "queue" | "users" | "audit" | "system";

const adminCopy = {
  uk: {
    title: "Admin Center",
    subtitle:
      "Модерація продуктів, ролі користувачів і журнал дій для командного контролю.",
    backendUnavailable:
      "Cloud backend недоступний, тому admin center зараз не може підвантажити дані.",
    tabs: {
      queue: "Модерація",
      stats: "Статистика",
      users: "Користувачі",
      audit: "Аудит",
      system: "Система",
    },
    statsTitle: "Платформа",
    statsSubtitle: "Ключові показники користувачів, AI і каталогу.",
    usersTotal: "Користувачі",
    usersActive: "Активні",
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
    analytics: "Analytics",
    reports: "Reports",
    content: "Content",
    aiControls: "AI controls",
    systemLogs: "System logs",
    activeUsers: "Користувачі",
    publicProducts: "Продукти на перевірці",
    openReports: "Скарги",
    aiPolicy: "AI відповідає як wellness companion, без медичних діагнозів і з м'якими попередженнями.",
    logsReady: "Події ролей, модерації та блокувань вже пишуться в audit log.",
    pendingEmpty: "Черга модерації зараз порожня.",
    approve: "Підтвердити",
    reject: "Відхилити",
    role: "Роль",
    applyRole: "Застосувати",
    ban: "Заблокувати",
    unban: "Розблокувати",
    deleteUser: "Видалити",
    active: "Активний",
    confirmDelete: "Видалити користувача? Цю дію не можна скасувати.",
    banned: "Заблоковано",
    twoFactor: "2FA",
    required: "Потрібно",
    optional: "Опційно",
    noAudit: "Журнал дій порожній.",
  },
  pl: {
    title: "Admin Center",
    subtitle:
      "Moderacja produktów, role użytkowników i dziennik działań do kontroli zespołowej.",
    backendUnavailable:
      "Backend cloud jest niedostępny, więc admin center nie może teraz pobrać danych.",
    tabs: {
      queue: "Moderacja",
      stats: "Statystyka",
      users: "Użytkownicy",
      audit: "Audyt",
      system: "System",
    },
    statsTitle: "Platforma",
    statsSubtitle: "Kluczowe wskaźniki użytkowników, AI i katalogu.",
    usersTotal: "Użytkownicy",
    usersActive: "Aktywni",
    usersNewThisWeek: "Nowi w tygodniu",
    usersBanned: "Zablokowani",
    aiRequestsTotal: "Zapytania AI",
    productsTotal: "Produkty",
    productsPending: "W moderacji",
    photoAnalysesTotal: "Analiza zdjęć",
    suspiciousAccounts: "Podejrzane konta",
    moderationTitle: "Moderacja",
    reportsLabel: "Zgłoszenia",
    contentLabel: "Treści",
    photoAnalytics: "Analiza zdjęć",
    suspicious: "Podejrzane konta",
    systemTitle: "Centrum operacyjne",
    systemSubtitle:
      "Analityka, reports, content management, AI controls i logi systemowe w jednym miejscu.",
    analytics: "Analytics",
    reports: "Reports",
    content: "Content",
    aiControls: "AI controls",
    systemLogs: "System logs",
    activeUsers: "Użytkownicy",
    publicProducts: "Produkty do sprawdzenia",
    openReports: "Zgłoszenia",
    aiPolicy: "AI odpowiada jak wellness companion, bez diagnoz medycznych i z łagodnymi ostrzeżeniami.",
    logsReady: "Zdarzenia ról, moderacji i blokad są już zapisywane w audit logu.",
    pendingEmpty: "Kolejka moderacji jest teraz pusta.",
    approve: "Zatwierdź",
    reject: "Odrzuć",
    role: "Rola",
    applyRole: "Zastosuj",
    ban: "Zablokuj",
    unban: "Odblokuj",
    deleteUser: "Usuń",
    active: "Aktywne",
    confirmDelete: "Usunąć użytkownika? Tej akcji nie można cofnąć.",
    banned: "Zablokowane",
    twoFactor: "2FA",
    required: "Wymagane",
    optional: "Opcjonalne",
    noAudit: "Dziennik działań jest pusty.",
  },
} as const;

const formatDateTime = (value: string, language: "uk" | "pl") =>
  new Date(value).toLocaleString(language === "pl" ? "pl-PL" : "uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
  });

export const AdminCenterCard = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const { language } = useLanguage();
  const copy = adminCopy[language];
  const backendUnavailableMessage = adminCopy[language].backendUnavailable;
  const [tab, setTab] = useState<AdminTab>("queue");
  const [access, setAccess] = useState<AccessOverview | null>(null);
  const [stats, setStats] = useState<AdminPlatformStats | null>(null);
  const [queue, setQueue] = useState<CatalogProductItem[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, Exclude<UserRole, "SUPER_ADMIN">>>({});
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

        if (nextAccess.permissions.accessAdminCenter) {
          const queueItems = await listModerationQueue();

          if (active) {
            setQueue(queueItems);
          }
        }

        if (nextAccess.permissions.manageModerators || nextAccess.permissions.manageAdmins) {
          const userItems = await listAdminUsers();

          if (active) {
            setUsers(userItems);
            setRoleDrafts(
              Object.fromEntries(
                userItems
                  .filter((item) => item.role !== "SUPER_ADMIN")
                  .map((item) => [
                    item.id,
                    item.role as Exclude<UserRole, "SUPER_ADMIN">,
                  ])
              ) as Record<string, Exclude<UserRole, "SUPER_ADMIN">>
            );
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

  if (!currentUser || currentUser.role === "USER" || currentUser.role === "VERIFIED_USER") {
    return null;
  }

  const allowedRoles = access?.permissions.manageAdmins
    ? (["USER", "VERIFIED_USER", "NUTRITIONIST", "MODERATOR", "ADMIN"] as const)
    : (["USER", "VERIFIED_USER", "NUTRITIONIST", "MODERATOR"] as const);
  const latestAudit = audit[0];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
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
            <Chip label={access.role} color="primary" />
            <Chip
              label={`${copy.twoFactor}: ${access.twoFactorRequired ? copy.required : copy.optional}`}
              variant="outlined"
            />
          </Stack>
        )}

        {error && <Alert severity="warning">{error}</Alert>}

        <Tabs
          value={tab}
          onChange={(_, value: AdminTab) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value="queue" label={copy.tabs.queue} />
          {access?.permissions.manageSystem && (
            <Tab value="stats" label={copy.tabs.stats} />
          )}
          {(access?.permissions.manageModerators || access?.permissions.manageAdmins) && (
            <Tab value="users" label={copy.tabs.users} />
          )}
          {access?.permissions.viewAuditLogs && <Tab value="audit" label={copy.tabs.audit} />}
          {access?.permissions.manageSystem && <Tab value="system" label={copy.tabs.system} />}
        </Tabs>

        {tab === "stats" && access?.permissions.manageSystem && (
          <Stack spacing={1.4}>
            <Stack spacing={0.3}>
              <Typography sx={{ fontWeight: 900 }}>{copy.statsTitle}</Typography>
              <Typography color="text.secondary">{copy.statsSubtitle}</Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
                gap: 1.2,
              }}
            >
              {[
                [copy.usersTotal, stats?.usersTotal ?? users.length],
                [copy.usersActive, stats?.usersActive ?? 0],
                [copy.usersNewThisWeek, stats?.usersNewThisWeek ?? 0],
                [copy.usersBanned, stats?.usersBanned ?? 0],
                [copy.aiRequestsTotal, stats?.aiRequestsTotal ?? 0],
                [copy.productsTotal, stats?.productsTotal ?? 0],
                [copy.productsPending, stats?.productsPending ?? queue.length],
                [copy.photoAnalysesTotal, stats?.photoAnalysesTotal ?? 0],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    border: "1px solid rgba(15, 23, 42, 0.1)",
                    backgroundColor: "rgba(255,255,255,0.72)",
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
                gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
                gap: 1.2,
              }}
            >
              {[
                [copy.reportsLabel, stats?.reportsOpen ?? 0],
                [copy.contentLabel, stats?.productsPending ?? queue.length],
                [copy.photoAnalytics, stats?.photoAnalysesTotal ?? 0],
                [copy.suspicious, stats?.suspiciousAccounts ?? 0],
              ].map(([label, value]) => (
                <Alert key={label} severity={Number(value) > 0 ? "warning" : "info"}>
                  <strong>{label}</strong>: {value}
                </Alert>
              ))}
            </Box>
          </Stack>
        )}

        {tab === "queue" && (
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
                      <Chip label={`P ${item.nutrients.protein}`} size="small" />
                      <Chip label={`F ${item.nutrients.fat}`} size="small" />
                      <Chip label={`C ${item.nutrients.carbs}`} size="small" />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        onClick={() => {
                          void reviewCatalogSubmission(item.id, { decision: "approve" }).then(
                            (updatedItem) => {
                              setQueue((current) =>
                                current.map((entry) =>
                                  entry.id === updatedItem.id ? updatedItem : entry
                                )
                              );
                            }
                          );
                        }}
                      >
                        {copy.approve}
                      </Button>
                      <Button
                        color="error"
                        onClick={() => {
                          void reviewCatalogSubmission(item.id, { decision: "reject" }).then(
                            (updatedItem) => {
                              setQueue((current) =>
                                current.map((entry) =>
                                  entry.id === updatedItem.id ? updatedItem : entry
                                )
                              );
                            }
                          );
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

        {tab === "users" && (access?.permissions.manageModerators || access?.permissions.manageAdmins) && (
          <Stack spacing={1.2}>
            {users.map((user) => (
              <Paper key={user.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.2}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Stack spacing={0.3}>
                    <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {user.email}
                    </Typography>
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                    <Chip
                      color={user.isBanned ? "error" : "success"}
                      label={user.isBanned ? copy.banned : copy.active}
                      sx={{ alignSelf: "center" }}
                    />
                    <TextField
                      select
                      size="small"
                      label={copy.role}
                      value={roleDrafts[user.id] ?? user.role}
                      disabled={user.id === currentUser.id}
                      onChange={(event) =>
                        setRoleDrafts((current) => ({
                          ...current,
                          [user.id]: event.target.value as Exclude<UserRole, "SUPER_ADMIN">,
                        }))
                      }
                      sx={{ minWidth: 180 }}
                    >
                      {allowedRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      disabled={user.id === currentUser.id}
                      startIcon={<ShieldCheck size={16} />}
                      onClick={() => {
                        const nextRole = roleDrafts[user.id];

                        if (!nextRole) {
                          return;
                        }

                        void updateAdminUserRole(user.id, nextRole).then((updatedUser) => {
                          setUsers((current) =>
                            current.map((entry) =>
                              entry.id === updatedUser.id ? updatedUser : entry
                            )
                          );
                        });
                      }}
                    >
                      {copy.applyRole}
                    </Button>
                    {access?.permissions.banUsers && (
                      <Button
                      color={user.isBanned ? "success" : "error"}
                      disabled={user.id === currentUser.id || user.role === "SUPER_ADMIN"}
                      startIcon={<Ban size={16} />}
                      onClick={() => {
                          void updateAdminUserBan(user.id, {
                            banned: !user.isBanned,
                            reason: "Admin moderation action",
                          }).then((updatedUser) => {
                            setUsers((current) =>
                              current.map((entry) =>
                                entry.id === updatedUser.id ? updatedUser : entry
                              )
                            );
                          });
                        }}
                      >
                        {user.isBanned ? copy.unban : copy.ban}
                      </Button>
                    )}
                    {access?.permissions.manageAdmins && (
                      <Button
                        color="error"
                        disabled={user.id === currentUser.id || user.role === "SUPER_ADMIN"}
                        startIcon={<Trash2 size={16} />}
                        onClick={() => {
                          if (!window.confirm(copy.confirmDelete)) {
                            return;
                          }

                          void deleteAdminUser(user.id).then(() => {
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
                                  }
                                : current
                            );
                          });
                        }}
                      >
                        {copy.deleteUser}
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}

        {tab === "audit" && access?.permissions.viewAuditLogs && (
          <Stack spacing={1.2}>
            {audit.length === 0 ? (
              <Alert severity="info">{copy.noAudit}</Alert>
            ) : (
              audit.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={0.4}>
                    <Typography sx={{ fontWeight: 700 }}>{item.action}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {item.actorRole} - {formatDateTime(item.createdAt, language)}
                    </Typography>
                  </Stack>
                </Paper>
              ))
            )}
          </Stack>
        )}

        {tab === "system" && access?.permissions.manageSystem && (
          <Stack spacing={1.2}>
            <Stack spacing={0.4}>
              <Typography sx={{ fontWeight: 900 }}>{copy.systemTitle}</Typography>
              <Typography color="text.secondary">{copy.systemSubtitle}</Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
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
                    ? `${latestAudit.action} - ${formatDateTime(latestAudit.createdAt, language)}`
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
