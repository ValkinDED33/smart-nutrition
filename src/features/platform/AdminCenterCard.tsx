import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Alert,
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
import type { RootState } from "../../app/store";
import type {
  AccessOverview,
  AdminUserSummary,
  AuditLogEntry,
  CatalogProductItem,
} from "../../shared/types/platform";
import {
  PlatformApiError,
  getPlatformAccessOverview,
  listAdminUsers,
  listAuditLogs,
  listModerationQueue,
  reviewCatalogSubmission,
  updateAdminUserRole,
} from "../../shared/api/platform";
import { useLanguage } from "../../shared/language";

type AdminTab = "queue" | "users" | "audit";

const adminCopy = {
  uk: {
    title: "Admin Center",
    subtitle:
      "Модерація продуктів, ролі користувачів і журнал дій для командного контролю.",
    backendUnavailable:
      "Cloud backend недоступний, тому admin center зараз не може підвантажити дані.",
    tabs: {
      queue: "Модерація",
      users: "Користувачі",
      audit: "Аудит",
    },
    pendingEmpty: "Черга модерації зараз порожня.",
    approve: "Підтвердити",
    reject: "Відхилити",
    role: "Роль",
    applyRole: "Застосувати",
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
      users: "Użytkownicy",
      audit: "Audyt",
    },
    pendingEmpty: "Kolejka moderacji jest teraz pusta.",
    approve: "Zatwierdź",
    reject: "Odrzuć",
    role: "Rola",
    applyRole: "Zastosuj",
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
  const [queue, setQueue] = useState<CatalogProductItem[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [audit, setAudit] = useState<AuditLogEntry[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, "USER" | "MODERATOR" | "ADMIN">>({});
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
                userItems.map((item) => [item.id, item.role as "USER" | "MODERATOR" | "ADMIN"])
              )
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

  if (!currentUser || currentUser.role === "USER") {
    return null;
  }

  const allowedRoles = access?.permissions.manageAdmins
    ? (["USER", "MODERATOR", "ADMIN"] as const)
    : (["USER", "MODERATOR"] as const);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        border: "1px solid rgba(15, 23, 42, 0.08)",
        backgroundColor: "rgba(255,255,255,0.86)",
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={0.6}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
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
          {(access?.permissions.manageModerators || access?.permissions.manageAdmins) && (
            <Tab value="users" label={copy.tabs.users} />
          )}
          {access?.permissions.viewAuditLogs && <Tab value="audit" label={copy.tabs.audit} />}
        </Tabs>

        {tab === "queue" && (
          <Stack spacing={1.2}>
            {queue.length === 0 ? (
              <Alert severity="info">{copy.pendingEmpty}</Alert>
            ) : (
              queue.map((item) => (
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
                  <Stack spacing={1}>
                    <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                    <Typography color="text.secondary">
                      {item.category ?? item.brand ?? "Manual"}
                    </Typography>
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
              <Paper key={user.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
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
                    <TextField
                      select
                      size="small"
                      label={copy.role}
                      value={roleDrafts[user.id] ?? user.role}
                      disabled={user.id === currentUser.id}
                      onChange={(event) =>
                        setRoleDrafts((current) => ({
                          ...current,
                          [user.id]: event.target.value as "USER" | "MODERATOR" | "ADMIN",
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
                <Paper key={item.id} variant="outlined" sx={{ p: 1.5, borderRadius: 4 }}>
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
      </Stack>
    </Paper>
  );
};
